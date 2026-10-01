import Link from "next/link";
import { notes } from "@/config/landing";

/** `eyebrow` renames the section when it is reused off the home page. */
export function Notes({ eyebrow = "06 / From the notebook" }: { eyebrow?: string } = {}) {
  return (
    <section className="notes wrap">
      <div className="section-top">
        <p className="eyebrow">{eyebrow}</p>
        <Link className="text-link" href="/blog">
          All field notes ↗
        </Link>
      </div>
      <h2>
        Thinking behind
        <br />
        the things we build.
      </h2>
      <div className="notes-list">
        {notes.map((note) => (
          <Link key={note.href} className="reveal" href={note.href}>
            <span>{note.kicker}</span>
            <h3>
              {note.title[0]}
              <br />
              {note.title[1]}
            </h3>
            <span>{note.cta}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
