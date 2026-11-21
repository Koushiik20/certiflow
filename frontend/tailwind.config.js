/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          dark: '#0B1E36',     // Deep government navy
          primary: '#153E75',  // Classic official blue
          accent: '#2B6CB0',   // Active blue
          light: '#F0F4F8',    // Light background grey-blue
          subtle: '#E2E8F0',   // Subtle border
          success: '#1B8755',  // Formal green
          warning: '#C05621',  // Amber warning
          danger: '#C53030',   // Red alert
        }
      }
    },
  },
  plugins: [],
}

