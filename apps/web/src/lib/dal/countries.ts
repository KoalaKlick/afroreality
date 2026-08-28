export const supportedCountries = [
  { code: 'GH', name: 'Ghana', currency: 'GHS', phoneCode: '+233' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', phoneCode: '+234' },
  { code: 'KE', name: 'Kenya', currency: 'KES', phoneCode: '+254' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', phoneCode: '+27' },
  { code: 'CI', name: "Cote d'Ivoire", currency: 'XOF', phoneCode: '+225' },
];

export const SUPPORTED_COUNTRIES = supportedCountries;

export function getCurrencyByCountryCode(code: string): string {
  const country = supportedCountries.find((c) => c.code === code);
  return country?.currency || 'GHS';
}

export function getCountryByCode(code: string) {
  return supportedCountries.find((c) => c.code === code) || supportedCountries[0];
}
