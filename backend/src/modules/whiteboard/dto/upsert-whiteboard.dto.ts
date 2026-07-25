import { IsObject } from 'class-validator';

export class UpsertWhiteboardDto {
  /** tldraw document snapshot (typically `{ document: ... }`). */
  @IsObject()
  snapshot!: Record<string, unknown>;
}
