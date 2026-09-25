/**
 * Screens mirror the LESS breakpoints as raw INCLUSIVE max-width queries
 * (`max768:` === `@media (max-width: 768px)`), because the whole legacy
 * stylesheet is max-width based; Tailwind's own `max-*` variants subtract
 * 0.02px and would flip behavior at exactly 768px (iPad portrait).
 * `min901`/`min769` are the matching desktop counterparts.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: ['wl-toast--error', 'wl-toast--success', 'wl-toast--warning'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        surface: '#F8F8F6',
        ink: {
          DEFAULT: '#111111',
          2: '#6B6B6B',
        },
        line: {
          DEFAULT: '#E8E8E5',
          strong: '#C9C9C5',
          dark: '#9C9C97',
        },
        skel: {
          base: '#DCDCD7',
          hi: '#ECECE7',
        },
        accent: '#0F4C5C',
        sale: '#B91C1C',
        danger: {
          DEFAULT: '#C52327',
          bg: '#FFF5F5',
          border: '#F5C2C7',
        },
        success: {
          DEFAULT: '#1E6E33',
          bg: '#F2F7F2',
          border: '#C7E0C7',
        },
        warning: '#b45309',
      },
      fontFamily: {
        sans: ['Inter', 'Inter Fallback', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Lora', 'Lora Fallback', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': 'var(--fs-2xs)',
        xs: 'var(--fs-xs)',
        sm: 'var(--fs-sm)',
        13: 'var(--fs-13)',
        base: 'var(--fs-base)',
        md: 'var(--fs-md)',
        lg: 'var(--fs-lg)',
        xl: 'var(--fs-xl)',
        '2xl': 'var(--fs-2xl)',
        '3xl': 'var(--fs-3xl)',
        '4xl': 'var(--fs-4xl)',
        hero: 'var(--fs-hero)',
      },
      lineHeight: {
        tight: '1.15',
        snug: '1.3',
        base: '1.5',
        relaxed: '1.55',
      },
      letterSpacing: {
        eyebrow: '0.14em',
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        lg: '6px',
        pill: '999px',
      },
      maxWidth: {
        container: '1320px',
      },
      spacing: {
        gutter: 'clamp(16px, 3vw, 40px)',
      },
      transitionDuration: {
        fast: '120ms',
        med: '200ms',
      },
      /* One keyframe per distinct motion; the `animation` entries below give
         each usage its own timing. Overlays, drawers and modals all shared the
         same fade/pop/pulse curves, so they share the keyframe too. */
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'drop-in': {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'drop-out': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(-12px)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        spin: 'spin 0.7s linear infinite',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        scrim: 'fade-in 200ms ease',
        'scrim-out': 'fade-out 200ms ease forwards',
        overlay: 'drop-in 220ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        'overlay-out': 'drop-out 200ms cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards',
        drawer: 'slide-in-right 240ms ease',
        modal: 'pop-in 240ms ease',
        'modal-quick': 'pop-in 200ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        'scrim-quick': 'fade-in 160ms ease',
        'skeleton-pulse': 'pulse-soft 1.4s ease-in-out infinite',
        'search-pulse': 'pulse-soft 1.2s ease-in-out infinite',
      },
    },
    /* Descending max-widths: narrower variants are emitted later in the
       stylesheet and win when several match, mirroring the LESS cascade
       (desktop rules first, tighter mobile overrides after). */
    screens: {
      max1024: { raw: '(max-width: 1024px)' },
      max900: { raw: '(max-width: 900px)' },
      max768: { raw: '(max-width: 768px)' },
      max720: { raw: '(max-width: 720px)' },
      max640: { raw: '(max-width: 640px)' },
      max600: { raw: '(max-width: 600px)' },
      max480: { raw: '(max-width: 480px)' },
      max420: { raw: '(max-width: 420px)' },
      min421: { raw: '(min-width: 421px)' },
      min601: { raw: '(min-width: 601px)' },
      min641: { raw: '(min-width: 641px)' },
      min769: { raw: '(min-width: 769px)' },
      min901: { raw: '(min-width: 901px)' },
    },
  },
  plugins: [],
};
