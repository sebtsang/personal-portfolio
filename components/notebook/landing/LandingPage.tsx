"use client";

import { DrawnText } from "../primitives/DrawnText";
import { FitToWidth } from "../primitives/FitToWidth";
import { RoleCycler } from "../primitives/RoleCycler";
import { AmbientLines } from "./AmbientLines";
import { CornerPeel } from "./CornerPeel";
import { Scraps } from "./Scraps";
import { ScrollCue } from "./ScrollCue";

const ROLES = ["Engineer", "Builder", "Student"];
const INK = "var(--color-ink)";
const INK_DIM = "var(--color-ink-faint)";
const INTRO_DURATION = 2.5;

export function LandingPage({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        zIndex: 2,
      }}
    >
      {/* Ambient hand-drawn lines — faint animated texture */}
      <AmbientLines stroke={INK} />

      {/* Kicker — "journal" */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "0.35em",
          color: "var(--color-ink-faint)",
          textTransform: "uppercase",
          marginBottom: 16,
          opacity: 0,
          animation: "fadeIn 0.6s ease-out 0.3s forwards",
        }}
      >
        journal
      </div>

      {/* Drawn name */}
      <div style={{ width: "min(88vw, 820px)", flex: "none" }}>
        <FitToWidth>
          <DrawnText
            text="Sebastian Tsang"
            fontFamily="Caveat"
            fontSize={140}
            fontWeight={500}
            color={INK}
            duration={INTRO_DURATION * 0.85}
            fillAfter
            fillDelay={0.1}
            strokeWidth={1.4}
          />
        </FitToWidth>
      </div>

      {/* Role cycler */}
      <RoleCycler
        roles={ROLES}
        color={INK_DIM}
        fontFamily="Caveat"
        fontSize={42}
        fontWeight={500}
        startAt={INTRO_DURATION * 1000 + 300}
      />

      {/* Scraps and annotations */}
      <Scraps variant="landing" />

      {/* Scroll cue — right-pointing chevrons bobbing horizontally */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ScrollCue delay={INTRO_DURATION * 1000 + 1000} />
      </div>

      {/* Corner peel — primary advance affordance */}
      <CornerPeel onClick={onAdvance} />
    </div>
  );
}
