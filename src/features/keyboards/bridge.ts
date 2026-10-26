/**
 * The mounted hero keyboard registers here so chrome can use it without importing three.js:
 * the palette emerges from the K cap, ⌘↵ plays the Enter pulse + camera ease.
 */
export interface KeyboardBridge {
  keyRect(code: string): DOMRect | null;
  enterPlayground(): Promise<void>;
}

let current: KeyboardBridge | null = null;
export const setKeyboardBridge = (b: KeyboardBridge | null) => {
  current = b;
};
export const getKeyboardBridge = () => current;
