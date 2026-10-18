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
        fluent: {
          bg: '#f3f4f6',
          sidebar: 'rgba(243, 244, 246, 0.95)',
          surface: '#ffffff',
          surfaceHover: '#f5f6f8',
          surfaceActive: '#edeef2',
          border: 'rgba(0, 0, 0, 0.08)',
          borderSubtle: 'rgba(0, 0, 0, 0.05)',
          blue: '#0067c0',
          blueHover: '#1879cd',
          blueLight: '#e5f1fb',
          blueActive: '#cce4f7',
          text: '#1a1a1a',
          textSecondary: '#616161',
          textMuted: '#8a8a8a',
          darkBg: '#1f1f1f',
          darkSurface: '#2b2b2b',
          darkBorder: 'rgba(255, 255, 255, 0.08)',
          darkText: '#f3f3f3',
          darkTextSecondary: '#a0a0a0',
        }
      },
      fontFamily: {
        sans: ['Segoe UI Variable', 'Segoe UI', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'fluent': '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'fluent-lg': '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'fluent-flyout': '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
