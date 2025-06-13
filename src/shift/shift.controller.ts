import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UsePipes,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import {
  CreateShiftDto,
  IDeletedShift,
  IShiftFindMany,
  IShiftFindOne,
  ShiftDto,
} from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { JwtType } from 'src/guards/auth/jwt.metadata';
import { JWT_TYPE } from 'src/constants/jwt.constants';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}
  @ApiOperation({
    summary: 'Create shift',
    description:
      'Create a new production shift with product and planning details',
    tags: ['Shift'],
  })
  @ApiResponse({
    status: 201,
    description: 'Shift successfully created',
    type: ShiftDto,
  })
  @ApiResponse({
    status: 400,
    description: "Data isn't unique",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createShiftDto: CreateShiftDto): Promise<ShiftDto> {
    return await this.shiftService.create(createShiftDto);
  }
  @ApiOperation({
    summary: 'Get all shifts',
    description: 'Retrieve a paginated list of all production shifts',
    tags: ['Shift'],
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of shifts',
    type: IShiftFindMany,
  })
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
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<IShiftFindMany> {
    return await this.shiftService.findAll(page, limit);
  }
  @ApiOperation({
    summary: 'Get all shifts for operator',
    description:
      'Retrieve a paginated list of all production shifts accessible by operators',
    tags: ['Shift', 'Operator'],
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of shifts',
    type: IShiftFindMany,
  })
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
  @JwtType(JWT_TYPE.Operator)
  @UseGuards(AuthGuard)
  @Get('/operator')
  async findAllForApp(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<IShiftFindMany> {
    return await this.shiftService.findAll(page, limit);
  }
  @ApiOperation({
    summary: 'Get shift by ID',
    description:
      'Retrieve detailed information about a specific production shift',
    tags: ['Shift'],
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the requested shift',
    type: IShiftFindOne,
  })
  @ApiResponse({
    status: 404,
    description: "Shift can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<IShiftFindOne> {
    return await this.shiftService.findOne(id);
  }
  @ApiOperation({
    summary: 'Get shift by ID for operator',
    description:
      'Retrieve detailed information about a specific production shift for operators',
    tags: ['Shift', 'Operator'],
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the requested shift',
    type: IShiftFindOne,
  })
  @ApiResponse({
    status: 404,
    description: "Shift can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Operator)
  @UseGuards(AuthGuard)
  @Get('/operator/:id')
  async findOneForApp(@Param('id') id: string): Promise<IShiftFindOne> {
    return await this.shiftService.findOne(id);
  }
  @ApiOperation({
    summary: 'Update shift',
    description:
      'Update information about an existing production shift such as planned count, status, etc.',
    tags: ['Shift'],
  })
  @ApiResponse({
    status: 200,
    description: 'Shift successfully updated',
    type: ShiftDto,
  })
  @ApiResponse({
    status: 404,
    description: "Shift can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateShiftDto: UpdateShiftDto,
  ): Promise<ShiftDto> {
    return await this.shiftService.update(id, updateShiftDto);
  }
  @ApiOperation({
    summary: 'Delete shift',
    description: 'Remove a production shift from the system',
    tags: ['Shift'],
  })
  @ApiResponse({
    status: 200,
    description: 'Shift has been deleted',
    type: IDeletedShift,
  })
  @ApiResponse({
    status: 404,
    description: "Shift can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<IDeletedShift> {
    return await this.shiftService.remove(id);
  }
}
