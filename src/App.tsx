import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Aula from "./pages/Aula.tsx";
import Istruttore from "./pages/Istruttore.tsx";
import PercheLaGuidaSicura from "./pages/PercheLaGuidaSicura.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/aula" element={<Aula />} />
          <Route path="/istruttore" element={<Istruttore />} />
          <Route
            path="/modulo/perche-la-guida-sicura"
            element={<PercheLaGuidaSicura />}
          />
          <Route
            path="/aula/perche-la-guida-sicura"
            element={<PercheLaGuidaSicura />}
          />
          {/* Legacy redirect */}
          <Route
            path="/perche-la-guida-sicura"
            element={<Navigate to="/modulo/perche-la-guida-sicura" replace />}
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
