import { useRef, useState } from 'react';
import { apiPost } from '../lib/api';
import { useStore } from '../lib/store';
import { fmtMoney } from '../lib/format';
import { normStr, searchProducts, highlightSegments } from '../lib/productSearch';

// In-row product smart-search for the items table. Mirrors the original:
// type to search, dropdown with exact matches + suggestions, keyboard nav,
// pick to fill the row, and a "Save" button to persist a typed-in product.
//
// Props:
//  - row: the current item row ({ productId, description, unit, rate, hsn, _searchText })
//  - onPick(product): link an existing product to the row
//  - onType(text): user typed free text (clears productId, sets description)
//  - onProductCreated(product): a new product was saved from this row
//  - onEnterNavigate(): move focus to Qty after picking (optional)
export default function ProductSearchCell({ row, onPick, onType, onProductCreated }) {
  const products = useStore((s) => s.products);
  const refreshProducts = useStore((s) => s.refreshProducts);
  const toast = useStore((s) => s.toast);

  const picked = row.productId ? products.find((p) => p._id === row.productId) : null;
  const value =
    row._searchText !== undefined
      ? row._searchText
      : picked
      ? picked.name
      : row.description || '';

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef(null);

  const { exactMatches, suggestions } = searchProducts(products, value);
  const flat = [...exactMatches, ...suggestions];

  const saveable = (() => {
    if (row.productId) return false;
    const name = (row._searchText !== undefined ? row._searchText : row.description || '').trim();
    if (!name) return false;
    return !products.some((p) => normStr(p.name) === normStr(name));
  })();

  function handleInput(e) {
    const q = e.target.value;
    onType(q);
    setActive(-1);
    setOpen(!!q.trim());
  }

  function pick(product) {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(false);
    onPick(product);
  }

  function onKeyDown(e) {
    if (!open || flat.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = active < 0 ? 0 : active;
      if (flat[idx]) pick(flat[idx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  async function saveProduct() {
    const name = (row._searchText !== undefined ? row._searchText : row.description || '').trim();
    if (!name) {
      toast('Type a product name first');
      return;
    }
    const existing = products.find((p) => normStr(p.name) === normStr(name));
    if (existing) {
      onPick(existing);
      toast('Product already saved');
      return;
    }
    const data = {
      name,
      description: (row.description || '').trim(),
      unit: (row.unit || 'pcs').trim() || 'pcs',
      rate: parseFloat(row.rate) || 0,
      hsn: (row.hsn || '').trim()
    };
    try {
      const created = await apiPost('/products', data);
      await refreshProducts();
      onProductCreated?.(created);
      toast('Product saved for reuse');
    } catch (err) {
      toast(err.message || 'Could not save product');
    }
  }

  let flatIdx = -1;

  return (
    <div className="relative flex items-center gap-1">
      <input
        className={[
          'flex-1 min-w-0 border border-transparent bg-transparent px-1 py-1 text-inherit',
          'focus:outline-none focus:bg-white focus:border-accent focus:rounded',
          value ? 'font-semibold' : ''
        ].join(' ')}
        placeholder="Search or type product…"
        value={value}
        autoComplete="off"
        onChange={handleInput}
        onFocus={(e) => {
          e.target.select();
          if (value.trim()) setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
      />
      {saveable && (
        <button
          type="button"
          title="Save this product for reuse"
          className="flex-none inline-flex items-center gap-0.5 border border-accent bg-[#E4F3EE] text-accent-dark text-[10.5px] font-bold px-1.5 py-0.5 rounded-[5px] whitespace-nowrap hover:bg-accent hover:text-white"
          onMouseDown={(e) => e.preventDefault()}
          onClick={saveProduct}
        >
          💾 Save
        </button>
      )}

      {open && value.trim() && (
        <div className="absolute top-full left-0 min-w-[320px] w-full max-w-[440px] bg-white border border-[#CBD5E1] rounded-lg shadow-[0_8px_28px_rgba(0,0,0,.15)] z-[9999] max-h-[300px] overflow-y-auto">
          {flat.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-[#64748b] italic">
              No products found for "<b>{value.trim()}</b>".
            </div>
          ) : (
            <>
              {exactMatches.length > 0 && <SectionLabel>Matching Products</SectionLabel>}
              {exactMatches.map((p) => {
                flatIdx++;
                return (
                  <ProdItem
                    key={p._id}
                    product={p}
                    query={value}
                    active={flatIdx === active}
                    onPick={() => pick(p)}
                  />
                );
              })}
              {suggestions.length > 0 && (
                <SectionLabel>You might also want…</SectionLabel>
              )}
              {suggestions.map((p) => {
                flatIdx++;
                return (
                  <ProdItem
                    key={p._id}
                    product={p}
                    query={value}
                    active={flatIdx === active}
                    onPick={() => pick(p)}
                  />
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[9.5px] uppercase tracking-[.7px] font-bold text-[#94a3b8] px-3 pt-2 pb-0.5 border-t border-[#F1F5F9] first:border-t-0">
      {children}
    </div>
  );
}

function ProdItem({ product, query, active, onPick }) {
  const segs = highlightSegments(product.name, query);
  return (
    <div
      className={[
        'flex items-center gap-2 px-3 py-[7px] cursor-pointer',
        active ? 'bg-[#EFF6FF]' : 'hover:bg-[#EFF6FF]'
      ].join(' ')}
      onMouseDown={(e) => {
        e.preventDefault();
        onPick();
      }}
    >
      <div className="text-xs font-semibold text-[#1e293b] flex-1">
        {segs.map((s, i) =>
          s.hit ? (
            <mark key={i} className="bg-[#FEF9C3] rounded-sm font-bold text-[#92400E]">
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
      </div>
      {product.unit && (
        <span className="text-[10.5px] text-[#64748b] whitespace-nowrap">
          {product.unit}
        </span>
      )}
      {product.rate ? (
        <span className="text-[11px] font-bold text-[#0f766e] whitespace-nowrap">
          {fmtMoney(product.rate)}
        </span>
      ) : null}
    </div>
  );
}
