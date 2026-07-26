import { IsObject } from 'class-validator';

export class UpsertWhiteboardDto {
  @IsObject()
  snapshot!: Record<string, unknown>;
}
