import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreatedProductId, CreateProductDto } from './dto/create-product.dto';
import {
  UpdateProductDto,
  UpdateProductStatusDto,
} from './dto/update-product.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IProductFindMany, SelectProductDto } from './dto/select-product.dto';

@ApiTags('Product')
@Controller('product')
@UsePipes(ZodValidationPipe)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: CreatedProductId,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiBody({
    type: CreateProductDto,
    description: 'Json structure for product object',
  })
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<CreatedProductId> {
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    type: IProductFindMany,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<IProductFindMany> {
    return this.productService.findAll(page, limit);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    type: SelectProductDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @ApiBody({
    type: UpdateProductDto,
    description: 'Json structure for product object',
  })
  @ApiResponse({
    status: 200,
    type: UpdateProductDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<UpdateProductDto> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @ApiBody({
    type: UpdateProductStatusDto,
    description: 'Json structure for product status',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() status: UpdateProductStatusDto,
  ): Promise<UpdateProductDto> {
    return this.productService.updateStatus(id, status.status);
  }

  @Get('search')
  @ApiResponse({
    status: 200,
    type: SelectProductDto,
    isArray: true,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async search(@Query('search') search: string) {
    return this.productService.search(search);
  }
}
