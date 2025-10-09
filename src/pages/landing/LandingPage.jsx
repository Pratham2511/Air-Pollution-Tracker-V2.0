import { HeroSection } from '../../components/landing/HeroSection';
import { AboutSection } from '../../components/landing/AboutSection';
import { AuthTabs } from '../../components/landing/AuthTabs';

export const LandingPage = () => (
  <main className="min-h-screen bg-gradient-to-br from-user-muted via-white to-gov-muted">
    <HeroSection />
    <AboutSection />
    <AuthTabs />
  </main>
);
