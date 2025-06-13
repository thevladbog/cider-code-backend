import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UsePipes,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
  Put,
} from '@nestjs/common';
import { SabyService } from './saby.service';
import {
  CreatedOrderToDeliveryId,
  CreateOrderToDeliveryDto,
} from './dto/create-order-to-delivery.dto';
import { UpdateOrderToDeliveryDto } from './dto/update-order-to-delivery.dto';
import {
  IOrderToDeliveryFindMany,
  SelectOrderToDeliveryDto,
} from './dto/select-order-to-delivery.dto';
import {
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

const DEFAULT_LIMIT = 999;

@ApiTags('Saby')
@Controller('saby')
export class SabyController {
  constructor(private readonly sabyService: SabyService) {}
  @ApiOperation({
    summary: 'Create delivery order',
    description: 'Creates a new delivery order in the SABY system',
    tags: ['Saby Orders'],
  })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: CreatedOrderToDeliveryId,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiBody({
    type: CreateOrderToDeliveryDto,
    description: 'Json structure for order object',
  })
  @UsePipes(ZodValidationPipe)
  @Post('/order/delivery/')
  async create(
    @Body() createOrderToDeliveryDto: CreateOrderToDeliveryDto | string,
  ): Promise<CreatedOrderToDeliveryId> {
    return await this.sabyService.create(createOrderToDeliveryDto);
  }
  @ApiOperation({
    summary: 'Get delivery order by ID',
    description:
      'Retrieves a specific delivery order from the SABY system by its ID',
    tags: ['Saby Orders'],
  })
  @ApiResponse({
    status: 200,
    type: SelectOrderToDeliveryDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @Get('/order/delivery/:id')
  async findOne(
    @Param('id') id: string,
  ): Promise<SelectOrderToDeliveryDto | null> {
    return await this.sabyService.findOne(id);
  }
  @ApiOperation({
    summary: 'Update delivery order',
    description:
      'Updates an existing delivery order in the SABY system by its ID',
    tags: ['Saby Orders'],
  })
  @ApiBody({
    type: UpdateOrderToDeliveryDto,
    description: 'Json structure for order object',
  })
  @ApiResponse({
    status: 200,
    type: UpdateOrderToDeliveryDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @UsePipes(ZodValidationPipe)
  @Patch('/order/delivery/:id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderToDeliveryDto: UpdateOrderToDeliveryDto | string,
  ) {
    return await this.sabyService.update(id, updateOrderToDeliveryDto);
  }
  @ApiOperation({
    summary: 'Update delivery order from SABY',
    description:
      'Updates a delivery order with information received from the SABY system',
    tags: ['Saby Orders'],
  })
  @ApiBody({
    type: UpdateOrderToDeliveryDto,
    description: 'Json structure for order object',
  })
  @ApiResponse({
    status: 200,
    type: UpdateOrderToDeliveryDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @UsePipes(ZodValidationPipe)
  @Put('/order/delivery/change/')
  async updateFromSaby(
    @Body() updateOrderToDeliveryDto: UpdateOrderToDeliveryDto,
  ): Promise<UpdateOrderToDeliveryDto> {
    return await this.sabyService.updateFromSaby(updateOrderToDeliveryDto);
  }
  @ApiOperation({
    summary: 'Get all delivery orders',
    description:
      'Retrieves a paginated list of delivery orders from the SABY system with optional filtering',
    tags: ['Saby Orders'],
  })
  @Get('/order/delivery/')
  @ApiResponse({
    status: 200,
    type: IOrderToDeliveryFindMany,
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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['NEW', 'ARCHIVE'],
    description: 'Order status filter',
  })
  @UsePipes(ZodValidationPipe)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)
    limit: number,
    @Query('search') search: string | undefined,
    @Query('status') status: 'NEW' | 'ARCHIVE' | undefined,
  ): Promise<IOrderToDeliveryFindMany> {
    return await this.sabyService.findAll(page, limit, search, status);
  }
}
