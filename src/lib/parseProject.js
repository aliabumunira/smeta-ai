import {
  OBJECT_TYPES,
  REGIONS,
  WALL_MATERIALS,
  ROOF_TYPES,
  FINISH_LEVELS,
  DEFAULT_PARAMS,
} from '../data/pricing.js';

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

// Разбирает свободное описание проекта в параметры сметы.
// Возвращает { params, source: 'openai' | 'local' | 'local-fallback' }
export async function parseProject(text) {
  if (OPENAI_KEY) {
    try {
      const params = await parseWithOpenAI(text);
      return { params, source: 'openai' };
    } catch (e) {
      console.warn('OpenAI недоступен, использую офлайн-парсер:', e);
      return { params: heuristicParse(text), source: 'local-fallback' };
    }
  }
  return { params: heuristicParse(text), source: 'local' };
}

async function parseWithOpenAI(text) {
  const sys = `Ты извлекаешь параметры строительного проекта из описания на русском языке.
Верни СТРОГО JSON без markdown и пояснений с полями:
{"objectType": string, "area": number, "floors": integer, "region": string, "wallMaterial": string, "roofType": string, "finishLevel": string}
"area" — общая площадь в квадратных метрах.
Значения выбирай ТОЛЬКО из допустимых:
objectType: ${OBJECT_TYPES.join(' | ')}
region: ${Object.keys(REGIONS).join(' | ')}
wallMaterial: ${Object.keys(WALL_MATERIALS).join(' | ')}
roofType: ${Object.keys(ROOF_TYPES).join(' | ')}
finishLevel: ${Object.keys(FINISH_LEVELS).join(' | ')}
Если чего-то нет в описании — поставь разумное значение по умолчанию.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '{}';
  return validate(JSON.parse(content));
}

// ---- Проверка и приведение значений ----

function pick(value, allowed, fallback) {
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim();
    const exact = allowed.find((k) => k.toLowerCase() === v);
    if (exact) return exact;
    const partial = allowed.find(
      (k) => v.includes(k.toLowerCase()) || k.toLowerCase().includes(v)
    );
    if (partial) return partial;
  }
  return fallback;
}

function clampNum(v, min, max, fb) {
  const n = Number(v);
  if (!isFinite(n)) return fb;
  return Math.min(max, Math.max(min, n));
}

function clampInt(v, min, max, fb) {
  const n = parseInt(v, 10);
  if (!isFinite(n)) return fb;
  return Math.min(max, Math.max(min, n));
}

function validate(raw) {
  return {
    objectType: pick(raw.objectType, OBJECT_TYPES, DEFAULT_PARAMS.objectType),
    area: clampNum(raw.area, 20, 5000, DEFAULT_PARAMS.area),
    floors: clampInt(raw.floors, 1, 10, DEFAULT_PARAMS.floors),
    region: pick(raw.region, Object.keys(REGIONS), DEFAULT_PARAMS.region),
    wallMaterial: pick(raw.wallMaterial, Object.keys(WALL_MATERIALS), DEFAULT_PARAMS.wallMaterial),
    roofType: pick(raw.roofType, Object.keys(ROOF_TYPES), DEFAULT_PARAMS.roofType),
    finishLevel: pick(raw.finishLevel, Object.keys(FINISH_LEVELS), DEFAULT_PARAMS.finishLevel),
  };
}

// ---- Офлайн-парсер (работает без ключа OpenAI) ----

function heuristicParse(text) {
  const t = (text || '').toLowerCase();
  const p = { ...DEFAULT_PARAMS };

  // площадь
  const areaMatch = t.match(/(\d{2,4}(?:[.,]\d+)?)\s*(?:кв|м²|м2|метр|квадрат)/);
  if (areaMatch) {
    p.area = clampNum(parseFloat(areaMatch[1].replace(',', '.')), 20, 5000, DEFAULT_PARAMS.area);
  } else {
    const anyNum = t.match(/(\d{2,4})/);
    if (anyNum) p.area = clampNum(parseInt(anyNum[1], 10), 20, 5000, DEFAULT_PARAMS.area);
  }

  // этажность
  if (/одноэтаж|1\s*этаж|один этаж/.test(t)) p.floors = 1;
  else if (/двухэтаж|2\s*этаж|два этаж/.test(t)) p.floors = 2;
  else if (/трёхэтаж|трехэтаж|3\s*этаж|три этаж/.test(t)) p.floors = 3;
  else {
    const fm = t.match(/(\d)\s*этаж/);
    if (fm) p.floors = clampInt(parseInt(fm[1], 10), 1, 10, 1);
  }

  // регион
  if (/астан|нур-?султан/.test(t)) p.region = 'Астана';
  else if (/алмат/.test(t)) p.region = 'Алматы';
  else if (/шымкент|чимкент/.test(t)) p.region = 'Шымкент';
  else if (/караганд/.test(t)) p.region = 'Караганда';
  else if (/актоб/.test(t)) p.region = 'Актобе';

  // стены
  if (/газоблок|газобетон|пеноблок/.test(t)) p.wallMaterial = 'Газоблок';
  else if (/кирпич/.test(t)) p.wallMaterial = 'Кирпич';
  else if (/каркас|сип|дерев|брус/.test(t)) p.wallMaterial = 'Каркас (СИП/дерево)';

  // кровля
  if (/металлочерепиц/.test(t)) p.roofType = 'Металлочерепица';
  else if (/профнастил/.test(t)) p.roofType = 'Профнастил';
  else if (/мягк|битумн|гибк/.test(t)) p.roofType = 'Мягкая кровля';
  else if (/фальц/.test(t)) p.roofType = 'Фальцевая кровля';

  // отделка
  if (/чернов|без отделк/.test(t)) p.finishLevel = 'Черновая';
  else if (/премиум|люкс|элит|дорог/.test(t)) p.finishLevel = 'Премиум';
  else if (/стандарт|обычн/.test(t)) p.finishLevel = 'Стандарт';

  // тип объекта
  if (/дуплекс|таунхаус/.test(t)) p.objectType = 'Дуплекс / таунхаус';
  else if (/коммерч|офис|магазин|склад/.test(t)) p.objectType = 'Малоэтажное коммерческое';

  return p;
}
