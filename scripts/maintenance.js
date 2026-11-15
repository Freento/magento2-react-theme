import { readSiteSettings, writeSiteSettings, SITE_SETTINGS_FILE } from '../server/siteSettings.js';

const mode = process.argv[2];
if (mode !== 'on' && mode !== 'off') {
  console.error('Usage: npm run maintenance:on | npm run maintenance:off');
  process.exit(1);
}
const current = readSiteSettings();
const next = writeSiteSettings({ ...current, maintenance: { ...current.maintenance, enabled: mode === 'on' } });
const ips = next.maintenance.allowedIps.map((e) => e.ip).join(', ') || 'none';
console.log(`Maintenance ${next.maintenance.enabled ? 'ON' : 'OFF'} (${SITE_SETTINGS_FILE}). Allowed IPs: ${ips}`);
