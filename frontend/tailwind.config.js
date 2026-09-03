/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        portal: {
          bg: '#0b1326',
          card: '#0a0f1d',
          border: 'rgba(255,255,255,0.1)',
          text: '#dae2fd',
          muted: '#c3c6d7',
          accent: '#ffb95f',
          link: '#b4c5ff',
          primary: '#2563eb',
        },
      },
    },
  },
  plugins: [],
}
