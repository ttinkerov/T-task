import { SetMetadata } from '@nestjs/common';
import type { WorkspaceScopeValue } from '../scopes';

export const SCOPES_KEY = 'scopes';

export const Scopes = (...scopes: WorkspaceScopeValue[]) => SetMetadata(SCOPES_KEY, scopes);
