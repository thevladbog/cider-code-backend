import { Injectable } from '@nestjs/common';
import { CreatedProductDto, CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<CreatedProductDto> {
    const res = await this.prismaService.product.create({
      data: { ...createProductDto },
    });

    return {
      data: res,
    };
  }

  async findAll() {
    return this.prismaService.product.findMany();
  }

  async findOne(id: string) {
    return this.prismaService.product.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
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
}
