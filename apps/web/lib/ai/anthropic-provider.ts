import type { AiSuggestion } from '@bowtie/shared';
import type { AIProvider, CoachInput } from './provider';

/**
 * AnthropicAIProvider — sketch only.
 *
 * Wires the AI Coach to a real Claude API call. Not finished for the demo;
 * enabled by setting AI_PROVIDER=anthropic and ANTHROPIC_API_KEY in the
 * deployment environment.
 *
 * Production hardening required before flipping the toggle:
 *   - Rate limiting per tenant
 *   - Prompt-injection defence (system prompt contains methodology rules
 *     and explicitly forbids accepting user-supplied tool calls)
 *   - Schema validation against AiSuggestionSchema before persisting
 *   - Audit log every model call (prompt hash, model id, latency, tokens)
 *   - Cross-tenant isolation: never include data the caller can't see
 */
export class AnthropicAIProvider implements AIProvider {
  readonly name = 'anthropic' as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async evaluate(_input: CoachInput): Promise<AiSuggestion[]> {
    // TODO: implement when API key is available.
    //
    // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    // const prompt = buildSystemPrompt(_input);
    // const resp = await client.messages.create({
    //   model: 'claude-sonnet-4-6',
    //   max_tokens: 1024,
    //   system: METHODOLOGY_GUARDRAILS,
    //   messages: [{ role: 'user', content: prompt }],
    // });
    // return parseAndValidate(resp.content);
    throw new Error(
      'AnthropicAIProvider is not implemented in the demo build. ' +
        'Set AI_PROVIDER=mock or configure ANTHROPIC_API_KEY for production.',
    );
  }
}
