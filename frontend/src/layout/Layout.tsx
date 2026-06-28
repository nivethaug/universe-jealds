import { Outlet } from "react-router-dom";
import Navbar from "@/layout/Navbar";

/**
 * Layout — cosmic shell for the Universe Archive.
 * Renders a floating glass Navbar and a full-bleed scrollable main
 * where each page paints its own canvas-driven scene.
 */
const Layout = () => {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#05030f]">
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
