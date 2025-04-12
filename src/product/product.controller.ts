import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreatedProductDto, CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Product')
@Controller('product')
@UsePipes(ZodValidationPipe)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: CreatedProductDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiBody({
    type: CreateProductDto,
    description: 'Json structure for product object',
  })
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<CreatedProductDto> {
    return this.productService.create(createProductDto);
  }

  @Get()
  async findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
