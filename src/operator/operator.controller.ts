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
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { OperatorService } from './operator.service';
import {
  CreateOperatorDto,
  CreatedOperatorDto,
  IOperatorFindMay,
  IOperatorFindOne,
} from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtType } from 'src/guards/auth/jwt.metadata';
import { JWT_TYPE } from 'src/constants/jwt.constants';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { Response, Request } from 'express';
import { LoginOperatorDto } from './dto/login-operator.dto';

@Controller('operator')
export class OperatorController {
  constructor(private readonly operatorService: OperatorService) {}

  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: CreatedOperatorDto,
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOperator(
    @Body() createOperatorDto: CreateOperatorDto,
  ): Promise<CreatedOperatorDto> {
    return await this.operatorService.createOperator(createOperatorDto);
  }

  @ApiResponse({ status: 200, type: IOperatorFindOne })
  @ApiResponse({ status: 404, description: 'Operator not found' })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
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

  @ApiResponse({
    status: 201,
    description: 'Operator login successful',
    type: Boolean,
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('/login')
  async login(
    @Body() loginOperatorDto: LoginOperatorDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<boolean> {
    const token = await this.operatorService.loginOperator(
      loginOperatorDto.barcode,
    );

    res.cookie(JWT_TYPE.Operator, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.JWT_COOKIE_MAX_AGE ?? '57600000'),
    });

    return true;
  }

  @ApiResponse({
    status: 200,
    description: 'Returns a list of users',
    type: IOperatorFindMay,
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
  ): Promise<IOperatorFindMay> {
    return await this.operatorService.getAll(page, limit);
  }

  @ApiResponse({
    status: 200,
    description: 'Returns the requested user',
    type: IOperatorFindOne,
  })
  @ApiResponse({
    status: 404,
    description: "User can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Get('/one/:id')
  async findOne(@Param('id') id: string): Promise<IOperatorFindOne> {
    return await this.operatorService.getOne(id);
  }

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
