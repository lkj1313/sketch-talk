import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AppException } from '@/common/exceptions/app.exception';
import { WordDifficulty } from '@/generated/prisma/client';
import { WORD_ERROR } from '@/words/constants/word-error.constants';

type GenerateKimiWordsOptions = {
  count: number;
  category: string;
  difficulty: WordDifficulty;
};

@Injectable()
export class KimiService {
  private readonly logger = new Logger(KimiService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('KIMI_CODE_API_KEY');
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: configService.get<string>(
            'KIMI_CODE_BASE_URL',
            'https://api.kimi.com/coding/v1',
          ),
        })
      : null;
    this.model = configService.get<string>(
      'KIMI_CODE_MODEL',
      'kimi-for-coding',
    );
  }

  async generateWords(options: GenerateKimiWordsOptions): Promise<string[]> {
    if (!this.client) {
      throw new AppException(WORD_ERROR.KIMI_NOT_CONFIGURED);
    }

    let content: string | null;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.createSystemPrompt(),
          },
          {
            role: 'user',
            content: this.createUserPrompt(options),
          },
        ],
      });

      content = completion.choices[0]?.message.content ?? null;
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Kimi API 호출에 실패했습니다.', stack);
      throw new AppException(WORD_ERROR.KIMI_REQUEST_FAILED);
    }

    return this.parseWords(content);
  }

  private createSystemPrompt(): string {
    return [
      '당신은 한국어 캐치마인드 게임의 제시어 생성기입니다.',
      '그림으로 표현할 수 있는 명확한 한국어 명사만 생성하세요.',
      '욕설, 혐오 표현, 성적인 표현, 고유명사, 중복 단어는 제외하세요.',
      '설명이나 마크다운 없이 {"words":["단어1","단어2"]} 형태의 JSON만 반환하세요.',
    ].join(' ');
  }

  private createUserPrompt(options: GenerateKimiWordsOptions): string {
    return [
      `개수: ${options.count}개`,
      `카테고리: ${options.category}`,
      `난이도: ${options.difficulty}`,
      '조건에 맞는 서로 다른 제시어를 정확한 개수만큼 생성하세요.',
    ].join('\n');
  }

  private parseWords(content: string | null): string[] {
    if (!content) {
      throw new AppException(WORD_ERROR.INVALID_KIMI_RESPONSE);
    }

    try {
      const normalizedContent = content
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');
      const parsed: unknown = JSON.parse(normalizedContent);

      if (!this.isRecord(parsed) || !Array.isArray(parsed.words)) {
        throw new Error('words 배열이 없습니다.');
      }

      const words = parsed.words.filter(
        (word): word is string => typeof word === 'string',
      );

      if (words.length !== parsed.words.length) {
        throw new Error('문자열이 아닌 제시어가 포함되어 있습니다.');
      }

      return words;
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.warn('Kimi API 응답을 해석하지 못했습니다.', stack);
      throw new AppException(WORD_ERROR.INVALID_KIMI_RESPONSE);
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
