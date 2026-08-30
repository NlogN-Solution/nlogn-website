type Props = { schema: Record<string, unknown> | Record<string, unknown>[]; id?: string };

/**
 * Emits JSON-LD wrapped in an @graph so every entity on a page can
 * cross-reference the organisation and website nodes by @id.
 */
export function JsonLd({ schema, id }: Props) {
  const graph = Array.isArray(schema) ? schema : [schema];
  const payload = { "@context": "https://schema.org", "@graph": graph };
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}
