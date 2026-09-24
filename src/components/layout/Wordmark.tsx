import { LOGO } from "@/components/brand/logo-paths";

/** The n···n / NLOGN lockup. Letters follow the text colour; dots take the brand blue. */
export function Wordmark() {
  return (
    <a className="wordmark" href="#" aria-label="NLOGN home">
      <svg viewBox={`0 0 ${LOGO.lockup.w} ${LOGO.lockup.h}`} aria-hidden="true">
        <path d={LOGO.paths.lockupMark} fill="currentColor" fillRule="evenodd" />
        <path d={LOGO.paths.lockupDots} fill="var(--blue)" fillRule="evenodd" />
        <path d={LOGO.paths.lockupWord} fill="currentColor" fillRule="evenodd" />
      </svg>
    </a>
  );
}
