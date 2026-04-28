import { describe, expect, it } from 'vitest';

describe('apps/web smoke', () => {
  it('runs at all', () => {
    expect(1 + 1).toBe(2);
  });
});
