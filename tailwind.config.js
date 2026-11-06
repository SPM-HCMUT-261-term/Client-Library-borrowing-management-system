/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#17645F',
          tealHover: '#12504C',
          ink: '#203B3B',
          slate: '#687573',
          canvas: '#F7F6F2',
          beige: '#EEEBE3',
          mint: '#E7EFEB',
          amberSurface: '#F4EDDE',
          amberBorder: '#E7D9BD',
          amberText: '#8B6324',
          border: '#DCE2DC',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
