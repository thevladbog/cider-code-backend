import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
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

@Controller('code')
export class CodeController {
  constructor(private readonly codeService: CodeService) {}

  @ApiResponse({
    status: 201,
    description: 'Code successfully created',
    type: IndividualCodeDataDto,
  })
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  @Post('/boxes')
  @HttpCode(HttpStatus.CREATED)
  async getNextSscc(
    @Body() writeBoxesCodeDto: WriteBoxesCodeDto,
  ): Promise<BoxesCodeDataDto> {
    return await this.codeService.getNextSscc(writeBoxesCodeDto);
  }
}
