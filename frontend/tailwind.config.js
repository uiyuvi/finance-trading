/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        varsity: {
          blue: '#0047b3',
          light: '#eff6ff',
          accent: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}
