/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require('nativewind/preset')],  // Add this line!
  theme: {
    extend: {
      colors: {
        primary: '#14B8A6',
        primaryDark: '#0D9488',
        expense: '#EF4444',
        income: '#22C55E',
        warning: '#F59E0B',
        background: '#F8FAFC',
        card: '#FFFFFF',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        border: '#E5E7EB',
      }
    },
  },
  plugins: [],
}