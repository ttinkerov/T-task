import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class CreateExternalAppDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Название обязательно' })
  @IsNotEmpty({ message: 'Название не должно быть пустым' })
  @MaxLength(120, { message: 'Название слишком длинное' })
  // eslint-disable-next-line no-control-regex -- intentional control-character allowlist
  @Matches(/^[^\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\uFEFF]+$/, {
    message: 'Название не должно содержать невидимые или управляющие символы',
  })
  title!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'URL обязателен' })
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'Укажите корректный HTTPS-адрес' },
  )
  @MaxLength(2048, { message: 'URL слишком длинный' })
  url!: string;
}
