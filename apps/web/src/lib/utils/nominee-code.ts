export function generateNomineeCode(categoryName = 'CAT', index = 1): string {
  const prefix = (categoryName || 'CAT').slice(0, 3).toUpperCase();
  const padded = String(index || 1).padStart(3, '0');
  return `${prefix}${padded}`;
}
