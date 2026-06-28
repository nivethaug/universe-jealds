import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, BookOpen, ArrowRight, Orbit, ScrollText, Globe2, Star } from "lucide-react";

type FloatingBook = {
  x: number;
  y: number;
  z: number;
  rot: number;
  rotSpeed: number;
  size: number;
  hue: number;
  vy: number;
};

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
};

/**
 * Grandarchive — the cosmic hero.
 * A full-screen infinite library: an opening centrepiece book,
 * books orbiting in 3D space, glowing particle streams,
 * celestial pathways and a parallax starfield. Pure Canvas 2D
 * + requestAnimationFrame so the experience ships without a
 * WebGL dependency while still feeling cinematic.
 */
export default function Grandarchive() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coreRef = useRef<HTMLDivElement | null>(null);
  const mouse = useRef({ x: 0.5, y: 0.5, active: false });
  const [entered, setEntered] = useState(false);
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [scrollY, setScrollY] = useState(0);

  // Adaptive quality based on device + motion preference.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setQuality(mq.matches || reduce.matches ? "low" : "high");
  }, []);

  // Pointer parallax for hero content.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
      mouse.current.active = true;
      if (coreRef.current) {
        const dx = (mouse.current.x - 0.5) * 24;
        const dy = (mouse.current.y - 0.5) * 24;
        coreRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cosmic scene renderer.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let t = 0;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const starCount = quality === "high" ? 320 : 140;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.9 + 0.1,
      r: Math.random() * 1.4 + 0.2,
      tw: Math.random() * Math.PI * 2,
    }));

    const books: FloatingBook[] = Array.from({ length: quality === "high" ? 14 : 7 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.8 + 0.2,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.005,
      size: Math.random() * 30 + 18,
      hue: 200 + Math.random() * 120,
      vy: (Math.random() - 0.5) * 0.15,
    }));

    const particles: Particle[] = [];
    const spawn = () => {
      if (particles.length > (quality === "high" ? 220 : 90)) return;
      const cx = w / 2;
      const cy = h / 2;
      const ang = Math.random() * Math.PI * 2;
      const sp = Math.random() * 1.6 + 0.4;
      particles.push({
        x: cx,
        y: cy,
        z: Math.random(),
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0,
        maxLife: 120 + Math.random() * 120,
        hue: 180 + Math.random() * 120,
      });
    };

    const drawBook = (b: FloatingBook) => {
      const scale = 0.5 + b.z * 1.2;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.scale(scale, scale);
      const gw = b.size * 1.4;
      const gh = b.size;
      // glow
      const grad = ctx.createLinearGradient(-gw / 2, 0, gw / 2, 0);
      grad.addColorStop(0, `hsla(${b.hue}, 90%, 65%, 0.95)`);
      grad.addColorStop(1, `hsla(${b.hue + 40}, 90%, 55%, 0.4)`);
      ctx.shadowBlur = 18;
      ctx.shadowColor = `hsla(${b.hue}, 95%, 70%, 0.7)`;
      ctx.fillStyle = grad;
      ctx.fillRect(-gw / 2, -gh / 2, gw, gh);
      // spine
      ctx.shadowBlur = 0;
      ctx.fillStyle = `hsla(${b.hue + 20}, 95%, 80%, 0.9)`;
      ctx.fillRect(-gw / 2 - 2, -gh / 2, 3, gh);
      ctx.restore();
    };

    const render = () => {
      t += 1;
      // deep space gradient
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.8);
      bg.addColorStop(0, "rgba(20, 14, 48, 1)");
      bg.addColorStop(0.45, "rgba(9, 7, 28, 1)");
      bg.addColorStop(1, "rgba(2, 2, 10, 1)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // nebula blobs
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) {
        const cx = w * (0.3 + 0.2 * i) + Math.sin(t * 0.002 + i) * 60;
        const cy = h * (0.4 + 0.1 * Math.sin(i)) + Math.cos(t * 0.0015 + i) * 40;
        const rad = Math.max(80, 220 + Math.sin(t * 0.004 + i) * 60);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const hue = 250 + i * 30;
        g.addColorStop(0, `hsla(${hue}, 85%, 60%, 0.16)`);
        g.addColorStop(1, "hsla(260, 85%, 50%, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // stars
      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        s.tw += 0.04;
        const a = 0.4 + Math.sin(s.tw) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${a * s.z})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // particles streaming from the core
      spawn();
      spawn();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.995;
        p.vy *= 0.995;
        const a = 1 - p.life / p.maxLife;
        if (a <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `hsla(${p.hue}, 95%, 70%, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4 + p.z * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // floating books
      ctx.globalCompositeOperation = "lighter";
      for (const b of books) {
        b.x += Math.sin(t * 0.003 + b.z * 10) * 0.2;
        b.y += b.vy;
        b.rot += b.rotSpeed;
        if (b.y < -60) b.y = h + 60;
        if (b.y > h + 60) b.y = -60;
        drawBook(b);
      }

      // celestial pathway rings around core
      ctx.globalCompositeOperation = "lighter";
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < 4; i++) {
        const rad = 120 + i * 70 + Math.sin(t * 0.01 + i) * 8;
        ctx.strokeStyle = `hsla(${200 + i * 25}, 90%, 70%, ${0.18 - i * 0.03})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rad, rad * 0.32, t * 0.002 + i, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [quality]);

  const handleEnter = useCallback(() => setEntered(true), []);

  return (
    <main
      data-testid="grandarchive-page"
      className="relative min-h-screen w-full overflow-x-hidden bg-[#05030f] text-white"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 -z-10 h-full w-full"
      />

      {/* HERO */}
      <section
        data-testid="grandarchive-hero"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-[5] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(120,90,255,0.35),transparent_70%)] blur-3xl"
          aria-hidden="true"
        />

        {/* Opening centrepiece book (pure CSS animation) */}
        <div
          ref={coreRef}
          aria-hidden="true"
          className="grandarchive-book mb-10"
          data-testid="grandarchive-core-book"
        >
          <div className="grandarchive-book__cover grandarchive-book__cover--left" />
          <div className="grandarchive-book__spine" />
          <div className="grandarchive-book__pages" />
          <div className="grandarchive-book__cover grandarchive-book__cover--right" />
          <div className="grandarchive-book__glow" />
        </div>

        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-violet-200 backdrop-blur-md"
        >
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          The Cosmic Library · Chapter I
        </div>

        <h1
          className="max-w-4xl bg-gradient-to-br from-white via-violet-100 to-indigo-300 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl md:text-7xl"
        >
          Every Idea Ever Dreamed Exists Here
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-violet-100/70 sm:text-lg">
          You have entered the Grand Archive — an infinite repository where books
          orbit like planets, memories ignite into stars, and every page you turn
          opens a doorway to a new world.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#chapters"
            data-testid="grandarchive-enter-button"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(168,85,247,0.7)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_60px_-6px_rgba(217,70,239,0.8)]"
          >
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            Enter Archive
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <Link
            to="/worldsofknowledge"
            data-testid="grandarchive-explore-button"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-violet-300/60 hover:bg-white/10"
          >
            <Orbit aria-hidden="true" className="h-4 w-4" />
            Begin Exploration
          </Link>
        </div>

        <div
          aria-hidden={!entered}
          aria-live="polite"
          className="mt-6 h-5 text-xs font-medium uppercase tracking-widest text-violet-300/80"
        >
          {entered ? "Archive seal unlocked" : "Scroll to traverse the archive"}
        </div>
      </section>

      {/* CHAPTER NAVIGATOR */}
      <section
        id="chapters"
        data-testid="grandarchive-chapters"
        className="relative mx-auto max-w-6xl px-6 py-24"
      >
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-violet-300/70">
            Index of Realms
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Choose a doorway into the infinite
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              to: "/worldsofknowledge",
              icon: Globe2,
              title: "Worlds of Knowledge",
              desc: "Drift through giant floating realms — science, history, art and beyond.",
              hue: "from-cyan-400/20 to-blue-500/20",
              testId: "grandarchive-chapter-worlds",
            },
            {
              to: "/memoryconstellations",
              icon: Star,
              title: "Memory Constellations",
              desc: "Watch memories ignite into constellations that respond to your touch.",
              hue: "from-fuchsia-400/20 to-purple-500/20",
              testId: "grandarchive-chapter-memory",
            },
            {
              to: "/ideaforge",
              icon: Orbit,
              title: "The Idea Forge",
              desc: "Witness raw concepts forged into worlds inside a cosmic engine.",
              hue: "from-amber-400/20 to-orange-500/20",
              testId: "grandarchive-chapter-forge",
            },
            {
              to: "/",
              icon: ScrollText,
              title: "The Infinite Shelf",
              desc: "Pull back and witness millions of worlds stretching endlessly.",
              hue: "from-emerald-400/20 to-teal-500/20",
              testId: "grandarchive-chapter-shelf",
            },
          ].map((c) => (
            <Link
              key={c.title}
              to={c.to}
              data-testid={c.testId}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${c.hue} p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-violet-300/40 hover:shadow-[0_18px_60px_-12px_rgba(124,58,237,0.5)]`}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                <c.icon aria-hidden="true" className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{c.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-violet-200">
                Enter
                <ArrowRight aria-hidden="true" className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* STATS / MYTHOS */}
      <section
        data-testid="grandarchive-mythos"
        className="relative mx-auto max-w-6xl px-6 pb-24"
      >
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl sm:grid-cols-3">
          {[
            { k: "∞", v: "Worlds indexed", testId: "grandarchive-stat-worlds" },
            { k: "1.4M", v: "Living memories", testId: "grandarchive-stat-memory" },
            { k: "0", v: "Boundaries remaining", testId: "grandarchive-stat-bound" },
          ].map((s) => (
            <div
              key={s.v}
              data-testid={s.testId}
              className="text-center"
              style={{ transform: `translateY(${Math.min(scrollY * 0.02, 16)}px)` }}
            >
              <div className="bg-gradient-to-br from-violet-200 to-fuchsia-300 bg-clip-text text-5xl font-bold text-transparent">
                {s.k}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-white/60">{s.v}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
