import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  X,
  BookOpen,
  Globe2,
  Star,
  Lightbulb,
  ArrowRight,
  Compass,
} from "lucide-react";

type Category =
  | "grandarchive"
  | "worldsofknowledge"
  | "memoryconstellations"
  | "ideaforge";

type CosmicNode = {
  id: string;
  title: string;
  preview: string;
  category: Category;
  x: number; // percentage position on the canvas
  y: number;
  size: number;
};

const CATEGORY_META: Record<
  Category,
  {
    label: string;
    color: string;
    to: string;
    testId: string;
    Icon: typeof BookOpen;
  }
> = {
  grandarchive: {
    label: "Grandarchive",
    color: "#a855f7",
    to: "/",
    testId: "grandarchive",
    Icon: BookOpen,
  },
  worldsofknowledge: {
    label: "Worlds of Knowledge",
    color: "#3b82f6",
    to: "/worldsofknowledge",
    testId: "worldsofknowledge",
    Icon: Globe2,
  },
  memoryconstellations: {
    label: "Memory Constellations",
    color: "#facc15",
    to: "/memoryconstellations",
    testId: "memoryconstellations",
    Icon: Star,
  },
  ideaforge: {
    label: "The Idea Forge",
    color: "#ec4899",
    to: "/ideaforge",
    testId: "ideaforge",
    Icon: Lightbulb,
  },
};

const NODES: CosmicNode[] = [
  // Grandarchive (purple)
  {
    id: "ga-1",
    title: "The First Scroll",
    preview:
      "Where the archive began — a single glowing scroll of memory suspended in the dark.",
    category: "grandarchive",
    x: 16,
    y: 26,
    size: 16,
  },
  {
    id: "ga-2",
    title: "Origins of the Archive",
    preview:
      "How the universe learned to remember itself, one quiet star at a time.",
    category: "grandarchive",
    x: 78,
    y: 18,
    size: 14,
  },
  {
    id: "ga-3",
    title: "The Lost Codex",
    preview:
      "A mysterious book whose pages turn themselves when no one is watching.",
    category: "grandarchive",
    x: 38,
    y: 70,
    size: 13,
  },
  // Worlds of Knowledge (blue)
  {
    id: "wk-1",
    title: "Quantum Realms",
    preview:
      "Where particles dance in two places at once and reality softly blurs.",
    category: "worldsofknowledge",
    x: 28,
    y: 48,
    size: 15,
  },
  {
    id: "wk-2",
    title: "Ancient Mythology",
    preview:
      "Gods, monsters, and cosmic tales etched into the oldest constellations.",
    category: "worldsofknowledge",
    x: 64,
    y: 58,
    size: 14,
  },
  {
    id: "wk-3",
    title: "The Language of Stars",
    preview:
      "A forgotten tongue spoken only in the quiet hum of distant suns.",
    category: "worldsofknowledge",
    x: 88,
    y: 40,
    size: 13,
  },
  // Memory Constellations (gold)
  {
    id: "mc-1",
    title: "A Walk by the Ocean",
    preview:
      "Salt air, a setting sun, and the hush of waves on cool wet sand.",
    category: "memoryconstellations",
    x: 50,
    y: 32,
    size: 16,
  },
  {
    id: "mc-2",
    title: "Grandmother's Kitchen",
    preview:
      "Cinnamon, flour dust, and the warm weight of freshly baked bread.",
    category: "memoryconstellations",
    x: 22,
    y: 60,
    size: 14,
  },
  {
    id: "mc-3",
    title: "The First Snow",
    preview:
      "A whole morning blanketed in white, the world holding its breath.",
    category: "memoryconstellations",
    x: 70,
    y: 80,
    size: 13,
  },
  // Idea Forge (pink)
  {
    id: "if-1",
    title: "Time Travel Paradox",
    preview:
      "What happens if you meet yourself on a long-forgotten Tuesday?",
    category: "ideaforge",
    x: 44,
    y: 14,
    size: 15,
  },
  {
    id: "if-2",
    title: "The Infinite Library",
    preview:
      "Every book that could ever exist, on shelves that stretch forever.",
    category: "ideaforge",
    x: 84,
    y: 68,
    size: 14,
  },
  {
    id: "if-3",
    title: "Dreams of Flight",
    preview:
      "Wings made of light, lifting a dreamer above a sleeping city.",
    category: "ideaforge",
    x: 12,
    y: 82,
    size: 13,
  },
];

type BgStar = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
};

function makeBackgroundStars(count: number): BgStar[] {
  const stars: BgStar[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    });
  }
  return stars;
}

type DragState = {
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
} | null;

/**
 * Cosmicmap — an interactive star map that ties every chapter of the
 * Universe Archive into a single explorable galaxy. Visitors drag to
 * pan, scroll to zoom, hover for a preview, and click a glowing star
 * to open a detail panel that links into the related chapter.
 */
export default function Cosmicmap() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState<CosmicNode | null>(null);
  const [hovered, setHovered] = useState<CosmicNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<DragState>(null);
  const movedRef = useRef(false);

  const bgStars = useMemo(() => makeBackgroundStars(180), []);

  // Close the detail panel on Escape for keyboard users.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
    movedRef.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    setOffset({
      x: dragRef.current.startOffsetX + dx,
      y: dragRef.current.startOffsetY + dy,
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY * 0.0015;
    setScale((s) => Math.min(2.5, Math.max(0.6, s + delta)));
  };

  const resetView = () => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };

  return (
    <main
      data-testid="cosmicmap-page"
      className="relative min-h-screen overflow-hidden bg-[#05010f] text-white"
    >
      {/* Soft cosmic gradient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet-700/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-blue-700/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-fuchsia-700/15 blur-[120px]" />
      </div>

      {/* Heading */}
      <div className="relative z-20 px-6 pt-24 pb-2 text-center md:pt-28">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
          <Compass aria-hidden="true" className="h-3 w-3 text-violet-300" />
          Navigate the Galaxy
        </div>
        <h1 className="bg-gradient-to-b from-white via-violet-100 to-violet-300/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-5xl">
          The Cosmic Map
        </h1>
        <p
          aria-live="polite"
          className="mx-auto mt-3 max-w-xl text-sm text-white/60 md:text-base"
        >
          Every glowing star is a doorway. Drag to wander, scroll to dive
          deeper, and click a star to step inside.
        </p>
      </div>

      {/* Star map canvas */}
      <div
        className="absolute inset-0 z-10 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="absolute left-0 top-0 h-full w-full origin-center"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          {/* Background twinkling stars */}
          {bgStars.map((s) => (
            <div
              key={s.id}
              aria-hidden="true"
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                animation: `cosmicmap-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}

          {/* Content stars — each one opens a chapter of the archive */}
          {NODES.map((node) => {
            const meta = CATEGORY_META[node.category];
            return (
              <button
                key={node.id}
                type="button"
                data-testid={`cosmicmap-star-${node.id}`}
                aria-label={`${meta.label}: ${node.title}. ${node.preview}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!movedRef.current) setSelected(node);
                }}
                onMouseEnter={(e) => {
                  setHovered(node);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) =>
                  setTooltipPos({ x: e.clientX, y: e.clientY })
                }
                onMouseLeave={() => setHovered(null)}
                onPointerDown={(e) => e.stopPropagation()}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition-transform duration-200 hover:scale-150 focus-visible:ring-2 focus-visible:ring-white/70"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  width: `${node.size}px`,
                  height: `${node.size}px`,
                  background: meta.color,
                  boxShadow: `0 0 ${node.size * 1.5}px ${meta.color}, 0 0 ${
                    node.size * 3
                  }px ${meta.color}99`,
                  animation: `cosmicmap-pulse ${
                    4 + (node.size % 3)
                  }s ease-in-out infinite`,
                }}
              >
                <span className="sr-only">{node.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating hover tooltip */}
      {hovered && (
        <div
          data-testid="cosmicmap-tooltip"
          className="pointer-events-none fixed z-40 max-w-[220px] rounded-xl border border-white/15 bg-black/85 px-3 py-2 text-left text-xs shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(tooltipPos.x + 14, window.innerWidth - 240),
            top: tooltipPos.y + 14,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: CATEGORY_META[hovered.category].color }}
            />
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              {CATEGORY_META[hovered.category].label}
            </span>
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            {hovered.title}
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-white/60">
            {hovered.preview}
          </div>
        </div>
      )}

      {/* Legend / controls */}
      <div
        data-testid="cosmicmap-legend"
        className="absolute bottom-4 left-4 z-30 w-56 rounded-2xl border border-white/10 bg-black/60 p-3 backdrop-blur-md md:bottom-6 md:left-6"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60">
            Star Legend
          </h2>
          <button
            type="button"
            onClick={resetView}
            data-testid="cosmicmap-reset-button"
            aria-label="Reset map view"
            className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Recenter
          </button>
        </div>
        <ul className="space-y-1.5">
          {(Object.keys(CATEGORY_META) as Category[]).map((key) => {
            const meta = CATEGORY_META[key];
            return (
              <li
                key={key}
                className="flex items-center gap-2 text-xs text-white/75"
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    background: meta.color,
                    boxShadow: `0 0 8px ${meta.color}`,
                  }}
                />
                <span>{meta.label}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 border-t border-white/10 pt-2 text-[10px] leading-snug text-white/40">
          Drag to pan • Scroll to zoom • Click a star to open
        </p>
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            data-testid="cosmicmap-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cosmicmap-detail-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#150a2e] to-[#0a0418] p-6 shadow-[0_0_60px_-10px_rgba(168,85,247,0.5)]"
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              data-testid="cosmicmap-detail-close"
              aria-label="Close detail panel"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 rounded-full"
                style={{
                  background: CATEGORY_META[selected.category].color,
                  boxShadow: `0 0 12px ${CATEGORY_META[selected.category].color}`,
                }}
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">
                {CATEGORY_META[selected.category].label}
              </span>
            </div>

            <h2
              id="cosmicmap-detail-title"
              className="mt-3 bg-gradient-to-b from-white to-violet-200/80 bg-clip-text text-2xl font-bold text-transparent"
            >
              {selected.title}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {selected.preview}
            </p>

            <Link
              to={CATEGORY_META[selected.category].to}
              data-testid={`cosmicmap-detail-open-${CATEGORY_META[selected.category].testId}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:shadow-[0_0_24px_-6px_rgba(168,85,247,0.8)]"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4 text-violet-300" />
              Open in {CATEGORY_META[selected.category].label}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Local keyframes for twinkling + pulsing stars */}
      <style>{`
        @keyframes cosmicmap-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes cosmicmap-pulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.6); }
        }
      `}</style>
    </main>
  );
}
