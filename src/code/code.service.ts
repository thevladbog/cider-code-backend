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
import { DownloadCodesDto } from './dto/download-codes.dto';

@Injectable()
export class CodeService {
  private readonly ssccSchema = z.string().length(18);
  private readonly logger = new Logger(CodeService.name);

  constructor(private readonly prisma: PrismaService) {}
  async writeIndividualCode(
    writeIndividualCodeDto: WriteIndividualCodeDto,
  ): Promise<{ count: number; codes: IndividualCodeDataDto[] }> {
    try {
      const {
        code: codes,
        productId,
        status,
        boxesCodeId,
        shiftId,
      } = writeIndividualCodeDto;

      this.logger.log(
        `Creating ${codes.length} individual codes for product ${productId}`,
      );

      // Создаем записи для каждого кода из массива
      const createdCodes = await Promise.all(
        codes.map(async (code) => {
          return await this.prisma.individualCode.create({
            data: {
              code,
              productId,
              status,
              ...(boxesCodeId && { boxesCodeId }),
              ...(shiftId && { shiftId }),
            },
          });
        }),
      );

      return {
        count: createdCodes.length,
        codes: createdCodes,
      };
    } catch (error) {
      this.logger.error('Failed to create individual codes:', error);

      if (error instanceof z.ZodError) {
        throw new BadRequestException('Invalid input data format');
      }

      throw new InternalServerErrorException(
        'Failed to create individual codes',
      );
    }
  }
  /**
   * Извлекает GLN из SSCC кода
   * @param sscc SSCC код формата начинающийся с '00'
   * @returns GLN - идентификатор участника цепочки поставок
   */
  private extractGlnFromSscc(sscc: string): string {
    try {
      // Проверяем, что SSCC имеет правильный формат
      this.ssccSchema.parse(sscc);

      // SSCC состоит из:
      // - Расширения (1 цифра)
      // - Префикса компании GS1 (обычно GLN без контрольной цифры) (7-10 символов)
      // - Серийного номера
      // - Контрольной цифры

      // Обычно GLN содержится в позициях 2-11 (индексы 1-10) SSCC кода
      // В зависимости от формата SSCC для вашей системы это может отличаться
      const gln = sscc.substring(1, 11);

      return gln;
    } catch (error) {
      this.logger.error('Failed to extract GLN from SSCC:', error);
      throw new BadRequestException('Invalid SSCC format for GLN extraction');
    }
  }

  async getNextSscc(
    writeBoxesCodeDto: WriteBoxesCodeDto,
  ): Promise<BoxesCodeDataDto> {
    try {
      const { gln: providedGln, productId, currentSscc } = writeBoxesCodeDto;

      // Если указан SSCC и не указан GLN, извлекаем GLN из SSCC
      let gln = providedGln ?? '46800899';
      if (currentSscc && !gln) {
        gln = this.extractGlnFromSscc(currentSscc);
        this.logger.log(`Extracted GLN from SSCC: ${gln}`);
      } else if (!gln) {
        gln = '46800899'; // Default GLN
      }

      if (gln) {
        z.string().min(1).parse(gln);
      }

      z.string().min(1).parse(productId);
      const newCode = await this.generateNextSscc(currentSscc);

      console.log({ newCode, gln, productId });

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

      // Обновляем shiftId у коробки, если он не установлен
      if (shiftId && !boxCode.shiftId) {
        this.logger.log(`Updating shiftId for BoxesCode with id ${id}`);
        await this.prisma.boxesCode.update({
          where: { id: id },
          data: { shiftId: shiftId },
        });
      }

      // Обновление статуса индивидуальных кодов и привязка к коробке
      await this.prisma.$transaction(async (tx) => {
        const individualCodes = await tx.individualCode.findMany({
          where: { code: { in: codes } },
        });

        // Создаем отсутствующие индивидуальные коды
        const existingCodeSet = new Set(individualCodes.map((ic) => ic.code));
        const missingCodes = codes.filter((code) => !existingCodeSet.has(code));

        if (missingCodes.length > 0) {
          this.logger.log(
            `Creating ${missingCodes.length} missing individual codes`,
          );
          await Promise.all(
            missingCodes.map((code) =>
              tx.individualCode.create({
                data: {
                  code,
                  productId,
                  status: IndividualCodeStatus.USED,
                  boxesCodeId: id,
                  shiftId: shiftId,
                },
              }),
            ),
          );
        }

        // Обновляем существующие коды
        if (existingCodeSet.size > 0) {
          await tx.individualCode.updateMany({
            where: { code: { in: Array.from(existingCodeSet) } },
            data: {
              status: IndividualCodeStatus.USED,
              boxesCodeId: id,
              shiftId: shiftId,
            },
          });
        }
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

      // Обновляем factCount в смене - подсчитываем количество кодов с id этой смены
      if (shiftId) {
        const codesCount = await this.prisma.individualCode.count({
          where: { shiftId: shiftId },
        });

        this.logger.log(`Updating shift ${shiftId} factCount to ${codesCount}`);

        await this.prisma.shift.update({
          where: { id: shiftId },
          data: { factCount: codesCount },
        });
      }

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
      const { codes, shiftId, productId } = updateCodesStatusDto;

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

        // Создаем отсутствующие индивидуальные коды
        if (missingCodes.length > 0) {
          if (!productId) {
            throw new BadRequestException(
              'productId is required when creating new individual codes',
            );
          }

          this.logger.log(
            `Creating ${missingCodes.length} missing individual codes for shift ${shiftId}`,
          );

          await Promise.all(
            missingCodes.map((code) =>
              tx.individualCode.create({
                data: {
                  code,
                  productId,
                  status: IndividualCodeStatus.USED,
                  shiftId: shiftId,
                },
              }),
            ),
          );
        }

        // Обновляем существующие коды
        if (existingCodeSet.size > 0) {
          await tx.individualCode.updateMany({
            where: { code: { in: Array.from(existingCodeSet) } },
            data: {
              status: IndividualCodeStatus.USED,
              shiftId: shiftId,
            },
          });
        }
      });

      // Обновляем factCount в смене - подсчитываем количество кодов с id этой смены
      const codesCount = await this.prisma.individualCode.count({
        where: { shiftId: shiftId },
      });

      this.logger.log(`Updating shift ${shiftId} factCount to ${codesCount}`);

      await this.prisma.shift.update({
        where: { id: shiftId },
        data: { factCount: codesCount },
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

  async downloadCodes(downloadCodesDto: DownloadCodesDto): Promise<string> {
    try {
      const { shiftId, includeBoxes } = downloadCodesDto;

      // Проверка входных данных
      z.string().min(1).parse(shiftId);

      // Проверка существования смены
      const shift = await this.prisma.shift.findUnique({
        where: { id: shiftId },
      });

      if (!shift) {
        throw new NotFoundException(`Shift with id ${shiftId} not found`);
      }

      if (includeBoxes) {
        // Получаем все индивидуальные коды для данной смены, которые привязаны к коробкам
        const codesInBoxes = await this.prisma.individualCode.findMany({
          where: {
            shiftId: shiftId,
            boxesCodeId: { not: null },
          },
          include: {
            BoxesCode: true,
          },
          orderBy: { created: 'asc' },
        });

        // Получаем индивидуальные коды, которые не привязаны к коробкам
        const unboxedCodes = await this.prisma.individualCode.findMany({
          where: {
            shiftId: shiftId,
            boxesCodeId: null,
          },
          orderBy: { created: 'asc' },
        });

        const lines: string[] = [];

        // Группируем коды по коробкам
        const codesByBox = new Map<string, { sscc: string; codes: string[] }>();

        codesInBoxes.forEach((code) => {
          if (code.BoxesCode) {
            const boxId = code.BoxesCode.id.toString();
            if (!codesByBox.has(boxId)) {
              codesByBox.set(boxId, {
                sscc: code.BoxesCode.sscc,
                codes: [],
              });
            }
            codesByBox.get(boxId)!.codes.push(code.code);
          }
        });

        // Добавляем коробки с их кодами
        codesByBox.forEach((boxData) => {
          // Добавляем SSCC код коробки
          lines.push(boxData.sscc);

          // Добавляем все индивидуальные коды из этой коробки
          boxData.codes.forEach((code) => {
            lines.push(code);
          });
        });

        // Добавляем индивидуальные коды, которые не в коробках
        unboxedCodes.forEach((code) => {
          lines.push(code.code);
        });

        // Если коробки не формировались, но флаг был проставлен
        if (codesByBox.size === 0 && unboxedCodes.length > 0) {
          this.logger.warn(
            `No boxes found for shift ${shiftId}, but includeBoxes flag was set. Returning only individual codes.`,
          );
        }

        return lines.join('\n');
      } else {
        // Получаем только индивидуальные коды для данной смены
        const individualCodes = await this.prisma.individualCode.findMany({
          where: { shiftId: shiftId },
          orderBy: { created: 'asc' },
        });

        if (individualCodes.length === 0) {
          this.logger.warn(`No individual codes found for shift ${shiftId}`);
          return '';
        }

        return individualCodes.map((code) => code.code).join('\n');
      }
    } catch (error) {
      this.logger.error('Failed to download codes:', error);

      if (error instanceof z.ZodError) {
        throw new BadRequestException('Invalid input data format');
      }

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to download codes');
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
