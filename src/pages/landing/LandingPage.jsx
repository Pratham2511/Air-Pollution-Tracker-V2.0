import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../../components/landing/HeroSection';
import { AboutSection } from '../../components/landing/AboutSection';
import { AuthTabs } from '../../components/landing/AuthTabs';
import { useAuth } from '../../context/AuthContext';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) {
      return;
    }
    const role = profile?.role ?? user.user_metadata?.role ?? null;
    if (role === 'government') {
      navigate('/gov', { replace: true });
    } else if (role === 'citizen') {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, navigate, profile?.role, user]);

  return (
    <main
      id="main-content"
      tabIndex="-1"
      className="min-h-screen bg-gradient-to-br from-user-muted via-white to-gov-muted"
    >
      <HeroSection />
      <AboutSection />
      <AuthTabs />
    </main>
  );
};

export default LandingPage;
