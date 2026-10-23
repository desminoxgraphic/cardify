/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // Small-height phones (e.g. 360x640) and phones with the keyboard open
        short: { raw: '(max-height: 700px)' },
      },
      colors: {
        brand: {
          blue: '#2563EB',
          cyan: '#0EA5E9',
          navy: '#0F172A',
          bg: '#F8FAFC',
          secondary: '#64748B',
          border: '#E2E8F0',
          success: '#16A34A',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
