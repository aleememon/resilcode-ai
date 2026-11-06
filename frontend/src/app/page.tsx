import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/sections/Hero";
import { CoverageRibbon } from "@/components/sections/CoverageRibbon";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FeatureGrid } from "@/components/sections/FeatureGrid";
import { FinalCta } from "@/components/sections/FinalCta";
import { AuthNotice } from "@/components/ui/AuthNotice";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="content" className="w-full bg-surface-container-lowest pt-20">
        <Suspense fallback={null}>
          <AuthNotice />
        </Suspense>
        <Hero />
        <CoverageRibbon />
        <HowItWorks />
        <FeatureGrid />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
