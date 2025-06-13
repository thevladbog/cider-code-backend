import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { OperatorService } from './operator.service';
import {
  CreateOperatorDto,
  CreatedOperatorDto,
  IOperatorFindMany,
  IOperatorFindOne,
} from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { JwtType } from 'src/guards/auth/jwt.metadata';
import { JWT_TYPE } from 'src/constants/jwt.constants';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { Request } from 'express';
import { LoginOperatorDto } from './dto/login-operator.dto';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller('operator')
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) {}
  @ApiOperation({
    summary: 'Create operator',
    description: 'Create a new operator account in the system',
    tags: ['Operator'],
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: CreatedOperatorDto,
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOperator(
    @Body() createOperatorDto: CreateOperatorDto,
  ): Promise<CreatedOperatorDto> {
    return await this.operatorService.createOperator(createOperatorDto);
  }
  @ApiOperation({
    summary: 'Update operator',
    description: 'Update operator information such as name or barcode',
    tags: ['Operator'],
  })
  @ApiResponse({ status: 200, type: IOperatorFindOne })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Patch(':id')
  async updateOperator(
    @Param('id') id: string,
    @Body() updateOperatorDto: UpdateOperatorDto,
  ): Promise<IOperatorFindOne> {
    const res = await this.operatorService.updateOperator(
      id,
      updateOperatorDto,
    );

    if (!res) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }

    return res;
  }
  @ApiOperation({
    summary: 'Login operator',
    description: 'Authenticate an operator using barcode and return JWT token',
    tags: ['Operator', 'Authentication'],
  })
  @ApiResponse({
    status: 201,
    description: 'Operator login successful',
    type: Boolean,
  })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  @Post('/login')
  async login(
    @Body() loginOperatorDto: LoginOperatorDto,
  ): Promise<{ token: string }> {
    const token = await this.operatorService.loginOperator(
      loginOperatorDto.barcode,
    );

    return { token };
  }
  @ApiOperation({
    summary: 'Get all operators',
    description: 'Retrieve a paginated list of all operators in the system',
    tags: ['Operator'],
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of operators',
    type: IOperatorFindMany,
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
  ): Promise<IOperatorFindMany> {
    return await this.operatorService.getAll(page, limit);
  }
  @ApiOperation({
    summary: 'Get operator by ID',
    description: 'Retrieve detailed information about a specific operator',
    tags: ['Operator'],
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the requested operator',
    type: IOperatorFindOne,
  })
  @ApiResponse({
    status: 404,
    description: "Operator can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Get('/one/:id')
  async findOne(@Param('id') id: string): Promise<IOperatorFindOne> {
    return await this.operatorService.getOne(id);
  }
  @ApiOperation({
    summary: 'Get current operator',
    description: 'Get details of the currently authenticated operator',
    tags: ['Operator', 'Authentication'],
  })
  @ApiResponse({
    status: 200,
    description: 'Returns current operator information',
    type: IOperatorFindOne,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or operator token missing',
  })
  @JwtType(JWT_TYPE.Operator)
  @UseGuards(AuthGuard)
  @Get('/me')
  async getMe(@Req() req: Request): Promise<IOperatorFindOne> {
    if (!req.operator?.sub) {
      throw new UnauthorizedException('Operator token missing');
    }
    return await this.operatorService.getOne(req.operator.sub);
  }
}
