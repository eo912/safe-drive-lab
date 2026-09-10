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
import AulaModulo7 from "./pages/AulaModulo7.tsx";
import AulaModulo8 from "./pages/AulaModulo8.tsx";
import NotFound from "./pages/NotFound.tsx";
import { useEditModeHotkey } from "@/lib/editMode";

const queryClient = new QueryClient();

const App = () => {
  useEditModeHotkey();
  return (
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
          <Route
            path="/aula/modulo-6-tecniche-di-guida"
            element={<AulaModulo6 />}
          />
          <Route
            path="/aula/modulo-7-guida-professionale"
            element={<AulaModulo7 />}
          />
          <Route
            path="/aula/modulo-8-applicazione-est"
            element={<AulaModulo8 />}
          />


          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
