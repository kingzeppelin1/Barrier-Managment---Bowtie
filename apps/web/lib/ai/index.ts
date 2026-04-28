import { MockAIProvider } from './mock-provider';
import { AnthropicAIProvider } from './anthropic-provider';
import type { AIProvider } from './provider';

export type { AIProvider, CoachInput } from './provider';
export { MockAIProvider } from './mock-provider';
export { AnthropicAIProvider } from './anthropic-provider';

/**
 * Provider selection. Demo build defaults to 'mock'. Swap to 'anthropic'
 * by setting AI_PROVIDER=anthropic in the deployment environment.
 */
export function getAIProvider(): AIProvider {
  const env = (typeof process !== 'undefined' ? process.env.AI_PROVIDER : undefined) ?? 'mock';
  if (env === 'anthropic') return new AnthropicAIProvider();
  return new MockAIProvider();
}

/** Read-only provider name for UI labels. */
export function getAIProviderName(): 'mock' | 'anthropic' {
  return getAIProvider().name;
}
