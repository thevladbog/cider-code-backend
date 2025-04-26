import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreatedUserDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<CreatedUserDto> {
    return await this.userService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<CreatedUserDto[]> {
    return await this.userService.findAll();
  }

  @ApiResponse({
    status: 400,
    description: "User can't be found or something went wrong",
  })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CreatedUserDto> {
    return await this.userService.findOne(id);
  }

  @ApiResponse({
    status: 400,
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
    status: 400,
    description: "User can't be found or something went wrong",
  })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<string> {
    return await this.userService.remove(id);
  }
}
