import { SectionHeading } from "@/components/ui/section-heading";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { faqs } from "@/config/site";

export function FaqSection({ items = faqs }: { items?: { q: string; a: string }[] }) {
  return (
    <section id="faq" className="container-x py-16 md:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.3fr] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            eyebrow="Questions"
            title={
              <>
                Answered before
                <br />
                you have to ask
              </>
            }
            lead="Pricing, timelines, ownership and what happens if it does not work. If yours is not here, ask it directly."
          />
          <Button href="/contact" className="mt-8" arrow>
            Ask us anything
          </Button>
        </div>
        <Accordion items={items} />
      </div>
    </section>
  );
}
