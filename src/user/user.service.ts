import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatedUserDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'nestjs-prisma';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<CreatedUserDto> {
    const hashedPassword = await this.hashPassword(createUserDto.password);
    const data = await this.prismaService.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    const res = this.hashPasswordInObject(data);

    return res;
  }

  async findAll(): Promise<CreatedUserDto[]> {
    const data = await this.prismaService.user.findMany();
    const cleanedData = data.map((user) => {
      return this.hashPasswordInObject(user);
    });

    return cleanedData;
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
        HttpStatus.BAD_REQUEST,
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
      const hashedPassword = await this.hashPassword(updateUserDto.password);
      updateUserDto.password = hashedPassword;
    }

    const data = await this.prismaService.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });

    if (!data) {
      throw new HttpException(
        `User with id ${id} can't be found or something went wrong`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = this.hashPasswordInObject(data);

    return res;
  }

  async remove(id: string): Promise<string> {
    const data = await this.prismaService.user.delete({
      where: {
        id,
      },
    });

    if (!data) {
      throw new HttpException(
        `User with id ${id} can't be found or something went wrong`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return data.id;
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
