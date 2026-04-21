import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sebastian Tsang — Journal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "rgb(250, 247, 240)";
const INK = "rgb(26, 26, 46)";
const INK_SOFT = "rgb(54, 48, 107)";
const INK_FAINT = "rgb(90, 84, 70)";
const RULE_NAVY = "rgb(61, 52, 139)";
const RULE_RED = "rgb(220, 38, 38)";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: PAPER,
          display: "flex",
          position: "relative",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Ruled lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {Array.from({ length: 19 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 32,
                borderBottom: `1px solid ${RULE_NAVY}`,
                opacity: 0.18,
              }}
            />
          ))}
        </div>

        {/* Red margin rule */}
        <div
          style={{
            position: "absolute",
            left: 140,
            top: 0,
            bottom: 0,
            width: 2,
            background: RULE_RED,
            opacity: 0.55,
          }}
        />

        {/* Spiral binding dots */}
        <div
          style={{
            position: "absolute",
            left: 32,
            top: 60,
            bottom: 60,
            width: 56,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9999,
                border: `3px solid ${INK_FAINT}`,
                background: PAPER,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 200,
            paddingRight: 80,
            width: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: INK_FAINT,
              marginBottom: 24,
              display: "flex",
            }}
          >
            sebastian tsang · journal
          </div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.05,
              color: INK,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              display: "flex",
            }}
          >
            ask the journal
          </div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.05,
              color: INK,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              display: "flex",
              marginTop: 8,
            }}
          >
            anything.
          </div>
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.4,
              color: INK_SOFT,
              marginTop: 36,
              maxWidth: 820,
              display: "flex",
            }}
          >
            a portfolio, rendered as a spiral-bound notebook.
          </div>

          {/* Sticky note */}
          <div
            style={{
              position: "absolute",
              right: 80,
              top: 80,
              width: 180,
              height: 140,
              background: "rgb(253, 230, 138)",
              transform: "rotate(6deg)",
              boxShadow: "0 12px 24px rgba(0,0,0,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Georgia, serif",
              fontSize: 28,
              color: INK,
              padding: 16,
              textAlign: "center",
            }}
          >
            hi 👋
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
