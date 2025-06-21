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
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreatedUserDto,
  CreateUserDto,
  IUserFindMany,
  IUserFindOne,
  UserLoginResponse,
} from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SignInDto } from './dto/sign-in.dto';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { JwtType } from 'src/guards/auth/jwt.metadata';
import { JWT_TYPE } from 'src/constants/jwt.constants';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  ResetPasswordDto,
  ResetPasswordRequestDto,
} from './dto/reset-password.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @ApiOperation({
    summary: 'Create user',
    description: 'Register a new user in the system with email and password',
    tags: ['User', 'Authentication'],
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: IUserFindOne,
  })
  @ApiResponse({
    status: 400,
    description: "Data isn't unique",
  })
  @UsePipes(ZodValidationPipe)
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
  @ApiOperation({
    summary: 'Find all users',
    description: 'Get paginated list of all registered users in the system',
    tags: ['User'],
  })
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by first name, last name, or email',
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<IUserFindMany> {
    return await this.userService.findAll(page, limit, search);
  }
  @ApiOperation({
    summary: 'Find user by ID',
    description: 'Get detailed information about a specific user by their ID',
    tags: ['User'],
  })
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
  @ApiOperation({
    summary: 'Update user',
    description:
      'Update user information such as name, email, or other profile data',
    tags: ['User'],
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: IUserFindOne,
  })
  @ApiResponse({
    status: 404,
    description: "User can't be found or something went wrong",
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<IUserFindOne> {
    const result = await this.userService.update(id, updateUserDto);
    return { result };
  }

  @ApiOperation({
    summary: 'Delete user',
    description: 'Remove a user from the system',
    tags: ['User'],
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted',
  })
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

  @ApiOperation({
    summary: 'Sign in user',
    description:
      'Authenticate user with email and password and return JWT token',
    tags: ['User', 'Authentication'],
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully signed in, JWT token set in cookies',
    type: UserLoginResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  @Post('auth/sign-in')
  async signIn(
    @Body() credentials: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserLoginResponse> {
    const { user, token }: { user: CreatedUserDto; token: string } =
      await this.userService.signIn(credentials);

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: true, //process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.JWT_COOKIE_MAX_AGE ?? '57600000'),
      sameSite: 'none',
    });

    return { user: user };
  }

  @ApiOperation({
    summary: 'Reset password request',
    description:
      'Request a password reset by providing an email, sends reset link to user email',
    tags: ['User', 'Authentication'],
  })
  @ApiResponse({
    status: 201,
    description: 'Reset password request processed successfully',
  })
  @ApiResponse({
    status: 404,
    description: "User can't be found or something went wrong",
  })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  @Post('auth/reset-password-request')
  async resetRequest(@Body() body: ResetPasswordRequestDto) {
    await this.userService.getResetRequest(body.email);
  }
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password using token received via email',
    tags: ['User', 'Authentication'],
  })
  @ApiResponse({
    status: 201,
    description: 'Password has been successfully reset',
  })
  @ApiResponse({
    status: 404,
    description: 'Something went wrong',
  })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  @Post('auth/reset-password')
  async resetPasswordAfterRequest(@Body() body: ResetPasswordDto) {
    await this.userService.resetPassword(body);
  }
  @ApiOperation({
    summary: 'Revoke token',
    description: 'Revoke the current JWT token (logout)',
    tags: ['User', 'Authentication'],
  })
  @ApiResponse({
    status: 200,
    description: 'Token successfully revoked',
  })
  @ApiResponse({
    status: 400,
    description: 'Token ID (jti) is missing',
  })
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
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get details of the currently authenticated user',
    tags: ['User', 'Authentication'],
  })
  @ApiResponse({
    status: 200,
    description: 'Returns current user information',
    type: IUserFindOne,
  })
  @ApiResponse({
    status: 400,
    description: 'User ID (sub) is missing',
  })
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
