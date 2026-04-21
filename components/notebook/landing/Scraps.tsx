"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const ACTIVATE_AFTER_MS = 3500;
const INTRO_DURATION = 2.5;

/**
 * Page scraps (taped card, sticky, todo list) and margin annotations.
 *
 * Scraps are *physical objects* — they drift toward the cursor and lift
 * on direct hover. Each has its own "weight" (activation radius, drift
 * magnitude, response stiffness).
 *
 * Annotations are *ink marks* — on hover, the text and SVG stroke re-draw
 * as if being written right now; ink also darkens while hovered.
 *
 * Interactivity gates on `ready` (enabled ~3.5s after mount, so nothing
 * moves during the name reveal).
 */
export function Scraps({
  variant = "landing",
}: {
  variant?: "landing" | "chat" | "content";
}) {
  const showBusyScraps = variant === "landing";
  const showAnnotations = variant !== "chat";

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), ACTIVATE_AFTER_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {showBusyScraps && (
        <>
          <TapedCard ready={ready} />
          <YellowSticky ready={ready} />
          <TodoList ready={ready} />
        </>
      )}
      {showAnnotations && <MarginAnnotations ready={ready} />}
    </div>
  );
}

// ── Magnetic scrap wrapper ─────────────────────────────────────────────

function MagneticScrap({
  baseRotation,
  activationRadius,
  maxDrift,
  stiffnessMs,
  ready,
  children,
  position,
  size,
}: {
  baseRotation: number;
  activationRadius: number;
  maxDrift: number;
  stiffnessMs: number;
  ready: boolean;
  children: ReactNode;
  position: CSSProperties;
  size: { width: number; height: number };
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [drift, setDrift] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!ready) {
      setDrift({ x: 0, y: 0 });
      return;
    }
    // Only engage magnetism on pointers that can actually hover.
    const canHover =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover)").matches;
    if (!canHover) return;

    const handler = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > activationRadius || dist === 0) {
        setDrift({ x: 0, y: 0 });
        return;
      }
      // Unit-vector toward cursor, scaled by maxDrift with linear falloff.
      const falloff = 1 - dist / activationRadius;
      const magnitude = maxDrift * falloff;
      setDrift({
        x: (dx / dist) * magnitude,
        y: (dy / dist) * magnitude,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [activationRadius, maxDrift, ready]);

  const scale = hovered ? 1.03 : 1;
  const shadow = hovered
    ? "drop-shadow(4px 10px 16px rgba(0,0,0,0.22))"
    : "drop-shadow(2px 4px 8px rgba(0,0,0,0.15))";

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        width: size.width,
        height: size.height,
        transform: `translate(${drift.x}px, ${drift.y}px) rotate(${baseRotation}deg) scale(${scale})`,
        transition: `transform ${stiffnessMs}ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease`,
        filter: shadow,
        pointerEvents: "auto",
        ...position,
      }}
    >
      {children}
    </div>
  );
}

// ── Scrap variants ─────────────────────────────────────────────────────

function TapedCard({ ready }: { ready: boolean }) {
  return (
    <MagneticScrap
      baseRotation={3}
      activationRadius={220}
      maxDrift={3}
      stiffnessMs={380}
      ready={ready}
      position={{ right: "6%", top: 84 }}
      size={{ width: 180, height: 110 }}
    >
      {/* Fade card AND tapes together so the tape never appears alone
          during the 1.2s mount delay. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: "fadeIn 0.8s ease 1.2s both",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "var(--color-paper-warm)",
            padding: "var(--pad-chip) var(--pad-chip-wide)",
            position: "relative",
            border: "1px solid rgba(0,0,0,0.05)",
            backgroundImage:
              "linear-gradient(to bottom, transparent 15px, rgba(61,52,139,0.12) 16px, transparent 17px)",
            backgroundSize: "100% 18px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "var(--fs-chip)",
              color: "var(--color-ink)",
              opacity: 0.55,
              marginBottom: 4,
            }}
          >
            now playing:
          </div>
          <div
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "var(--fs-script)",
              color: "var(--color-ink)",
              opacity: 0.85,
              lineHeight: 1.15,
            }}
          >
            portfolio v27
          </div>
          <div
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "var(--fs-chip)",
              color: "var(--color-ink)",
              opacity: 0.55,
              marginTop: 6,
            }}
          >
            <span style={{ textDecoration: "line-through" }}>v25</span>{" "}
            <span style={{ textDecoration: "line-through" }}>v26</span> v27 ✓
          </div>
        </div>
        <TapeStrip
          style={{ top: -8, left: "25%", transform: "rotate(-8deg)" }}
        />
        <TapeStrip
          style={{ top: -8, right: "20%", transform: "rotate(6deg)" }}
        />
      </div>
    </MagneticScrap>
  );
}

function TapeStrip({ style }: { style: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 52,
        height: 18,
        background: "rgba(200, 230, 240, 0.45)",
        border: "1px solid rgba(0, 80, 120, 0.08)",
        backdropFilter: "blur(1px)",
        ...style,
      }}
    />
  );
}

function YellowSticky({ ready }: { ready: boolean }) {
  return (
    <MagneticScrap
      baseRotation={-3}
      activationRadius={200}
      maxDrift={4}
      stiffnessMs={260}
      ready={ready}
      position={{ right: "5%", bottom: "7%" }}
      size={{ width: 120, height: 120 }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "var(--color-sticky-yellow)",
          padding: 14,
          fontFamily: "var(--font-script)",
          color: "#3a2a08",
          lineHeight: 1.15,
          position: "relative",
          animation: "fadeIn 0.8s ease 1.6s both",
        }}
      >
        <div style={{ fontSize: "var(--fs-input)", opacity: 0.7, marginBottom: 4 }}>
          mon 9am
        </div>
        <div style={{ fontSize: "var(--fs-script)" }}>coffee w/</div>
        <div style={{ fontSize: "var(--fs-script)" }}>Tom</div>
        <div
          style={{
            position: "absolute",
            top: -8,
            left: "50%",
            transform: "translateX(-50%) rotate(4deg)",
            width: 50,
            height: 18,
            background: "rgba(255, 250, 230, 0.55)",
            backdropFilter: "blur(1px)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        />
      </div>
    </MagneticScrap>
  );
}

function TodoList({ ready: _ready }: { ready: boolean }) {
  // Each item manages its own check state locally. No persistence —
  // visitors can toggle for fun, reloads reset.
  const [items, setItems] = useState<{ text: string; done: boolean }[]>([
    { text: "ship v27", done: true },
    { text: "write roles", done: true },
    { text: "add projects", done: false },
    { text: "coffee chat", done: false },
  ]);

  const toggle = (i: number) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it)),
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        top: "52%",
        width: 150,
        transform: "rotate(-2deg)",
        pointerEvents: "auto",
        fontFamily: "var(--font-script)",
        color: "var(--color-ink)",
        animation: "fadeIn 0.8s ease 2s both",
      }}
    >
      <div
        style={{
          fontSize: "var(--fs-chip)",
          opacity: 0.7,
          marginBottom: 6,
          textDecoration: "underline",
        }}
      >
        today
      </div>
      {items.map((item, i) => (
        <TodoItem
          key={item.text}
          done={item.done}
          onToggle={() => toggle(i)}
        >
          {item.text}
        </TodoItem>
      ))}
    </div>
  );
}

function TodoItem({
  done,
  onToggle,
  children,
}: {
  done: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{
        fontSize: "var(--fs-chip)",
        opacity: done ? 0.45 : 0.75,
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginBottom: 3,
        textDecoration: done ? "line-through" : "none",
        cursor: "pointer",
        userSelect: "none",
        transition: "opacity 160ms ease",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        style={{ flexShrink: 0 }}
        aria-hidden
      >
        <rect
          x="1"
          y="1"
          width="12"
          height="12"
          rx="2"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1"
          opacity="0.6"
        />
        {done && (
          <path
            d="M 2.5 7 L 6 10 L 11.5 3"
            stroke="var(--color-ink)"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.75"
          />
        )}
      </svg>
      {children}
    </div>
  );
}

// ── Margin annotations ─────────────────────────────────────────────────

/**
 * Ink annotation — text + arrow/bracket. Draws in once on mount (after
 * `initialDelayMs`). Hovering re-runs the draw animation from scratch
 * and darkens the ink until the cursor leaves.
 */
function InkAnnotation({
  ready,
  initialDelayMs,
  position,
  rotation,
  text,
  textStyle,
  svg,
  textOrder = "before",
  gap = 2,
  align = "flex-start",
}: {
  ready: boolean;
  initialDelayMs: number;
  position: CSSProperties;
  rotation: number;
  text: string | ReactNode;
  textStyle?: CSSProperties;
  svg: { width: number; height: number; children: ReactNode };
  textOrder?: "before" | "after";
  gap?: number;
  align?: CSSProperties["alignItems"];
}) {
  const [replayKey, setReplayKey] = useState(0);
  const [hovered, setHovered] = useState(false);

  const onEnter = () => {
    if (!ready) return;
    setHovered(true);
    setReplayKey((k) => k + 1);
  };
  const onLeave = () => setHovered(false);

  // Delay applies on first render only; replays use 0s delay.
  const delaySec = replayKey === 0 ? initialDelayMs / 1000 : 0;
  const durationSec = 0.7;

  const inkOpacity = hovered ? 0.85 : 0.55;
  const textNode = (
    <div
      style={{
        fontFamily: "var(--font-script)",
        fontSize: "var(--fs-script)",
        lineHeight: 1.1,
        color: "var(--color-ink)",
        opacity: inkOpacity,
        transition: "opacity 300ms ease",
        animation: `drawText ${durationSec}s ease-out ${delaySec}s both`,
        whiteSpace: "nowrap",
        ...textStyle,
      }}
    >
      {text}
    </div>
  );

  const svgNode = (
    <svg
      width={svg.width}
      height={svg.height}
      viewBox={`0 0 ${svg.width} ${svg.height}`}
      style={{
        overflow: "visible",
        opacity: inkOpacity,
        transition: "opacity 300ms ease",
      }}
    >
      {svg.children}
    </svg>
  );

  return (
    <div
      key={replayKey}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: "absolute",
        display: "flex",
        alignItems: align,
        gap,
        transform: `rotate(${rotation}deg)`,
        cursor: ready ? "default" : "default",
        pointerEvents: ready ? "auto" : "none",
        ...position,
      }}
    >
      {textOrder === "before" ? (
        <>
          {textNode}
          {svgNode}
        </>
      ) : (
        <>
          {svgNode}
          {textNode}
        </>
      )}
    </div>
  );
}

function MarginAnnotations({ ready }: { ready: boolean }) {
  const strokeStyle = (delaySec: number): CSSProperties => ({
    animation: `drawLine 0.7s ease-out ${delaySec}s both`,
  });

  return (
    <>
      {/* "hi, I'm" — left margin, pointing at the name */}
      <InkAnnotation
        ready={ready}
        initialDelayMs={2800}
        position={{ left: "max(15%, 140px)", top: "38%" }}
        rotation={-8}
        align="center"
        gap={8}
        textOrder="before"
        text={<>hi, I&apos;m</>}
        textStyle={{ fontSize: "var(--fs-script)" }}
        svg={{
          width: 60,
          height: 30,
          children: (
            <>
              <path
                d="M 2 20 Q 25 10, 52 10"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                pathLength="100"
                style={{
                  strokeDasharray: 100,
                  ...strokeStyle(2.8),
                }}
              />
              <path
                d="M 48 6 L 56 10 L 48 16"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                style={{
                  strokeDasharray: 100,
                  ...strokeStyle(3.1),
                }}
              />
            </>
          ),
        }}
      />

      {/* "I wear lots of hats" — right margin, bracket under roles */}
      <InkAnnotation
        ready={ready}
        initialDelayMs={3800}
        position={{ right: "14%", top: "62%" }}
        rotation={4}
        align="center"
        gap={6}
        textOrder="after"
        text={
          <span style={{ display: "inline-block", maxWidth: 140 }}>
            I build
            <br />
            stuff
          </span>
        }
        textStyle={{ fontSize: "var(--fs-chip)", lineHeight: 1.15, whiteSpace: "normal" }}
        svg={{
          width: 28,
          height: 60,
          children: (
            <path
              d="M 20 4 Q 6 30, 20 56"
              stroke="var(--color-ink)"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              pathLength="100"
              style={{
                strokeDasharray: 100,
                ...strokeStyle(3.8),
              }}
            />
          ),
        }}
      />
    </>
  );
}
