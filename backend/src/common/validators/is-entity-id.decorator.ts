import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/** Validates Prisma `cuid()` primary/foreign keys (not RFC UUIDs). */
export function IsEntityId() {
  return applyDecorators(IsString(), IsNotEmpty(), MinLength(20), MaxLength(36));
}
