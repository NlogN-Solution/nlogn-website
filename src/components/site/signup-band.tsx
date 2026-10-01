import { NewsletterForm } from "@/components/site/newsletter-form";

/** The newsletter ask, on the home page's pale-blue notebook ground. */
export function SignupBand() {
  return (
    <div className="signup reveal">
      <div>
        <h2>
          One essay a month. <em>No pitch.</em>
        </h2>
        <p>
          The Growth Brief goes out to 2,400 founders and marketing leads. Unsubscribe in one
          click, and we never sell the list.
        </p>
      </div>
      <div className="site-theme">
        <NewsletterForm />
      </div>
    </div>
  );
}
