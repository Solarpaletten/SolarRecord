import { NextResponse } from 'next/server';
import { detectLang, messages } from '@/lib/i18n';


export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function GET(req: Request) {
  const lang = detectLang(req);
  const t = messages[lang];

 
  return NextResponse.json({
    status: 'maintenance',
    title: t.maintenanceTitle,
    message: t.maintenanceText,
    contact: {
      phone: '+49 155 113 27 637',
      email: 'itsolarbank@gmail.com',
      company: 'SOLAR GMBH',
    },
    lang,
  });
}
