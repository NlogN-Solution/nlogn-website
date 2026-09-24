import Image from "next/image";
import type { CSSProperties } from "react";
import { clients } from "@/content/site";

// The set repeats so the -50% marquee loop lands on an identical frame and
// still fills very wide screens. Must stay even.
const REPEATS = 8;

export function ClientStrip() {
  return (
    <section className="client-strip" aria-label="Trusted by">
      <p className="eyebrow">Trusted by</p>
      <div className="client-marquee">
        <div className="client-track">
          {Array.from({ length: REPEATS }, (_, r) => (
            <ul key={r} className="client-set" aria-hidden={r > 0 || undefined}>
              {clients.map((client) => (
                <li key={client.name}>
                  <Image
                    src={client.src}
                    alt={r > 0 ? "" : client.name}
                    width={client.width}
                    height={client.height}
                    sizes="240px"
                    style={{ "--logo-h": `${client.displayHeight}px` } as CSSProperties}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
