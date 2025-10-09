/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
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
      },
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        ambient: "0 20px 45px -15px rgba(15, 157, 88, 0.35)",
        elevated: "0 16px 40px -12px rgba(31, 79, 139, 0.35)",
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
      },
      animation: {
        pulseGlow: "pulseGlow 3s infinite",
        float: "float 6s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
