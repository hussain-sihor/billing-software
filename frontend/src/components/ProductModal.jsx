import { useEffect, useState } from 'react';
import { apiPost, apiPut } from '../lib/api';
import { useStore } from '../lib/store';
import Modal from './Modal';
import { Field, Input, Textarea, Button } from './ui';

const EMPTY = { name: '', group: '', description: '', unit: 'pcs', rate: '', disc: '', hsn: '' };

// Add/edit product modal. `product` is the product being edited, or null to add.
export default function ProductModal({ open, product, onClose, onSaved }) {
  const refreshProducts = useStore((s) => s.refreshProducts);
  const toast = useStore((s) => s.toast);
  const products = useStore((s) => s.products);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      product
        ? {
            name: product.name || '',
            group: product.group || '',
            description: product.description || '',
            unit: product.unit || 'pcs',
            rate: product.rate ?? '',
            disc: product.disc || '',
            hsn: product.hsn || ''
          }
        : EMPTY
    );
  }, [open, product]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    const name = form.name.trim();
    if (!name) {
      toast('Enter a product name');
      return;
    }
    const data = {
      name,
      group: form.group.trim(),
      description: form.description.trim(),
      unit: form.unit.trim() || 'pcs',
      rate: parseFloat(form.rate) || 0,
      disc: Math.min(100, Math.max(0, parseFloat(form.disc) || 0)),
      hsn: form.hsn.trim()
    };
    try {
      if (product) await apiPut('/products/' + product._id, data);
      else await apiPost('/products', data);
      await refreshProducts();
      toast('Product saved');
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast(err.message || 'Could not save product');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Edit product' : 'Add product'}>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Product name" className="col-span-2">
          <Input value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Group (optional)" className="col-span-2">
          <Input
            list="product-groups"
            value={form.group}
            onChange={set('group')}
            placeholder="Pick an existing group or type a new one"
          />
          <datalist id="product-groups">
            {[...new Set(products.map((p) => p.group).filter(Boolean))].sort().map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </Field>
        <Field label="Description" className="col-span-2">
          <Textarea value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Unit">
          <Input value={form.unit} onChange={set('unit')} placeholder="pcs / kg / box" />
        </Field>
        <Field label="Default rate (₹)">
          <Input type="number" value={form.rate} onChange={set('rate')} />
        </Field>
        <Field label="Default discount (%)" className="col-span-2">
          <Input type="number" value={form.disc} onChange={set('disc')} placeholder="0" />
        </Field>
        <Field label="HSN/SAC code (optional)" className="col-span-2">
          <Input
            value={form.hsn}
            onChange={set('hsn')}
            placeholder="Only used by the GST-Detailed invoice format"
          />
        </Field>
      </div>
      <div className="flex gap-4 justify-end mt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save}>
          Save product
        </Button>
      </div>
    </Modal>
  );
}
