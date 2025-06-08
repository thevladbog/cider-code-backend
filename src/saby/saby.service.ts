import { Injectable } from '@nestjs/common';
import {
  CreatedOrderToDeliveryId,
  CreateOrderToDeliveryDto,
} from './dto/create-order-to-delivery.dto';
import { UpdateOrderToDeliveryDto } from './dto/update-order-to-delivery.dto';
import { PrismaService } from 'nestjs-prisma';
import { SelectOrderToDeliveryDto } from './dto/select-order-to-delivery.dto';

@Injectable()
export class SabyService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    CreateOrderToDeliveryDto: CreateOrderToDeliveryDto,
  ): Promise<CreatedOrderToDeliveryId> {
    const data = await this.prismaService.ordersToDelivery.create({
      data: { ...CreateOrderToDeliveryDto },
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
    updateOrderToDeliveryDto: UpdateOrderToDeliveryDto,
  ): Promise<UpdateOrderToDeliveryDto> {
    return this.prismaService.ordersToDelivery.update({
      where: {
        id,
      },
      data: {
        ...updateOrderToDeliveryDto,
      },
    });
  }
}
