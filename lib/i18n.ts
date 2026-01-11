export type Lang = 'en' | 'de';

export function detectLang(req: Request): Lang {
  const header = req.headers.get('accept-language') || '';
  return header.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export const messages = {
  en: {
    maintenanceTitle: 'Our website is temporarily unavailable',
    maintenanceText: 'Please contact us directly:',
  },
  de: {
    maintenanceTitle: 'Unsere Website ist vorübergehend nicht verfügbar',
    maintenanceText: 'Bitte kontaktieren Sie uns direkt:',
  },
};
