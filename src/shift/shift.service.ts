import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  CreateShiftDto,
  IDeletedShift,
  IShiftFindMay,
  IShiftFindOne,
  ShiftDto,
} from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(ShiftService.name);

  async create(createShiftDto: CreateShiftDto): Promise<ShiftDto> {
    try {
      const data = await this.prismaService.shift.create({
        data: createShiftDto,
      });

      return data;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.error('The user already exists', error);
          throw new HttpException(
            { message: 'The shift data is not unique', error },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      this.logger.error('Something ent wrong', error);
      throw error;
    }
  }

  async findAll(page: number, limit: number): Promise<IShiftFindMay> {
    const raw = await this.prismaService.$transaction([
      this.prismaService.shift.count(),
      this.prismaService.shift.findMany({
        take: limit,
        skip: limit * (page - 1),
      }),
    ]);

    const [total, data] = raw;

    return {
      result: data,
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<IShiftFindOne> {
    if (!id) {
      throw new HttpException('Shift ID is required', HttpStatus.BAD_REQUEST);
    }

    const data = await this.prismaService.shift.findUniqueOrThrow({
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

    return { result: data };
  }

  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<ShiftDto> {
    try {
      const data = await this.prismaService.shift.update({
        where: { id },
        data: updateShiftDto,
      });

      return data;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.error(`Shift with id ${id} not found`, error);
          throw new HttpException(
            `Shift with id ${id} not found`,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      this.logger.error('Something went wrong', error);
      throw error;
    }
  }

  async remove(id: string): Promise<IDeletedShift> {
    try {
      const data = await this.prismaService.shift.delete({
        where: {
          id,
        },
      });

      return { id: data.id, message: 'Shift successfully deleted' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          this.logger.error(`Shift with id ${id} not found`, error);
          throw new HttpException(
            `Shift with id ${id} not found`,
            HttpStatus.NOT_FOUND,
          );
        }
      }

      this.logger.error('Something went wrong', error);
      throw error;
    }
  }
}
