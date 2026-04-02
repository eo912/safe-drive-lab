import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MethodSection from "@/components/MethodSection";
import ExperienceSection from "@/components/ExperienceSection";
import ModulesSection from "@/components/ModulesSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <MethodSection />
      <ExperienceSection />
      <ModulesSection />
      <FooterSection />
    </div>
  );
};

export default Index;
