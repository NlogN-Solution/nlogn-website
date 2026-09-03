"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { ProcessReel } from "@/components/ui/process-reel";
import { cloudinaryPoster, cloudinaryVideo } from "@/config/clients";
import { siteConfig } from "@/config/site";

const RAW_SRC = siteConfig.videoUrl || "/videos/how-we-work.mp4";
const FILE_SRC = cloudinaryVideo(RAW_SRC);
const POSTER = cloudinaryPoster(RAW_SRC);

export function VideoModal({
  open,
  onClose,
  /** Second to open at, when the viewer picked a chapter. */
  startAt = 0,
}: {
  open: boolean;
  onClose: () => void;
  startAt?: number;
}) {
  const [fileFailed, setFileFailed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, handleKey]);

  // Seeking is only ever attempted inside the cut we actually have, so a
  // chapter marked beyond the end of the current film plays from the top
  // instead of parking the player on its last frame.
  const seek = useCallback(() => {
    const el = videoRef.current;
    if (!el || !startAt) return;
    if (Number.isFinite(el.duration) && startAt < el.duration - 1) {
      el.currentTime = startAt;
    }
  }, [startAt]);

  useEffect(() => {
    if (open) seek();
  }, [open, seek]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] grid place-items-center bg-ink/70 p-4 backdrop-blur-md md:p-8"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="How we work"
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl overflow-hidden rounded-[26px] shadow-2xl outline-none"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close video"
              className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/12 text-white backdrop-blur transition-colors hover:bg-white/25"
            >
              <X className="size-5" />
            </button>

            {fileFailed ? (
              <ProcessReel playing={open} />
            ) : (
              <div className="relative aspect-video w-full overflow-hidden bg-ink">
                {/* a blown-up, blurred still fills the letterbox, so a cut that
                    is not 16:9 sits in colour rather than in two black bars */}
                {POSTER && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={POSTER}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 size-full scale-125 object-cover opacity-40 blur-2xl saturate-150"
                  />
                )}
                <video
                  ref={videoRef}
                  className="relative size-full object-contain"
                  src={FILE_SRC}
                  poster={POSTER}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={seek}
                  onError={() => setFileFailed(true)}
                >
                  <track kind="captions" />
                </video>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
