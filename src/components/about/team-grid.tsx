import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { team } from "@/config/site";

/**
 * The four of us.
 *
 * The source photos were shot in very different places and light, so they are
 * held to one 4:5 frame and desaturated at rest — colour returns on hover. That
 * evens out the row without retouching anything.
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
                quality={88}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                style={{ objectPosition: member.focus }}
                className="object-cover saturate-[0.55] grayscale-[0.55] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:grayscale-0 group-hover:saturate-100"
              />

              {/* a violet cast at rest, so four different backgrounds read as one row */}
              <span
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(175deg,rgba(108,71,255,0.16)_0%,rgba(69,38,201,0.30)_100%)] mix-blend-multiply transition-opacity duration-700 group-hover:opacity-0"
              />
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(11,11,15,0.22))] transition-opacity duration-700 group-hover:opacity-0"
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
