// The editor shares the host theme's @tailwind entry (PreviewChrome imports
// @host/styles/tailwind.css), processed here with editor-app's own Tailwind
// config — it presets on the host config and additionally scans editor-app
// sources, so the one entry emits both theme and editor utilities.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: path.join(HERE, 'tailwind.config.js') },
    autoprefixer: {},
  },
};
