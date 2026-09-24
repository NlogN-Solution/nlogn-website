import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same mark as icon.svg: one glyph of the n···n pair plus the accent dot.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0b0b0f",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g transform="translate(6 19) scale(0.2231)">
            <path
              fill="#ffffff"
              d="M42.78,5.56 48.89,0.00 175.00,0.00 197.22,24.44 161.67,100.00 117.22,100.00 140.00,48.89 150.00,28.33 145.56,20.00 83.33,19.44 42.22,98.89 0.00,100.00Z"
            />
          </g>
          <circle cx="54" cy="39" r="6.2" fill="#2563ff" />
        </svg>
      </div>
    ),
    size,
  );
}
