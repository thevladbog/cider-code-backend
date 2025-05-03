import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  CreatedUserDto,
  CreateUserDto,
  IUserFindMay,
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

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(UserService.name);
  private readonly privateKey = readFileSync(
    path.resolve(__dirname, '../../../config/cert/jwt_private_key.pem'),
    'utf8',
  );

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

  async findAll(page: number, limit: number): Promise<IUserFindMay> {
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
    if (updateUserDto.password) {
      const hashedPassword = await this.hashPassword(
        String(updateUserDto.password),
      );
      updateUserDto.password = hashedPassword;
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

  async hashPassword(password: string): Promise<string> {
    const hash = await argon2.hash(password);
    return hash;
  }

  async comparePasswords(hash: string, password: string): Promise<boolean> {
    const result = await argon2.verify(hash, password);
    return result;
  }

  hashPasswordInObject<T>(object: T): T {
    return {
      ...object,
      password: 'hashed_password',
    };
  }

  async getJwtToken(id: string) {
    console.log(__dirname);
    const token = await this.jwtService.signAsync(
      {},
      {
        jwtid: nanoid(),
        subject: id,
        expiresIn: process.env.JWT_EXPIRES ?? '1h',
        privateKey: this.privateKey,
        algorithm: 'RS256',
      },
    );

    return token;
  }
}
