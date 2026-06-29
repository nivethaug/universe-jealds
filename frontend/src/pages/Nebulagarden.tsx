import { useEffect, useRef, useState, useCallback } from "react";
import {
  Sparkles,
  Orbit,
  Wind,
  Thermometer,
  Droplet,
  Plus,
  Minus,
  Trash2,
  Save,
  Undo2,
  Flower2,
} from "lucide-react";

type Particle = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gas: "hydrogen" | "helium" | "oxygen" | "nitrogen";
  life: number;
  maxLife: number;
  size: number;
};

type GasMixture = {
  hydrogen: number;
  helium: number;
  oxygen: number;
  nitrogen: number;
};

type SavedNebula = {
  id: string;
  name: string;
  gases: GasMixture;
  gravity: number;
  temperature: number;
  particleCount: number;
  hueShift: number;
  createdAt: string;
  thumbnail?: string;
};

const GAS_COLORS: Record<string, { hue: number; label: string }> = {
  hydrogen: { hue: 200, label: "Hydrogen · Blue" },
  helium: { hue: 55, label: "Helium · Gold" },
  oxygen: { hue: 320, label: "Oxygen · Magenta" },
  nitrogen: { hue: 160, label: "Nitrogen · Teal" },
};

const SEED_NEBULAE: SavedNebula[] = [
  {
    id: "seed-aurora",
    name: "Aurora's Veil",
    gases: { hydrogen: 50, helium: 30, oxygen: 15, nitrogen: 5 },
    gravity: 0.3,
    temperature: 0.6,
    particleCount: 450,
    hueShift: 0,
    createdAt: "Eternal · The First Garden",
  },
  {
    id: "seed-ember",
    name: "Ember Bloom",
    gases: { hydrogen: 20, helium: 45, oxygen: 30, nitrogen: 5 },
    gravity: 0.5,
    temperature: 0.8,
    particleCount: 380,
    hueShift: 15,
    createdAt: "Eternal · The First Garden",
  },
];

/**
 * NebulaGarden — Chapter VII of the Universe Archive.
 * Visitors grow their own nebulae by mixing cosmic gases, adjusting gravity
 * and temperature, then seeding particles that swirl into luminous clouds.
 */
export default function Nebulagarden() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const [gases, setGases] = useState<GasMixture>({
    hydrogen: 40,
    helium: 25,
    oxygen: 20,
    nitrogen: 15,
  });
  const [gravity, setGravity] = useState(0.35);
  const [temperature, setTemperature] = useState(0.5);
  const [hueShift, setHueShift] = useState(0);
  const [saved, setSaved] = useState<SavedNebula[]>(SEED_NEBULAE);
  const [name, setName] = useState("");
  const [particleCount, setParticleCount] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);

  // Normalize gas mixture to always sum to 100
  const normalizeGases = useCallback(
    (gas: keyof GasMixture, value: number): GasMixture => {
      const newGases = { ...gases, [gas]: value };
      const total = Object.values(newGases).reduce((a, b) => a + b, 0);
      if (total === 0) return newGases;
      const factor = 100 / total;
      return {
        hydrogen: Math.round(newGases.hydrogen * factor),
        helium: Math.round(newGases.helium * factor),
        oxygen: Math.round(newGases.oxygen * factor),
        nitrogen: Math.round(newGases.nitrogen * factor),
      };
    },
    [gases],
  );

  // Pick a random gas based on mixture probabilities
  const pickGasByMixture = useCallback((): Particle["gas"] => {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const [gas, prob] of Object.entries(gases)) {
      cumulative += prob;
      if (rand <= cumulative) return gas as Particle["gas"];
    }
    return "hydrogen";
  }, [gases]);

  // Seed particles at position
  const seedParticles = useCallback(
    (x: number, y: number, count: number = 25) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 40;
        const tempFactor = 0.3 + temperature * 1.2;
        const gas = pickGasByMixture();
        newParticles.push({
          id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * tempFactor * 2,
          vy: (Math.random() - 0.5) * tempFactor * 2,
          gas,
          life: 1,
          maxLife: 200 + Math.random() * 300,
          size: 1.5 + Math.random() * 2.5,
        });
      }
      particlesRef.current = [...particlesRef.current, ...newParticles];
    },
    [temperature, pickGasByMixture],
  );

  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);

    // Background stars
    const bgStars = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1 + 0.4,
      a: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.015 + 0.003,
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // Ambient nebula glow
      const centerX = w * 0.5;
      const centerY = h * 0.45;
      const grad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(w, h) * 0.55,
      );

      const baseHue =
        (GAS_COLORS["hydrogen"].hue +
          (gases.helium / 100) * 20 +
          (gases.oxygen / 100) * 30 +
          hueShift) %
        360;
      grad.addColorStop(0, `hsla(${baseHue}, 70%, 35%, 0.12)`);
      grad.addColorStop(0.5, `hsla(${(baseHue + 30) % 360}, 60%, 25%, 0.06)`);
      grad.addColorStop(1, "hsla(0,0%,0%,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Background stars
      for (const s of bgStars) {
        s.a += s.sp;
        const alpha = 0.2 + Math.abs(Math.sin(s.a)) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw particles
      const gravFactor = gravity * 0.00008;
      const tempFactor = 0.4 + temperature * 0.8;
      const centerXForce = w / 2;
      const centerYForce = h / 2;

      particlesRef.current = particlesRef.current.filter((p) => {
        // Apply gravity toward center
        const dx = centerXForce - p.x;
        const dy = centerYForce - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        p.vx += (dx / dist) * gravFactor * tempFactor;
        p.vy += (dy / dist) * gravFactor * tempFactor;

        // Add some swirl
        p.vx += (dy / dist) * 0.0003 * tempFactor;
        p.vy -= (dx / dist) * 0.0003 * tempFactor;

        // Apply velocity with damping
        p.x += p.vx * tempFactor;
        p.y += p.vy * tempFactor;
        p.vx *= 0.995;
        p.vy *= 0.995;

        // Life decay
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) return false;

        // Draw particle
        const gasHue = (GAS_COLORS[p.gas].hue + hueShift) % 360;
        const alpha = p.life * 0.7;
        const size = p.size * (0.5 + p.life * 0.5);

        const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        pGrad.addColorStop(0, `hsla(${gasHue}, 90%, 75%, ${(alpha * 0.9).toFixed(3)})`);
        pGrad.addColorStop(0.4, `hsla(${gasHue}, 85%, 55%, ${(alpha * 0.5).toFixed(3)})`);
        pGrad.addColorStop(1, `hsla(${gasHue}, 80%, 40%, 0)`);

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      setParticleCount(particlesRef.current.length);

      rafRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [gravity, temperature, gases, hueShift]);

  // Mouse handlers for seeding
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsSeeding(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    seedParticles(x, y, 20);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSeeding) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    seedParticles(x, y, 8);
  };

  const handleMouseUp = () => setIsSeeding(false);

  const handleClear = () => {
    particlesRef.current = [];
  };

  const handleSave = () => {
    if (particleCount < 50) return;

    const canvas = canvasRef.current;
    let thumbnail: string | undefined;
    if (canvas) {
      thumbnail = canvas.toDataURL("image/webp", 0.3);
    }

    const nebula: SavedNebula = {
      id: `neb-${Date.now()}`,
      name: name.trim() || "Untitled Nebula",
      gases: { ...gases },
      gravity,
      temperature,
      particleCount,
      hueShift,
      createdAt: new Date().toLocaleString(),
      thumbnail,
    };
    setSaved((prev) => [nebula, ...prev]);
    setName("");
  };

  const handleDeleteSaved = (id: string) => {
    setSaved((prev) => prev.filter((n) => n.id !== id));
  };

  const canSave = particleCount >= 50;

  return (
    <main
      data-testid="nebulagarden-page"
      className="relative min-h-screen w-full overflow-x-hidden bg-[#05030f] text-white"
    >
      {/* Ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(168,85,247,0.1),transparent_55%)]"
      />

      {/* HERO */}
      <section
        data-testid="nebulagarden-hero"
        className="relative mx-auto max-w-6xl px-6 pt-20 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-cyan-200 backdrop-blur-md">
          <Orbit aria-hidden="true" className="h-3.5 w-3.5" />
          Chapter VII · The Stellar Nursery
        </div>
        <h1 className="mx-auto max-w-3xl bg-gradient-to-br from-white via-cyan-100 to-violet-300 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-6xl">
          Nebula Garden
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-cyan-100/70 sm:text-lg">
          Shape your own stellar nursery. Mix cosmic gases, tune gravity and
          temperature, then paint the void — watch particles swirl and bloom into
          luminous clouds. Name your nebula and save it to the garden gallery.
        </p>
      </section>

      {/* GARDEN */}
      <section
        data-testid="nebulagarden-console"
        className="relative mx-auto mt-12 grid max-w-6xl gap-6 px-6 pb-20 lg:grid-cols-[1.5fr_1fr]"
      >
        {/* Canvas */}
        <div
          data-testid="nebulagarden-canvas-wrap"
          className="relative min-h-[480px] overflow-hidden rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl"
        >
          <canvas
            ref={canvasRef}
            aria-label="Nebula canvas. Click and drag to seed particles."
            data-testid="nebulagarden-canvas"
            className="absolute inset-0 h-full w-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Live stats */}
          <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-200/80">
            <span
              aria-live="polite"
              className="inline-block h-2 w-2 rounded-full bg-cyan-400"
            />
            {isSeeding ? "Seeding..." : "Click to grow"}
          </div>
          <div
            aria-live="polite"
            className="pointer-events-none absolute right-5 top-5 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-mono text-white/70"
          >
            {particleCount.toLocaleString()} particles
          </div>

          {particleCount === 0 && (
            <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-white/50">
              Click and drag on the dark to seed your first cloud ✦
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5">
          <div
            data-testid="nebulagarden-controls"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <h2 className="text-lg font-semibold">Grow your nebula</h2>
            <p className="mt-1 text-sm text-white/60">
              Adjust gas mixture, gravity, and temperature.
            </p>

            {/* Gas mixture */}
            <div className="mt-5">
              <span
                id="gas-mix-label"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Gas mixture
              </span>
              <div
                role="group"
                aria-labelledby="gas-mix-label"
                className="space-y-2"
              >
                {(Object.keys(gases) as Array<keyof GasMixture>).map((gas) => (
                  <div key={gas} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        background: `hsl(${(GAS_COLORS[gas].hue + hueShift) % 360}, 80%, 60%)`,
                      }}
                      aria-hidden="true"
                    />
                    <label
                      htmlFor={`gas-${gas}`}
                      className="flex-1 text-xs text-white/70"
                    >
                      {GAS_COLORS[gas].label}
                    </label>
                    <input
                      id={`gas-${gas}`}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={gases[gas]}
                      onChange={(e) =>
                        setGases(normalizeGases(gas, Number(e.target.value)))
                      }
                      aria-label={`${GAS_COLORS[gas].label} proportion`}
                      data-testid={`nebulagarden-gas-${gas}`}
                      className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-white/20 accent-cyan-400"
                    />
                    <span
                      className="w-8 text-right text-xs font-mono text-white/80"
                      aria-live="polite"
                    >
                      {gases[gas]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gravity */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <label
                  htmlFor="nebulagarden-gravity"
                  className="font-medium text-white/80"
                >
                  Gravity
                </label>
                <span className="font-mono text-cyan-200" aria-live="polite">
                  {(gravity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wind
                  aria-hidden="true"
                  className="h-4 w-4 text-white/50"
                />
                <input
                  id="nebulagarden-gravity"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={gravity}
                  onChange={(e) => setGravity(Number(e.target.value))}
                  aria-label="Gravity strength"
                  data-testid="nebulagarden-gravity-slider"
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-cyan-500/30 to-violet-500/30 accent-violet-400"
                />
              </div>
            </div>

            {/* Temperature */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <label
                  htmlFor="nebulagarden-temp"
                  className="font-medium text-white/80"
                >
                  Temperature
                </label>
                <span className="font-mono text-cyan-200" aria-live="polite">
                  {(temperature * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer
                  aria-hidden="true"
                  className="h-4 w-4 text-white/50"
                />
                <input
                  id="nebulagarden-temp"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  aria-label="Temperature level"
                  data-testid="nebulagarden-temp-slider"
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gradient-to-r from-blue-500/30 to-rose-500/30 accent-rose-400"
                />
              </div>
            </div>

            {/* Hue shift */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <label
                  htmlFor="nebulagarden-hue"
                  className="font-medium text-white/80"
                >
                  Hue shift
                </label>
                <span className="font-mono text-cyan-200" aria-live="polite">
                  {hueShift}°
                </span>
              </div>
              <input
                id="nebulagarden-hue"
                type="range"
                min={0}
                max={360}
                step={15}
                value={hueShift}
                onChange={(e) => setHueShift(Number(e.target.value))}
                aria-label="Hue shift"
                data-testid="nebulagarden-hue-slider"
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-red-500/40 via-green-500/40 to-blue-500/40 accent-cyan-300"
              />
            </div>

            {/* Name */}
            <div className="mt-5">
              <label
                htmlFor="nebulagarden-name"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Nebula name
              </label>
              <input
                id="nebulagarden-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Stellar Rose"
                aria-label="Nebula name"
                data-testid="nebulagarden-name-input"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan-300/50"
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={particleCount === 0}
                aria-label="Clear the canvas"
                data-testid="nebulagarden-clear-button"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-colors hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Clear
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                aria-label="Save nebula to gallery"
                data-testid="nebulagarden-save-button"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(56,189,248,0.8)] transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <Save aria-hidden="true" className="h-4 w-4" />
                Plant in Garden
              </button>
            </div>
            {!canSave && (
              <p className="mt-2 text-center text-xs text-white/40">
                Seed at least 50 particles to save your nebula.
              </p>
            )}
          </div>

          {/* Guide */}
          <div
            data-testid="nebulagarden-guide"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/80">
              How to grow
            </h2>
            <ol className="space-y-2 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="font-mono text-cyan-300">1.</span>
                Tune the <strong className="text-white">gas mixture</strong> —
                each gas adds its own hue.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-cyan-300">2.</span>
                Adjust <strong className="text-white">gravity</strong> and{" "}
                <strong className="text-white">temperature</strong> to shape the
                swirl.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-cyan-300">3.</span>
                Click and drag to <strong className="text-white">seed particles</strong> — watch them bloom.
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-cyan-300">4.</span>
                Name it and <strong className="text-white">Plant in Garden</strong>.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section
        data-testid="nebulagarden-gallery"
        className="relative mx-auto max-w-6xl px-6 pb-28"
      >
        <div className="mb-3 flex items-center gap-2">
          <Flower2 aria-hidden="true" className="h-4 w-4 text-cyan-300" />
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-cyan-300/70">
            The garden gallery
          </p>
        </div>
        <h2 className="mb-8 text-3xl font-semibold sm:text-4xl">
          Nebulae grown so far
        </h2>

        {saved.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <Sparkles
              aria-hidden="true"
              className="mx-auto mb-4 h-8 w-8 text-white/30"
            />
            <p className="text-white/50">
              The garden is empty. Grow your first nebula above.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((n) => (
              <div
                key={n.id}
                data-testid={`nebulagarden-card-${n.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-[#070414]">
                  {n.thumbnail ? (
                    <img
                      src={n.thumbnail}
                      alt={`Preview of ${n.name}`}
                      className="h-full w-full object-cover opacity-90"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background: `radial-gradient(circle at 50% 45%, hsla(${(GAS_COLORS["hydrogen"].hue + n.hueShift) % 360}, 70%, 40%, 0.25), transparent 60%)`,
                      }}
                    />
                  )}
                  {/* Gas swatches */}
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {Object.entries(n.gases).map(([gas, val]) =>
                      val > 0 ? (
                        <span
                          key={gas}
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: `hsl(${(GAS_COLORS[gas].hue + n.hueShift) % 360}, 75%, 60%)`,
                          }}
                        />
                      ) : null,
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="p-5">
                  <div className="mb-1 flex items-center gap-2">
                    <Sparkles
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-cyan-300"
                    />
                    <h3 className="text-base font-semibold text-white">
                      {n.name}
                    </h3>
                  </div>
                  <p className="text-xs text-white/50">
                    {n.particleCount.toLocaleString()} particles · G:{" "}
                    {(n.gravity * 100).toFixed(0)}% · T:{" "}
                    {(n.temperature * 100).toFixed(0)}% · {n.createdAt}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeleteSaved(n.id)}
                    aria-label={`Remove ${n.name} from the garden`}
                    data-testid={`nebulagarden-delete-${n.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-rose-300/40 hover:text-rose-200"
                  >
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
