import theme from '../tailwind.config.js';

/**
 * The editor embeds host storefront components (Header, ProductsCarousel,
 * NewsletterForm, ContactForm, Category preview…) whose Tailwind classes live
 * in the theme's `src/`. Reuse the theme's `theme`/`corePlugins`/`safelist`
 * verbatim, widen `content` to scan both the host source and the editor app,
 * and add the editor's own `e-*` design tokens so the editor UI itself can be
 * expressed as Tailwind utilities (colors prefixed `e-` to stay clear of the
 * storefront palette).
 */
export default {
  ...theme,
  content: [
    '../src/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
    './packages/**/*.{js,jsx}',
  ],
  theme: {
    ...theme.theme,
    extend: {
      ...theme.theme.extend,
      colors: {
        ...theme.theme.extend.colors,
        e: {
          bg: '#F8F8F6',
          surface: '#FFFFFF',
          'surface-alt': '#F8F8F6',
          'surface-hover': '#F2F2EF',
          'surface-hover-strong': 'rgba(15, 23, 42, 0.08)',
          'surface-sel': '#F2F2EF',
          border: '#E8E8E5',
          'border-strong': '#D8D8D4',
          text: '#111111',
          'text-muted': '#6B6B6B',
          'text-soft': '#9A9A95',
          'text-hover': '#262626',
          primary: '#0F4C5C',
          'primary-soft': '#EAF0F2',
          'primary-border': '#0F4C5C',
          danger: '#B91C1C',
          'danger-soft': '#FFF5F5',
          'danger-border': '#fca5a5',
          success: '#16a34a',
          info: '#1d4ed8',
          black: '#000000',
          shadow: '#0f172a',
          accent: '#3b82f6',
          'accent-strong': '#2563eb',
          'code-bg': '#f3f4f6',
          'code-bg-soft': '#f9fafb',
          'code-border': '#d1d5db',
          'code-text': '#1f2937',
          'muted-2': '#6b7280',
          dashed: '#c7cbd1',
          'sel-soft': '#dfe7fd',
        },
      },
      borderRadius: {
        ...theme.theme.extend.borderRadius,
        'e-sm': '4px',
        e: '4px',
        'e-lg': '6px',
        'e-xl': '8px',
      },
      boxShadow: {
        'e-pop': '0 1px 2px rgba(0, 0, 0, 0.03), 0 8px 20px -6px rgba(0, 0, 0, 0.08)',
      },
    },
  },
};
