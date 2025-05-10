import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  CreatedUserDto,
  CreateUserDto,
  IUserFindMany,
} from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'nestjs-prisma';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in.dto';
import { nanoid } from 'nanoid';
import { readFileSync } from 'fs';
import * as path from 'path';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: MailService,
    private readonly config: ConfigService,
  ) {}
  private readonly logger = new Logger(UserService.name);

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ user: CreatedUserDto; token: string }> {
    try {
      const hashedPassword = await this.hashPassword(
        String(createUserDto.password),
      );
      const data = await this.prismaService.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });

      const res = this.hashPasswordInObject(data);

      const token = await this.getJwtToken(res.id);

      return { user: res, token };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.error('The user already exists', error);
          throw new HttpException(
            { message: 'The provided data is not unique', error },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      this.logger.error('Something ent wrong', error);
      throw error;
    }
  }

  async findAll(page: number, limit: number): Promise<IUserFindMany> {
    const raw = await this.prismaService.$transaction([
      this.prismaService.user.count(),
      this.prismaService.user.findMany({
        take: limit,
        skip: limit * (page - 1),
      }),
    ]);

    const [total, data] = raw;

    const cleanedData = data.map((user) => {
      return this.hashPasswordInObject(user);
    });

    return {
      result: cleanedData,
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string | undefined): Promise<CreatedUserDto> {
    if (!id) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    console.log({ id });

    const data = await this.prismaService.user.findUniqueOrThrow({
      where: {
        id,
      },
    });

    if (!data) {
      throw new HttpException(
        `User with id ${id} can't be found or something went wrong`,
        HttpStatus.NOT_FOUND,
      );
    }

    const res = this.hashPasswordInObject(data);

    return res;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<CreatedUserDto> {
    const currentData = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if (updateUserDto.password) {
      const checkedPassword = await this.comparePasswords(
        currentData?.password ?? '',
        updateUserDto.password,
      );

      if (checkedPassword) {
        const hashedPassword = await this.hashPassword(
          String(updateUserDto.password),
        );
        updateUserDto.password = hashedPassword;
      } else {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
    }

    try {
      const data = await this.prismaService.user.update({
        where: { id },
        data: updateUserDto,
      });

      return this.hashPasswordInObject(data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.error(`User with id ${id} not found`, error);
          throw new HttpException(
            `User with id ${id} not found`,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      this.logger.error('Something went wrong', error);
      throw error;
    }
  }

  async remove(id: string): Promise<{ id: string; message: string }> {
    try {
      const data = await this.prismaService.user.delete({
        where: {
          id,
        },
      });

      return { id: data.id, message: 'User successfully deleted' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.error(`User with id ${id} not found`, error);
          throw new HttpException(
            `User with id ${id} not found`,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      this.logger.error('Something went wrong', error);
      throw error;
    }
  }

  async signIn(
    credentials: SignInDto,
  ): Promise<{ user: CreatedUserDto; token: string }> {
    const user = await this.prismaService.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user)
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    const valid = await this.comparePasswords(
      user.password,
      credentials.password,
    );
    if (!valid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const safeUser = this.hashPasswordInObject(user);

    const token = await this.getJwtToken(safeUser.id);

    return { user: safeUser, token };
  }

  async revokeToken(jti: string) {
    await this.prismaService.revokedToken.create({ data: { jti } });

    return true;
  }

  async getById(id: string) {
    return await this.prismaService.user.findUniqueOrThrow({ where: { id } });
  }

  async getResetRequest(email: string): Promise<void> {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: {
        email,
      },
    });

    const currentToken = await this.prismaService.emailTokens.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (currentToken) {
      await this.prismaService.emailTokens.delete({
        where: {
          userId: user.id,
        },
      });
    }

    const token = nanoid(64);
    await this.prismaService.emailTokens.create({
      data: {
        userId: user.id,
        token,
      },
    });

    try {
      await this.emailService.sendResetPasswordMail(user.id, token, email);
    } catch (error) {
      await this.prismaService.emailTokens.delete({
        where: {
          userId: user.id,
        },
      });
      this.logger.error('Failed to send reset password email', error);
      throw new HttpException(
        'Failed to send reset password email. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resetPassword({
    userId,
    token,
    password,
  }: ResetPasswordDto): Promise<void> {
    const storedToken = await this.prismaService.emailTokens.findUniqueOrThrow({
      where: {
        userId,
      },
    });

    if (storedToken.token !== token) {
      throw new HttpException(
        `Token can't be found or something went wrong`,
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const hashedPassword = await this.hashPassword(password);
      await this.prismaService.$transaction(async (prisma) => {
        await prisma.user.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
          },
        });

        await prisma.emailTokens.delete({
          where: {
            userId,
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.error(
            `Password can't be changed for User with id ${userId}`,
            error,
          );
          throw new HttpException(
            `Password can't be changed for User with id ${userId}`,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      this.logger.error('Something went wrong', error);
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const hash = await argon2.hash(password);
    return hash;
  }

  async comparePasswords(hash: string, password: string): Promise<boolean> {
    const result = await argon2.verify(hash, password);
    return result;
  }

  hashPasswordInObject(object: CreatedUserDto): CreatedUserDto {
    delete object.password;

    return object;
  }

  async getJwtToken(id: string) {
    const privateKey: string =
      this.config.getOrThrow('JWT_PRIVATE_KEY_PATH') ??
      readFileSync(
        path.resolve(__dirname, '../../../config/cert/jwt_private_key.pem'),
        'utf8',
      );
    const token = await this.jwtService.signAsync(
      {},
      {
        jwtid: nanoid(),
        subject: id,
        expiresIn: process.env.JWT_EXPIRES ?? '1h',
        privateKey: privateKey,
        algorithm: 'RS256',
      },
    );

    return token;
  }
}
