import { tenge, tengeShort, num } from '../lib/format.js';

const COLORS = ['#e5891f', '#2b6e8f', '#7a8b5a', '#b4633a', '#4a5568', '#c9a24b'];

function Donut({ cats, total }) {
  const size = 176;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;

  let offset = 0;
  const segs = cats
    .filter((c) => c.subtotal > 0)
    .map((c, i) => {
      const frac = total > 0 ? c.subtotal / total : 0;
      const len = frac * C;
      const s = { name: c.name, color: COLORS[i % COLORS.length], len, offset, frac };
      offset += len;
      return s;
    });

  const mln = total / 1_000_000;

  return (
    <div className="chart-wrap">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Структура затрат по разделам"
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
          {segs.map((s, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${s.len} ${C - s.len}`}
              strokeDashoffset={-s.offset}
            />
          ))}
        </g>
        <text x={size / 2} y={size / 2} textAnchor="middle">
          <tspan x={size / 2} dy="-2" className="donut-num">
            {num(mln)}
          </tspan>
          <tspan x={size / 2} dy="18" className="donut-unit">
            млн ₸
          </tspan>
        </text>
      </svg>

      <div className="legend">
        {segs.map((s, i) => (
          <div className="legend-item" key={i}>
            <span className="swatch" style={{ background: s.color }} />
            <span className="legend-name">{s.name}</span>
            <span className="legend-val num">{Math.round(s.frac * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Overview({ totals, params }) {
  const area = Number(params.area) || 0;
  const perM2 = area > 0 ? totals.total / area : 0;

  return (
    <div className="panel overview">
      <div className="summary">
        <div className="total">
          <div className="label">Итоговая стоимость</div>
          <div className="value num">{tenge(totals.total)}</div>
        </div>
        <div className="divider-v" />
        <div className="metric">
          <div className="label">За м²</div>
          <div className="value num">{tenge(perM2)}</div>
        </div>
        <div className="metric">
          <div className="label">Площадь</div>
          <div className="value num">{num(area)} м²</div>
        </div>
        <div className="metric">
          <div className="label">Прямые затраты</div>
          <div className="value num">{tengeShort(totals.direct)}</div>
        </div>
      </div>
      <Donut cats={totals.cats} total={totals.total} />
    </div>
  );
}
