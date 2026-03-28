/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'risk-low': '#10b981',
        'risk-med': '#f59e0b',
        'risk-high': '#ef4444',
      }
    },
  },
  plugins: [],
}
