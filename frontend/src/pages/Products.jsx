import { Fragment, useState } from 'react';
import { apiDelete, apiPut } from '../lib/api';
import { useStore } from '../lib/store';
import { fmtMoney } from '../lib/format';
import { Topbar, Card, Button, DTable, EmptyState } from '../components/ui';
import ProductModal from '../components/ProductModal';

const UNGROUPED = 'Ungrouped';

export default function Products() {
  const products = useStore((s) => s.products);
  const refreshProducts = useStore((s) => s.refreshProducts);
  const toast = useStore((s) => s.toast);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(() => new Set());
  const [targetGroup, setTargetGroup] = useState('');

  const toggle = (ids, on) =>
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
      return n;
    });

  async function applyGroup(group) {
    const ids = [...selected];
    try {
      await apiPut('/products/bulk/group', { ids, group });
      await refreshProducts();
      toast(group ? `${ids.length} added to "${group}"` : `${ids.length} removed from group`);
      setSelected(new Set());
      setTargetGroup('');
    } catch (err) {
      toast(err.message || 'Could not update group');
    }
  }

  const groupNames = [...new Set(products.map((p) => p.group).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
  // Sections to render: named groups first (A-Z), then ungrouped. Honors the filter.
  const sections = [...groupNames, UNGROUPED]
    .filter((g) => filter === 'All' || filter === g)
    .map((g) => [
      g,
      products.filter((p) => (g === UNGROUPED ? !p.group : p.group === g))
    ])
    .filter(([, items]) => items.length > 0);

  const add = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggleCollapse = (g) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(g) ? n.delete(g) : n.add(g);
      return n;
    });

  // Inline row editing: drafts[id] = { name, unit, rate, focus } while a row is being edited.
  const [drafts, setDrafts] = useState({});
  const startEdit = (p, focus) =>
    setDrafts((d) => ({
      ...d,
      [p._id]: {
        name: p.name || '',
        unit: p.unit || '',
        rate: p.rate ?? 0,
        disc: p.disc ?? 0,
        focus
      }
    }));
  const setDraftField = (id, k, v) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [k]: v } }));
  const cancelRow = (id) =>
    setDrafts((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });

  async function saveRow(p) {
    const d = drafts[p._id];
    if (!d) return;
    const name = d.name.trim();
    if (!name) {
      toast('Product name cannot be empty');
      return;
    }
    try {
      await apiPut('/products/' + p._id, {
        name,
        description: p.description || '',
        unit: d.unit.trim() || 'pcs',
        rate: parseFloat(d.rate) || 0,
        disc: Math.min(100, Math.max(0, parseFloat(d.disc) || 0)),
        hsn: p.hsn || ''
      });
      await refreshProducts();
      cancelRow(p._id);
      toast('Product updated');
    } catch (err) {
      toast(err.message || 'Could not update product');
    }
  }

  async function remove(id) {
    if (!confirm('Remove this product?')) return;
    try {
      await apiDelete('/products/' + id);
      await refreshProducts();
    } catch (err) {
      toast(err.message || 'Could not delete product');
    }
  }

  return (
    <section>
      <Topbar title="Products" desc="Manage the product list used in bills and quotations.">
        <Button variant="primary" onClick={add}>
          + Add product
        </Button>
      </Topbar>

      <Card>
        {products.length === 0 ? (
          <EmptyState emoji="📦">
            No products yet. Add the items you sell.
          </EmptyState>
        ) : (
          <>
            {groupNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['All', ...groupNames, UNGROUPED].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFilter(g)}
                    className={[
                      'border rounded-full px-3 py-0.5 text-[14px] hover:bg-accent hover:text-white',
                      filter === g
                        ? 'bg-accent text-white border-accent'
                        : 'bg-white border-bordr text-muted'
                    ].join(' ')}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 p-2 rounded bg-[#E4F3EE] border border-accent">
                <b className="text-[12px]">{selected.size} selected</b>
                <input
                  list="group-targets"
                  className="border border-bordr rounded px-2 py-1 text-[12px] w-56 bg-white"
                  placeholder="Group name (existing or new)"
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                />
                <datalist id="group-targets">
                  {groupNames.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
                <Button
                  variant="primary"
                  sm
                  onClick={() =>
                    targetGroup.trim() ? applyGroup(targetGroup.trim()) : toast('Enter a group name')
                  }
                >
                  Add to group
                </Button>
                <Button variant="ghost" sm onClick={() => applyGroup('')}>
                  Remove from group
                </Button>
                <Button variant="ghost" sm onClick={() => setSelected(new Set())}>
                  Clear
                </Button>
              </div>
            )}
            <DTable
              head={['', 'Name', 'Description', 'Unit', 'Default rate', 'Disc %', '']}
              widths={['40px', '26%', null, '100px', '120px', '90px', '170px']}
            >
              {sections.map(([g, items]) => (
                <Fragment key={g}>
                  {groupNames.length > 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-2 py-2 bg-[#F0F3F7] text-[14px] uppercase font-bold text-muted border-b border-bordr"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="flex justify-end items-end w-5 h-5 text-[14px] cursor-pointer"
                            title={collapsed.has(g) ? 'Expand group' : 'Minimize group'}
                            onClick={() => toggleCollapse(g)}
                          >
                            {collapsed.has(g) ? '➡️' : '⬇️'}
                          </button>
                          <input
                            type="checkbox"
                            title="Select all in this group"
                            checked={items.every((p) => selected.has(p._id))}
                            onChange={(e) => toggle(items.map((p) => p._id), e.target.checked)}
                            className=""
                          />
                          <span
                            className="cursor-pointer select-none"
                            onClick={() => toggleCollapse(g)}
                          >
                            {g} ({items.length})
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!(groupNames.length > 0 && collapsed.has(g)) && items.map((p) => (
                    <tr key={p._id} className="hover:bg-[#FAFBFD]">
                      <Td>
                        <input
                          type="checkbox"
                          checked={selected.has(p._id)}
                          onChange={(e) => toggle([p._id], e.target.checked)}
                        />
                      </Td>
                      {(() => {
                        const d = drafts[p._id];
                        // Same props for every editable cell; EditCell keeps
                        // view and edit modes the same size so nothing shifts.
                        const cell = (field, display, extra = {}) => (
                          <Td>
                            <EditCell
                              editing={!!d}
                              display={display}
                              value={d ? d[field] : ''}
                              autoFocus={d?.focus === field}
                              onStart={() => startEdit(p, field)}
                              onChange={(v) => setDraftField(p._id, field, v)}
                              onEnter={() => saveRow(p)}
                              onEscape={() => cancelRow(p._id)}
                              {...extra}
                            />
                          </Td>
                        );
                        return (
                          <>
                            {cell('name', p.name, { textClass: 'text-[14px] font-medium' })}
                            <Td>
                              <span className="text-[11px] text-gray-500">{p.description || ''}</span>
                            </Td>
                            {cell('unit', p.unit || '—')}
                            {cell('rate', fmtMoney(p.rate || 0), {
                              number: true,
                              textClass: 'text-[14px] font-medium'
                            })}
                            {cell('disc', p.disc ? `${p.disc}%` : '—', { number: true })}
                            <Td nowrap>
                              {d ? (
                                <>
                                  <Button variant="primary" sm onClick={() => saveRow(p)}>
                                    Save
                                  </Button>{' '}
                                  <Button variant="ghost" sm onClick={() => cancelRow(p._id)}>
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button variant="danger" sm onClick={() => remove(p._id)}>
                                  Delete
                                </Button>
                              )}
                            </Td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </DTable>
          </>
        )}
      </Card>

      <ProductModal
        open={modalOpen}
        product={editing}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}

// Same box (border, padding, height, font, alignment) in view and edit mode,
// so double-clicking only swaps text for an input without moving anything.
const CELL_BOX =
  'block w-full h-[30px] leading-[20px] border rounded px-1.5 py-1 box-border text-left truncate';

function EditCell({ editing, display, textClass = '', onStart, ...inputProps }) {
  if (!editing) {
    return (
      <div
        className={[CELL_BOX, 'border-transparent cursor-default select-none', textClass].join(' ')}
        title="Double-click to edit"
        onDoubleClick={onStart}
      >
        {display}
      </div>
    );
  }
  return <DraftInput {...inputProps} textClass={textClass} />;
}

function DraftInput({ value, onChange, onEnter, onEscape, number, autoFocus, textClass = '' }) {
  return (
    <input
      className={[
        CELL_BOX,
        'border-accent bg-white focus:outline-none',
        textClass,
        number
          ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          : ''
      ].join(' ')}
      type={number ? 'number' : 'text'}
      step={number ? 'any' : undefined}
      min={number ? '0' : undefined}
      autoFocus={autoFocus}
      value={value}
      onFocus={(e) => e.target.select()}
      onWheel={number ? (e) => e.target.blur() : undefined}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter();
        else if (e.key === 'Escape') onEscape();
      }}
    />
  );
}

function Td({ children, nowrap }) {
  return (
    <td
      className={[
        'px-2 py-[9px] border-b border-bordr align-middle',
        nowrap ? 'whitespace-nowrap' : ''
      ].join(' ')}
    >
      {children}
    </td>
  );
}
