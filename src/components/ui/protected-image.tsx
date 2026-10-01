import { cn } from "@/lib/utils";

/**
 * An image that does not come away on a right-click, a drag or a long-press.
 *
 * It stays a real `<img>` — the alt text, the lazy loading and the crawler that
 * reads both are worth more than any trick that swaps it for a background — but
 * it takes no pointer events, and a transparent sibling sits over it. The
 * context menu, the drag and the iOS callout all land on the overlay, which has
 * nothing to save.
 *
 * This is a deterrent and not a lock, and the difference is worth stating: the
 * file is a public Cloudinary URL that anybody willing to open the network tab
 * still has. What it stops is the casual save of a cover we would rather people
 * came to the page for, which is very nearly all of the traffic.
 */
export function ProtectedImage({
  src,
  alt,
  className,
  wrapperClassName,
  loading,
}: {
  src: string;
  alt: string;
  /** Classes for the image itself — object-fit, sizing, hover transforms. */
  className?: string;
  /** Classes for the positioned wrapper — aspect ratio, radius, border. */
  wrapperClassName?: string;
  loading?: "eager" | "lazy";
}) {
  return (
    <div className={cn("relative select-none", wrapperClassName)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        draggable={false}
        className={cn("pointer-events-none select-none", className)}
        style={{ WebkitTouchCallout: "none" }}
      />
      {/*
        What the pointer actually hits. Nothing here is saveable, and no
        JavaScript is needed to keep it that way — this renders on the server
        with the page, so it is in place before any handler could be attached.
      */}
      <span aria-hidden className="absolute inset-0" />
    </div>
  );
}
