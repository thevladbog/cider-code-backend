import { Injectable } from '@nestjs/common';
import {
  CreatedOrderToDeliveryId,
  CreateOrderToDeliveryDto,
} from './dto/create-order-to-delivery.dto';
import { UpdateOrderToDeliveryDto } from './dto/update-order-to-delivery.dto';
import { PrismaService } from 'nestjs-prisma';
import {
  IOrderToDeliveryFindMany,
  SelectOrderToDeliveryDto,
} from './dto/select-order-to-delivery.dto';

@Injectable()
export class SabyService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    createOrderToDeliveryDto: CreateOrderToDeliveryDto | string,
  ): Promise<CreatedOrderToDeliveryId> {
    let body: CreateOrderToDeliveryDto;

    if (typeof createOrderToDeliveryDto === 'string') {
      body = JSON.parse(createOrderToDeliveryDto) as CreateOrderToDeliveryDto;
    } else {
      body = createOrderToDeliveryDto;
    }

    const data = await this.prismaService.ordersToDelivery.create({
      data: { ...body },
      select: {
        id: true,
      },
    });

    return data;
  }

  async findOne(id: string): Promise<SelectOrderToDeliveryDto | null> {
    return this.prismaService.ordersToDelivery.findUnique({
      where: {
        id,
      },
    });
  }

  async update(
    id: string,
    updateOrderToDeliveryDto: UpdateOrderToDeliveryDto | string,
  ): Promise<UpdateOrderToDeliveryDto> {
    let body: UpdateOrderToDeliveryDto;

    if (typeof updateOrderToDeliveryDto === 'string') {
      body = JSON.parse(updateOrderToDeliveryDto) as CreateOrderToDeliveryDto;
    } else {
      body = updateOrderToDeliveryDto;
    }

    return this.prismaService.ordersToDelivery.update({
      where: {
        id,
      },
      data: {
        ...body,
      },
    });
  }

  async findAll(
    page: number,
    limit: number,
    search: string | undefined,
    status: 'NEW' | 'ARCHIVE' | undefined,
  ): Promise<IOrderToDeliveryFindMany> {
    const where = search
      ? {
          OR: [
            { id: { contains: search } },
            { consignee: { contains: search } },
            { orderNumber: { contains: search } },
            { address: { contains: search } },
          ],
        }
      : {};

    const statusWhere = status ? { status } : {};
    const raw = await this.prismaService.$transaction([
      this.prismaService.ordersToDelivery.count({
        where: { ...where, ...statusWhere },
      }),
      this.prismaService.ordersToDelivery.findMany({
        take: limit,
        skip: limit * (page - 1),
        where: { ...where, ...statusWhere },
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
}
