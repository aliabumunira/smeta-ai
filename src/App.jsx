import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PARAMS } from './data/pricing.js';
import { generateEstimate, computeTotals, makeId } from './lib/estimate.js';
import { parseProject } from './lib/parseProject.js';
import { tenge } from './lib/format.js';
import Controls from './components/Controls.jsx';
import Overview from './components/Overview.jsx';
import CategoryCard from './components/CategoryCard.jsx';

export default function App() {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [estimate, setEstimate] = useState(() => generateEstimate(DEFAULT_PARAMS));
  const [aiText, setAiText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSource, setAiSource] = useState(null);
  const [openCats, setOpenCats] = useState({ foundation: true });

  // Пересобираем смету при изменении параметров (ручные правки позиций при этом сбрасываются).
  useEffect(() => {
    setEstimate(generateEstimate(params));
  }, [params]);

  const totals = useMemo(() => computeTotals(estimate.categories), [estimate]);

  const setParam = (field, value) => setParams((p) => ({ ...p, [field]: value }));
  const toggleCat = (id) => setOpenCats((o) => ({ ...o, [id]: !o[id] }));

  const onItemChange = (catId, itemId, field, value) =>
    setEstimate((est) => ({
      ...est,
      categories: est.categories.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              items: c.items.map((it) => (it.id !== itemId ? it : { ...it, [field]: value })),
            }
      ),
    }));

  const onAddItem = (catId) =>
    setEstimate((est) => ({
      ...est,
      categories: est.categories.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              items: [
                ...c.items,
                { id: makeId(), name: 'Новая позиция', unit: 'шт', quantity: 1, unitPrice: 0 },
              ],
            }
      ),
    }));

  const onRemoveItem = (catId, itemId) =>
    setEstimate((est) => ({
      ...est,
      categories: est.categories.map((c) =>
        c.id !== catId ? c : { ...c, items: c.items.filter((it) => it.id !== itemId) }
      ),
    }));

  const onRunAi = async () => {
    if (!aiText.trim() || aiBusy) return;
    setAiBusy(true);
    setAiSource(null);
    try {
      const { params: parsed, source } = await parseProject(aiText);
      setParams(parsed);
      setAiSource(source);
    } catch (e) {
      console.error(e);
      setAiSource('error');
    } finally {
      setAiBusy(false);
    }
  };

  const subtotalOf = (catId) => totals.cats.find((c) => c.id === catId)?.subtotal ?? 0;

  return (
    <div className="app">
      <header className="header">
        <div className="brand-row">
          <span className="brand">
            Смета<span className="ai">AI</span>
          </span>
          <span className="badge">HackAlem AI</span>
        </div>
        <p className="tagline">
          Опишите стройку — получите смету по разделам: фундамент, стены, кровля, инженерные сети и
          отделка. Любую позицию можно поправить под свои цены, итог пересчитается сам.
        </p>
        <div className="ruler" aria-hidden="true" />
      </header>

      <main className="grid">
        <Controls
          params={params}
          setParam={setParam}
          aiText={aiText}
          setAiText={setAiText}
          onRunAi={onRunAi}
          aiBusy={aiBusy}
          aiSource={aiSource}
        />

        <section className="results">
          <Overview totals={totals} params={params} />

          <div className="cats">
            {estimate.categories.map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                subtotal={subtotalOf(c.id)}
                isOpen={!!openCats[c.id]}
                onToggle={() => toggleCat(c.id)}
                onItemChange={onItemChange}
                onAddItem={onAddItem}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>

          <div className="totals-foot panel">
            <Row label="Прямые затраты" value={totals.direct} />
            <Row label="Накладные и логистика (5%)" value={totals.logistics} />
            <Row label="Непредвиденные расходы (8%)" value={totals.contingency} />
            <Row label="Итого" value={totals.total} strong />
          </div>
        </section>
      </main>

      <footer className="foot">
        <p>
          <strong>Это предварительная смета.</strong> Базовые цены — усреднённые ориентиры по рынку
          Казахстана; перед использованием откалибруйте их под своего поставщика и регион. Инструмент
          не заменяет сметный расчёт по нормативам (ГЭСН / сборники) для официальной документации.
        </p>
        <p>
          ИИ-режим использует OpenAI, если задан ключ <code>VITE_OPENAI_API_KEY</code> в{' '}
          <code>.env</code>. Без ключа описание разбирается офлайн-парсером.
        </p>
      </footer>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`trow ${strong ? 'strong' : ''}`}>
      <span>{label}</span>
      <span className="num">{tenge(value)}</span>
    </div>
  );
}
