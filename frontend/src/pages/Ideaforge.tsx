import { useEffect, useRef, useState, useCallback } from "react";
import { Orbit, Zap, Sparkles, Cog, Gem, Plus, Minus, ArrowRight, Flame } from "lucide-react";

type Forge = {
  id: string;
  name: string;
  hue: number;
  desc: string;
};

const FORGES: Forge[] = [
  { id: "genesis", name: "Genesis Engine", hue: 25, desc: "Sparks raw concepts from the void and shapes them into proto-worlds." },
  { id: "crystal", name: "Crystal Loom", hue: 190, desc: "Weaves loose thoughts into lattice crystals of pure knowledge." },
  { id: "aurora", name: "Aurora Bellows", hue: 310, desc: "Pumps light through molten ideas until they harden into worlds." },
];

const RECENT_IDEAS = [
  "A city that dreams in reverse",
  "Music that can be touched",
  "A language made only of colours",
  "Forests that grow downward into the sky",
  "Time kept in glass instead of clocks",
  "A library where the books read you",
];

/**
 * IdeaForge — a gigantic cosmic machine that forges ideas into worlds.
 * Concentric energy rings rotate around a glowing core, gears spin,
 * knowledge crystals pulse, and the visitor can "forge" a new world
 * by tuning the engine's parameters. The reactor canvas is pure 2D,
 * driven by requestAnimationFrame for buttery performance.
 */
export default function Ideaforge() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [intensity, setIntensity] = useState(60);
  const [crystal, setCrystal] = useState<"quartz" | "onyx" | "prism">("prism");
  const [forging, setForging] = useState(false);
  const [forgedName, setForgedName] = useState<string | null>(null);
  const [forgeLog, setForgeLog] = useState<string[]>([]);
  const [quality, setQuality] = useState<"high" | "low">("high");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setQuality(mq.matches || reduce.matches ? "low" : "high");
  }, []);

  // Reactor renderer: gears, energy rings, particle stream, crystals.
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

    const sparkCount = quality === "high" ? 90 : 40;
    const sparks = Array.from({ length: sparkCount }, () => ({
      ang: Math.random() * Math.PI * 2,
      r: Math.random() * 200 + 30,
      sp: (Math.random() - 0.5) * 0.04,
      hue: 25 + Math.random() * 40,
      a: Math.random(),
    }));

    let t = 0;
    const render = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.4;

      // reactor halo
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 1.3);
      halo.addColorStop(0, `hsla(${30 + intensity / 4}, 95%, 60%, ${0.18 + intensity / 600})`);
      halo.addColorStop(1, "hsla(30, 95%, 60%, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      // energy rings (concentric, rotating opposite directions)
      const rings = quality === "high" ? 5 : 3;
      for (let i = 0; i < rings; i++) {
        const rad = base * (0.35 + i * 0.14);
        const dir = i % 2 === 0 ? 1 : -1;
        const segments = 80;
        for (let s = 0; s < segments; s++) {
          const a0 = (s / segments) * Math.PI * 2 + t * 0.004 * dir;
          const a1 = ((s + 1) / segments) * Math.PI * 2 + t * 0.004 * dir;
          const hue = 25 + i * 30 + Math.sin(t * 0.02 + s) * 20;
          ctx.strokeStyle = `hsla(${hue}, 95%, ${60 + (s % 4) * 6}%, ${0.5 - i * 0.06})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, a0, a1);
          ctx.stroke();
        }
      }

      // orbiting gears (drawn as notched rings)
      const gearCount = quality === "high" ? 6 : 3;
      for (let i = 0; i < gearCount; i++) {
        const ang = (i / gearCount) * Math.PI * 2 + t * 0.002;
        const gx = cx + Math.cos(ang) * base * 0.7;
        const gy = cy + Math.sin(ang) * base * 0.7;
        const gr = base * 0.1;
        const teeth = 12;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(t * 0.01 * (i % 2 === 0 ? 1 : -1));
        ctx.strokeStyle = `hsla(${40 + i * 20}, 80%, 65%, 0.5)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 0; k <= teeth * 2; k++) {
          const rr = k % 2 === 0 ? gr : gr * 0.8;
          const a = (k / (teeth * 2)) * Math.PI * 2;
          const x = Math.cos(a) * rr;
          const y = Math.sin(a) * rr;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // sparks streaming inward when forging
      const targetCount = forging ? sparkCount : Math.floor(sparkCount / 3);
      for (let i = 0; i < targetCount; i++) {
        const sp = sparks[i];
        sp.ang += sp.sp;
        sp.r -= 0.6 + intensity / 100;
        if (sp.r < 20) {
          sp.r = base + Math.random() * 40;
          sp.ang = Math.random() * Math.PI * 2;
        }
        const x = cx + Math.cos(sp.ang) * sp.r;
        const y = cy + Math.sin(sp.ang) * sp.r;
        const hue = crystal === "onyx" ? 270 : crystal === "quartz" ? 200 : sp.hue;
        ctx.fillStyle = `hsla(${hue}, 95%, 70%, ${sp.a})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // central crystal
      const cHue = crystal === "onyx" ? 280 : crystal === "quartz" ? 200 : 30;
      const pulse = 0.85 + Math.sin(t * 0.08) * 0.15;
      const cr = base * 0.16 * pulse;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 2.5);
      cg.addColorStop(0, `hsla(${cHue}, 100%, 85%, 0.95)`);
      cg.addColorStop(0.5, `hsla(${cHue}, 95%, 60%, 0.55)`);
      cg.addColorStop(1, `hsla(${cHue}, 95%, 50%, 0)`);
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 2.5, 0, Math.PI * 2);
      ctx.fill();
      // diamond facets
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.005);
      ctx.fillStyle = `hsla(${cHue}, 100%, 90%, 0.85)`;
      ctx.beginPath();
      ctx.moveTo(0, -cr);
      ctx.lineTo(cr * 0.8, 0);
      ctx.lineTo(0, cr);
      ctx.lineTo(-cr * 0.8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [quality, intensity, crystal, forging]);

  const handleForge = useCallback(() => {
    setForging(true);
    const pool = [
      "Aelora",
      "Veythos",
      "Nyxmir",
      "Solengard",
      "Orinthia",
      "Pellucide",
      "Khaelen",
      "Zephyria",
    ];
    const suffix = ["Prime", "Ascendant", "Reborn", "Eternal", "Veiled", "Unbound"];
    const name = `${pool[Math.floor(Math.random() * pool.length)]} ${suffix[Math.floor(Math.random() * suffix.length)]}`;
    setForgedName(name);
    setForgeLog((prev) => [
      `${new Date().toLocaleTimeString()} — Forged ${name} (${crystal}, intensity ${intensity})`,
      ...prev.slice(0, 6),
    ]);
    setTimeout(() => setForging(false), 1800);
  }, [crystal, intensity]);

  return (
    <main
      data-testid="ideaforge-page"
      className="relative min-h-screen w-full overflow-x-hidden bg-[#05030f] text-white"
    >
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(251,146,60,0.18),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.16),transparent_60%)]"
      />

      {/* HERO */}
      <section
        data-testid="ideaforge-hero"
        className="relative mx-auto max-w-6xl px-6 pt-20 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-amber-200 backdrop-blur-md">
          <Flame aria-hidden="true" className="h-3.5 w-3.5" />
          Chapter IV · The Cosmic Engine
        </div>
        <h1 className="mx-auto max-w-3xl bg-gradient-to-br from-white via-amber-100 to-orange-300 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl">
          The Idea Forge
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-amber-100/70 sm:text-lg">
          A machine older than language. Floating gears mesh with knowledge
          crystals while energy rings compress raw thought until it ignites
          into a brand-new world.
        </p>
      </section>

      {/* FORGE CONSOLE */}
      <section
        data-testid="ideaforge-console"
        className="relative mx-auto mt-12 grid max-w-6xl gap-6 px-6 pb-24 lg:grid-cols-[1.2fr_1fr]"
      >
        {/* Reactor canvas */}
        <div
          data-testid="ideaforge-reactor"
          className="relative min-h-[420px] overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl"
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          />
          <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-amber-200/80">
            <span
              aria-live="polite"
              className={`inline-block h-2 w-2 rounded-full ${forging ? "animate-ping bg-fuchsia-400" : "bg-amber-400"}`}
            />
            {forging ? "Forging in progress" : "Reactor idle"}
          </div>
          {forgedName && !forging && (
            <div
              data-testid="ideaforge-forged-output"
              className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-amber-300/40 bg-black/60 px-5 py-2 text-center text-sm backdrop-blur-md"
              aria-live="polite"
            >
              <span className="text-amber-200">World forged:</span>{" "}
              <span className="font-semibold text-white">{forgedName}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5">
          <div
            data-testid="ideaforge-controls"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <h2 className="text-lg font-semibold">Tune the engine</h2>
            <p className="mt-1 text-sm text-white/60">
              Adjust the forge parameters, then strike the crystal.
            </p>

            {/* Intensity */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <label htmlFor="ideaforge-intensity" className="font-medium text-white/80">
                  Forge intensity
                </label>
                <span className="font-mono text-amber-200" aria-live="polite">{intensity}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease forge intensity"
                  data-testid="ideaforge-intensity-decrease"
                  onClick={() => setIntensity((v) => Math.max(10, v - 10))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-amber-300/50 hover:bg-white/10"
                >
                  <Minus aria-hidden="true" className="h-4 w-4" />
                </button>
                <input
                  id="ideaforge-intensity"
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  aria-label="Forge intensity slider"
                  data-testid="ideaforge-intensity-slider"
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-amber-500/40 to-fuchsia-500/40 accent-amber-400"
                />
                <button
                  type="button"
                  aria-label="Increase forge intensity"
                  data-testid="ideaforge-intensity-increase"
                  onClick={() => setIntensity((v) => Math.min(100, v + 10))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-amber-300/50 hover:bg-white/10"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Crystal selector */}
            <div className="mt-6">
              <span id="ideaforge-crystal-label" className="mb-2 block text-sm font-medium text-white/80">
                Knowledge crystal
              </span>
              <div role="radiogroup" aria-labelledby="ideaforge-crystal-label" className="grid grid-cols-3 gap-2">
                {([
                  { v: "quartz", label: "Quartz", hue: "from-cyan-400 to-blue-500", icon: Gem },
                  { v: "onyx", label: "Onyx", hue: "from-fuchsia-400 to-purple-500", icon: Gem },
                  { v: "prism", label: "Prism", hue: "from-amber-400 to-orange-500", icon: Gem },
                ] as const).map((c) => {
                  const Icon = c.icon;
                  const selected = crystal === c.v;
                  return (
                    <button
                      key={c.v}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`Select ${c.label} crystal`}
                      data-testid={`ideaforge-crystal-${c.v}`}
                      onClick={() => setCrystal(c.v)}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-medium transition-all duration-300 ${
                        selected
                          ? `border-white/40 bg-gradient-to-br ${c.hue} text-white shadow-lg`
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                      }`}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleForge}
              disabled={forging}
              data-testid="ideaforge-forge-button"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-fuchsia-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(251,146,60,0.7)] transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {forging ? (
                <>
                  <Cog aria-hidden="true" className="h-4 w-4 animate-spin" />
                  Forging…
                </>
              ) : (
                <>
                  <Zap aria-hidden="true" className="h-4 w-4" />
                  Strike the Forge
                </>
              )}
            </button>
          </div>

          {/* Forge log */}
          <div
            data-testid="ideaforge-log"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                Forge log
              </h2>
              <Sparkles aria-hidden="true" className="h-4 w-4 text-amber-300" />
            </div>
            {forgeLog.length === 0 ? (
              <p className="text-sm text-white/50">
                No worlds forged yet. Strike the forge to ignite the engine.
              </p>
            ) : (
              <ul className="space-y-2" aria-live="polite">
                {forgeLog.map((entry, i) => (
                  <li
                    key={`${entry}-${i}`}
                    data-testid={`ideaforge-log-entry-${i}`}
                    className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 font-mono text-xs text-white/80"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* FORGE ROSTER */}
      <section
        data-testid="ideaforge-forges"
        className="relative mx-auto max-w-6xl px-6 pb-24"
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-amber-300/70">
          Three engines, one purpose
        </p>
        <h2 className="mb-8 text-3xl font-semibold sm:text-4xl">Inside the cosmic machine</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {FORGES.map((f) => (
            <div
              key={f.id}
              data-testid={`ideaforge-forge-${f.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40"
            >
              <div
                aria-hidden="true"
                className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: `hsla(${f.hue}, 90%, 60%, 0.18)` }}
              >
                <Orbit aria-hidden="true" className="h-5 w-5" style={{ color: `hsl(${f.hue} 95% 75%)` }} />
              </div>
              <h3 className="text-lg font-semibold">{f.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT IDEAS */}
      <section
        data-testid="ideaforge-recent"
        className="relative mx-auto max-w-6xl px-6 pb-28"
      >
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Concepts awaiting worlds</h2>
            <ArrowRight aria-hidden="true" className="h-5 w-5 text-amber-300" />
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {RECENT_IDEAS.map((idea) => (
              <li
                key={idea}
                data-testid={`ideaforge-idea-${idea.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-white/80 transition-colors hover:border-amber-300/40 hover:text-white"
              >
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-amber-300" />
                {idea}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
