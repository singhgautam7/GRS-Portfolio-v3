/**
 * Ask Me Anything — public engine API.
 *
 * Fully client-side, offline-ready, unit-testable in isolation. The UI imports
 * only from here. Layering and seams live in the sibling modules.
 */
export { answer, answerLayer1 } from './engine';
export { matchIntent, getIntents } from './match';
export { buildContext } from './context';
export { fallbackResponse } from './fallback';
export { intents } from './intents';
export { SEMANTIC_ENABLED } from './semantic';
export { llmFallback } from './llm';
export type {
  AssistantResponse,
  AssistantButton,
  AssistantCard,
  AssistantContext,
  ButtonAction,
  ButtonKind,
  Intent,
  MatchResult,
  ResponseSource,
} from './types';
