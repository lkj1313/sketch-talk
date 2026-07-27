import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { ControllerResponse } from '@/common/types/api-response.type';
import { GenerateWordsDto } from '@/words/dto/generate-words.dto';
import { GenerateWordsResponseDto } from '@/words/dto/generate-words-response.dto';
import { WordsService } from '@/words/words.service';

@UseGuards(JwtAuthGuard)
@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Post('generate')
  async generate(
    @Body() dto: GenerateWordsDto,
  ): Promise<ControllerResponse<GenerateWordsResponseDto>> {
    const result = await this.wordsService.generate(dto);

    return { data: result };
  }
}
