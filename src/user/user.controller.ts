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
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreatedUserDto,
  CreateUserDto,
  IUserFindMay,
  IUserFindOne,
} from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SignInDto } from './dto/sign-in.dto';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/guards/auth/auth.guard';

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
    @Res() res: Response,
  ): Promise<IUserFindOne> {
    const { user, token } = await this.userService.create(createUserDto);

    res.cookie('jwt', token, { httpOnly: true });

    res.status(201).send({ user: user });

    return { result: user };
  }

  @ApiResponse({
    status: 200,
    description: 'Returns a list of users',
    type: IUserFindMay,
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
  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<IUserFindMay> {
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
  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ id: string; message: string }> {
    return await this.userService.remove(id);
  }

  @Post('auth/sign-in')
  async signIn(@Body() credentials: SignInDto, @Res() res: Response) {
    const { user, token }: { user: Partial<CreatedUserDto>; token: string } =
      await this.userService.signIn(credentials);

    res.cookie('jwt', token, { httpOnly: true });

    res.send({ user: user });
  }

  @UseGuards(AuthGuard)
  @Post('auth/revoke-token')
  async revokeToken(@Req() req: Request): Promise<{ revoked: boolean }> {
    return { revoked: await this.userService.revokeToken(req.user.jti) };
  }

  @UseGuards(AuthGuard)
  @Get('/me')
  async getMe(@Req() req: Request): Promise<IUserFindOne> {
    return { result: await this.userService.findOne(req.user.sub) };
  }
}
