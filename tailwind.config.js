/** @type {import('tailwindcss').Config} */
// Design tokens for boostov.ma ("Gold Lacquer"). Keep in sync with app/globals.css.
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
        ink: {
          950: '#0A0A0B',
          900: '#111113',
          800: '#1A1A1D',
          700: '#26262B',
          600: '#3A3A41',
          500: '#5B5B66',
          400: '#8A8A96',
          300: '#B9B9C2',
          200: '#DCDCE2',
          100: '#EEEEF2',
        },
        ivory: {
          DEFAULT: '#FBF8F1',
          50: '#FFFDF8',
          100: '#FBF8F1',
          200: '#F3EEE2',
          300: '#E7E0CF',
        },
        gold: {
          50: '#FFF8E1',
          100: '#FFEDB8',
          200: '#FFE7A0',
          300: '#FAD46B',
          400: '#F5C542',
          500: '#E5A823',
          600: '#C8901A',
          700: '#9A6A0E',
          800: '#6E4A08',
        },
        success: { 50: '#ECFDF3', 500: '#22C55E', 600: '#16A34A', 700: '#15803D' },
        danger: { 50: '#FEF2F2', 200: '#FECACA', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C' },
        brand: {
          blue: '#2563EB',
          navy: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'var(--font-arabic)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 11vw, 3.25rem)', { lineHeight: '0.98', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-lg': ['clamp(2.125rem, 9.4vw, 2.75rem)', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '800' }],
        'display-md': ['clamp(1.75rem, 7.6vw, 2.125rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '800' }],
        eyebrow: ['0.75rem', { lineHeight: '1', letterSpacing: '0.2em', fontWeight: '700' }],
      },
      borderRadius: {
        card: '24px',
        sheet: '32px',
        button: '20px',
      },
      boxShadow: {
        lift: '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 0 rgba(17,17,19,0.06), 0 14px 28px -18px rgba(17,17,19,0.35)',
        float: '0 30px 60px -24px rgba(0,0,0,0.75)',
        sheet: '0 -24px 48px -24px rgba(0,0,0,0.6)',
        panel: '0 1px 0 rgba(17,17,19,0.04), 0 12px 32px -20px rgba(17,17,19,0.25)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
