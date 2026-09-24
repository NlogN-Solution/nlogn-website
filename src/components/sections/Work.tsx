import type { CSSProperties } from "react";
import { projects, type Project } from "@/content/site";
import Image from "next/image";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { ProjectFlip } from "@/components/motion/ProjectFlip";
import { projectDemos } from "./ProjectDemos";

function ProjectCard({ project, index }: { project: Project; index: number }) {
  // Cards in the same row enter slightly out of step.
  const style = {
    "--reveal-delay": `${((index + 1) % 2) * 100}ms`,
  } as CSSProperties;
  return (
    <article
      className={`project${project.large ? " project-large" : ""} reveal`}
      style={style}
    >
      <ProjectFlip
        label={project.word}
        className={`project-image project-${project.tone}`}
        header={
          <div className="project-word" aria-hidden="true">
            {project.word}
            <span>{project.wordMark}</span>
          </div>
        }
        front={
          // The whole screenshot stays inside the card (no scroll drift).
          <div className="project-shot">
            <Image
              {...project.image}
              alt={project.image.alt}
              sizes="(max-width: 700px) 90vw, 50vw"
            />
          </div>
        }
        back={projectDemos[project.word.toLowerCase()]}
        footer={
          <span className="round-arrow" aria-hidden="true">
            ↗
          </span>
        }
      />
      <div className="project-caption">
        <div>
          <h3>
            {/* The project destination lives on the title (it used to wrap
                the whole card, but the image is now the flip control). */}
            <ExternalLink href={project.href}>
              {project.title[0]}
              <br />
              {project.title[1]}
            </ExternalLink>
          </h3>
          <p>{project.summary}</p>
        </div>
        <span className="tag">{project.status}</span>
      </div>
    </article>
  );
}

export function Work() {
  return (
    <section className="work wrap" id="work">
      <div className="section-top">
        <p className="eyebrow">02 / Selected work</p>
        <span className="eyebrow">Built with purpose.</span>
      </div>
      <div className="heading-row reveal">
        <h2>
          Less explaining.
          <br />
          More <em>showing.</em>
        </h2>
        <p>
          Customer conversations.
          <br />
          Student journeys. Daily operations.
          <br />
          Different problems. Thoughtful systems.
        </p>
      </div>
      <div className="project-grid">
        {projects.map((project, i) => (
          <ProjectCard key={project.word} project={project} index={i} />
        ))}
      </div>
      <div className="work-more">
        <p>There’s more to the work than software.</p>
        <ExternalLink className="text-link" href="https://nlogn.online/#work">
          Explore the existing portfolio ↗
        </ExternalLink>
      </div>
    </section>
  );
}
