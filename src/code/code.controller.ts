import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { CodeService } from './code.service';
import { WriteIndividualCodeDto } from './dto/write-individual-code.dto';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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
import { DownloadCodesDto } from './dto/download-codes.dto';
import { Response } from 'express';

@Controller('code')
export class CodeController {
  constructor(private readonly codeService: CodeService) {}

  @ApiOperation({
    summary: 'Create individual codes',
    description:
      'Create new individual product codes and store them in the database with product association',
    tags: ['Codes', 'Individual'],
  })
  @ApiResponse({
    status: 201,
    description: 'Codes successfully created and stored in database',
    content: {
      'application/json': {
        schema: {
          properties: {
            count: { type: 'number', description: 'Number of codes created' },
            codes: {
              type: 'array',
              description: 'Array of created codes',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  code: { type: 'string' },
                  productId: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input format or validation error',
  })
  @JwtType(JWT_TYPE.Operator)
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
  @JwtType(JWT_TYPE.Operator)
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

  @ApiOperation({
    summary: 'Download codes as text file',
    description:
      'Download codes for a specific shift as a text file. Can include box codes if requested.',
    tags: ['Codes', 'Download'],
  })
  @ApiQuery({
    name: 'shiftId',
    description: 'ID of the shift to download codes for',
    required: true,
    type: String,
    example: 'shift_123',
  })
  @ApiQuery({
    name: 'includeBoxes',
    description: 'Whether to include box codes in the download',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Text file with codes successfully generated',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          description: 'Text file containing codes, one per line',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data format',
  })
  @ApiResponse({
    status: 404,
    description: 'Shift not found',
  })
  @JwtType(JWT_TYPE.Common)
  @UseGuards(AuthGuard)
  @UsePipes(ZodValidationPipe)
  @Get('/download')
  async downloadCodes(
    @Query() downloadCodesDto: DownloadCodesDto,
    @Res() res: Response,
  ): Promise<void> {
    const fileContent = await this.codeService.downloadCodes(downloadCodesDto);

    const filename = `codes_shift_${downloadCodesDto.shiftId}_${new Date().toISOString().split('T')[0]}.txt`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileContent);
  }
}
