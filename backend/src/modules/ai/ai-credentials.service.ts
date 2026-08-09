import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RAG_DEFAULT_EMBEDDING_MODEL } from './rag/rag.constants';
import { assertSafeAiBaseUrl } from './utils/base-url-guard.util';
import { resolveProviderBaseUrl } from './utils/provider-presets';
import { decryptToken } from './utils/token-crypto.util';

export type AiRuntimeCredentials = {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  apiToken: string;
};

const CHAT_PROVIDERS_WITH_EMBEDDINGS: ReadonlySet<AiProvider> = new Set([
  AiProvider.OPENAI,
  AiProvider.OPENROUTER,
]);

@Injectable()
export class AiCredentialsService {
  private readonly logger = new Logger(AiCredentialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async loadChatCredentials(workspaceId: string): Promise<AiRuntimeCredentials> {
    const setting = await this.prisma.aiWorkspaceSetting.findUnique({
      where: { workspaceId },
    });
    if (!setting) {
      throw new BadRequestException(
        'ИИ не настроен. Администратор команды может вставить API-токен в настройках.',
      );
    }
    try {
      return this.toRuntime({
        provider: setting.provider,
        model: setting.model,
        baseUrl: setting.baseUrl,
        tokenCiphertext: setting.tokenCiphertext,
        tokenIv: setting.tokenIv,
        tokenAuthTag: setting.tokenAuthTag,
      });
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'Не удалось расшифровать токен ИИ. Проверьте AI_TOKEN_ENC_KEY.',
      );
    }
  }

  async loadEmbeddingCredentials(workspaceId: string): Promise<AiRuntimeCredentials | null> {
    const setting = await this.prisma.aiWorkspaceSetting.findUnique({
      where: { workspaceId },
    });
    if (!setting) return null;
    if (!this.configService.get<string>('AI_TOKEN_ENC_KEY')?.trim()) return null;

    if (
      setting.embeddingTokenCiphertext &&
      setting.embeddingTokenIv &&
      setting.embeddingTokenAuthTag &&
      setting.embeddingProvider &&
      setting.embeddingProvider !== AiProvider.GROQ
    ) {
      const model =
        setting.embeddingModel?.trim() ||
        this.configService.get<string>('RAG_EMBEDDING_MODEL')?.trim() ||
        RAG_DEFAULT_EMBEDDING_MODEL;
      try {
        return this.toRuntime({
          provider: setting.embeddingProvider,
          model,
          baseUrl: setting.embeddingBaseUrl,
          tokenCiphertext: setting.embeddingTokenCiphertext,
          tokenIv: setting.embeddingTokenIv,
          tokenAuthTag: setting.embeddingTokenAuthTag,
        });
      } catch (error) {
        this.logger.warn(
          `Dedicated embedding credentials unusable for ${workspaceId}: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
        return null;
      }
    }

    if (!CHAT_PROVIDERS_WITH_EMBEDDINGS.has(setting.provider)) {
      return null;
    }

    const model =
      this.configService.get<string>('RAG_EMBEDDING_MODEL')?.trim() || RAG_DEFAULT_EMBEDDING_MODEL;
    try {
      return this.toRuntime({
        provider: setting.provider,
        model,
        baseUrl: setting.baseUrl,
        tokenCiphertext: setting.tokenCiphertext,
        tokenIv: setting.tokenIv,
        tokenAuthTag: setting.tokenAuthTag,
      });
    } catch (error) {
      this.logger.warn(
        `Inherited embedding credentials unusable for ${workspaceId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      return null;
    }
  }

  hasDedicatedEmbedding(setting: {
    embeddingTokenCiphertext: string | null;
    embeddingProvider: AiProvider | null;
  }): boolean {
    return Boolean(setting.embeddingTokenCiphertext && setting.embeddingProvider);
  }

  private toRuntime(input: {
    provider: AiProvider;
    model: string;
    baseUrl: string | null;
    tokenCiphertext: string;
    tokenIv: string;
    tokenAuthTag: string;
  }): AiRuntimeCredentials {
    const encKey = this.configService.get<string>('AI_TOKEN_ENC_KEY')?.trim();
    if (!encKey) {
      throw new ServiceUnavailableException(
        'Сервер не настроен для ИИ: задайте AI_TOKEN_ENC_KEY в окружении',
      );
    }

    let apiToken: string;
    try {
      apiToken = decryptToken(
        {
          ciphertext: input.tokenCiphertext,
          iv: input.tokenIv,
          authTag: input.tokenAuthTag,
        },
        encKey,
      );
    } catch {
      throw new ServiceUnavailableException(
        'Не удалось расшифровать токен ИИ. Проверьте AI_TOKEN_ENC_KEY.',
      );
    }

    let baseUrl: string;
    try {
      baseUrl =
        input.provider === AiProvider.CUSTOM
          ? assertSafeAiBaseUrl(input.baseUrl ?? '')
          : resolveProviderBaseUrl(input.provider);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Некорректный base URL',
      );
    }

    return {
      provider: input.provider,
      model: input.model,
      baseUrl,
      apiToken,
    };
  }
}
