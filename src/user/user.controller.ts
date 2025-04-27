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
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreatedUserDto,
  CreateUserDto,
  IUserFindMay,
} from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: CreatedUserDto,
  })
  @ApiResponse({
    status: 400,
    description: "Data isn't unique",
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<CreatedUserDto> {
    return await this.userService.create(createUserDto);
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
    type: CreatedUserDto,
  })
  @ApiResponse({
    status: 404,
    description: "User can't be found or something went wrong",
  })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CreatedUserDto> {
    return await this.userService.findOne(id);
  }

  @ApiResponse({
    status: 404,
    description: "User can't be found or something went wrong",
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<CreatedUserDto> {
    return await this.userService.update(id, updateUserDto);
  }

  @ApiResponse({
    status: 404,
    description: "User can't be found or something went wrong",
  })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ id: string; message: string }> {
    return await this.userService.remove(id);
  }
}
