import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { highlight } from "sugar-high";
import type { ComponentProps } from "react";

function Anchor({ href = "", children, ...rest }: ComponentProps<"a">) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

function Code({ children, className, ...rest }: ComponentProps<"code">) {
  if (typeof children === "string" && className?.startsWith("language-")) {
    return (
      <code
        className={className}
        dangerouslySetInnerHTML={{ __html: highlight(children) }}
        {...rest}
      />
    );
  }
  return (
    <code className={className} {...rest}>
      {children}
    </code>
  );
}

/** A pull-out box for the one thing a reader should take away. */
function Takeaway({ children }: { children: React.ReactNode }) {
  return (
    <aside className="my-10 rounded-[22px] border border-violet/20 bg-violet-wash p-7">
      <p className="label mb-3 text-violet-deep">The short version</p>
      <div className="text-[0.9375rem] leading-relaxed text-ink-soft [&>p]:m-0">{children}</div>
    </aside>
  );
}

const components = {
  a: Anchor,
  code: Code,
  Takeaway,
  Image,
};

export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              { behavior: "wrap", properties: { className: "no-underline hover:underline" } },
            ],
          ],
        },
      }}
    />
  );
}
