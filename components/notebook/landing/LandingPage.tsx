"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

/**
 * Routes prefetched while the landing animation is playing. Warm
 * during the ~3s the user spends on the cover so the first open of
 * any content page has its JS chunk + data already cached — page
 * flip can kick in without a network round-trip pause.
 */
const PREFETCH_ROUTES = [
  "/home",
  "/about",
  "/experience",
  "/linkedin",
  "/contact",
];

export function LandingPage({ onAdvance }: { onAdvance: () => void }) {
  const router = useRouter();

  // Warm up the content-route bundles during the landing animation.
  // Each router.prefetch triggers Next to download the route chunk +
  // any data dependencies without actually mounting the component —
  // so by the time the user opens /about, React already has the code
  // and only has to render. Cuts first-open jank noticeably on cold
  // sessions.
  useEffect(() => {
    for (const path of PREFETCH_ROUTES) {
      router.prefetch(path);
    }
  }, [router]);

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
