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
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Res,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreatedUserDto,
  CreateUserDto,
  IUserFindMany,
  IUserFindOne,
} from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SignInDto } from './dto/sign-in.dto';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { JwtType } from 'src/guards/auth/jwt.metadata';
import { JWT_TYPE } from 'src/constants/jwt.constants';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: IUserFindOne,
  })
  @ApiResponse({
    status: 400,
    description: "Data isn't unique",
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IUserFindOne> {
    const { user, token } = await this.userService.create(createUserDto);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.JWT_COOKIE_MAX_AGE ?? '57600000'),
    });

    return { result: user };
  }

  @ApiResponse({
    status: 200,
    description: 'Returns a list of users',
    type: IUserFindMany,
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
  ): Promise<IUserFindMany> {
    return await this.userService.findAll(page, limit);
  }

  @ApiResponse({
    status: 200,
    description: 'Returns the requested user',
    type: IUserFindOne,
  })
  @ApiResponse({
    status: 404,
    description: "User can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<IUserFindOne> {
    const result = await this.userService.findOne(id);
    return { result };
  }

  @ApiResponse({
    status: 404,
    description: "User can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<IUserFindOne> {
    const result = await this.userService.update(id, updateUserDto);
    return { result };
  }

  @ApiResponse({
    status: 404,
    description: "User can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ id: string; message: string }> {
    return await this.userService.remove(id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('auth/sign-in')
  async signIn(
    @Body() credentials: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token }: { user: Partial<CreatedUserDto>; token: string } =
      await this.userService.signIn(credentials);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: true, //process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.JWT_COOKIE_MAX_AGE ?? '57600000'),
      sameSite: 'none',
    });

    res.send({ user: user });
  }

  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Post('auth/revoke-token')
  async revokeToken(@Req() req: Request): Promise<{ revoked: boolean }> {
    const jti = req?.user?.jti;

    if (!jti) {
      throw new BadRequestException('Token ID (jti) is missing');
    }
    return { revoked: await this.userService.revokeToken(jti) };
  }

  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Get('auth/me')
  async getMe(@Req() req: Request): Promise<IUserFindOne> {
    const userId = req?.user?.sub;
    if (!userId) {
      throw new BadRequestException('User id (sub) is missing');
    }
    return { result: await this.userService.findOne(userId) };
  }
}
