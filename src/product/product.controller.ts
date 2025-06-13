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
import {
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { IProductFindMany, SelectProductDto } from './dto/select-product.dto';

@ApiTags('Product')
@Controller('product')
@UsePipes(ZodValidationPipe)
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @ApiOperation({
    summary: 'Create product',
    description: 'Create a new product with all required details',
    tags: ['Product'],
  })
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
  @ApiOperation({
    summary: 'Get all products',
    description:
      'Retrieve a paginated list of all products with optional search capabilities',
    tags: ['Product'],
  })
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search string',
  })
  @UsePipes(ZodValidationPipe)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    @Query('search') search: string | undefined,
  ): Promise<IProductFindMany> {
    return this.productService.findAll(page, limit, search);
  }
  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Retrieve detailed information about a specific product by its ID',
    tags: ['Product'],
  })
  @Get(':id')
  @ApiResponse({
    status: 200,
    type: SelectProductDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
  @ApiOperation({
    summary: 'Update product',
    description:
      'Update an existing product information such as name, GTIN, alcohol code, etc.',
    tags: ['Product'],
  })
  @ApiBody({
    type: UpdateProductDto,
    description: 'Json structure for product object',
  })
  @ApiResponse({
    status: 200,
    type: UpdateProductDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @UsePipes(ZodValidationPipe)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<UpdateProductDto> {
    return this.productService.update(id, updateProductDto);
  }
  @ApiOperation({
    summary: 'Delete product',
    description: 'Remove a product from the system',
    tags: ['Product'],
  })
  @ApiResponse({
    status: 200,
    description: 'Product successfully deleted',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
  @ApiOperation({
    summary: 'Update product status',
    description: 'Change product status (ACTIVE, INACTIVE, PAUSED, etc.)',
    tags: ['Product'],
  })
  @ApiBody({
    type: UpdateProductStatusDto,
    description: 'Json structure for product status',
  })
  @ApiResponse({
    status: 200,
    description: 'Product status successfully updated',
    type: UpdateProductDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() status: UpdateProductStatusDto,
  ): Promise<UpdateProductDto> {
    return this.productService.updateStatus(id, status.status);
  }
  @ApiOperation({
    summary: 'Search products',
    description:
      'Search for products by name, GTIN, alcohol code or other attributes',
    tags: ['Product'],
  })
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
