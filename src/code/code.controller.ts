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
import { ApiResponse } from '@nestjs/swagger';
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

  @ApiResponse({
    status: 201,
    description: 'Code successfully created',
    type: IndividualCodeDataDto,
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

  @ApiResponse({
    status: 201,
    description: 'Code successfully created',
    type: BoxesCodeDataDto,
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

  @ApiResponse({
    status: 201,
    description: 'Codes successfully packed and new SSCC code created',
    type: PackedCodesResponseDto,
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

  @ApiResponse({
    status: 200,
    description: 'Codes status successfully updated',
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
