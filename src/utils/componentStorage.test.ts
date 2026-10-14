import { describe, it, expect, vi } from 'vitest';
import type { GeneratedComponent } from '../types';
import { STORAGE_KEY, loadComponents, saveComponents } from './componentStorage';

function createStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(STORAGE_KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const sample: GeneratedComponent = {
  id: '1-abc',
  prompt: '프로필 카드',
  code: 'const A = () => null;\nrender(<A />);',
  createdAt: new Date('2026-01-02T03:04:05.000Z'),
};

describe('saveComponents / loadComponents', () => {
  it('저장한 컴포넌트를 불러오면 createdAt이 Date로 복원된다', () => {
    const storage = createStorage();

    expect(saveComponents([sample], storage)).toBe(true);
    const loaded = loadComponents(storage);

    expect(loaded).toEqual([sample]);
    expect(loaded[0].createdAt).toBeInstanceOf(Date);
  });
});

describe('loadComponents', () => {
  it('저장된 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadComponents(createStorage())).toEqual([]);
  });

  it('JSON이 손상되었으면 빈 배열을 반환한다', () => {
    expect(loadComponents(createStorage('{not json'))).toEqual([]);
  });

  it('배열이 아닌 값이면 빈 배열을 반환한다', () => {
    expect(loadComponents(createStorage('{"id":"1"}'))).toEqual([]);
  });

  it('형식이 잘못된 항목은 걸러내고 나머지는 유지한다', () => {
    const raw = JSON.stringify([
      { ...sample, createdAt: sample.createdAt.toISOString() },
      { id: 2, prompt: 'x', code: 'y', createdAt: sample.createdAt.toISOString() },
      { id: '3', prompt: 'x', code: 'y', createdAt: 'not-a-date' },
      null,
    ]);

    expect(loadComponents(createStorage(raw))).toEqual([sample]);
  });

  it('저장소 접근이 예외를 던져도 빈 배열을 반환한다', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('SecurityError');
      }),
    };

    expect(loadComponents(storage)).toEqual([]);
  });
});

describe('saveComponents', () => {
  it('저장에 실패해도 예외를 던지지 않고 false를 반환한다', () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
    };

    expect(saveComponents([sample], storage)).toBe(false);
  });
});
