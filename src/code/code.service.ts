import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { z } from 'zod';
import {
  IndividualCodeDataDto,
  WriteIndividualCodeDto,
} from './dto/write-individual-code.dto';
import {
  BoxesCodeDataDto,
  WriteBoxesCodeDto,
} from './dto/write-boxes-code.dto';

@Injectable()
export class CodeService {
  private readonly ssccSchema = z.string().length(18);
  private readonly logger = new Logger(CodeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async writeIndividualCode(
    writeIndividualCodeDto: WriteIndividualCodeDto,
  ): Promise<IndividualCodeDataDto> {
    const data = await this.prisma.individualCode.create({
      data: writeIndividualCodeDto,
    });

    return data;
  }

  async getNextSscc(
    writeBoxesCodeDto: WriteBoxesCodeDto,
  ): Promise<BoxesCodeDataDto> {
    try {
      const { gln, productId, currentSscc } = writeBoxesCodeDto;
      z.string().min(1).parse(gln);
      z.string().min(1).parse(productId);
      const newCode = await this.generateNextSscc(currentSscc);

      const data = await this.writeSsccCodeToBase(newCode, gln, productId);

      return data;
    } catch (error) {
      this.logger.error('Failed to generate next SSCC code:', error);
      throw error;
    }
  }

  async generateNextSscc(sscc?: string): Promise<string> {
    let ssccToUse: string;

    if (sscc) {
      try {
        this.ssccSchema.parse(sscc);
      } catch (error) {
        this.logger.error('Invalid SSCC format, ', error);
        throw new BadRequestException('Invalid SSCC format');
      }
      ssccToUse = sscc;
    } else {
      let lastSscc: BoxesCodeDataDto | null = null;
      try {
        lastSscc = await this.prisma.boxesCode.findFirst({
          orderBy: { created: 'desc' },
        });
      } catch (error) {
        this.logger.error('DB error retrieving last SSCC, ', error);
        throw new InternalServerErrorException('DB error retrieving last SSCC');
      }

      if (!lastSscc) {
        this.logger.error('No SSCC codes found in database');
        throw new NotFoundException('No SSCC codes found in database');
      }

      ssccToUse = lastSscc.sscc;
    }

    const ssccWithoutCheckDigit = ssccToUse.slice(0, 17);
    const ssccNumber = BigInt(ssccWithoutCheckDigit);

    const nextSsccNumber = ssccNumber + BigInt(1);
    const nextSsccWithoutCheckDigit = nextSsccNumber
      .toString()
      .padStart(17, '0');

    const checkDigit = this.calculateCheckDigit(nextSsccWithoutCheckDigit);

    const newSscc = nextSsccWithoutCheckDigit + checkDigit.toString();

    return newSscc;
  }

  async writeSsccCodeToBase(sscc: string, gln: string, productId: string) {
    this.ssccSchema.parse(sscc);
    z.string().min(1).parse(gln);
    z.string().min(1).parse(productId);

    try {
      const data = await this.prisma.boxesCode.create({
        data: {
          sscc,
          gln,
          productId,
        },
      });

      return data;
    } catch (error) {
      this.logger.error('Failed to write SSCC code to database:', error);
      throw error;
    }
  }

  private calculateCheckDigit(sscc: string): number {
    const digits = sscc.split('').map(Number);
    const sum = digits.reduce((acc, digit, index) => {
      return acc + (index % 2 === 0 ? digit * 3 : digit);
    }, 0);
    const nextMultipleOfTen = Math.ceil(sum / 10) * 10;
    return nextMultipleOfTen - sum;
  }
}
