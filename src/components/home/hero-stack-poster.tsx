/**
 * Static stand-in for the AI Growth Core. Server-rendered so the hero has its
 * full composition before any JavaScript runs, and kept as the permanent
 * visual when WebGL is unavailable or motion is reduced.
 */
export function HeroCorePoster({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 grid place-items-center ${className}`} aria-hidden>
      {/* atmospheric bloom */}
      <div className="absolute size-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(124,92,255,0.45),rgba(124,92,255,0.08)_55%,transparent_75%)] blur-2xl" />

      {/* orbital rings */}
      <div className="absolute size-[74%] rotate-[18deg] rounded-full border border-violet-soft/25" />
      <div className="absolute size-[86%] -rotate-[24deg] rounded-full border border-fuchsia-400/15 [transform:rotateX(62deg)_rotateZ(-18deg)]" />
      <div className="absolute size-[96%] rounded-full border border-violet-soft/12 [transform:rotateX(70deg)_rotateZ(30deg)]" />

      {/* node lattice */}
      <div className="absolute size-[54%] rounded-full border border-violet-soft/30" />
      <div className="absolute size-[54%] rounded-full border border-violet-soft/20 [transform:rotateY(62deg)]" />
      <div className="absolute size-[54%] rounded-full border border-violet-soft/20 [transform:rotateX(62deg)]" />

      {/* core */}
      <div className="absolute size-[29%] rounded-[36%] border border-white/25 bg-[radial-gradient(circle_at_34%_28%,rgba(233,226,255,0.95)_0%,rgba(139,108,255,0.75)_42%,rgba(76,31,214,0.6)_100%)] shadow-[0_0_90px_rgba(124,92,255,0.75)]" />
      <div className="absolute size-[12%] rounded-full bg-[radial-gradient(circle,#ffffff_0%,#c9b6ff_60%,transparent_100%)] blur-[2px]" />

      {/* nodes */}
      {[
        [50, 4], [82, 20], [96, 52], [80, 84], [50, 96], [19, 82], [4, 50], [18, 19],
      ].map(([x, y]) => (
        <span
          key={`${x}-${y}`}
          className="absolute size-1.5 rounded-full bg-violet-soft shadow-[0_0_10px_rgba(167,139,250,0.9)]"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
    </div>
  );
}
