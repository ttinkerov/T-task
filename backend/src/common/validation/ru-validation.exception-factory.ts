import { BadRequestException, ValidationError } from '@nestjs/common';

function flattenValidationErrors(errors: ValidationError[], parent = ''): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;

    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        messages.push(localizeValidationMessage(message, path));
      }
    }

    if (error.children?.length) {
      messages.push(...flattenValidationErrors(error.children, path));
    }
  }

  return messages;
}

function localizeValidationMessage(message: string, path: string): string {
  if (/should not exist/i.test(message)) {
    return `Поле «${path}» не допускается`;
  }
  if (/must be a string/i.test(message)) {
    return `Поле «${path}» должно быть строкой`;
  }
  if (/must be a number/i.test(message)) {
    return `Поле «${path}» должно быть числом`;
  }
  if (/must be a boolean/i.test(message)) {
    return `Поле «${path}» должно быть булевым`;
  }
  if (/must be an object/i.test(message)) {
    return `Поле «${path}» должно быть объектом`;
  }
  if (/must be an array/i.test(message)) {
    return `Поле «${path}» должно быть массивом`;
  }
  if (/must be an email/i.test(message)) {
    return `Поле «${path}» должно быть корректным email`;
  }
  if (/must be a valid enum value/i.test(message)) {
    return `Поле «${path}» содержит недопустимое значение`;
  }
  if (/should not be empty/i.test(message)) {
    return `Поле «${path}» обязательно`;
  }
  if (/must be longer than or equal to/i.test(message)) {
    return `Поле «${path}» слишком короткое`;
  }
  if (/must be shorter than or equal to/i.test(message)) {
    return `Поле «${path}» слишком длинное`;
  }
  if (/must be a UUID/i.test(message)) {
    return `Поле «${path}» должно быть корректным идентификатором`;
  }
  if (/must be a URL/i.test(message)) {
    return `Поле «${path}» должно быть корректным URL`;
  }
  if (/must be an integer number/i.test(message) || /must be an integer/i.test(message)) {
    return `Поле «${path}» должно быть целым числом`;
  }
  if (/must be a number conforming to the specified constraints/i.test(message)) {
    return `Поле «${path}» содержит недопустимое число`;
  }
  if (
    /must be a valid ISO 8601 date string/i.test(message) ||
    /must be a Date instance/i.test(message)
  ) {
    return `Поле «${path}» должно быть корректной датой`;
  }
  if (/must be one of the following values/i.test(message)) {
    return `Поле «${path}» содержит недопустимое значение`;
  }
  if (/must not be less than/i.test(message) || /must not be greater than/i.test(message)) {
    return `Поле «${path}» вне допустимого диапазона`;
  }
  if (/must match/i.test(message)) {
    return `Поле «${path}» имеет неверный формат`;
  }
  if (/nested property/i.test(message)) {
    return `Поле «${path}» содержит некорректные вложенные данные`;
  }

  return message;
}

export function ruValidationExceptionFactory(errors: ValidationError[]) {
  const messages = flattenValidationErrors(errors);
  return new BadRequestException(messages.length > 0 ? messages : ['Некорректные данные запроса']);
}
