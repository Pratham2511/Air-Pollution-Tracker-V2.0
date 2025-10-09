import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeading } from '../common/SectionHeading';
import { CitizenAuthForm } from '../auth/CitizenAuthForm';
import { GovernmentAuthForm } from '../auth/GovernmentAuthForm';

const tabs = [
  { id: 'citizen', label: 'Citizen Access', variant: 'user' },
  { id: 'government', label: 'Government Access', variant: 'gov' },
];

export const AuthTabs = () => {
  const [activeTab, setActiveTab] = useState('citizen');

  const gradientClass = activeTab === 'citizen' ? 'user-gradient' : 'gov-gradient';

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div className="space-y-10">
            <SectionHeading
              eyebrow="DUAL ACCESS"
              title="Secure gateways tailored for citizens and government agencies"
              description="We combine accessible user onboarding with rigorous, domain-validated government authentication including OTP-based approvals and region-specific controls."
              alignment="left"
            />
            <ul className="grid sm:grid-cols-2 gap-4 text-slate-600 text-sm">
              <li className="flex gap-3 items-center">
                <span className="h-10 w-10 rounded-full bg-user-accent/15 text-user-accent flex items-center justify-center font-semibold">OTP</span>
                Citizen email OTP verification with 5-minute expiry
              </li>
              <li className="flex gap-3 items-center">
                <span className="h-10 w-10 rounded-full bg-gov-accent/15 text-gov-accent flex items-center justify-center font-semibold">RLS</span>
                Supabase Row Level Security for data isolation
              </li>
              <li className="flex gap-3 items-center">
                <span className="h-10 w-10 rounded-full bg-user-accent/15 text-user-accent flex items-center justify-center font-semibold">Geo</span>
                Location-aware dashboards and alerts
              </li>
              <li className="flex gap-3 items-center">
                <span className="h-10 w-10 rounded-full bg-gov-accent/15 text-gov-accent flex items-center justify-center font-semibold">Gov</span>
                Strict domain validation for .gov and equivalent domains
              </li>
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-br from-user-accent/10 via-white to-gov-accent/10 blur-3xl" />
            <div className="relative glass-panel">
              <div className="flex p-2 bg-slate-100 rounded-full mx-6 mt-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="p-8"
                >
                  <div className={`rounded-2xl p-[1px] ${gradientClass}`}>
                    <div className="rounded-2xl bg-white p-8">
                      {activeTab === 'citizen' ? <CitizenAuthForm /> : <GovernmentAuthForm />}
                      <p className="mt-6 text-xs text-slate-400 text-center">
                        Authentication powered by Supabase • Outlook mailer `Air-Pollution-Tracker-Security-Team`
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
