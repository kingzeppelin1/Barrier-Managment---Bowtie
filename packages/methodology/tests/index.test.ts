import { describe, expect, it } from 'vitest';
import { PACKAGE_NAME, calculateBarrierHealth } from '../src/index.js';

describe('@bowtie/methodology', () => {
  it('exposes the package name', () => {
    expect(PACKAGE_NAME).toBe('@bowtie/methodology');
  });

  it('returns the placeholder barrier-health value until the real calculator lands', () => {
    expect(calculateBarrierHealth()).toBe(0);
  });
});
