import s from './chrome.module.css';

/** Ink pill for confirmations ("Email copied"). Announced politely. */
export function Toast({ message }: { message: string | null }) {
  return (
    <div role="status" aria-live="polite">
      {message && <div className={s.toast}>{message}</div>}
    </div>
  );
}
