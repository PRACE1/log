/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        surface: {
          primary: 'var(--ods-bg-primary)',
          secondary: 'var(--ods-bg-secondary)',
          tertiary: 'var(--ods-bg-tertiary)'
        },
        border: {
          DEFAULT: 'var(--tk-border)',
          subtle: 'var(--ods-border)',
          strong: 'var(--ods-border-strong)'
        },
        text: {
          primary: 'var(--ods-text-primary)',
          secondary: 'var(--ods-text-secondary)',
          tertiary: 'var(--ods-text-tertiary)'
        },
        // Ported from ui-kit (shadcn-style semantic tokens + brand ink/paper).
        primary: 'var(--tk-primary)',
        'primary-foreground': 'var(--tk-primary-foreground)',
        secondary: 'var(--tk-secondary)',
        'secondary-foreground': 'var(--tk-secondary-foreground)',
        muted: 'var(--tk-muted)',
        'muted-foreground': 'var(--tk-muted-foreground)',
        accent: 'var(--tk-accent)',
        'accent-foreground': 'var(--tk-accent-foreground)',
        destructive: 'var(--tk-destructive)',
        ring: 'var(--tk-ring)',
        input: 'var(--tk-input)',
        background: 'var(--tk-background)',
        foreground: 'var(--tk-foreground)',
        card: 'var(--tk-card)',
        'card-foreground': 'var(--tk-card-foreground)',
        popover: 'var(--tk-popover)',
        'popover-foreground': 'var(--tk-popover-foreground)',
        ink: '#0D2A4C',
        'ink-muted': 'oklch(0.32 0.012 72)',
        paper: 'oklch(0.962 0.008 92)',
        'paper-muted': 'oklch(0.91 0.01 92)'
      },
      borderRadius: {
        // Matches ui-kit: --radius-md used by button xs/sm/icon sizes.
        md: 'var(--radius-md)'
      },
      fontFamily: {
        sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif']
      },
      keyframes: {
        'lk-cycle': {
          '0%': { transform: 'rotateY(90deg)', opacity: '0.4' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' }
        }
      },
      animation: {
        'lk-cycle': 'lk-cycle 0.28s ease-out'
      }
    }
  },
  plugins: []
}
