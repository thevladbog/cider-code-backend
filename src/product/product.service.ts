import { Injectable } from '@nestjs/common';
import { CreatedProductId, CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'nestjs-prisma';
import { IProductFindMay, SelectProductDto } from './dto/select-product.dto';
import { ProductStatusType } from '../../prisma/generated/zod';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<CreatedProductId> {
    return this.prismaService.product.create({
      data: { ...createProductDto },
      select: {
        id: true,
      },
    });
  }

  async findAll(page: number, limit: number): Promise<IProductFindMay> {
    const raw = await this.prismaService.$transaction([
      this.prismaService.product.count(),
      this.prismaService.product.findMany({
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

  async findOne(id: string) {
    return this.prismaService.product.findUnique({
      where: {
        id,
      },
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<UpdateProductDto> {
    return this.prismaService.product.update({
      where: {
        id,
      },
      data: {
        ...updateProductDto,
      },
    });
  }

  async remove(id: string) {
    return this.prismaService.product.delete({
      where: {
        id,
      },
    });
  }

  async updateStatus(
    id: string,
    status: ProductStatusType,
  ): Promise<UpdateProductDto> {
    return this.prismaService.product.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  async search(query: string): Promise<SelectProductDto[]> {
    return this.prismaService.product.findMany({
      where: {
        OR: [
          {
            shortName: {
              contains: query,
            },
          },
          {
            fullName: {
              contains: query,
            },
          },
          {
            gtin: {
              contains: query,
            },
          },
        ],
      },
    });
  }
}
