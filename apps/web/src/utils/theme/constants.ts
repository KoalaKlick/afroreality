export const PRESET_THEMES = [
  { name: 'Afro Pan-African', primary: '#02a605', secondary: '#ffe100', tertiary: '#dc2626' },
  { name: 'Sunset Gold', primary: '#d97706', secondary: '#f59e0b', tertiary: '#b45309' },
  { name: 'Ocean Wave', primary: '#0284c7', secondary: '#38bdf8', tertiary: '#0369a1' },
  { name: 'Emerald Forest', primary: '#059669', secondary: '#34d399', tertiary: '#047857' },
  { name: 'Royal Velvet', primary: '#7c3aed', secondary: '#a78bfa', tertiary: '#6d28d9' },
];

export const PRESET_COLORS = PRESET_THEMES.map(t => ({ name: t.name, value: t.primary }));
