import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/layout/Layout";
import Grandarchive from "@/pages/Grandarchive";
import Worldsofknowledge from "@/pages/Worldsofknowledge";
import Memoryconstellations from "@/pages/Memoryconstellations";
import Ideaforge from "@/pages/Ideaforge";
import Cosmicmap from "@/pages/Cosmicmap";
import Constellationbuilder from "@/pages/Constellationbuilder";
import Nebulagarden from "@/pages/Nebulagarden";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Grandarchive />} />
                <Route path="/worldsofknowledge" element={<Worldsofknowledge />} />
                <Route path="/memoryconstellations" element={<Memoryconstellations />} />
                <Route path="/ideaforge" element={<Ideaforge />} />
                <Route path="/cosmicmap" element={<Cosmicmap />} />
                <Route path="/constellationbuilder" element={<Constellationbuilder />} />
                <Route path="/nebulagarden" element={<Nebulagarden />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
