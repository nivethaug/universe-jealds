import { useEffect, useRef, useState } from "react";
import {
  Star,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Undo2,
  Save,
  Link2,
  Eraser,
  MousePointer2,
  Orbit,
} from "lucide-react";

type PlacedStar = {
  id: string;
  x: number; // 0..1 relative to canvas
  y: number; // 0..1 relative to canvas
  size: number;
};

type Connection = {
  id: string;
  from: string;
  to: string;
};

type Theme = {
  id: string;
  label: string;
  hue: number;
  gradient: string;
};

type SavedConstellation = {
  id: string;
  name: string;
  themeId: string;
  hue: number;
  stars: PlacedStar[];
  connections: Connection[];
  createdAt: string;
};

type Mode = "place" | "connect" | "erase";

const THEMES: Theme[] = [
  { id: "nebula", label: "Nebula", hue: 280, gradient: "from-violet-400 to-fuchsia-500" },
  { id: "ice", label: "Ice", hue: 200, gradient: "from-cyan-400 to-blue-500" },
  { id: "dawn", label: "Dawn", hue: 40, gradient: "from-amber-400 to-orange-500" },
  { id: "rose", label: "Rose", hue: 330, gradient: "from-rose-400 to-pink-500" },
];

const seedStars = (prefix: string, coords: Array<[number, number, number]>): PlacedStar[] =>
  coords.map(([x, y, size], i) => ({ id: `${prefix}-${i}`, x, y, size }));

const SEED_SAVED: SavedConstellation[] = [
  {
    id: "seed-wanderer",
    name: "The Wanderer",
    themeId: "nebula",
    hue: 280,
    stars: seedStars("w", [
      [0.5, 0.15, 7],
      [0.5, 0.4, 6],
      [0.33, 0.55, 5],
      [0.67, 0.55, 5],
      [0.5, 0.66, 6],
      [0.39, 0.9, 5],
      [0.61, 0.9, 5],
    ]),
    connections: [
      "0-1", "1-2", "1-3", "1-4", "4-5", "4-6",
    ].map((pair, i) => {
      const [f, t] = pair.split("-");
      return { id: `wc-${i}`, from: `w-${f}`, to: `w-${t}` };
    }),
    createdAt: "Eternal · The First Sky",
  },
  {
    id: "seed-crown",
    name: "Crown of Embers",
    themeId: "dawn",
    hue: 40,
    stars: seedStars("c", [
      [0.15, 0.72, 6],
      [0.35, 0.35, 7],
      [0.5, 0.6, 6],
      [0.65, 0.3, 7],
      [0.85, 0.66, 6],
    ]),
    connections: [
      "0-1", "1-2", "2-3", "3-4",
    ].map((pair, i) => {
      const [f, t] = pair.split("-");
      return { id: `cc-${i}`, from: `c-${f}`, to: `c-${t}` };
    }),
    createdAt: "Eternal · The First Sky",
  },
];

/**
 * ConstellationBuilder — Chapter VI of the Universe Archive.
 * Visitors weave their own constellations by placing glowing stars on a
 * living night sky, drawing threads of light between them, choosing a
 * cosmic hue, naming their creation, and saving it to the celestial vault.
 */
export default function Constellationbuilder() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const skyRef = useRef<HTMLDivElement | null>(null);

  const [stars, setStars] = useState<PlacedStar[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [mode, setMode] = useState<Mode>("place");
  const [themeId, setThemeId] = useState<string>("nebula");
  const [starSize, setStarSize] = useState(6);
  const [name, setName] = useState("");
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedConstellation[]>(SEED_SAVED);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  // Background twinkling starfield + nebula glow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);

    const bgStars = Array.from({ length: 130 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.025 + 0.004,
    }));

    let t = 0;
    const render = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      // nebula glow tinted by the active theme
      const grad = ctx.createRadialGradient(
        w * 0.5,
        h * 0.38,
        0,
        w * 0.5,
        h * 0.38,
        Math.max(w, h) * 0.65,
      );
      grad.addColorStop(0, `hsla(${theme.hue}, 80%, 45%, 0.14)`);
      grad.addColorStop(1, "hsla(0,0%,0%,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (const s of bgStars) {
        s.a += s.sp;
        const alpha = 0.25 + Math.abs(Math.sin(s.a)) * 0.55;
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [theme.hue]);

  const handleSkyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "place") return;
    const rect = skyRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    setStars((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x,
        y,
        size: starSize,
      },
    ]);
  };

  const handleStarClick = (e: React.MouseEvent, starId: string) => {
    e.stopPropagation();
    if (mode === "erase") {
      setStars((prev) => prev.filter((s) => s.id !== starId));
      setConnections((prev) =>
        prev.filter((c) => c.from !== starId && c.to !== starId),
      );
      if (connectFrom === starId) setConnectFrom(null);
    } else if (mode === "connect") {
      if (connectFrom === null) {
        setConnectFrom(starId);
      } else if (connectFrom === starId) {
        setConnectFrom(null);
      } else {
        const exists = connections.some(
          (c) =>
            (c.from === connectFrom && c.to === starId) ||
            (c.from === starId && c.to === connectFrom),
        );
        if (!exists) {
          setConnections((prev) => [
            ...prev,
            {
              id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              from: connectFrom,
              to: starId,
            },
          ]);
        }
        setConnectFrom(null);
      }
    }
  };

  const handleUndo = () => {
    if (connections.length > 0) {
      setConnections((prev) => prev.slice(0, -1));
    } else if (stars.length > 0) {
      const lastId = stars[stars.length - 1].id;
      setStars((prev) => prev.slice(0, -1));
      setConnections((prev) =>
        prev.filter((c) => c.from !== lastId && c.to !== lastId),
      );
    }
    setConnectFrom(null);
  };

  const handleClear = () => {
    setStars([]);
    setConnections([]);
    setConnectFrom(null);
  };

  const handleSave = () => {
    if (stars.length < 2) return;
    const constellation: SavedConstellation = {
      id: `const-${Date.now()}`,
      name: name.trim() || "Untitled Constellation",
      themeId,
      hue: theme.hue,
      stars: stars.map((s) => ({ ...s })),
      connections: connections.map((c) => ({ ...c })),
      createdAt: new Date().toLocaleString(),
    };
    setSaved((prev) => [constellation, ...prev]);
    setName("");
    handleClear();
  };

  const handleDeleteSaved = (id: string) => {
    setSaved((prev) => prev.filter((c) => c.id !== id));
  };

  const modes: Array<{ id: Mode; label: string; icon: typeof Star }> = [
    { id: "place", label: "Place", icon: MousePointer2 },
    { id: "connect", label: "Connect", icon: Link2 },
    { id: "erase", label: "Erase", icon: Eraser },
  ];

  const canSave = stars.length >= 2;
  const canUndo = stars.length > 0 || connections.length > 0;

  return (
    <main
      data-testid="constellationbuilder-page"
      className="relative min-h-screen w-full overflow-x-hidden bg-[#05030f] text-white"
    >
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_25%,rgba(168,85,247,0.16),transparent_60%),radial-gradient(circle_at_85%_75%,rgba(56,189,248,0.12),transparent_60%)]"
      />

      {/* HERO */}
      <section
        data-testid="constellationbuilder-hero"
        className="relative mx-auto max-w-6xl px-6 pt-20 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-violet-200 backdrop-blur-md">
          <Orbit aria-hidden="true" className="h-3.5 w-3.5" />
          Chapter VI · The Celestial Loom
        </div>
        <h1 className="mx-auto max-w-3xl bg-gradient-to-br from-white via-violet-100 to-fuchsia-300 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl">
          Constellation Builder
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-violet-100/70 sm:text-lg">
          The sky is yours to weave. Place glowing stars on the living dark,
          draw threads of light between them, and press your own pattern into
          the heavens. Name it, choose its hue, and add it to the celestial
          vault forever.
        </p>
      </section>

      {/* BUILDER */}
      <section
        data-testid="constellationbuilder-console"
        className="relative mx-auto mt-12 grid max-w-6xl gap-6 px-6 pb-20 lg:grid-cols-[1.4fr_1fr]"
      >
        {/* Sky canvas */}
        <div
          data-testid="constellationbuilder-sky"
          className="relative min-h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl"
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          />
          {/* Interactive overlay */}
          <div
            ref={skyRef}
            onClick={handleSkyClick}
            role="application"
            aria-label="Constellation canvas. Click in place mode to add a star."
            data-testid="constellationbuilder-sky-surface"
            className="absolute inset-0"
          >
            {/* Connection lines */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {connections.map((conn) => {
                const a = stars.find((s) => s.id === conn.from);
                const b = stars.find((s) => s.id === conn.to);
                if (!a || !b) return null;
                return (
                  <line
                    key={conn.id}
                    x1={`${a.x * 100}%`}
                    y1={`${a.y * 100}%`}
                    x2={`${b.x * 100}%`}
                    y2={`${b.y * 100}%`}
                    stroke={`hsl(${theme.hue}, 90%, 72%)`}
                    strokeWidth={1.2}
                    strokeOpacity={0.65}
                  />
                );
              })}
              {/* Preview line while connecting */}
              {mode === "connect" && connectFrom && (() => {
                const a = stars.find((s) => s.id === connectFrom);
                if (!a) return null;
                return null;
              })()}
            </svg>

            {/* Placed stars */}
            {stars.map((s) => {
              const isSource = connectFrom === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Star at ${Math.round(s.x * 100)}, ${Math.round(s.y * 100)}`}
                  data-testid={`constellationbuilder-star-${s.id}`}
                  onClick={(e) => handleStarClick(e, s.id)}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  style={{
                    left: `${s.x * 100}%`,
                    top: `${s.y * 100}%`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="block rounded-full transition-transform duration-200 group-hover:scale-150"
                    style={{
                      width: s.size * 2,
                      height: s.size * 2,
                      background: `radial-gradient(circle, hsl(${theme.hue}, 100%, 88%) 0%, hsl(${theme.hue}, 95%, 65%) 40%, hsla(${theme.hue}, 95%, 55%, 0) 72%)`,
                      boxShadow: isSource
                        ? `0 0 ${s.size * 3}px hsl(${theme.hue}, 100%, 75%), 0 0 0 3px hsla(${theme.hue}, 100%, 80%, 0.5)`
                        : `0 0 ${s.size * 2}px hsl(${theme.hue}, 100%, 70%)`,
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Mode + count badge */}
          <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-violet-200/80">
            <span
              aria-live="polite"
              className={`inline-block h-2 w-2 rounded-full ${connectFrom ? "animate-ping bg-fuchsia-400" : "bg-violet-400"}`}
            />
            {mode === "place"
              ? "Place mode · click the sky"
              : mode === "connect"
                ? connectFrom
                  ? "Connect mode · pick a second star"
                  : "Connect mode · pick a star"
                : "Erase mode · click a star"}
          </div>
          <div
            aria-live="polite"
            className="pointer-events-none absolute right-5 top-5 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-mono text-white/70"
          >
            {stars.length} stars · {connections.length} threads
          </div>

          {stars.length === 0 && (
            <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-white/50">
              Click anywhere on the sky to place your first star ✦
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5">
          <div
            data-testid="constellationbuilder-controls"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <h2 className="text-lg font-semibold">Weave your pattern</h2>
            <p className="mt-1 text-sm text-white/60">
              Choose a tool, then interact with the sky.
            </p>

            {/* Mode toggle */}
            <div className="mt-5">
              <span
                id="builder-mode-label"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Tool
              </span>
              <div
                role="radiogroup"
                aria-labelledby="builder-mode-label"
                className="grid grid-cols-3 gap-2"
              >
                {modes.map((m) => {
                  const Icon = m.icon;
                  const selected = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${m.label} tool`}
                      data-testid={`constellationbuilder-mode-${m.id}`}
                      onClick={() => {
                        setMode(m.id);
                        setConnectFrom(null);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-all duration-300 ${
                        selected
                          ? "border-white/40 bg-white/15 text-white shadow-[0_0_20px_-6px_rgba(168,85,247,0.8)]"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                      }`}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div className="mt-5">
              <label
                htmlFor="constellationbuilder-name"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Constellation name
              </label>
              <input
                id="constellationbuilder-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Silver Hart"
                aria-label="Constellation name"
                data-testid="constellationbuilder-name-input"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet-300/50"
              />
            </div>

            {/* Theme */}
            <div className="mt-5">
              <span
                id="builder-theme-label"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Cosmic hue
              </span>
              <div
                role="radiogroup"
                aria-labelledby="builder-theme-label"
                className="grid grid-cols-4 gap-2"
              >
                {THEMES.map((t) => {
                  const selected = themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${t.label} hue`}
                      data-testid={`constellationbuilder-theme-${t.id}`}
                      onClick={() => setThemeId(t.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-[10px] font-medium uppercase tracking-wider transition-all duration-300 ${
                        selected
                          ? "border-white/40 bg-white/15 text-white"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-5 w-5 rounded-full bg-gradient-to-br ${t.gradient}`}
                      />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Star size */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <label
                  htmlFor="constellationbuilder-size"
                  className="font-medium text-white/80"
                >
                  Star size
                </label>
                <span className="font-mono text-violet-200" aria-live="polite">
                  {starSize}px
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease star size"
                  data-testid="constellationbuilder-size-decrease"
                  onClick={() => setStarSize((v) => Math.max(3, v - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-violet-300/50 hover:bg-white/10"
                >
                  <Minus aria-hidden="true" className="h-4 w-4" />
                </button>
                <input
                  id="constellationbuilder-size"
                  type="range"
                  min={3}
                  max={12}
                  step={1}
                  value={starSize}
                  onChange={(e) => setStarSize(Number(e.target.value))}
                  aria-label="Star size slider"
                  data-testid="constellationbuilder-size-slider"
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-violet-500/40 to-fuchsia-500/40 accent-violet-400"
                />
                <button
                  type="button"
                  aria-label="Increase star size"
                  data-testid="constellationbuilder-size-increase"
                  onClick={() => setStarSize((v) => Math.min(12, v + 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-violet-300/50 hover:bg-white/10"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-7 flex gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                aria-label="Undo last action"
                data-testid="constellationbuilder-undo-button"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-colors hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Undo2 aria-hidden="true" className="h-4 w-4" />
                Undo
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={stars.length === 0}
                aria-label="Clear the sky"
                data-testid="constellationbuilder-clear-button"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-colors hover:border-rose-300/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Clear
              </button>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              aria-label="Save constellation to the vault"
              data-testid="constellationbuilder-save-button"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(168,85,247,0.8)] transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              Weave into the Vault
            </button>
            {!canSave && (
              <p className="mt-2 text-center text-xs text-white/40">
                Place at least 2 stars to save your constellation.
              </p>
            )}
          </div>

          {/* How to play */}
          <div
            data-testid="constellationbuilder-guide"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/80">
              How to weave
            </h2>
            <ol className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="font-mono text-violet-300">1.</span>
                Pick <strong className="text-white">Place</strong> and click the
                sky to drop stars.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-violet-300">2.</span>
                Switch to <strong className="text-white">Connect</strong> and tap
                two stars to draw a thread of light.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-violet-300">3.</span>
                Name it, choose its hue, and{" "}
                <strong className="text-white">Weave into the Vault</strong>.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* VAULT GALLERY */}
      <section
        data-testid="constellationbuilder-vault"
        className="relative mx-auto max-w-6xl px-6 pb-28"
      >
        <div className="mb-3 flex items-center gap-2">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-violet-300" />
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-300/70">
            The celestial vault
          </p>
        </div>
        <h2 className="mb-8 text-3xl font-semibold sm:text-4xl">
          Constellations woven so far
        </h2>

        {saved.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <Star aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-white/30" />
            <p className="text-white/50">
              The vault is empty. Weave your first constellation above.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((c) => {
              const starMap = new Map(c.stars.map((s) => [s.id, s]));
              const cTheme = THEMES.find((t) => t.id === c.themeId);
              return (
                <div
                  key={c.id}
                  data-testid={`constellationbuilder-card-${c.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Mini preview */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#070414]">
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="h-full w-full"
                      aria-hidden="true"
                    >
                      {c.connections.map((conn) => {
                        const a = starMap.get(conn.from);
                        const b = starMap.get(conn.to);
                        if (!a || !b) return null;
                        return (
                          <line
                            key={conn.id}
                            x1={a.x * 100}
                            y1={a.y * 100}
                            x2={b.x * 100}
                            y2={b.y * 100}
                            stroke={`hsl(${c.hue}, 90%, 68%)`}
                            strokeWidth={0.45}
                            strokeOpacity={0.7}
                          />
                        );
                      })}
                      {c.stars.map((s) => (
                        <circle
                          key={s.id}
                          cx={s.x * 100}
                          cy={s.y * 100}
                          r={1.6}
                          fill={`hsl(${c.hue}, 100%, 85%)`}
                        />
                      ))}
                    </svg>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at 50% 40%, hsla(${c.hue}, 80%, 40%, 0.18), transparent 65%)`,
                      }}
                    />
                  </div>
                  {/* Meta */}
                  <div className="p-5">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-3 w-3 rounded-full bg-gradient-to-br ${
                          cTheme?.gradient ?? "from-violet-400 to-fuchsia-500"
                        }`}
                      />
                      <h3 className="text-base font-semibold text-white">
                        {c.name}
                      </h3>
                    </div>
                    <p className="text-xs text-white/50">
                      {c.stars.length} stars · {c.connections.length} threads ·{" "}
                      {c.createdAt}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDeleteSaved(c.id)}
                      aria-label={`Remove ${c.name} from the vault`}
                      data-testid={`constellationbuilder-delete-${c.id}`}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-rose-300/40 hover:text-rose-200"
                    >
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      Unravel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
