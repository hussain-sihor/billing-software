import { useStore } from '../lib/store';
import { fmtMoney } from '../lib/format';
import { lineAmount } from '../lib/calc';
import ProductSearchCell from './ProductSearchCell';

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
      hsn: p.hsn || ''
    });

  // Free-typing clears the product link and mirrors text into description.
  const onType = (idx, text) =>
    patch(idx, { _searchText: text, productId: '', description: text });

  const onProductCreated = (idx, created) => {
    if (created && created._id) patch(idx, { productId: created._id });
  };

  return (
    <table className="w-full border-collapse mt-1.5">
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
  );
}

export function blankItem() {
  return { productId: '', description: '', hsn: '', qty: 1, unit: 'pcs', rate: 0, disc: 0 };
}

const CELL_INPUT =
  'w-full border border-transparent bg-transparent px-1 py-1 box-border focus:outline-none focus:bg-white focus:border-accent focus:rounded';

function NumInput({ value, onChange }) {
  return (
    <input
      className={CELL_INPUT + ' text-right'}
      type="number"
      step="any"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      onFocus={(e) => e.target.select()}
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
