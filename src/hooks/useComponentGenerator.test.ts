import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEY } from '../utils/componentStorage';

const stored = {
  id: 'saved-1',
  prompt: '저장된 프롬프트',
  code: 'render(<div />);',
  createdAt: '2026-01-02T03:04:05.000Z',
};

function readStored(): { id: string }[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
}

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('localStorage에 저장된 컴포넌트로 초기화한다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([stored]));

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].id).toBe('saved-1');
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('컴포넌트를 생성하면 localStorage에 저장된다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ code: 'render(<b />);' }) })),
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('굵은 글씨', undefined, 'google');
    });

    await waitFor(() => expect(readStored()).toHaveLength(1));
    expect(readStored()[0]).toMatchObject({ prompt: '굵은 글씨', code: 'render(<b />);' });
  });

  it('컴포넌트를 삭제하면 localStorage에도 반영된다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([stored]));
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.removeComponent('saved-1'));

    expect(readStored()).toEqual([]);
  });

  it('전체 삭제하면 localStorage도 비워진다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([stored]));
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.clearAll());

    expect(readStored()).toEqual([]);
  });
});
