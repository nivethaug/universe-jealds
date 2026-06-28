import { useEffect, useRef, useState, useCallback } from "react";
import { Globe2, Atom, Cpu, Landmark, Palette, Leaf, ArrowRight, Sparkles } from "lucide-react";

type World = {
  id: string;
  name: string;
  domain: string;
  hue: number;
  accent: string;
  icon: typeof Atom;
  blurb: string;
  relics: string[];
};

const WORLDS: World[] = [
  {
    id: "science",
    name: "Science",
    domain: "The Lattice of Laws",
    hue: 190,
    accent: "from-cyan-400 to-blue-500",
    icon: Atom,
    blurb:
      "A crystalline sphere where the equations of the cosmos hum in perfect harmony — gravity, light and time orbit one another in slow majestic arcs.",
    relics: ["Quantum Gardens", "The Prism Cathedral", "Tensor Forests"],
  },
  {
    id: "technology",
    name: "Technology",
    domain: "The Engine of Tomorrow",
    hue: 25,
    accent: "from-amber-400 to-orange-500",
    icon: Cpu,
    blurb:
      "Gears of glass and circuitry spin endlessly, weaving every invention humanity has dreamed into a single living blueprint of progress.",
    relics: ["The Silicon Spires", "Neural Bazaars", "Code Nebula"],
  },
  {
    id: "history",
    name: "History",
    domain: "The Eternal Chronicle",
    hue: 35,
    accent: "from-yellow-400 to-amber-600",
    icon: Landmark,
    blurb:
      "Ancient empires drift as sediment in amber skies. Every voice that ever spoke is preserved as a slowly turning fragment of light.",
    relics: ["The Sunken Libraries", "Emperor Walkways", "The Calendar Wheel"],
  },
  {
    id: "art",
    name: "Art",
    domain: "The Living Palette",
    hue: 310,
    accent: "from-fuchsia-400 to-purple-500",
    icon: Palette,
    blurb:
      "A world of pure pigment where paintings breathe, sculptures dream, and every brushstroke has weight enough to bend the horizon.",
    relics: ["The Colour Wells", "Marble Constellations", "Symphony Tides"],
  },
  {
    id: "nature",
    name: "Nature",
    domain: "The Verdant Spiral",
    hue: 145,
    accent: "from-emerald-400 to-teal-500",
    icon: Leaf,
    blurb:
      "Bioluminescent forests rise into orbit, rivers of pollen carve continents, and the seasons themselves rotate like the hands of a clock.",
    relics: ["The Migrating Jungles", "Coral Skies", "The Pollen Ocean"],
  },
];

/**
 * WorldsOfKnowledge — a cinematic flythrough of giant floating worlds.
 * As the visitor scrolls, each world rotates, emits unique particles,
 * and reveals the floating structures held within it. The scene uses
 * a fixed canvas with depth, parallax and mouse-reactive lighting.
 */
export default function Worldsofknowledge() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionsRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [quality, setQuality] = useState<"high" | "low">("high");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setQuality(mq.matches || reduce.matches ? "low" : "high");
  }, []);

  // Track which world panel is centered.
  useEffect(() => {
    const panels = sectionsRef.current?.querySelectorAll<HTMLElement>("[data-world-index]");
    if (!panels || panels.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.worldIndex);
            setActive(idx);
          }
        });
      },
      { threshold: 0.55 }
    );
    panels.forEach((p) => obs.observe(p));
    return () => obs.disconnect();
  }, []);

  // Canvas renderer: 5 rotating worlds with unique particle systems.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const starCount = quality === "high" ? 220 : 100;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.9 + 0.1,
      r: Math.random() * 1.3 + 0.2,
      tw: Math.random() * Math.PI * 2,
    }));

    // particle systems per world
    const systems = WORLDS.map((world, i) => ({
      hue: world.hue,
      // each system stays near a vertical band
      bandX: () => w * (0.2 + (i / (WORLDS.length - 1)) * 0.6),
      particles: Array.from({ length: quality === "high" ? 60 : 30 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: Math.random() * 200,
      })),
    }));

    let t = 0;
    const render = () => {
      t += 1;
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#070418");
      bg.addColorStop(1, "#02010a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // stars
      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        s.tw += 0.03;
        const a = 0.3 + Math.sin(s.tw) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${a * s.z})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // each world: rotating ring + glowing core + particles
      systems.forEach((sys, i) => {
        const cx = sys.bandX();
        const cy = h / 2 + Math.sin(t * 0.003 + i) * 30;
        const baseR = Math.min(w, h) * 0.18;

        // outer halo
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 2);
        halo.addColorStop(0, `hsla(${sys.hue}, 90%, 60%, 0.22)`);
        halo.addColorStop(1, `hsla(${sys.hue}, 90%, 60%, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 2, 0, Math.PI * 2);
        ctx.fill();

        // rotating ring
        ctx.strokeStyle = `hsla(${sys.hue}, 95%, 75%, 0.55)`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, baseR, baseR * 0.4, t * 0.004 + i, 0, Math.PI * 2);
        ctx.stroke();

        // secondary ring
        ctx.strokeStyle = `hsla(${sys.hue + 30}, 95%, 75%, 0.3)`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, baseR * 0.7, baseR * 0.28, -t * 0.003 + i, 0, Math.PI * 2);
        ctx.stroke();

        // core
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.55);
        core.addColorStop(0, `hsla(${sys.hue}, 95%, 80%, 0.95)`);
        core.addColorStop(0.6, `hsla(${sys.hue + 10}, 90%, 55%, 0.5)`);
        core.addColorStop(1, `hsla(${sys.hue}, 90%, 40%, 0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // particles orbiting the world
        for (const p of sys.particles) {
          p.life += 1;
          // orbit
          const ang = Math.atan2(p.y - cy, p.x - cx) + 0.01;
          const dist = Math.hypot(p.x - cx, p.y - cy);
          const target = baseR * (0.8 + (p.life % 120) / 240);
          const nd = dist + (target - dist) * 0.02;
          p.x = cx + Math.cos(ang) * nd + p.vx;
          p.y = cy + Math.sin(ang) * nd + p.vy;
          if (p.life > 240) p.life = 0;
          const a = 0.5 + Math.sin(p.life * 0.05) * 0.4;
          ctx.fillStyle = `hsla(${sys.hue + 20}, 95%, 75%, ${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [quality]);

  const scrollToNext = useCallback(() => {
    const next = Math.min(active + 1, WORLDS.length - 1);
    const el = sectionsRef.current?.querySelector<HTMLElement>(`[data-world-index="${next}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active]);

  return (
    <main
      data-testid="worldsofknowledge-page"
      className="relative w-full overflow-x-hidden bg-[#05030f] text-white"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 -z-10 h-full w-full"
      />

      {/* HERO */}
      <section
        data-testid="worldsofknowledge-hero"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-cyan-200 backdrop-blur-md">
          <Globe2 aria-hidden="true" className="h-3.5 w-3.5" />
          Chapter II · The Atlas of Realms
        </div>
        <h1 className="max-w-4xl bg-gradient-to-br from-white via-cyan-100 to-blue-300 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl md:text-7xl">
          Worlds of Knowledge
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-cyan-100/70 sm:text-lg">
          Each floating sphere is an entire discipline made tangible. Drift
          between them — touch their atmospheres, listen to their relics, and
          let the camera carry you into the heart of every world.
        </p>
        <button
          type="button"
          onClick={scrollToNext}
          data-testid="worldsofknowledge-descend-button"
          className="group mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(34,211,238,0.7)] transition-all duration-300 hover:scale-[1.03]"
        >
          Descend into the Worlds
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </section>

      {/* WORLD PANELS */}
      <div ref={sectionsRef} className="relative">
        {WORLDS.map((world, i) => {
          const Icon = world.icon;
          const flipped = i % 2 === 1;
          const isActive = active === i;
          return (
            <section
              key={world.id}
              data-world-index={i}
              data-testid={`worldsofknowledge-world-${world.id}`}
              className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20"
            >
              <div
                className={`grid w-full items-center gap-10 md:grid-cols-2 ${flipped ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div
                  className={`transition-all duration-500 ${isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-60"}`}
                >
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-white/80 backdrop-blur-md`}
                    style={{ color: `hsl(${world.hue} 90% 75%)` }}
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                    {world.domain}
                  </div>
                  <h2 className="mt-5 text-4xl font-semibold sm:text-5xl">
                    {world.name}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                    {world.blurb}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-2">
                    {world.relics.map((r) => (
                      <span
                        key={r}
                        data-testid={`worldsofknowledge-relic-${world.id}-${r.toLowerCase().replace(/\s+/g, "-")}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md"
                      >
                        <Sparkles aria-hidden="true" className="h-3 w-3" style={{ color: `hsl(${world.hue} 95% 75%)` }} />
                        {r}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-white/30 to-transparent" />
                    <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {String(i + 1).padStart(2, "0")} / {String(WORLDS.length).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Visual disc */}
                <div className="relative flex justify-center">
                  <div
                    aria-hidden="true"
                    className={`world-orb bg-gradient-to-br ${world.accent}`}
                    style={{ animationDelay: `${i * -3}s` }}
                    data-testid={`worldsofknowledge-orb-${world.id}`}
                  >
                    <div className="world-orb__ring" />
                    <div className="world-orb__ring world-orb__ring--2" />
                    <div className="world-orb__core">
                      <Icon aria-hidden="true" className="h-10 w-10 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* FOOTER CTA */}
      <section
        data-testid="worldsofknowledge-footer"
        className="relative mx-auto max-w-6xl px-6 py-24 text-center"
      >
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Five worlds. One infinite atlas.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            The flythrough is only the surface. Beneath every sphere lies a
            deeper archive — the constellations that remember it all.
          </p>
        </div>
      </section>
    </main>
  );
}
