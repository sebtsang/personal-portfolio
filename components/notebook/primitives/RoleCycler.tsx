"use client";

import { useEffect, useState } from "react";
import { DrawnText } from "./DrawnText";

type Phase = "idle" | "drawing" | "hold" | "erasing";

export function RoleCycler({
  roles,
  color,
  fontFamily,
  fontSize,
  fontWeight = 500,
  fontStyle = "normal",
  startAt = 3200,
}: {
  roles: string[];
  color: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic";
  startAt?: number;
}) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setStarted(true);
      setPhase("drawing");
    }, startAt);
    return () => clearTimeout(t);
  }, [startAt]);

  useEffect(() => {
    if (phase === "drawing") {
      const t = setTimeout(() => setPhase("hold"), 1400);
      return () => clearTimeout(t);
    }
    if (phase === "hold") {
      const t = setTimeout(() => setPhase("erasing"), 1700);
      return () => clearTimeout(t);
    }
    if (phase === "erasing") {
      const t = setTimeout(() => {
        setIdx((i) => (i + 1) % roles.length);
        setPhase("drawing");
      }, 900);
      return () => clearTimeout(t);
    }
  }, [phase, roles.length]);

  if (!started) {
    return <div style={{ height: fontSize * 1.6, flex: "none" }} />;
  }

  return (
    <div
      style={{
        height: fontSize * 1.6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flex: "none",
      }}
    >
      <div style={{ display: "inline-flex", justifyContent: "center" }}>
        <DrawnText
          key={`${idx}-${phase === "erasing" ? "e" : "d"}`}
          text={roles[idx]}
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={fontWeight}
          fontStyle={fontStyle}
          color={color}
          duration={1.1}
          fillAfter
          fillDelay={0}
          strokeWidth={0.8}
          erasing={phase === "erasing"}
          eraseDuration={0.8}
        />
      </div>
    </div>
  );
}
