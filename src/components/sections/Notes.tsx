import { notes } from "@/content/site";
import { ExternalLink } from "@/components/ui/ExternalLink";

export function Notes() {
  return (
    <section className="notes wrap">
      <div className="section-top">
        <p className="eyebrow">06 / From the notebook</p>
        <ExternalLink className="text-link" href="https://nlogn.online/blog">
          All field notes ↗
        </ExternalLink>
      </div>
      <h2>
        Thinking behind
        <br />
        the things we build.
      </h2>
      <div className="notes-list">
        {notes.map((note) => (
          <ExternalLink key={note.href} className="reveal" href={note.href}>
            <span>{note.kicker}</span>
            <h3>
              {note.title[0]}
              <br />
              {note.title[1]}
            </h3>
            <span>{note.cta}</span>
          </ExternalLink>
        ))}
      </div>
    </section>
  );
}
