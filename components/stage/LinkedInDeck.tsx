"use client";

/**
 * LinkedIn flashcard deck — stacked-card carousel inspired by Caleb Wu's
 * case-study stack, with click-to-flip on the active card to reveal the
 * full post body.
 *
 * Stack math (Caleb):
 *   pos 0 (front)   → translateY(0) scale(1)           opacity 1  overlay 0
 *   pos 1           → translateY(6vh) scale(0.90)      opacity 1  overlay 0.15
 *   pos 2           → translateY(12vh) scale(0.80)     opacity 1  overlay 0.30
 *   pos 3+ (off)    → translateY(-64vh) scale(0.85) rot 8deg  opacity 0
 *
 * Navigation: thumbnail pill at the bottom. The pill itself does the
 * Caleb border-radius morph (rounded-full → rounded-lg on hover).
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { linkedinPosts, type LinkedInPost } from "@/content/linkedin";
import { NumberedHeading } from "@/components/ui/NumberedHeading";
import { Overline } from "@/components/ui/Overline";

const EASE = [0.62, 0.61, 0.02, 1] as const;

function stackAnimate(pos: number) {
  if (pos === 0)
    return { y: 0, scale: 1, opacity: 1, zIndex: 30, rotate: 0 };
  if (pos === 1)
    return { y: "4vh", scale: 0.94, opacity: 1, zIndex: 20, rotate: 0 };
  if (pos === 2)
    return { y: "8vh", scale: 0.88, opacity: 1, zIndex: 10, rotate: 0 };
  // 3+ or < 0 — fly up and out
  return { y: "-56vh", scale: 0.82, opacity: 0, zIndex: 5, rotate: 6 };
}

function overlayOpacity(pos: number): number {
  if (pos === 0) return 0;
  if (pos === 1) return 0.18;
  if (pos === 2) return 0.32;
  return 0;
}

export function LinkedInDeck() {
  const posts = linkedinPosts;
  const [active, setActive] = useState(0);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const goTo = (i: number) => {
    const next = ((i % posts.length) + posts.length) % posts.length;
    setActive(next);
    // Un-flip when navigating.
    setFlipped({});
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Overline>
          Favorite LinkedIn posts · {String(posts.length).padStart(2, "0")} cards
        </Overline>
        <NumberedHeading num="05">Public writing.</NumberedHeading>
        <p className="max-w-xl text-[0.92rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_72%,transparent)]">
          Click a card to flip and read the full post. Use the thumbnails (or
          arrows) to cycle through.
        </p>
      </div>

      {/* Deck container */}
      <div className="relative flex min-h-[60vh] w-full items-center justify-center md:min-h-[52vh]">
        {posts.map((post, i) => {
          const pos =
            ((i - active) % posts.length + posts.length) % posts.length;
          const isActive = pos === 0;
          const isFlipped = !!flipped[post.id];
          const behind = pos > 0;
          return (
            <motion.div
              key={post.id}
              initial={false}
              animate={stackAnimate(pos)}
              transition={{ duration: 0.7, ease: EASE, delay: pos * 0.04 }}
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                perspective: "1400px",
                pointerEvents: behind && pos > 2 ? "none" : undefined,
                transformOrigin: "center top",
              }}
            >
              <div
                className="relative w-[90vw] max-w-[58rem] md:w-[60vw] md:min-h-[22rem]"
                style={{
                  aspectRatio: "5 / 3",
                  transformStyle: "preserve-3d",
                  transition: "transform 700ms var(--ease-fast)",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <CardFront
                  post={post}
                  onFlip={() => isActive && setFlipped((f) => ({ ...f, [post.id]: true }))}
                  active={isActive}
                />
                <CardBack
                  post={post}
                  onFlip={() => setFlipped((f) => ({ ...f, [post.id]: false }))}
                />
                {/* Darkening overlay for cards behind the front */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-black"
                  style={{
                    opacity: overlayOpacity(pos),
                    transition: "opacity 700ms var(--ease-fast)",
                  }}
                  aria-hidden
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigator */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          data-cursor="link"
          aria-label="Previous post"
          className="chip-morph inline-flex h-9 w-9 items-center justify-center border border-[color-mix(in_srgb,var(--color-line)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>

        <ThumbnailPill
          posts={posts}
          active={active}
          onSelect={goTo}
        />

        <button
          type="button"
          onClick={() => goTo(active + 1)}
          data-cursor="link"
          aria-label="Next post"
          className="chip-morph inline-flex h-9 w-9 items-center justify-center border border-[color-mix(in_srgb,var(--color-line)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="text-center font-mono text-[0.66rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {String(active + 1).padStart(2, "0")} / {String(posts.length).padStart(2, "0")}
      </div>
    </div>
  );
}

function CardFront({
  post,
  onFlip,
  active,
}: {
  post: LinkedInPost;
  onFlip: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onFlip}
      disabled={!active}
      data-cursor={active ? "card" : undefined}
      data-cursor-label={active ? "Click to flip" : undefined}
      className={`absolute inset-0 rounded-2xl border border-[color-mix(in_srgb,var(--color-line)_80%,transparent)] bg-gradient-to-br from-[color-mix(in_srgb,var(--color-surface)_95%,transparent)] to-[color-mix(in_srgb,var(--color-surface)_82%,transparent)] p-8 text-left shadow-[var(--shadow-card)] transition-shadow md:p-10 ${active ? "hover:shadow-[var(--shadow-stage)]" : ""}`}
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {/* Accent gradient wash */}
      {post.accent && (
        <div
          className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-60 ${post.accent}`}
          aria-hidden
        />
      )}

      <div className="relative flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-3">
          <Overline accent>LinkedIn · {formatDate(post.date)}</Overline>
          <ArrowUpRight
            className="h-4 w-4 text-[color:var(--color-muted)]"
            strokeWidth={1.75}
          />
        </div>

        <p className="font-serif text-[clamp(1.4rem,3.5vw,2.25rem)] leading-[1.2] text-[color:var(--color-ink)]">
          {post.hook}
        </p>

        <div className="flex items-center gap-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
          {post.reactions !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <ThumbsUp className="h-3 w-3" strokeWidth={2} />
              {post.reactions}
            </span>
          )}
          {post.comments !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" strokeWidth={2} />
              {post.comments}
            </span>
          )}
          <span className="ml-auto text-[color:var(--color-accent)]">
            {active ? "Click to flip →" : ""}
          </span>
        </div>
      </div>
    </button>
  );
}

function CardBack({
  post,
  onFlip,
}: {
  post: LinkedInPost;
  onFlip: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col rounded-2xl border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[color:var(--color-surface)] p-8 shadow-[var(--shadow-stage)] md:p-10"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <Overline accent>LinkedIn · {formatDate(post.date)}</Overline>
        <button
          type="button"
          onClick={onFlip}
          data-cursor="link"
          className="font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-accent)]"
        >
          ← Flip back
        </button>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto pr-2 text-[0.92rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_85%,transparent)]">
        {post.body.split("\n\n").map((para, i) => (
          <p key={i} className="mb-3 whitespace-pre-line last:mb-0">
            {para}
          </p>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[color-mix(in_srgb,var(--color-line)_55%,transparent)] pt-3">
        <div className="flex items-center gap-4 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
          {post.reactions !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <ThumbsUp className="h-3 w-3" strokeWidth={2} />
              {post.reactions}
            </span>
          )}
          {post.comments !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" strokeWidth={2} />
              {post.comments}
            </span>
          )}
        </div>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="link"
          className="link-underline inline-flex items-center gap-1.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--color-accent)]"
        >
          View on LinkedIn
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}

/**
 * Caleb's signature thumbnail pill: at rest, small overlapping circles.
 * On hover, the row spreads out AND each thumb morphs from rounded-full
 * to rounded-lg (pill → square).
 */
function ThumbnailPill({
  posts,
  active,
  onSelect,
}: {
  posts: LinkedInPost[];
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="group relative flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--color-line)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_80%,transparent)] backdrop-blur-md transition-[padding] duration-[450ms] ease-[var(--ease-fast)]"
      style={{ padding: "0.3rem 0.5rem" }}
    >
      {posts.map((p, i) => {
        const isActive = i === active;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(i)}
            data-cursor="tooltip"
            data-cursor-label={p.hook.slice(0, 40) + (p.hook.length > 40 ? "…" : "")}
            aria-label={p.hook}
            className="relative h-7 w-7 shrink-0 rounded-full transition-[border-radius,background,opacity,margin-left] duration-[450ms] ease-[var(--ease-fast)] group-hover:rounded-lg"
            style={{
              marginLeft: i === 0 ? 0 : -8,
              background: isActive
                ? "var(--color-accent)"
                : "color-mix(in srgb, var(--color-muted) 30%, transparent)",
              opacity: isActive ? 1 : 0.75,
            }}
          />
        );
      })}
      <style jsx>{`
        .group:hover > button {
          margin-left: 0.25rem !important;
        }
        .group:hover > button:first-child {
          margin-left: 0 !important;
        }
      `}</style>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}
