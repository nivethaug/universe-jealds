import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, Sparkles } from "lucide-react";

type NavItem = {
  to: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Grandarchive" },
  { to: "/worldsofknowledge", label: "Worlds of Knowledge" },
  { to: "/memoryconstellations", label: "Memory Constellations" },
  { to: "/ideaforge", label: "The Idea Forge" },
  { to: "/cosmicmap", label: "Cosmic Map" },
  { to: "/constellationbuilder", label: "Constellation Builder" },
];

/**
 * Navbar — responsive cosmic navigation.
 * Glassy floating top bar on desktop with visible text links,
 * a mobile sheet menu, and a single-child wrapper around link
 * contents to satisfy react-router-dom's element expectations.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl md:px-6"
      >
        <Link
          to="/"
          data-testid="navbar-brand"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-white"
        >
          <span className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-violet-300" />
            The Universe Archive
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`navbar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 text-white shadow-[0_0_24px_-6px_rgba(168,85,247,0.8)]"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          data-testid="navbar-toggle"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white md:hidden"
        >
          {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div
          data-testid="navbar-mobile-menu"
          className="pointer-events-auto mx-auto mt-2 block max-w-6xl rounded-2xl border border-white/10 bg-black/70 p-2 backdrop-blur-xl md:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`navbar-mobile-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
