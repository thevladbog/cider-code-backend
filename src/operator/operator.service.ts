import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { customAlphabet } from 'nanoid';
import {
  CreateOperatorDto,
  CreatedOperatorDto,
  IOperatorFindMay,
  IOperatorFindOne,
} from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { MAIN_PREFIX } from 'src/constants/main.constants';
import { UserService } from 'src/user/user.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OperatorService {
  private readonly logger = new Logger(OperatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async createOperator(
    createOperatorDto: CreateOperatorDto,
  ): Promise<CreatedOperatorDto> {
    let newBarcode = createOperatorDto.barcode;

    if (!createOperatorDto.barcode) {
      newBarcode = this.generateBarcode();
    }

    try {
      const data = await this.prisma.operator.create({
        data: {
          ...createOperatorDto,
          barcode: newBarcode,
        },
      });

      return data;
    } catch (error) {
      this.logger.error('Failed to create new operator:', error);
      throw error;
    }
  }

  async updateOperator(
    id: string,
    updateOperatorDto: UpdateOperatorDto,
  ): Promise<IOperatorFindOne | undefined> {
    const dataToUpdate: Prisma.OperatorUpdateInput = {};

    if (updateOperatorDto.regenerateBarcode) {
      dataToUpdate.barcode = this.generateBarcode();
    }
    if (updateOperatorDto.name) {
      dataToUpdate.name = updateOperatorDto.name;
    }
    if (Object.keys(dataToUpdate).length === 0) {
      return await this.getOne(id);
    }

    await this.prisma.operator.update({ where: { id }, data: dataToUpdate });

    try {
      const data = await this.getOne(id);

      if (data) return data;
    } catch (error) {
      this.logger.error('Failed to update operator:', error);
      throw error;
    }
  }

  async loginOperator(barcode: string): Promise<string> {
    try {
      const operator = await this.prisma.operator.findFirstOrThrow({
        where: {
          barcode,
        },
      });

      const token = await this.userService.getJwtToken(operator.id);

      return token;
    } catch (error) {
      this.logger.error('Invalid credentials:', error);
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  async getAll(page: number, limit: number): Promise<IOperatorFindMay> {
    try {
      const raw = await this.prisma.$transaction([
        this.prisma.operator.count(),
        this.prisma.operator.findMany({
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
    } catch (error) {
      this.logger.error('Something went wrong:', error);
      throw error;
    }
  }

  async getOne(id: string | undefined): Promise<IOperatorFindOne> {
    const data = await this.prisma.operator.findUniqueOrThrow({
      where: {
        id,
      },
    });

    if (!data) {
      throw new HttpException(
        `Operator with id ${id} can't be found or something went wrong`,
        HttpStatus.NOT_FOUND,
      );
    }

    return { result: data };
  }

  generateBarcode(): string {
    const nanoid: (size?: number) => string = customAlphabet(
      '23456789ABCDEFGHJKLMNPQRSTUVWXYZ',
      6,
    );
    const generatedPart = nanoid();
    return `[${MAIN_PREFIX}]-${generatedPart}-[BC]`;
  }
}
