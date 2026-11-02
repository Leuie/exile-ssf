/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        zorbble: {
          bg: '#0f172a',
          surface: '#1a1a2e',
          surfaceLight: '#2d2d44',
          border: '#2d2d44',
          borderLight: '#3f3f5f',
          primary: '#6366f1',
          primaryLight: '#818cf8',
          primaryDark: '#4f46e5',
          secondary: '#8b5cf6',
          secondaryLight: '#a78bfa',
          secondaryDark: '#7c3aed',
          gold: '#fbbf24',
          error: '#ef4444',
          success: '#10b981',
          cyan: '#06b6d4'
        },
        poe: {
          darkest: '#0f172a',
          darker: '#13182b',
          dark: '#1a1a2e',
          card: '#1a1a2e',
          cardElevated: '#2d2d44',
          cardLight: '#ffffff',
          border: '#2d2d44',
          borderLight: '#e2e8f0',
          gold: '#fbbf24',
          goldLight: '#fde68a',
          crimson: '#ef4444',
          arcane: '#8b5cf6',
          ethereal: '#6366f1',
          emerald: '#10b981',
          unique: '#f59e0b',
          rare: '#facc15',
          magic: '#818cf8',
          gem: '#06b6d4',
          currency: '#e2e8f0'
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        poe: ['Cinzel', 'Trajan Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'gaming-glow': '0 0 25px rgba(99, 102, 241, 0.35)',
        'gaming-glow-purple': '0 0 25px rgba(139, 92, 246, 0.35)',
        'gaming-glow-gold': '0 0 25px rgba(251, 191, 36, 0.35)',
      }
    },
  },
  plugins: [],
}
