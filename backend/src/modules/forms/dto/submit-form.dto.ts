import {
  IsObject,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const MAX_ANSWER_KEYS = 50;

@ValidatorConstraint({ name: 'submitFormAnswersShape', async: false })
class SubmitFormAnswersShapeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const keys = Object.keys(value);

    if (keys.length > MAX_ANSWER_KEYS) {
      return false;
    }

    return keys.every((key) => {
      const answer = (value as Record<string, unknown>)[key];
      return (
        typeof answer === 'string' ||
        (Array.isArray(answer) && answer.every((item) => typeof item === 'string'))
      );
    });
  }

  defaultMessage(): string {
    return 'Ответы должны быть объектом не более чем с 50 полями типа string или string[]';
  }
}

export class SubmitFormDto {
  @IsObject({ message: 'Ответы должны быть объектом' })
  @Validate(SubmitFormAnswersShapeConstraint)
  answers!: Record<string, string | string[]>;
}
