import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GrowthCurve } from "@/components/ui/growth-curve";
import { capabilities } from "@/config/capabilities";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="relative overflow-hidden pb-24 pt-40 md:pt-52">
      <GrowthCurve
        width={1440}
        height={300}
        animate={false}
        strokeWidth={1.5}
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 w-full opacity-10"
        id="notfound-curve"
      />
      <div className="container-x">
        <p className="label text-violet">Error 404</p>
        <h1 className="mt-6 max-w-2xl text-[clamp(2.4rem,1.4rem+3.6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink">
          This page did not make the cut
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          The URL is wrong, or the page has moved. Here is everything that definitely
          does exist.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/" size="lg" arrow>
            Back to home
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            Tell us what broke
          </Button>
        </div>

        <ul className="mt-16 grid gap-3 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <li key={capability.id}>
              <Link
                href="/works"
                className="block rounded-2xl border border-line bg-surface px-6 py-5 transition-colors hover:border-violet/30"
              >
                <span className="block font-display font-bold text-ink">{capability.label}</span>
                <span className="block text-sm text-muted">{capability.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
