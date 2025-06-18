import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  CreateShiftDto,
  CreateShiftByOperatorDto,
  IDeletedShift,
  IShiftFindMany,
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

  async findAll(page: number, limit: number): Promise<IShiftFindMany> {
    const raw = await this.prismaService.$transaction([
      this.prismaService.shift.count(),
      this.prismaService.shift.findMany({
        take: limit,
        skip: limit * (page - 1),
        include: {
          product: true,
        },
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
      include: {
        product: true,
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

  /**
   * Создание смены оператором по EAN/GTIN
   */
  async createByOperator(
    createShiftByOperatorDto: CreateShiftByOperatorDto,
    operatorId: string,
  ): Promise<IShiftFindOne> {
    try {
      // Преобразуем EAN в GTIN если необходимо
      let gtin = createShiftByOperatorDto.ean;
      if (gtin.length < 14) {
        // Добавляем ведущие нули для получения 14-значного GTIN
        gtin = gtin.padStart(14, '0');
      }

      // Находим продукт по GTIN со статусом ACTIVE
      const product = await this.prismaService.product.findFirst({
        where: {
          gtin: gtin,
          status: 'ACTIVE',
        },
      });

      if (!product) {
        throw new HttpException(
          `Product with GTIN ${gtin} not found or not active`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Устанавливаем плановую дату - сегодня если не указана
      const plannedDate = createShiftByOperatorDto.plannedDay || new Date();

      // Создаем смену
      const shift = await this.prismaService.shift.create({
        data: {
          productId: product.id,
          operatorId: operatorId,
          plannedDate: plannedDate,
          status: 'PLANNED',
          packing: false,
        },
        include: {
          product: true,
        },
      });

      return { result: shift };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.error('The shift data is not unique', error);
          throw new HttpException(
            { message: 'The shift data is not unique', error },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      this.logger.error('Something went wrong', error);
      throw error;
    }
  }
}
