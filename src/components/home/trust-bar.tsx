import { Building2, GraduationCap, Hexagon, Leaf, Mountain, Sparkles } from "lucide-react";

const logos = [
  { name: "Himalayan Café", Icon: Mountain },
  { name: "EduBridge", Icon: GraduationCap },
  { name: "Urban Space", Icon: Building2 },
  { name: "GreenPath", Icon: Leaf },
  { name: "Craft Studio", Icon: Hexagon },
  { name: "Lumen Health", Icon: Sparkles },
];

/**
 * Closing bar of the hero: the positioning line on the left, client proof on
 * the right, separated by a hairline.
 */
export function TrustBar() {
  return (
    <div className="mt-12 border-t border-white/10 pb-10 pt-7 md:mt-14">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <p className="shrink-0 font-display text-[0.95rem] font-semibold tracking-tight text-white/70">
          Marketing. Software. AI. Automation.
        </p>

        <ul className="flex flex-wrap items-center gap-x-8 gap-y-5 md:gap-x-10">
          {logos.map(({ name, Icon }) => (
            <li key={name}>
              <span className="flex items-center gap-2 text-white/35 transition-colors duration-300 hover:text-white/70">
                <Icon className="size-[1.15rem] shrink-0" strokeWidth={1.6} aria-hidden />
                <span className="font-display text-[0.9rem] font-semibold tracking-tight">
                  {name}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
