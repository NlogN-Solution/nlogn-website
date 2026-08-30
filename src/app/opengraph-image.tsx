import { ImageResponse } from "next/og";

export const alt = "nlogn — digital growth agency for websites, SEO and software";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(140deg, #f6f6f9 0%, #eceaf5 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -2 }}>
            <span style={{ color: "#0b0b0f" }}>nlog</span>
            <span style={{ color: "#6c47ff" }}>n</span>
          </div>
          <div style={{ display: "flex", fontSize: 18, color: "#74747f", letterSpacing: 4 }}>
            DIGITAL GROWTH
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -3.5,
              lineHeight: 1.05,
              color: "#0b0b0f",
              maxWidth: 900,
            }}
          >
            We build digital experiences that
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -3.5,
              lineHeight: 1.05,
              color: "#6c47ff",
            }}
          >
            drive growth.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 24, color: "#74747f", maxWidth: 640 }}>
            Websites, software and SEO built on Next.js and Node.js.
          </div>
          <svg width="260" height="110" viewBox="0 0 260 110" fill="none">
            <path
              d="M4 106 C 60 100, 96 86, 130 62 C 164 38, 200 16, 256 4"
              stroke="#6c47ff"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="256" cy="6" r="9" fill="#6c47ff" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
