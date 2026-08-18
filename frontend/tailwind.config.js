/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#4F46E5', light: '#818CF8', dark: '#3730A3', faint: '#EEF2FF' },
        positive: { DEFAULT: '#16A34A', light: '#BBF7D0', faint: '#F0FDF4' },
        negative: { DEFAULT: '#E11D48', light: '#FDA4AF', faint: '#FFF1F2' },
        warning:  { DEFAULT: '#F59E0B', light: '#FDE68A', faint: '#FFFBEB' },
        surface:  '#FFFFFF',
        canvas:   '#F8FAFC',
        border:   '#E2E8F0',
        ink:      '#0F172A',
        muted:    '#64748B',
        sidebar:  '#0F172A',
      },
      borderRadius: {
        card: '12px',
        control: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
      },
    },
  },
  plugins: [],
}
