/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        13: '3.25rem',
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
        34: '8.5rem',
      },
      colors: {
        "aqi-good": "#31d17c",
        "aqi-moderate": "#ffce54",
        "aqi-unhealthy": "#ff8a5b",
        "aqi-very-unhealthy": "#d9534f",
        "aqi-hazardous": "#6f1a07",
        "gov-primary": "#1f4f8b",
        "gov-accent": "#2c82d4",
        "gov-muted": "#e2ecf6",
        "user-primary": "#0f9d58",
        "user-accent": "#34a853",
        "user-muted": "#e7f6ed",
        "surface-elevated": "#ffffff",
        "surface-muted": "#eff6ff",
        "ink-subtle": "#64748b",
        "ink-contrast": "#0f172a",
      },
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        ambient: "0 20px 45px -15px rgba(15, 157, 88, 0.35)",
        elevated: "0 16px 40px -12px rgba(31, 79, 139, 0.35)",
        focus: "0 0 0 4px rgba(44, 130, 212, 0.25)",
        toast: "0 28px 60px -28px rgba(15, 23, 42, 0.55)",
      },
      borderRadius: {
        '4xl': '2.5rem',
        '5xl': '3.5rem',
      },
      backgroundImage: {
        'mesh-soft': 'radial-gradient(circle at 5% 0%, rgba(15,157,88,0.18), transparent 45%), radial-gradient(circle at 100% 35%, rgba(31,79,139,0.15), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.95), rgba(228,241,255,0.75))',
        'gradient-hero': 'radial-gradient(circle at top left, rgba(52,168,83,0.35), rgba(31,79,139,0))',
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(52, 168, 83, 0.35)" },
          "70%": { boxShadow: "0 0 0 20px rgba(52, 168, 83, 0)" },
        },
        float: {
          "0%": { transform: "translateY(0px)" },
          "100%": { transform: "translateY(-12px)" },
        },
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translate3d(0, 12px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 3s infinite",
        float: "float 6s ease-in-out infinite alternate",
        fadeSlideUp: "fadeSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.8s linear infinite",
      },
      transitionTimingFunction: {
        snappy: 'cubic-bezier(0.22, 1, 0.36, 1)',
        gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      transitionDuration: {
        0: '0ms',
        250: '250ms',
        400: '400ms',
      },
      blur: {
        28: '28px',
      },
    },
  },
  plugins: [],
};
