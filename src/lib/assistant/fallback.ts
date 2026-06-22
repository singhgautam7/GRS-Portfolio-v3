import type { AssistantResponse } from './types';

/**
 * Layer 3 — the graceful fallback. It never dead-ends: it offers quick-pick
 * chips and always includes a contact exit ramp ("or just email me"). This same
 * panel is the assistant's in-app empty/error answer.
 */
export function fallbackResponse(): AssistantResponse {
  return {
    source: 'fallback',
    text: "That's a bit outside what I cover here. Ask me about my work, projects, or how to reach me.",
    buttons: [
      { label: 'My work', kind: 'ghost', action: 'ask', value: 'What do you work on?' },
      { label: 'Projects', kind: 'ghost', action: 'ask', value: 'Show me your best projects' },
      { label: 'Contact me', kind: 'primary', action: 'mailto' },
    ],
  };
}
