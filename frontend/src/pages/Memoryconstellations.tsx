import { useEffect, useRef, useState, useMemo } from "react";
import { Star, Sparkles, Brain, Radio, ArrowRight } from "lucide-react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
  hue: number;
  memory: string;
};

const MEMORIES = [
  "First light",
  "A whispered name",
  "The taste of rain",
  "A door left open",
  "Midnight laughter",
  "The colour of goodbye",
  "A song half-remembered",
  "Hands held in winter",
  "The longest summer",
  "A promise kept",
  "Footprints in snow",
  "Silence at dawn",
  "The first word",
  "An unfinished letter",
  "Lightning over fields",
  "The weight of a key",
  "A mother's lullaby",
  "The road not taken",
  "Smoke from a hearth",
  "Tides returning",
];

/**
 * MemoryConstellations — the most visually reactive section.
 * Stars representing memories float in cosmic space; as the cursor
 * moves nearby stars brighten, connections illuminate and entirely
 * new constellations form dynamically. Touch is supported.
 */
export default function Memoryconstellations() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false });
  const nodesRef = useRef<Node[]>([]);
  const [activeMemory, setActiveMemory] = useState<string | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [quality, setQuality] = useState<"high" | "low">("high");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setQuality(mq.matches || reduce.matches ? "low" : "high");
  }, []);

  // Initialise nodes once canvas size is known.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const w = canvas.width;
      const h = canvas.height;
      const count = quality === "high" ? 70 : 36;
      nodesRef.current = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.8,
        pulse: Math.random() * Math.PI * 2,
        hue: 270 + Math.random() * 80,
        memory: MEMORIES[i % MEMORIES.length],
      }));
    };
    init();
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, [quality]);

  // Pointer + touch handlers.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      pointer.current.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
      pointer.current.x = -9999;
      pointer.current.y = -9999;
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) {
        pointer.current.x = e.touches[0].clientX;
        pointer.current.y = e.touches[0].clientY;
        pointer.current.active = true;
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
    };
  }, []);

  // Render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const maxDist = quality === "high" ? 150 : 110;
    const pointerRange = 200;

    const render = () => {
      t += 1;
      const w = canvas.width;
      const h = canvas.height;
      // Trail fade for that dreamy neural look.
      ctx.fillStyle = "rgba(5,3,15,0.28)";
      ctx.fillRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const px = pointer.current.x;
      const py = pointer.current.y;
      const pointerActive = pointer.current.active;

      // Update positions
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.04;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Pointer attraction
        if (pointerActive) {
          const dx = px - n.x;
          const dy = py - n.y;
          const d = Math.hypot(dx, dy);
          if (d < pointerRange && d > 0.001) {
            const f = (1 - d / pointerRange) * 0.08;
            n.vx += (dx / d) * f;
            n.vy += (dy / d) * f;
          }
        }
        // Damping
        n.vx *= 0.985;
        n.vy *= 0.985;
      }

      // Draw connections
      let connections = 0;
      ctx.lineWidth = 0.7;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < maxDist) {
            const baseAlpha = (1 - d / maxDist) * 0.5;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            let boost = 0;
            if (pointerActive) {
              const pd = Math.hypot(midX - px, midY - py);
              if (pd < pointerRange) boost = (1 - pd / pointerRange) * 0.7;
            }
            const alpha = Math.min(0.9, baseAlpha + boost);
            const hue = (a.hue + b.hue) / 2;
            ctx.strokeStyle = `hsla(${hue}, 90%, ${65 + boost * 20}%, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            connections++;
          }
        }
      }
      setConnectionCount((c) => (Math.abs(c - connections) > 3 ? connections : c));

      // Draw nodes
      for (const n of nodes) {
        const pulse = 0.6 + Math.sin(n.pulse) * 0.4;
        let highlight = 0;
        let label = false;
        if (pointerActive) {
          const d = Math.hypot(n.x - px, n.y - py);
          if (d < pointerRange) highlight = 1 - d / pointerRange;
          if (d < 36) label = true;
        }
        const r = n.r * (1 + highlight * 2);
        // halo
        const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 8);
        halo.addColorStop(0, `hsla(${n.hue}, 95%, 75%, ${0.6 * pulse + highlight * 0.5})`);
        halo.addColorStop(1, `hsla(${n.hue}, 95%, 75%, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 8, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.fillStyle = `hsla(${n.hue}, 95%, ${80 + highlight * 15}%, ${0.95})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (label) {
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(n.memory, n.x, n.y - 14);
          if (activeMemory !== n.memory) setActiveMemory(n.memory);
        }
      }

      // Pointer halo
      if (pointerActive) {
        const g = ctx.createRadialGradient(px, py, 0, px, py, pointerRange);
        g.addColorStop(0, "rgba(217,70,239,0.16)");
        g.addColorStop(1, "rgba(217,70,239,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, pointerRange, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [quality, activeMemory]);

  const insights = useMemo(
    () => [
      {
        icon: Brain,
        title: "Living neural pathways",
        body: "Every memory is a star. Every shared thought pulls them closer until constellations bloom unbidden.",
      },
      {
        icon: Radio,
        title: "Reactive resonance",
        body: "Move your cursor across the void — dormant threads ignite, forging meaning where none existed a moment ago.",
      },
      {
        icon: Star,
        title: "Infinite recall",
        body: "The constellation map is never the same twice. It rearranges itself around whoever is watching.",
      },
    ],
    []
  );

  return (
    <main
      data-testid="memoryconstellations-page"
      className="relative min-h-screen w-full overflow-x-hidden bg-[#05030f] text-white"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 -z-10 h-full w-full touch-none"
      />

      {/* HERO */}
      <section
        data-testid="memoryconstellations-hero"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-fuchsia-200 backdrop-blur-md">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          Chapter III · The Memory Field
        </div>
        <h1 className="max-w-4xl bg-gradient-to-br from-white via-fuchsia-100 to-purple-300 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl md:text-7xl">
          Memory Constellations
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-fuchsia-100/70 sm:text-lg">
          Reach into the field. Stars will brighten, threads will ignite, and
          memories will rearrange themselves into constellations only you could
          summon.
        </p>

        {/* Live HUD */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <div
            data-testid="memoryconstellations-hud-connections"
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm backdrop-blur-md"
          >
            <span aria-live="polite" className="font-mono text-fuchsia-200">
              {connectionCount.toString().padStart(3, "0")}
            </span>
            <span className="text-white/60">active threads</span>
          </div>
          <div
            data-testid="memoryconstellations-hud-memory"
            className="flex min-w-[200px] items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm backdrop-blur-md"
            aria-live="polite"
          >
            <Star aria-hidden="true" className="h-3.5 w-3.5 text-fuchsia-300" />
            <span className="truncate text-white/80">
              {activeMemory ?? "hover a star to remember"}
            </span>
          </div>
        </div>

        <div className="mt-10 animate-bounce text-fuchsia-200/70">
          <ArrowRight aria-hidden="true" className="h-5 w-5 rotate-90" />
        </div>
      </section>

      {/* INSIGHTS */}
      <section
        data-testid="memoryconstellations-insights"
        className="relative mx-auto max-w-6xl px-6 py-24"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {insights.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.title}
                data-testid={`memoryconstellations-insight-${it.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 to-purple-600/5 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-300/40"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                  <Icon aria-hidden="true" className="h-5 w-5 text-fuchsia-200" />
                </div>
                <h2 className="text-lg font-semibold">{it.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{it.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* REMEMBERED LIST */}
      <section
        data-testid="memoryconstellations-archive"
        className="relative mx-auto max-w-6xl px-6 pb-24"
      >
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-fuchsia-300/70">
            Echoes from the field
          </p>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            A few of the memories adrift tonight
          </h2>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MEMORIES.slice(0, 12).map((m) => (
              <li
                key={m}
                data-testid={`memoryconstellations-echo-${m.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-white/80 transition-colors hover:border-fuchsia-300/40 hover:text-white"
              >
                <Star aria-hidden="true" className="h-3 w-3 text-fuchsia-300" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
