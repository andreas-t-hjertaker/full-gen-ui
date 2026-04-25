import type { ComponentSpec } from './schemas';

/**
 * Extracts a component spec from an AI message.
 * The AI SDK embeds tool call results in the message content.
 * This function parses and validates the spec before rendering.
 */
export function parseComponentSpec(content: string): ComponentSpec | null {
  try {
    // AI SDK tool results are JSON-serialized in the message
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && 'component' in parsed) {
      return parsed as ComponentSpec;
    }
    return null;
  } catch {
    // Plain text response — no component spec
    return null;
  }
}
