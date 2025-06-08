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
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';

const DEFAULT_LIMIT = 999;

@ApiTags('Saby')
@Controller('saby')
@UsePipes(ZodValidationPipe)
export class SabyController {
  constructor(private readonly sabyService: SabyService) {}

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
  @Post('/order/delivery/')
  async create(
    @Body() createOrderToDeliveryDto: CreateOrderToDeliveryDto,
  ): Promise<CreatedOrderToDeliveryId> {
    return await this.sabyService.create(createOrderToDeliveryDto);
  }

  @ApiResponse({
    status: 200,
    type: SelectOrderToDeliveryDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Get('/order/delivery/:id')
  async findOne(
    @Param('id') id: string,
  ): Promise<SelectOrderToDeliveryDto | null> {
    return await this.sabyService.findOne(id);
  }

  @ApiBody({
    type: UpdateOrderToDeliveryDto,
    description: 'Json structure for order object',
  })
  @ApiResponse({
    status: 200,
    type: UpdateOrderToDeliveryDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @UsePipes(ZodValidationPipe)
  @Patch('/order/delivery/:id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderToDeliveryDto: UpdateOrderToDeliveryDto,
  ) {
    return await this.sabyService.update(id, updateOrderToDeliveryDto);
  }

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
  @UsePipes(ZodValidationPipe)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(DEFAULT_LIMIT), ParseIntPipe)
    limit: number,
    @Query('search') search: string | undefined,
  ): Promise<IOrderToDeliveryFindMany> {
    return await this.sabyService.findAll(page, limit, search);
  }
}
