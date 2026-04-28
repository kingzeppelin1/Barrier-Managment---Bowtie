import { describe, expect, it } from 'vitest';
import { PACKAGE_NAME } from '../src/index.js';

describe('@bowtie/ui', () => {
  it('exposes the package name', () => {
    expect(PACKAGE_NAME).toBe('@bowtie/ui');
  });
});
