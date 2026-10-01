import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost, apiPut } from '../lib/api';
import { useStore } from '../lib/store';
import { fmtMoney, todayISO, numberToWordsIndian, capitalizeWords } from '../lib/format';
import { computeTotals, resolveGstRate, lineAmount } from '../lib/calc';
import { previewDocNumber } from '../lib/docHelpers';
import { Topbar, Card, Button, Field, Input, Select } from '../components/ui';
import ItemsEditorTable, { blankItem } from '../components/ItemsEditorTable';
import ProductModal from '../components/ProductModal';
import PartyModal from '../components/PartyModal';
import PreviewModal from '../components/PreviewModal';

const KNOWN_RATES = ['0', '5', '8', '12', '18', '28'];

export default function NewDocument() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const settings = useStore((s) => s.settings);
  const parties = useStore((s) => s.parties);
  const documents = useStore((s) => s.documents);
  const refreshDocsAndSettings = useStore((s) => s.refreshDocsAndSettings);
  const toast = useStore((s) => s.toast);

  const [docType, setDocType] = useState('invoice');
  const [editingDocId, setEditingDocId] = useState(null);
  const [editingDocType, setEditingDocType] = useState(null);
  const [docNumber, setDocNumber] = useState('');
  const [date, setDate] = useState(todayISO());
  const [deliveryNote, setDeliveryNote] = useState('');
  const [terms, setTerms] = useState('');
  const [partyId, setPartyId] = useState('');
  const [rows, setRows] = useState([blankItem()]);
  const [gstMode, setGstMode] = useState('split');
  const [gstRateSel, setGstRateSel] = useState('12');
  const [gstCustom, setGstCustom] = useState('');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // ---- load: new (type) or edit (edit=id) based on query params ----
  useEffect(() => {
    const editId = params.get('edit');
    if (editId) {
      const doc = documents.find((d) => d._id === editId);
      if (doc) {
        loadDoc(doc);
        return;
      }
    }
    const t = params.get('type') === 'quotation' ? 'quotation' : 'invoice';
    freshForm(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, documents.length]);

  function freshForm(type) {
    setEditingDocId(null);
    setEditingDocType(null);
    setDocType(type);
    setDocNumber(previewDocNumber(settings, type));
    setDate(todayISO());
    setDeliveryNote('');
    setTerms('');
    setPartyId('');
    setRows([blankItem()]);
    setGstMode('split');
    setGstRateSel('12');
    setGstCustom('');
  }

  function loadDoc(doc) {
    setEditingDocId(doc._id);
    setEditingDocType(doc.type);
    setDocType(doc.type);
    setDocNumber(doc.docNumber);
    setDate(doc.date);
    setDeliveryNote(doc.deliveryNote || '');
    setTerms(doc.terms || '');
    setPartyId(doc.partyId || '');
    setRows(
      doc.items.length
        ? doc.items.map((it) => ({
            productId: it.productId || '',
            description: it.description,
            hsn: it.hsn || '',
            qty: it.qty,
            unit: it.unit,
            rate: it.rate,
            disc: it.disc
          }))
        : [blankItem()]
    );
    setGstMode(doc.gstMode === 'none' ? 'none' : doc.gstMode === 'igst' ? 'igst' : 'split');
    if (KNOWN_RATES.includes(String(doc.gstRate))) {
      setGstRateSel(String(doc.gstRate));
      setGstCustom('');
    } else {
      setGstRateSel('custom');
      setGstCustom(String(doc.gstRate));
    }
  }

  // Switching type: fresh number for a new doc or a conversion; restore the
  // original number when switching back to the loaded type.
  function changeType(type) {
    setDocType(type);
    if (!editingDocId) {
      setDocNumber(previewDocNumber(settings, type));
    } else if (editingDocType && type !== editingDocType) {
      setDocNumber(previewDocNumber(settings, type));
    } else if (editingDocType && type === editingDocType) {
      const orig = documents.find((d) => d._id === editingDocId);
      if (orig) setDocNumber(orig.docNumber);
    }
  }

  const rate = resolveGstRate(gstRateSel, gstCustom);
  const totals = useMemo(() => computeTotals(rows, gstMode, rate), [rows, gstMode, rate]);

  const selectedParty = parties.find((p) => p._id === partyId);

  function collect() {
    return {
      type: docType,
      docNumber: docNumber.trim(),
      date: date || todayISO(),
      deliveryNote: deliveryNote.trim(),
      terms: terms.trim(),
      partyId,
      items: rows
        .filter((it) => (it.description || it.productId))
        .map((it, i) => ({
          slNo: i + 1,
          productId: it.productId || null,
          description: it.description,
          hsn: it.hsn || '',
          qty: it.qty,
          unit: it.unit,
          rate: it.rate,
          disc: it.disc,
          amount: lineAmount(it)
        })),
      subtotal: totals.subtotal,
      gstMode: totals.mode,
      gstRate: totals.rate,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      roundOff: totals.roundOff,
      grandTotal: totals.grand
    };
  }

  async function save() {
    const doc = collect();
    if (!doc.docNumber) {
      toast('Please enter a document number');
      return;
    }
    if (!doc.partyId) {
      toast('Please select a party');
      return;
    }
    if (doc.items.length === 0) {
      toast('Please add at least one item');
      return;
    }
    // Converting an existing doc to the other type saves a NEW document so the
    // original stays intact (quotation + bill both exist).
    const isConversion = editingDocId && editingDocType && doc.type !== editingDocType;
    try {
      let saved;
      if (editingDocId && !isConversion) saved = await apiPut('/documents/' + editingDocId, doc);
      else saved = await apiPost('/documents', doc);
      await refreshDocsAndSettings();
      setEditingDocId(saved._id);
      setEditingDocType(saved.type);
      toast(
        isConversion
          ? doc.type === 'invoice'
            ? 'Converted to a new bill'
            : 'Converted to a new quotation'
          : doc.type === 'invoice'
          ? 'Bill saved'
          : 'Quotation saved'
      );
      navigate('/saved');
    } catch (err) {
      toast(err.message || 'Could not save the document');
    }
  }

  function openPreview() {
    const doc = collect();
    if (!doc.partyId) {
      toast('Select a party first');
      return;
    }
    // Attach snapshots so the template renders company/party exactly like a saved doc.
    const party = parties.find((p) => p._id === doc.partyId);
    setPreviewDoc({
      ...doc,
      partySnapshot: party
        ? {
            name: party.name,
            gstNo: party.gstNo,
            email: party.email,
            phone: party.phone,
            address: party.address
          }
        : undefined,
      companySnapshot: settings || {}
    });
  }

  const title = docType === 'invoice' ? (editingDocId ? 'Edit bill' : 'New bill') : editingDocId ? 'Edit quotation' : 'New quotation';
  const docNoLabel = docType === 'invoice' ? 'Invoice No.' : 'Quotation No.';

  return (
    <section>
      <Topbar title={title} desc="GST is applied on the total bill value.">
        <div className="flex gap-2">
          <RadioPill
            checked={docType === 'invoice'}
            onChange={() => changeType('invoice')}
            label="Bill (Invoice)"
          />
          <RadioPill
            checked={docType === 'quotation'}
            onChange={() => changeType('quotation')}
            label="Quotation"
          />
        </div>
      </Topbar>

      <Card title="Document details">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          <Field label={docNoLabel}>
            <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Delivery note">
            <Input
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field label="Terms of payment / delivery">
            <Input
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g. 100% advance"
            />
          </Field>
        </div>
      </Card>

      <Card title="Bill to (party)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <Field label="Select party">
            <Select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
              <option value="">— Select party —</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="self-end">
            <Button variant="ghost" sm onClick={() => setPartyModalOpen(true)}>
              + Add new party
            </Button>
          </div>
        </div>
        {selectedParty && (
          <div className="text-xs text-muted mt-2.5">
            <b>{selectedParty.name}</b>
            {selectedParty.gstNo ? ` · GSTIN: ${selectedParty.gstNo}` : ''}
            {selectedParty.email ? ` · ${selectedParty.email}` : ''}
            {selectedParty.address ? (
              <>
                <br />
                {selectedParty.address}
              </>
            ) : null}
          </div>
        )}
      </Card>

      <Card title="Items">
        <ItemsEditorTable rows={rows} setRows={setRows} />
        <div className="mt-2.5 flex gap-2">
          <Button variant="ghost" sm onClick={() => setRows((rs) => [...rs, blankItem()])}>
            + Add row
          </Button>
          <Button variant="ghost" sm onClick={() => setProductModalOpen(true)}>
            + New product
          </Button>
        </div>

        <div className="mt-3.5 flex justify-end">
          <table className="min-w-[340px] border-collapse">
            <tbody>
              <TotalRow label="Subtotal" value={fmtMoney(totals.subtotal)} />
              <tr>
                <td colSpan={2} className="pt-2">
                  <div className="flex gap-2 flex-wrap items-center">
                    <GstModeRadio value="none" cur={gstMode} set={setGstMode} label="No GST" />
                    <GstModeRadio value="split" cur={gstMode} set={setGstMode} label="CGST + SGST" />
                    <GstModeRadio value="igst" cur={gstMode} set={setGstMode} label="IGST" />
                    {gstMode !== 'none' && (
                      <>
                        <Select
                          className="w-auto"
                          value={gstRateSel}
                          onChange={(e) => setGstRateSel(e.target.value)}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="8">8%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                          <option value="custom">Custom</option>
                        </Select>
                        {gstRateSel === 'custom' && (
                          <Input
                            className="w-14"
                            placeholder="%"
                            value={gstCustom}
                            onChange={(e) => setGstCustom(e.target.value)}
                          />
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
              {gstMode === 'split' && (
                <>
                  <TotalRow label={`CGST @ ${(rate / 2).toFixed(2)}%`} value={fmtMoney(totals.cgst)} />
                  <TotalRow label={`SGST @ ${(rate / 2).toFixed(2)}%`} value={fmtMoney(totals.sgst)} />
                </>
              )}
              {gstMode === 'igst' && <TotalRow label="IGST" value={fmtMoney(totals.igst)} />}
              <TotalRow label="Round off" value={fmtMoney(totals.roundOff)} />
              <tr className="border-t-2 border-navy font-bold text-[15.5px] text-navy">
                <td className="pt-2.5 pr-2.5">Grand total</td>
                <td className="pt-2.5 text-right tabular-nums">{fmtMoney(totals.grand)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-2.5 px-3 py-2 bg-[#F7F8FA] border border-dashed border-bordr-strong rounded-md text-[13px] text-navy">
          Amount in words: Rupees {capitalizeWords(numberToWordsIndian(totals.grand))} Only
        </div>
      </Card>

      <div className="flex gap-4 justify-end flex-wrap">
        <Button variant="ghost" onClick={() => freshForm(docType)}>
          Clear
        </Button>
        <Button variant="ghost" onClick={openPreview}>
          Preview / Print / PDF
        </Button>
        <Button variant="primary" onClick={save}>
          Save document
        </Button>
      </div>

      <ProductModal open={productModalOpen} product={null} onClose={() => setProductModalOpen(false)} />
      <PartyModal
        open={partyModalOpen}
        party={null}
        onClose={() => setPartyModalOpen(false)}
        onSaved={(saved) => saved && setPartyId(saved._id)}
      />
      <PreviewModal
        open={!!previewDoc}
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </section>
  );
}

function RadioPill({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-1.5 text-[13px] border border-bordr-strong px-2.5 py-1.5 rounded-md cursor-pointer">
      <input type="radio" checked={checked} onChange={onChange} className="m-0" />
      {label}
    </label>
  );
}

function GstModeRadio({ value, cur, set, label }) {
  return (
    <label className="flex items-center gap-1.5 text-[13px] border border-bordr-strong px-2.5 py-1.5 rounded-md cursor-pointer">
      <input
        type="radio"
        name="gstMode"
        checked={cur === value}
        onChange={() => set(value)}
        className="m-0"
      />
      {label}
    </label>
  );
}

function TotalRow({ label, value }) {
  return (
    <tr>
      <td className="px-2.5 py-1.5 text-[13.5px] text-muted">{label}</td>
      <td className="px-2.5 py-1.5 text-[13.5px] text-right tabular-nums">{value}</td>
    </tr>
  );
}
