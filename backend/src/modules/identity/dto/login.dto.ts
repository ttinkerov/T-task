import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsString({ message: 'Пароль обязателен' })
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(128, { message: 'Пароль слишком длинный' })
  password!: string;
}
