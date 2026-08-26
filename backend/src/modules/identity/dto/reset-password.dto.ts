import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Токен обязателен' })
  @MinLength(16, { message: 'Недействительная ссылка сброса' })
  @MaxLength(128, { message: 'Недействительная ссылка сброса' })
  token!: string;

  @IsString({ message: 'Пароль обязателен' })
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(128, { message: 'Пароль слишком длинный' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Пароль должен содержать заглавную, строчную букву и цифру',
  })
  password!: string;
}
