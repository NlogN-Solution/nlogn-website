import Link from "next/link";
import { CardEngagement } from "@/components/engagement/engagement-bar";
import { works } from "@/config/site";

/*
 * The home page's project tones, taken in turn so a grid of studies reads
 * like the "Selected work" grid: blue, silver, dark, pale blue.
 */
const tones = [
  { bg: "#2563ff", fg: "#ffffff" },
  { bg: "#e0e4e3", fg: "#1e292b" },
  { bg: "#232b36", fg: "#ffffff" },
  { bg: "#dce4fc", fg: "#171819" },
];

/**
 * A case study, as the home page's project tile: the headline metric set as
 * the word mark on a coloured ground, then the client, title and numbers.
 *
 * The card is an `<article>` with a stretched link over it rather than one big
 * `<a>`, because the like button lives inside it and a button nested in an
 * anchor is neither valid HTML nor clickable.
 */
export function WorkCard({ work, index = 0 }: { work: (typeof works)[number]; index?: number }) {
  const [headline, ...rest] = work.metrics;
  const tone = tones[index % tones.length];
  return (
    <article className="card">
      <div
        className="card-media is-word"
        style={{ "--card-bg": tone.bg, "--card-fg": tone.fg } as React.CSSProperties}
      >
        <span>
          {work.category}
          <span>{work.year}</span>
        </span>
        <div>
          <strong>{headline.value}</strong>
          <span style={{ marginTop: 10 }}>{headline.label}</span>
        </div>
        <span className="round-arrow" aria-hidden="true">
          ↗
        </span>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <span className="tag">{work.client}</span>
        </div>
        <h3>
          <Link href={`/case-studies/${work.slug}`}>{work.title}</Link>
        </h3>
        <p>{work.summary}</p>

        {rest.length > 0 && (
          <dl>
            {rest.slice(0, 2).map((m) => (
              <div key={m.label}>
                <dd>{m.value}</dd>
                <dt>{m.label}</dt>
              </div>
            ))}
          </dl>
        )}

        <div className="card-foot">
          <span>Read the case study</span>
          <div className="site-theme">
            <CardEngagement kind="CASE_STUDY" slug={work.slug} />
          </div>
        </div>
      </div>
    </article>
  );
}
