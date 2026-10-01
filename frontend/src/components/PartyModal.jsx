import { useEffect, useState } from 'react';
import { apiPost, apiPut } from '../lib/api';
import { useStore } from '../lib/store';
import Modal from './Modal';
import { Field, Input, Textarea, Button } from './ui';

const EMPTY = { name: '', gstNo: '', phone: '', email: '', address: '' };

// Add/edit party modal. `party` is the party being edited, or null to add.
// onSaved receives the saved party (so callers like the editor can auto-select it).
export default function PartyModal({ open, party, onClose, onSaved }) {
  const refreshParties = useStore((s) => s.refreshParties);
  const toast = useStore((s) => s.toast);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      party
        ? {
            name: party.name || '',
            gstNo: party.gstNo || '',
            phone: party.phone || '',
            email: party.email || '',
            address: party.address || ''
          }
        : EMPTY
    );
  }, [open, party]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    const name = form.name.trim();
    if (!name) {
      toast('Enter a party name');
      return;
    }
    const data = {
      name,
      gstNo: form.gstNo.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim()
    };
    try {
      const saved = party
        ? await apiPut('/parties/' + party._id, data)
        : await apiPost('/parties', data);
      await refreshParties();
      toast('Party saved');
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      toast(err.message || 'Could not save party');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={party ? 'Edit party' : 'Add party'}>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="Party name" className="col-span-2">
          <Input value={form.name} onChange={set('name')} />
        </Field>
        <Field label="GSTIN">
          <Input value={form.gstNo} onChange={set('gstNo')} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Email">
          <Input value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Address" className="col-span-2">
          <Textarea value={form.address} onChange={set('address')} />
        </Field>
      </div>
      <div className="flex gap-4 justify-end mt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save}>
          Save party
        </Button>
      </div>
    </Modal>
  );
}
