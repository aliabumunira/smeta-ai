import {
  REGIONS,
  WALL_MATERIALS,
  ROOF_TYPES,
  FINISH_LEVELS,
  OVERHEAD,
} from '../data/pricing.js';

// Простой генератор id для позиций сметы
let _seq = 0;
export const makeId = () => `it_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

const roundQty = (x) => (x >= 100 ? Math.round(x) : Math.round(x * 10) / 10);
const roundPrice = (x) => Math.max(100, Math.round(x / 100) * 100);

// Строит смету по параметрам проекта.
// Возвращает { params, categories: [{ id, name, items: [{id,name,unit,quantity,unitPrice}] }] }
export function generateEstimate(params) {
  const p = { ...params };
  const N = Math.max(1, Number(p.floors) || 1);
  const A = Math.max(1, Number(p.area) || 1); // общая площадь, м²
  const S = A / N; // площадь застройки (footprint), м²
  const H = 3; // высота этажа, м
  const P = 4 * Math.sqrt(S) * 1.1; // периметр, м (поправка на непрямоугольность)
  const roofArea = S * 1.3; // площадь кровли (уклон + свесы)
  const extWall = P * H * N; // площадь наружных стен
  const intWall = extWall * 0.6; // внутренние перегородки
  const floor = A; // площадь полов/потолков

  const rc = REGIONS[p.region] ?? 1;
  const fm = FINISH_LEVELS[p.finishLevel] ?? 1;
  const wallPrice = WALL_MATERIALS[p.wallMaterial] ?? 9000;
  const roofPrice = ROOF_TYPES[p.roofType] ?? 5500;

  const price = (base) => roundPrice(base * rc);
  const fprice = (base) => roundPrice(base * rc * fm); // цена с учётом уровня отделки

  const item = (name, unit, qty, unitPrice) => ({
    id: makeId(),
    name,
    unit,
    quantity: roundQty(qty),
    unitPrice,
  });

  const categories = [
    {
      id: 'foundation',
      name: 'Фундамент',
      items: [
        item('Земляные работы', 'м³', S * 0.4, price(2500)),
        item('Песчано-гравийная подушка', 'м³', S * 0.15, price(9000)),
        item('Опалубка', 'м²', P * 1.2, price(3500)),
        item('Арматура', 'кг', S * 24, price(450)),
        item('Бетон М300', 'м³', S * 0.3, price(28000)),
        item('Гидроизоляция фундамента', 'м²', S, price(1500)),
      ],
    },
    {
      id: 'walls',
      name: 'Стены',
      items: [
        item(`Кладка стен (${p.wallMaterial})`, 'м²', extWall, price(wallPrice)),
        item('Перегородки внутренние', 'м²', intWall, price(6000)),
        item('Утепление стен', 'м²', extWall, price(3500)),
        item('Армопояс и перемычки', 'м.п.', P * N, price(4500)),
      ],
    },
    {
      id: 'roof',
      name: 'Кровля',
      items: [
        item('Стропильная система и обрешётка', 'м²', roofArea, price(4000)),
        item('Гидро- и пароизоляция', 'м²', roofArea, price(800)),
        item('Утеплитель кровли', 'м²', roofArea, price(2500)),
        item(`Кровельное покрытие (${p.roofType})`, 'м²', roofArea, price(roofPrice)),
        item('Водосточная система', 'м.п.', P, price(5000)),
      ],
    },
    {
      id: 'utilities',
      name: 'Инженерные сети',
      items: [
        item('Электромонтаж (кабель, щит, розетки)', 'м²', floor, price(4500)),
        item('Водоснабжение', 'м²', floor, price(2500)),
        item('Канализация', 'м²', floor, price(2000)),
        item('Отопление (котёл, радиаторы, трубы)', 'м²', floor, price(7000)),
        item('Вентиляция', 'м²', floor, price(2000)),
      ],
    },
    {
      id: 'finishing',
      name: 'Отделка',
      items: [
        item('Штукатурка стен', 'м²', floor * 2.5, fprice(2000)),
        item('Стяжка пола', 'м²', floor, fprice(2500)),
        item('Шпаклёвка, покраска / обои', 'м²', floor * 2.5, fprice(1800)),
        item('Напольное покрытие', 'м²', floor, fprice(4500)),
        item('Потолки', 'м²', floor, fprice(2500)),
        item('Плитка (санузлы)', 'м²', floor * 0.15, fprice(6000)),
        item('Окна ПВХ', 'шт', floor / 14, fprice(55000)),
        item('Двери межкомнатные', 'шт', floor / 16, fprice(35000)),
      ],
    },
    {
      id: 'other',
      name: 'Прочие работы',
      items: [
        item('Проектная документация', 'м²', floor, price(1200)),
        item('Благоустройство территории', 'м²', S * 0.5, price(3500)),
      ],
    },
  ];

  return { params: p, categories };
}

// Считает суммы по позициям, разделам и итог.
export function computeTotals(categories) {
  const cats = categories.map((c) => {
    const subtotal = c.items.reduce(
      (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
    return { id: c.id, name: c.name, subtotal };
  });
  const direct = cats.reduce((s, c) => s + c.subtotal, 0);
  const logistics = direct * OVERHEAD.logistics;
  const contingency = direct * OVERHEAD.contingency;
  const total = direct + logistics + contingency;
  return { cats, direct, logistics, contingency, total };
}
