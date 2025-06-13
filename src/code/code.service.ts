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
import { PackCodesDto, PackedCodesResponseDto } from './dto/pack-codes.dto';
import { IndividualCodeStatus } from '@prisma/client';
import { UpdateCodesStatusDto } from './dto/update-codes-status.dto';

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
    try {
      this.ssccSchema.parse(sscc);
      z.string().min(1).parse(gln);
      z.string().min(1).parse(productId);

      const data = await this.prisma.boxesCode.create({
        data: {
          sscc,
          gln,
          productId,
        },
      });

      return data as BoxesCodeDataDto;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Invalid input data format:', error);
        throw new BadRequestException('Invalid input data format');
      }
      this.logger.error('Failed to write SSCC code to database:', error);
      throw new InternalServerErrorException(
        'Failed to write SSCC code to database',
      );
    }
  }
  async packCodes(packCodesDto: PackCodesDto): Promise<PackedCodesResponseDto> {
    try {
      const id = packCodesDto.id;
      const ssccCode = packCodesDto.ssccCode;
      const codes = packCodesDto.codes;
      const shiftId = packCodesDto.shiftId;
      const productId = packCodesDto.productId;

      // Проверка существования BoxesCode
      const boxCode = await this.prisma.boxesCode.findFirst({
        where: {
          id: id,
          sscc: ssccCode,
        },
      });

      if (!boxCode) {
        throw new NotFoundException(
          `BoxesCode with id ${id} and sscc ${ssccCode} not found`,
        );
      }

      // Обновление статуса индивидуальных кодов и привязка к коробке
      await this.prisma.$transaction(async (tx) => {
        const individualCodes = await tx.individualCode.findMany({
          where: { code: { in: codes } },
        });

        if (individualCodes.length !== codes.length) {
          const missingCodes = codes.filter(
            (code) => !individualCodes.some((ic) => ic.code === code),
          );
          throw new NotFoundException(
            `Individual codes not found: ${missingCodes.join(', ')}`,
          );
        }

        await tx.individualCode.updateMany({
          where: { code: { in: codes } },
          data: {
            status: IndividualCodeStatus.USED,
            boxesCodeId: id,
            shiftId: shiftId,
          },
        });
      });

      // Генерация нового SSCC кода
      const newSscc = await this.generateNextSscc(ssccCode);

      // Запись нового SSCC кода в базу
      const newBoxCode = await this.prisma.boxesCode.create({
        data: {
          sscc: newSscc,
          gln: boxCode.gln, // используем GLN из предыдущего кода
          productId: productId,
          shiftId: shiftId,
        },
      });

      return {
        id: newBoxCode.id,
        ssccCode: newBoxCode.sscc,
      };
    } catch (error) {
      this.logger.error('Failed to pack codes:', error);

      if (error instanceof z.ZodError) {
        throw new BadRequestException('Invalid input data format');
      }

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to process code packing');
    }
  }
  async updateCodesStatus(
    updateCodesStatusDto: UpdateCodesStatusDto,
  ): Promise<void> {
    try {
      const { codes, shiftId } = updateCodesStatusDto;

      // Проверка входных данных
      z.string().min(1).parse(shiftId);

      // Проверка существования Shift
      const shift = await this.prisma.shift.findUnique({
        where: { id: shiftId },
      });

      if (!shift) {
        throw new NotFoundException(`Shift with id ${shiftId} not found`);
      }

      // Обновление статуса индивидуальных кодов и привязка к смене
      await this.prisma.$transaction(async (tx) => {
        const existingCodes = await tx.individualCode.findMany({
          where: { code: { in: codes } },
        });

        const existingCodeSet = new Set(existingCodes.map((code) => code.code));
        const missingCodes = codes.filter((code) => !existingCodeSet.has(code));

        if (missingCodes.length > 0) {
          throw new NotFoundException(
            `Individual codes not found: ${missingCodes.join(', ')}`,
          );
        }

        await tx.individualCode.updateMany({
          where: { code: { in: codes } },
          data: {
            status: IndividualCodeStatus.USED,
            shiftId: shiftId,
          },
        });
      });

      this.logger.log(
        `Updated status for ${codes.length} codes in shift ${shiftId}`,
      );
    } catch (error) {
      this.logger.error('Failed to update codes status:', error);

      if (error instanceof z.ZodError) {
        throw new BadRequestException('Invalid input data format');
      }

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update codes status');
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
