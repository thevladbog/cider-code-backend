import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { CodeService } from './code.service';
import {
  IndividualCodeDataDto,
  WriteIndividualCodeDto,
} from './dto/write-individual-code.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  BoxesCodeDataDto,
  WriteBoxesCodeDto,
} from './dto/write-boxes-code.dto';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { JwtType } from 'src/guards/auth/jwt.metadata';
import { JWT_TYPE } from 'src/constants/jwt.constants';
import { ZodValidationPipe } from 'nestjs-zod';
import { PackCodesDto, PackedCodesResponseDto } from './dto/pack-codes.dto';
import { UpdateCodesStatusDto } from './dto/update-codes-status.dto';

@Controller('code')
export class CodeController {
  constructor(private readonly codeService: CodeService) {}
  @ApiOperation({
    summary: 'Create individual code',
    description:
      'Create a new individual product code and store it in the database with product association',
    tags: ['Codes', 'Individual'],
  })
  @ApiResponse({
    status: 201,
    description: 'Code successfully created and stored in database',
    type: IndividualCodeDataDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input format or validation error',
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Post('/individual')
  @HttpCode(HttpStatus.CREATED)
  async writeIndividualCode(
    @Body() writeIndividualCodeDto: WriteIndividualCodeDto,
  ) {
    return await this.codeService.writeIndividualCode(writeIndividualCodeDto);
  }
  @ApiOperation({
    summary: 'Generate SSCC code',
    description:
      'Generate next SSCC code for boxes and store it in the database',
    tags: ['Codes', 'Boxes'],
  })
  @ApiResponse({
    status: 201,
    description: 'Code successfully created',
    type: BoxesCodeDataDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or SSCC format',
  })
  @ApiResponse({
    status: 404,
    description: 'No previous SSCC codes found in database',
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Post('/boxes')
  @HttpCode(HttpStatus.CREATED)
  async getNextSscc(
    @Body() writeBoxesCodeDto: WriteBoxesCodeDto,
  ): Promise<BoxesCodeDataDto> {
    return await this.codeService.getNextSscc(writeBoxesCodeDto);
  }
  @ApiOperation({
    summary: 'Pack codes',
    description:
      'Pack individual codes into a box and generate a new SSCC code',
    tags: ['Codes', 'Packaging'],
  })
  @ApiResponse({
    status: 201,
    description: 'Codes successfully packed and new SSCC code created',
    type: PackedCodesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data format',
  })
  @ApiResponse({
    status: 404,
    description: 'Box code or individual codes not found',
  })
  @JwtType(JWT_TYPE.Operator)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Post('/pack')
  @HttpCode(HttpStatus.CREATED)
  async packCodes(
    @Body() packCodesDto: PackCodesDto,
  ): Promise<PackedCodesResponseDto> {
    return await this.codeService.packCodes(packCodesDto);
  }
  @ApiOperation({
    summary: 'Update codes status',
    description:
      'Update the status of multiple individual codes and link them to a shift',
    tags: ['Codes', 'Status'],
  })
  @ApiResponse({
    status: 200,
    description: 'Codes status successfully updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data format',
  })
  @ApiResponse({
    status: 404,
    description: 'Shift or individual codes not found',
  })
  @JwtType(JWT_TYPE.Operator)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Post('/update-status')
  @HttpCode(HttpStatus.OK)
  async updateCodesStatus(
    @Body() updateCodesStatusDto: UpdateCodesStatusDto,
  ): Promise<void> {
    await this.codeService.updateCodesStatus(updateCodesStatusDto);
  }
}
