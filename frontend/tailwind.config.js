/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,営業,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        railway: {
          dark: '#0f172a',      // slate-900
          card: '#1e293b',      // slate-800
          border: '#334155',    // slate-700
          text: '#f8fafc',      // slate-50
          muted: '#94a3b8',     // slate-400
          primary: '#3b82f6',   // blue-500
          accent: '#f59e0b',    // amber-500
          success: '#10b981',   // emerald-500
          warning: '#f97316',   // orange-500
          danger: '#ef4444',    // red-500
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
