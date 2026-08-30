import { ShieldCheck, Timer, FileText, Users } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { values, team } from "@/config/site";

const proof = [
  { icon: Timer, label: "One working day", detail: "Median first reply to a new enquiry" },
  { icon: FileText, label: "Fixed-price scope", detail: "Signed before a line of code is written" },
  { icon: ShieldCheck, label: "You own everything", detail: "Repos, accounts and design files, from day one" },
  { icon: Users, label: "Same team throughout", detail: "The people who pitch are the people who build" },
];

export function TrustSection() {
  return (
    <section className="container-x py-16 md:py-28">
      <SectionHeading
        eyebrow="Why teams stay"
        title={
          <>
            We build websites for a living. <span className="text-gradient-violet">Ours has to prove it.</span>
          </>
        }
        lead="This page loads in under a second, scores green on Core Web Vitals, and every claim on it is one we would show you the dashboard for. That is the standard we hand to clients."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <ul className="grid gap-5 sm:grid-cols-2">
          {values.map((v, i) => (
            <Reveal as="li" key={v.title} delay={i * 0.07}>
              <div className="h-full rounded-[24px] border border-line bg-surface p-8">
                <h3 className="font-display text-lg font-bold tracking-tight text-ink">{v.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.1}>
          <div className="flex h-full flex-col rounded-[24px] border border-line bg-surface p-8">
            <ul className="space-y-6">
              {proof.map(({ icon: Icon, label, detail }) => (
                <li key={label} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-wash text-violet">
                    <Icon className="size-[1.1rem]" strokeWidth={1.9} aria-hidden />
                  </span>
                  <span>
                    <span className="block font-display text-[0.95rem] font-semibold text-ink">
                      {label}
                    </span>
                    <span className="block text-sm leading-relaxed text-muted">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto border-t border-line-soft pt-6">
              <p className="label text-muted">The team you get</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {team.map((member) => (
                  <li
                    key={member.name}
                    className="flex items-center gap-2 rounded-full border border-line py-1.5 pl-1.5 pr-3.5"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-ink font-display text-[0.6rem] font-bold text-white">
                      {member.initials}
                    </span>
                    <span className="text-xs font-medium text-ink-soft">{member.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
