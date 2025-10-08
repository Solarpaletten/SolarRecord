import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Solar Brand Colors
        solar: {
          blue: '#2563eb',      // Primary brand color
          blueLight: '#3b82f6', // Hover states
          blueDark: '#1e40af',  // Active states
          gray: '#f5f6fa',      // Background
          grayLight: '#fafbfc', // Lighter backgrounds
          grayMedium: '#e5e7eb',// Borders
          dark: '#1e293b',      // Dark text
          darkLight: '#334155', // Secondary text
        },
        // Extended palette for UI states
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        'gradient-solar': 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'solar': '0 4px 14px 0 rgba(37, 99, 235, 0.15)',
        'solar-lg': '0 10px 40px 0 rgba(37, 99, 235, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
};

export default config;