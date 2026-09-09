import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Aula from "./pages/Aula.tsx";
import Istruttore from "./pages/Istruttore.tsx";
import IstruttoreModulo from "./pages/IstruttoreModulo.tsx";
import PercheUnCorso from "./pages/PercheUnCorso.tsx";
import AulaModulo1 from "./pages/AulaModulo1.tsx";
import AulaModulo2 from "./pages/AulaModulo2.tsx";
import AulaModulo3 from "./pages/AulaModulo3.tsx";
import AulaModulo4 from "./pages/AulaModulo4.tsx";
import AulaModulo5 from "./pages/AulaModulo5.tsx";
import AulaModulo6 from "./pages/AulaModulo6.tsx";
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
          <Route path="/istruttore/:slug" element={<IstruttoreModulo />} />
          <Route
            path="/modulo/perche-un-corso"
            element={<PercheUnCorso />}
          />
          <Route
            path="/aula/modulo-1-perche-un-corso"
            element={<AulaModulo1 />}
          />
          <Route
            path="/aula/modulo-2-sicurezza-e-rischio"
            element={<AulaModulo2 />}
          />
          <Route
            path="/aula/modulo-3-il-conducente"
            element={<AulaModulo3 />}
          />
          <Route
            path="/aula/modulo-4-il-veicolo"
            element={<AulaModulo4 />}
          />
          <Route
            path="/aula/modulo-5-dinamica-del-veicolo"
            element={<AulaModulo5 />}
          />


          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
