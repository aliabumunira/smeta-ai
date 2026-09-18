import { tenge } from '../lib/format.js';

function Caret({ open }) {
  return (
    <svg
      className={`cat-caret ${open ? 'open' : ''}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 12a1 1 0 001 1h4a1 1 0 001-1l1-12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CategoryCard({
  category,
  subtotal,
  isOpen,
  onToggle,
  onItemChange,
  onAddItem,
  onRemoveItem,
}) {
  return (
    <div className="cat">
      <button
        className={`cat-head ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <Caret open={isOpen} />
        <span className="cat-name">{category.name}</span>
        <span className="cat-count">{category.items.length} поз.</span>
        <span className="cat-sub num">{tenge(subtotal)}</span>
      </button>

      {isOpen && (
        <div className="cat-body">
          <div className="table-wrap">
            <table className="items">
              <thead>
                <tr>
                  <th>Наименование</th>
                  <th className="num">Кол-во</th>
                  <th>Ед.</th>
                  <th className="num">Цена, ₸</th>
                  <th className="num">Сумма, ₸</th>
                  <th aria-label="Действия"></th>
                </tr>
              </thead>
              <tbody>
                {category.items.map((it) => {
                  const sum = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
                  return (
                    <tr key={it.id}>
                      <td>
                        <input
                          className="name-input"
                          value={it.name}
                          onChange={(e) => onItemChange(category.id, it.id, 'name', e.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          className="cell-input"
                          type="number"
                          min="0"
                          value={it.quantity}
                          onChange={(e) =>
                            onItemChange(category.id, it.id, 'quantity', e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="unit-input"
                          value={it.unit}
                          onChange={(e) => onItemChange(category.id, it.id, 'unit', e.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          className="cell-input"
                          type="number"
                          min="0"
                          step="100"
                          value={it.unitPrice}
                          onChange={(e) =>
                            onItemChange(category.id, it.id, 'unitPrice', e.target.value)
                          }
                        />
                      </td>
                      <td className="num row-sum">{tenge(sum)}</td>
                      <td>
                        <button
                          className="icon-btn"
                          title="Удалить позицию"
                          onClick={() => onRemoveItem(category.id, it.id)}
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="add-row">
            <button className="btn btn-ghost btn-sm" onClick={() => onAddItem(category.id)}>
              + Добавить позицию
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
