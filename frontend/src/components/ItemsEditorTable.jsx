import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { fmtMoney } from '../lib/format';
import { lineAmount } from '../lib/calc';
import ProductSearchCell from './ProductSearchCell';
import { apiPost } from '../lib/api';
import { normStr } from '../lib/productSearch';

// The editable items table. Rows live in the parent (NewDocument) so totals
// stay in sync. Each row: { productId, description, hsn, qty, unit, rate, disc, _searchText }.
export default function ItemsEditorTable({ rows, setRows }) {
  const products = useStore((s) => s.products);

  const patch = (idx, changes) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...changes } : r)));

  const removeRow = (idx) =>
    setRows((rs) => {
      const next = rs.filter((_, i) => i !== idx);
      return next.length ? next : [blankItem()];
    });

  // Picking an existing product fills the row from the product snapshot.
  const onPick = (idx, p) =>
    patch(idx, {
      productId: p._id,
      _searchText: p.name,
      description: p.description || p.name,
      unit: p.unit || 'pcs',
      rate: p.rate || 0,
      disc: p.disc || 0,
      hsn: p.hsn || ''
    });

  // Free-typing clears the product link and mirrors text into description.
  // If the row was linked to a saved product, it is now a new item, so the
  // old product's rate is reset to force a fresh price.
  const onType = (idx, text) =>
    setRows((rs) =>
      rs.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, _searchText: text, productId: '', description: text };
        if (r.productId) {
          next.rate = 0;
          next.disc = 0;
        }
        return next;
      })
    );

  // Enter in the product box: add a blank row below (unless the next row is
  // already blank) and focus its product search.
  const tableRef = useRef(null);
  const addRowBelow = (idx) => {
    const next = rows[idx + 1];
    const nextBlank = next && !next.productId && !(next.description || '').trim();
    if (!nextBlank) {
      setRows((rs) => [...rs.slice(0, idx + 1), blankItem(), ...rs.slice(idx + 1)]);
    }
    setTimeout(() => {
      const inputs = tableRef.current?.querySelectorAll('[data-product-search]');
      inputs?.[idx + 1]?.focus();
    }, 0);
  };

  const onProductCreated = (idx, created) => {
    if (created && created._id) patch(idx, { productId: created._id });
  };

  const refreshProducts = useStore((s) => s.refreshProducts);
  const toast = useStore((s) => s.toast);

  const rowName = (r) => (r._searchText !== undefined ? r._searchText : r.description || '').trim();

  // Rows with a typed name that isn't linked to, or named like, a saved product.
  const newRowIdxs = (() => {
    const seen = new Set();
    const out = [];
    rows.forEach((r, i) => {
      const name = rowName(r);
      const key = normStr(name);
      if (r.productId || !name || seen.has(key)) return;
      if (products.some((p) => normStr(p.name) === key)) return;
      seen.add(key);
      out.push(i);
    });
    return out;
  })();

  const saveAllNew = async () => {
    let saved = 0;
    const created = {};
    for (const i of newRowIdxs) {
      const r = rows[i];
      try {
        created[i] = await apiPost('/products', {
          name: rowName(r),
          description: (r.description || '').trim(),
          unit: (r.unit || 'pcs').trim() || 'pcs',
          rate: parseFloat(r.rate) || 0,
          disc: parseFloat(r.disc) || 0,
          hsn: (r.hsn || '').trim()
        });
        saved++;
      } catch (err) {
        toast(err.message || 'Could not save some products');
      }
    }
    if (saved) {
      await refreshProducts();
      setRows((rs) =>
        rs.map((r, i) => (created[i] && created[i]._id ? { ...r, productId: created[i]._id } : r))
      );
      toast(`${saved} new item${saved > 1 ? 's' : ''} saved`);
    }
  };

  const [allDisc, setAllDisc] = useState('');
  const applyAll = () => {
    const d = parseFloat(allDisc);
    if (isNaN(d)) return;
    setRows((rs) => rs.map((r) => ({ ...r, disc: d })));
  };

  return (
    <>
    <div className="flex items-center gap-2 mb-1.5">
      <label className="text-[12px] text-muted">Discount % for all items</label>
      <input
        className="w-24 border border-bordr rounded px-2 py-1 text-right"
        type="number"
        step="any"
        min="0"
        max="100"
        placeholder="0"
        value={allDisc}
        onChange={(e) => setAllDisc(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && applyAll()}
        onWheel={(e) => e.target.blur()}
      />
      <button
        type="button"
        className="border border-bordr rounded px-2.5 py-1 text-[12px] bg-white"
        onClick={applyAll}
      >
        Apply to all
      </button>
      {newRowIdxs.length > 0 && (
        <button
          type="button"
          className="ml-auto border border-accent bg-[#E4F3EE] text-accent-dark rounded px-2.5 py-1 text-[12px] font-bold hover:bg-accent hover:text-white"
          title="Save all new items for reuse"
          onClick={saveAllNew}
        >
          💾 Save all new items ({newRowIdxs.length})
        </button>
      )}
    </div>
    <table ref={tableRef} className="w-full border-collapse mt-1.5">
      <thead>
        <tr>
          <Th w="34px">Sl</Th>
          <Th>Product / description</Th>
          <Th w="80px">Qty</Th>
          <Th w="70px">Unit</Th>
          <Th w="100px">Rate</Th>
          <Th w="70px">Disc %</Th>
          <Th w="110px">Amount</Th>
          <Th w="34px" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            <Td className="text-center text-muted w-9">{idx + 1}</Td>
            <Td>
              <ProductSearchCell
                row={row}
                onPick={(p) => onPick(idx, p)}
                onType={(t) => onType(idx, t)}
                onProductCreated={(c) => onProductCreated(idx, c)}
                onEnter={() => addRowBelow(idx)}
              />
              <input
                className={CELL_INPUT}
                placeholder="Description"
                value={row.description || ''}
                onChange={(e) => patch(idx, { description: e.target.value })}
              />
              <input
                className={CELL_INPUT + ' text-[11px] text-muted mt-0.5'}
                placeholder="HSN/SAC (optional)"
                value={row.hsn || ''}
                onChange={(e) => patch(idx, { hsn: e.target.value })}
              />
            </Td>
            <Td>
              <NumInput
                value={row.qty}
                onChange={(v) => patch(idx, { qty: v })}
              />
            </Td>
            <Td>
              <input
                className={CELL_INPUT}
                value={row.unit || ''}
                onChange={(e) => patch(idx, { unit: e.target.value })}
              />
            </Td>
            <Td>
              <NumInput
                value={row.rate}
                onChange={(v) => patch(idx, { rate: v })}
              />
            </Td>
            <Td>
              <NumInput
                value={row.disc}
                onChange={(v) => patch(idx, { disc: v })}
              />
            </Td>
            <Td className="text-right tabular-nums">{fmtMoney(lineAmount(row))}</Td>
            <Td className="text-center w-9">
              <button
                className="border-0 bg-transparent text-danger text-base font-bold"
                title="Remove row"
                onClick={() => removeRow(idx)}
              >
                ×
              </button>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}

export function blankItem() {
  return { productId: '', description: '', hsn: '', qty: 1, unit: 'pcs', rate: 0, disc: 0 };
}

const CELL_INPUT =
  'w-full border border-transparent bg-transparent px-1 py-1 box-border focus:outline-none focus:bg-white focus:border-accent focus:rounded';

// Shows the value as plain text; double-click to edit. Enter/Escape/blur ends editing.
function NumInput({ value, onChange }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div
        className={CELL_INPUT + ' text-right cursor-default select-none min-h-[28px]'}
        title="Double-click to edit"
        onDoubleClick={() => setEditing(true)}
      >
        {value}
      </div>
    );
  }

  return (
    <input
      className={
        CELL_INPUT +
        ' text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
      }
      type="number"
      step="any"
      autoFocus
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      onFocus={(e) => e.target.select()}
      onWheel={(e) => e.target.blur()}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape') setEditing(false);
      }}
    />
  );
}

function Th({ children, w }) {
  return (
    <th
      style={w ? { width: w } : undefined}
      className="bg-[#F0F3F7] text-[11px] uppercase text-muted px-1.5 py-2 text-left border border-bordr"
    >
      {children}
    </th>
  );
}

function Td({ children, className = '' }) {
  return (
    <td className={['border border-bordr px-1.5 py-1 align-top', className].join(' ')}>
      {children}
    </td>
  );
}
