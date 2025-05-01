import { Injectable } from '@nestjs/common';
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
  private ssccSchema = z.string().length(18);

  constructor(private readonly prisma: PrismaService) {}

  private calculateCheckDigit(sscc: string): number {
    const digits = sscc.split('').map(Number);
    const sum = digits.reduce((acc, digit, index) => {
      return acc + (index % 2 === 0 ? digit * 3 : digit);
    }, 0);
    const nextMultipleOfTen = Math.ceil(sum / 10) * 10;
    return nextMultipleOfTen - sum;
  }

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
    const { gln, productId, currentSscc } = writeBoxesCodeDto;
    const newCode = await this.generateNextSscc(currentSscc);

    const data = await this.writeSsccCodeToBase(newCode, gln, productId);

    return data;
  }

  async generateNextSscc(sscc?: string): Promise<string> {
    let ssccToUse: string;

    if (sscc) {
      this.ssccSchema.parse(sscc);
      ssccToUse = sscc;
    } else {
      const lastSscc = await this.prisma.boxesCode.findFirst({
        orderBy: { created: 'desc' },
      });

      if (!lastSscc) {
        throw new Error('Нет сохраненных кодов SSCC в базе данных');
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
    const data = await this.prisma.boxesCode.create({
      data: {
        sscc,
        gln,
        productId,
      },
    });

    return data;
  }
}
