import ScrollProgress from "./componants/ScrollProgress.jsx";
import RevealOnScroll from "./componants/RevealOnScroll.jsx";
import SiteHeader from "./componants/SiteHeader.jsx";
import HeroSection from "./componants/HeroSection.jsx";
import AboutSection from "./componants/AboutSection.jsx";
import ProjectsSection from "./componants/ProjectsSection.jsx";
import SkillsSection from "./componants/SkillsSection.jsx";
import ProcessSection from "./componants/ProcessSection.jsx";
import ContactSection from "./componants/ContactSection.jsx";
import SiteFooter from "./componants/SiteFooter.jsx";
import CustomCursor from "./componants/CustomCursor.jsx";
import AmbientCodeBackground from "./componants/AmbientCodeBackground.jsx";
import { lazy, Suspense, useEffect } from "react";
import PortfolioContentProvider from "./componants/PortfolioContentProvider.jsx";

const AdminApp = lazy(() => import("./componants/admin/AdminApp.jsx"));

function OldAdminRouteRedirect() {
  useEffect(() => {
    window.location.replace("/adminportalofjc");
  }, []);
  return <div className="admin-loading">Opening admin…</div>;
}

function PublicPortfolio() {
  return (
    <>
      <AmbientCodeBackground />
      <CustomCursor />
      <ScrollProgress />
      <RevealOnScroll />
      <SiteHeader />

      <main>
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ProcessSection />
        <ContactSection />
      </main>

      <SiteFooter />
    </>
  );
}

function App() {
  const route = window.location.pathname.replace(/\/+$/, "");
  if (route === "/adJC") return <OldAdminRouteRedirect />;
  const isAdminRoute = route === "/adminportalofjc";
  if (isAdminRoute) {
    return <Suspense fallback={<div className="admin-loading">Opening admin…</div>}><AdminApp /></Suspense>;
  }
  return <PortfolioContentProvider><PublicPortfolio /></PortfolioContentProvider>;
}

export default App;
