import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { team } from "@/config/site";

/**
 * The four of us.
 *
 * The photographs are shown as shot — no grade, no tint, no scrim over the
 * face. The only treatment is the 4:5 frame they are held in, so the row lines
 * up. `quality` is pushed near-lossless and `sizes` is quoted against the
 * frame's height rather than its width, because a 4:5 crop needs 25% more
 * pixels than the column is wide or the browser upscales what it is given.
 */
export function TeamGrid() {
  return (
    <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {team.map((member, i) => (
        <Reveal as="li" key={member.name} delay={i * 0.08} className="h-full">
          <figure className="group h-full overflow-hidden rounded-[1.5rem] border border-line bg-surface transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-violet/30 hover:shadow-lift">
            <div className="relative aspect-[4/5] overflow-hidden bg-canvas-2">
              <Image
                src={member.photo}
                alt={`${member.name}, ${member.role} at nlogn`}
                fill
                quality={95}
                sizes="(max-width: 640px) 125vw, (max-width: 1024px) 63vw, 32vw"
                style={{ objectPosition: member.focus }}
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
            </div>

            <figcaption className="p-6">
              <h3 className="font-display text-[1.0625rem] font-bold tracking-[-0.02em] text-ink">
                {member.name}
              </h3>
              <p className="mt-1.5 text-[0.9375rem] font-medium text-violet-deep">{member.role}</p>
              <span aria-hidden className="mt-5 block h-px w-full bg-line">
                <span className="block h-px w-8 bg-[linear-gradient(90deg,#a78bfa,#6c47ff)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
              </span>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </ul>
  );
}
