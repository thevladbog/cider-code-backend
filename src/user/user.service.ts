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

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(UserService.name);

  async create(createUserDto: CreateUserDto): Promise<CreatedUserDto> {
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

      return res;
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

  async findOne(id: string): Promise<CreatedUserDto> {
    const data = await this.prismaService.user.findUnique({
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
}
