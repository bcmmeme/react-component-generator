import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './validatePrompt';

describe('validatePromptLength', () => {
  it('500자 이하면 유효하다', () => {
    expect(validatePromptLength('가'.repeat(MAX_PROMPT_LENGTH)).valid).toBe(true);
  });

  it('500자를 넘으면 유효하지 않다', () => {
    expect(validatePromptLength('가'.repeat(MAX_PROMPT_LENGTH + 1)).valid).toBe(false);
  });

  it('앞뒤 공백은 길이에 포함하지 않는다', () => {
    const prompt = `  ${'가'.repeat(MAX_PROMPT_LENGTH)}  `;
    expect(validatePromptLength(prompt)).toEqual({ valid: true, length: MAX_PROMPT_LENGTH });
  });

  it('공백을 제외한 글자 수를 length로 반환한다', () => {
    expect(validatePromptLength('프로필 카드').length).toBe(6);
  });
});
