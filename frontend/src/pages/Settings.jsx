import { useEffect, useState } from 'react';
import { apiPut } from '../lib/api';
import { useStore } from '../lib/store';
import { TEMPLATE_LIST } from '../templates/registry';
import { Topbar, Card, Button, Field, Input, Textarea, Select } from '../components/ui';

const DEFAULTS = {
  companyName: '',
  gstNo: '',
  address: '',
  phone: '',
  email: '',
  invPrefix: 'INV',
  invCounter: 1,
  qtPrefix: 'QT',
  qtCounter: 1,
  bankName: '',
  accName: '',
  accNo: '',
  ifsc: '',
  branch: '',
  upi: '',
  jurisdiction: '',
  template: 'classic'
};

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const refreshSettings = useStore((s) => s.refreshSettings);
  const toast = useStore((s) => s.toast);
  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    if (settings) setForm({ ...DEFAULTS, ...settings });
  }, [settings]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    const data = {
      companyName: (form.companyName || '').trim() || 'My Business',
      gstNo: (form.gstNo || '').trim(),
      address: (form.address || '').trim(),
      phone: (form.phone || '').trim(),
      email: (form.email || '').trim(),
      invPrefix: (form.invPrefix || '').trim() || 'INV',
      invCounter: parseInt(form.invCounter) || 1,
      qtPrefix: (form.qtPrefix || '').trim() || 'QT',
      qtCounter: parseInt(form.qtCounter) || 1,
      bankName: (form.bankName || '').trim(),
      accName: (form.accName || '').trim(),
      accNo: (form.accNo || '').trim(),
      ifsc: (form.ifsc || '').trim(),
      branch: (form.branch || '').trim(),
      upi: (form.upi || '').trim(),
      jurisdiction: (form.jurisdiction || '').trim(),
      template: form.template || 'classic'
    };
    try {
      await apiPut('/settings', data);
      await refreshSettings();
      toast('Settings saved');
    } catch (err) {
      toast(err.message || 'Could not save settings');
    }
  }

  return (
    <section>
      <Topbar
        title="Settings"
        desc="Your business details, shown on every bill and quotation."
      />

      <Card title="Company details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Field label="Company name">
            <Input value={form.companyName} onChange={set('companyName')} />
          </Field>
          <Field label="GSTIN">
            <Input value={form.gstNo} onChange={set('gstNo')} />
          </Field>
          <Field label="Address" className="md:col-span-2">
            <Textarea value={form.address} onChange={set('address')} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={set('email')} />
          </Field>
        </div>
      </Card>

      <Card title="Numbering">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <Field label="Bill prefix">
            <Input value={form.invPrefix} onChange={set('invPrefix')} />
          </Field>
          <Field label="Next bill number">
            <Input type="number" value={form.invCounter} onChange={set('invCounter')} />
          </Field>
          <Field label="Quotation prefix">
            <Input value={form.qtPrefix} onChange={set('qtPrefix')} />
          </Field>
          <Field label="Next quotation number">
            <Input type="number" value={form.qtCounter} onChange={set('qtCounter')} />
          </Field>
        </div>
      </Card>

      <Card title="Bank details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Field label="Bank name">
            <Input value={form.bankName} onChange={set('bankName')} />
          </Field>
          <Field label="Account name">
            <Input value={form.accName} onChange={set('accName')} />
          </Field>
          <Field label="Account number">
            <Input value={form.accNo} onChange={set('accNo')} />
          </Field>
          <Field label="IFSC code">
            <Input value={form.ifsc} onChange={set('ifsc')} />
          </Field>
          <Field label="Branch">
            <Input value={form.branch} onChange={set('branch')} />
          </Field>
          <Field label="UPI ID (optional)">
            <Input value={form.upi} onChange={set('upi')} />
          </Field>
        </div>
      </Card>

      <Card title="Terms & jurisdiction">
        <Field label="Footer note">
          <Textarea value={form.jurisdiction} onChange={set('jurisdiction')} />
        </Field>
      </Card>

      <Card title="Invoice / quotation format">
        <Field label="Default template">
          <Select value={form.template} onChange={set('template')}>
            {TEMPLATE_LIST.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <div className="text-xs text-muted mt-1">
            Used whenever you print or download a new bill or quotation. You can
            still pick a different one on the fly from the preview screen.
          </div>
        </Field>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={save}>
          Save settings
        </Button>
      </div>
    </section>
  );
}
