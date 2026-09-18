const NBSP = '\u00A0';

export function tenge(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString('ru-RU') + NBSP + '₸';
}

export function tengeShort(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) {
    return (v / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + NBSP + 'млн' + NBSP + '₸';
  }
  if (v >= 1_000) {
    return Math.round(v / 1000).toLocaleString('ru-RU') + NBSP + 'тыс' + NBSP + '₸';
  }
  return Math.round(v).toLocaleString('ru-RU') + NBSP + '₸';
}

export function num(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
}
