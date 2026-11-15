import path from 'node:path';
import { fileURLToPath } from 'node:url';
import hostConfig from '../tailwind.config.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export default {
  presets: [hostConfig],
  content: [
    path.join(HERE, '../index.html'),
    path.join(HERE, '../src/**/*.{js,jsx}'),
    path.join(HERE, 'src/**/*.{js,jsx}'),
    path.join(HERE, 'pages/**/*.{js,jsx}'),
    path.join(HERE, 'packages/**/*.{js,jsx}'),
  ],
  theme: {
    extend: {
      colors: {
        'ed-bg': '#F8F8F6',
        'ed-surface': '#FFFFFF',
        'ed-surface-hover': '#ECECE8',
        'ed-surface-hover-strong': 'rgba(17, 17, 17, 0.08)',
        'ed-border': '#B9B9B4',
        'ed-border-strong': '#9E9E99',
        'ed-text': '#111111',
        'ed-text-hover': '#262626',
        'ed-text-muted': '#424242',
        'ed-text-soft': '#5A5A57',
        'ed-primary': '#0F4C5C',
        'ed-primary-dark': '#0b3a46',
        'ed-primary-soft': '#EAF0F2',
        'ed-danger': '#B91C1C',
        'ed-danger-soft': '#FFF5F5',
        'ed-danger-border': '#fca5a5',
        'ed-success': '#0F4C5C',
        'ed-info': '#0F4C5C',
        'ed-accent': '#0F4C5C',
        'ed-accent-strong': '#0b3a46',
        'ed-code-bg': '#F2F2EF',
        'ed-code-bg-soft': '#F8F8F6',
        'ed-code-border': '#B9B9B4',
        'ed-code-text': '#111111',
        'ed-muted-2': '#424242',
        'ed-dashed': '#9E9E99',
        'ed-sel-soft': '#EAF0F2',
      },
      boxShadow: {
        'ed-pop': '0 1px 2px rgba(0, 0, 0, 0.03), 0 8px 20px -6px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        'ed-mono': ["'SF Mono'", 'ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
};
