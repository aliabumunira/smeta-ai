import {
  OBJECT_TYPES,
  REGIONS,
  WALL_MATERIALS,
  ROOF_TYPES,
  FINISH_LEVELS,
} from '../data/pricing.js';

function Select({ label, value, options, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="control" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Controls({
  params,
  setParam,
  aiText,
  setAiText,
  onRunAi,
  aiBusy,
  aiSource,
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Параметры проекта</div>
      </div>
      <div className="panel-pad">
        <div className="ai-box">
          <label className="ai-label">Опишите проект словами</label>
          <textarea
            className="control ai-text"
            value={aiText}
            placeholder="Напр.: двухэтажный дом 180 м² в Астане, газоблок, металлочерепица, стандартная отделка"
            onChange={(e) => setAiText(e.target.value)}
          />
          <button className="btn btn-primary btn-block" onClick={onRunAi} disabled={aiBusy}>
            {aiBusy ? 'Собираю смету…' : 'Собрать смету по описанию'}
          </button>
          {aiSource === 'openai' && (
            <div className="ai-note">Параметры распознаны ИИ (OpenAI).</div>
          )}
          {(aiSource === 'local' || aiSource === 'local-fallback') && (
            <div className="ai-note warn">
              Разобрано офлайн-парсером. Добавьте ключ OpenAI в .env для умного разбора.
            </div>
          )}
          {aiSource === 'error' && (
            <div className="ai-note warn">
              Не удалось разобрать описание — заполните параметры вручную ниже.
            </div>
          )}
        </div>

        <div className="sep">
          <span>или задайте вручную</span>
        </div>

        <Select
          label="Тип объекта"
          value={params.objectType}
          options={OBJECT_TYPES}
          onChange={(v) => setParam('objectType', v)}
        />
        <div className="row-2">
          <div className="field">
            <label>Общая площадь, м²</label>
            <input
              className="control"
              type="number"
              min="20"
              value={params.area}
              onChange={(e) => setParam('area', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Этажность</label>
            <input
              className="control"
              type="number"
              min="1"
              max="10"
              value={params.floors}
              onChange={(e) => setParam('floors', e.target.value)}
            />
          </div>
        </div>
        <Select
          label="Регион"
          value={params.region}
          options={Object.keys(REGIONS)}
          onChange={(v) => setParam('region', v)}
        />
        <Select
          label="Материал стен"
          value={params.wallMaterial}
          options={Object.keys(WALL_MATERIALS)}
          onChange={(v) => setParam('wallMaterial', v)}
        />
        <Select
          label="Тип кровли"
          value={params.roofType}
          options={Object.keys(ROOF_TYPES)}
          onChange={(v) => setParam('roofType', v)}
        />
        <Select
          label="Уровень отделки"
          value={params.finishLevel}
          options={Object.keys(FINISH_LEVELS)}
          onChange={(v) => setParam('finishLevel', v)}
        />
      </div>
    </div>
  );
}
