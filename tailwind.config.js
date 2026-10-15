/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Emerald & Teal Glassmorphism
        'bg-dark': '#041510',
        'card': '#08251d',
        'card-hover': '#0a2f26',
        'accent': '#10b981',
        'accent-glow': '#34d399',
        'border-teal': 'rgba(20, 83, 65, 0.6)',
      },
      fontFamily: {
        'tajawal': ['Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 40px rgba(16, 185, 129, 0.15)',
        'glow-lg': '0 0 80px rgba(16, 185, 129, 0.25)',
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}