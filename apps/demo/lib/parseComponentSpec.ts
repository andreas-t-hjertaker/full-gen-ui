import type { ComponentSpec } from './schemas';
import type { Message } from '@ai-sdk/react';

/**
 * Extracts a component spec from an AI SDK v5 message.
 * Tool results are stored in message.toolInvocations[], not in message.content.
 * Falls back to content JSON parse for custom serialization.
 */
export function parseComponentSpec(message: Message): ComponentSpec | null {
  // Primary: AI SDK v5 toolInvocations
  if (message.toolInvocations && message.toolInvocations.length > 0) {
    for (const invocation of message.toolInvocations) {
      if (invocation.state === 'result' && invocation.result) {
        const result = invocation.result as Record<string, unknown>;
        if (result.component && typeof result.component === 'string') {
          return result as unknown as ComponentSpec;
        }
      }
    }
  }

  // Fallback: raw JSON in content string
  if (typeof message.content === 'string') {
    try {
      const parsed = JSON.parse(message.content);
      if (parsed && typeof parsed === 'object' && 'component' in parsed) {
        return parsed as ComponentSpec;
      }
    } catch {
      // Plain text — no component
    }
  }

  return null;
}
