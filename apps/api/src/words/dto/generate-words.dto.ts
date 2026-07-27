import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '@/common/transformers/string.transformer';
import {
  DEFAULT_WORD_CATEGORY,
  DEFAULT_WORD_COUNT,
  MAX_GENERATED_WORD_COUNT,
  WordDifficulty,
} from '@/words/constants/word.constants';

export class GenerateWordsDto {
  @IsInt()
  @Min(1)
  @Max(MAX_GENERATED_WORD_COUNT)
  count = DEFAULT_WORD_COUNT;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(30)
  category = DEFAULT_WORD_CATEGORY;

  @IsEnum(WordDifficulty)
  difficulty = WordDifficulty.MEDIUM;
}
