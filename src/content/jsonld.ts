// Structured data (schema.org) for search engines, built from the same content
// files the page uses. Injected into index.html at build time (vite.config.ts).
import { BRANCHES, COMPANY, COMPANY_TH } from './branches';
import { DIMENSIONS, EXTERIOR_COLORS } from './brochure';

export const SITE_URL = 'https://divoctako.github.io/Website-3d/';

const mm = (value: number) => ({ '@type': 'QuantitativeValue', value, unitCode: 'MMT' });

export function buildJsonLd() {
  const car = {
    '@type': 'Car',
    '@id': `${SITE_URL}#car`,
    name: 'BYD SEALION 7',
    brand: { '@type': 'Brand', name: 'BYD' },
    model: 'SEALION 7',
    bodyType: 'SUV',
    fuelType: 'Electric',
    url: SITE_URL,
    image: [`${SITE_URL}og.jpg`, `${SITE_URL}assets/car-side.webp`],
    description:
      'BYD SEALION 7 รถ SUV เพื่อไลฟ์สไตล์ของคนสมาร์ท โดยนักออกแบบระดับโลก Wolfgang Egger ที่ได้แรงบันดาลใจจากความงามของท้องทะเล สู่เส้นสายที่โฉบเฉี่ยวรอบคัน พร้อมสมรรถนะที่ชาญฉลาด ตอบทุกความต้องการของชีวิตยุคใหม่',
    color: EXTERIOR_COLORS.map((c) => c.name),
    length: mm(DIMENSIONS.length),
    width: mm(DIMENSIONS.width),
    height: mm(DIMENSIONS.height),
    wheelbase: mm(DIMENSIONS.wheelbase),
    // figures printed on brochure page 2, which are those of the AWD Ultimate
    vehicleEngine: {
      '@type': 'EngineSpecification',
      enginePower: { '@type': 'QuantitativeValue', value: 390, unitCode: 'KWT' },
      torque: { '@type': 'QuantitativeValue', value: 690, unitCode: 'NU' },
    },
    accelerationTime: { '@type': 'QuantitativeValue', value: 4.5, unitCode: 'SEC' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Driven Range (NEDC)', value: 600, unitCode: 'KMT' },
      { '@type': 'PropertyValue', name: 'Battery Capacity', value: 91.3, unitCode: 'KWH' },
      { '@type': 'PropertyValue', name: 'DC Charging Port CCS2', value: 230, unitCode: 'KWT' },
    ],
  };

  const dealers = BRANCHES.map((b) => ({
    '@type': 'AutoDealer',
    '@id': `${SITE_URL}#${b.id}`,
    name: `${COMPANY} ${b.name}`,
    alternateName: `${COMPANY_TH} ${b.name}`,
    brand: { '@type': 'Brand', name: 'BYD' },
    url: SITE_URL,
    logo: `${SITE_URL}assets/pir-logo.webp`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.address,
      postalCode: b.address.match(/\d{5}\s*$/)?.[0].trim(),
      addressCountry: 'TH',
    },
    telephone: b.phones.map((p) => p.number),
    hasMap: b.map || undefined,
    sameAs: [b.line, b.messenger].filter(Boolean),
  }));

  return { '@context': 'https://schema.org', '@graph': [car, ...dealers] };
}
