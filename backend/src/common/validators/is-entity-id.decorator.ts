import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export function IsEntityId() {
  return applyDecorators(
    IsString({ message: 'Идентификатор должен быть строкой' }),
    IsNotEmpty({ message: 'Идентификатор обязателен' }),
    MinLength(20, { message: 'Идентификатор слишком короткий' }),
    MaxLength(36, { message: 'Идентификатор слишком длинный' }),
  );
}
