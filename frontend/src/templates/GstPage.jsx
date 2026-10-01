import { fmtMoney, fmtDate, numberToWordsIndian, capitalizeWords } from '../lib/format';
import { docParty, docCompany, itemAmount } from './templateData';

// One A4 page for the GST Detailed template (HSN column + tax summary).
// Mirrors buildGstPage and its header/rows/extras/footer helpers.
export default function GstPage({ doc, items, isLast, pageNo, pageCount, parties, settings, measuring }) {
  const co = docCompany(doc, settings);
  const extras = isLast ? gstExtras(doc, co) : null;

  return (
    <div
      className="doc-page doc-border"
      style={measuring ? { height: 'auto', minHeight: 0, maxHeight: 'none', overflow: 'visible' } : undefined}
    >
      <GstHeader doc={doc} parties={parties} settings={settings} />
      <table className="pitems">
        <thead>
          <tr>
            <th style={{ width: 26 }}>Sl</th>
            <th>Description of Goods</th>
            <th style={{ width: 60 }}>HSN/SAC</th>
            <th style={{ width: 60 }}>Quantity</th>
            <th style={{ width: 65 }}>Rate</th>
            <th style={{ width: 40 }}>per</th>
            <th style={{ width: 80 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className="c">{it.slNo ?? i + 1}</td>
              <td>{it.description}</td>
              <td className="c">{it.hsn || ''}</td>
              <td className="c">{it.qty}</td>
              <td className="r">{fmtMoney(it.rate)}</td>
              <td className="c">{it.unit}</td>
              <td className="r">{fmtMoney(itemAmount(it))}</td>
            </tr>
          ))}
          {isLast ? extras.rows : <tr className="continue-line"><td colSpan={7}>Continued...</td></tr>}
        </tbody>
      </table>
      <div className="doc-bottom">
        {isLast ? extras.footer : <GstFooter co={co} />}
        <div className="page-no">
          Page {pageNo} of {pageCount}
        </div>
      </div>
    </div>
  );
}

function GstHeader({ doc, parties, settings }) {
  const party = docParty(doc, parties);
  const co = docCompany(doc, settings);
  const isInvoice = doc.type === 'invoice';
  return (
    <>
      <div className="doc-head">
        <div>
          <div className="co-name">{co.companyName || ''}</div>
          <div className="co-sub">
            <Multiline text={co.address || ''} />
            <br />
            {co.phone ? `Phone: ${co.phone}  ` : ''}
            {co.email ? `Email: ${co.email}` : ''}
            <br />
            {co.gstNo ? `GSTIN/UIN: ${co.gstNo}` : ''}
          </div>
        </div>
      </div>
      <div className="doc-type">{isInvoice ? 'Tax Invoice' : 'Quotation'}</div>
      <div className="doc-meta">
        <div className="half">
          <div className="m-title">Party</div>
          <div>
            <b>{party.name || '—'}</b>
          </div>
          <div>
            <Multiline text={party.address || ''} />
          </div>
          {party.gstNo && <div>GSTIN/UIN: {party.gstNo}</div>}
          {party.email && <div>Email: {party.email}</div>}
        </div>
        <div className="half">
          <MRow label={isInvoice ? 'Invoice No.' : 'Quotation No.'} value={doc.docNumber} />
          <MRow label="Dated" value={fmtDate(doc.date)} />
          {doc.deliveryNote && <MRow label="Delivery Note" value={doc.deliveryNote} />}
          {doc.terms && <MRow label="Terms of Delivery" value={doc.terms} />}
        </div>
      </div>
    </>
  );
}

// Returns { rows: <>…tax rows + total row</>, footer: <>words + tax summary + bank/sign</> }
function gstExtras(doc, co) {
  const items = doc.items || [];
  const isSplit = doc.gstMode === 'split';
  const half = (doc.gstRate / 2).toFixed(2);

  const taxRows = [];
  if (isSplit) {
    taxRows.push(
      <tr key="cgst">
        <td /><td className="tax-label">Output CGST @ {half}%</td><td /><td />
        <td className="c">{half}</td><td className="c">%</td><td className="r">{fmtMoney(doc.cgst)}</td>
      </tr>,
      <tr key="sgst">
        <td /><td className="tax-label">Output SGST @ {half}%</td><td /><td />
        <td className="c">{half}</td><td className="c">%</td><td className="r">{fmtMoney(doc.sgst)}</td>
      </tr>
    );
  } else if (doc.gstMode === 'igst') {
    taxRows.push(
      <tr key="igst">
        <td /><td className="tax-label">Output IGST @ {doc.gstRate}%</td><td /><td />
        <td className="c">{doc.gstRate}</td><td className="c">%</td><td className="r">{fmtMoney(doc.igst)}</td>
      </tr>
    );
  }

  const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  const commonUnit = (items[0] && items[0].unit) || '';
  const totalRow = (
    <tr key="total" style={{ fontWeight: 700 }}>
      <td /><td style={{ textAlign: 'right' }}>Total</td><td />
      <td className="c">{totalQty} {commonUnit}</td><td /><td /><td className="r">{fmtMoney(doc.grandTotal)}</td>
    </tr>
  );

  // HSN-grouped tax summary
  const hsnGroups = {};
  items.forEach((it) => {
    const key = it.hsn || '—';
    hsnGroups[key] = (hsnGroups[key] || 0) + itemAmount(it);
  });
  const summaryRows = Object.entries(hsnGroups).map(([hsn, amt]) => {
    const cRate = isSplit ? doc.gstRate / 2 : doc.gstMode === 'igst' ? doc.gstRate : 0;
    const sRate = isSplit ? doc.gstRate / 2 : 0;
    const cAmt = (amt * cRate) / 100;
    const sAmt = isSplit ? (amt * sRate) / 100 : 0;
    return (
      <tr key={hsn}>
        <td className="l">{hsn}</td>
        <td>{fmtMoney(amt)}</td>
        <td>{cRate ? cRate.toFixed(2) + '%' : '-'}</td>
        <td>{cRate ? fmtMoney(cAmt) : '-'}</td>
        <td>{isSplit ? sRate.toFixed(2) + '%' : '-'}</td>
        <td>{isSplit ? fmtMoney(sAmt) : '-'}</td>
        <td>{fmtMoney(cAmt + sAmt)}</td>
      </tr>
    );
  });
  const totalTax = (doc.cgst || 0) + (doc.sgst || 0) + (doc.igst || 0);

  return {
    rows: (
      <>
        {taxRows}
        {totalRow}
      </>
    ),
    footer: (
      <>
        <div className="words-row">
          <div>
            <b>Amount Chargeable (in words):</b>
            <br />
            {`INR ${capitalizeWords(numberToWordsIndian(doc.grandTotal))} Only`}
          </div>
          <div>E. &amp; O.E</div>
        </div>
        <table className="taxsummary">
          <thead>
            <tr>
              <th rowSpan={2}>HSN/SAC</th>
              <th rowSpan={2}>Taxable Value</th>
              <th colSpan={2}>Central Tax</th>
              <th colSpan={2}>State Tax</th>
              <th rowSpan={2}>Total Tax Amount</th>
            </tr>
            <tr>
              <th>Rate</th>
              <th>Amount</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows}
            <tr style={{ fontWeight: 700 }}>
              <td className="l">Total</td>
              <td>{fmtMoney(doc.subtotal)}</td>
              <td />
              <td>{fmtMoney(doc.cgst || 0)}</td>
              <td />
              <td>{fmtMoney(doc.sgst || 0)}</td>
              <td>{fmtMoney(totalTax)}</td>
            </tr>
          </tbody>
        </table>
        <div className="words-row">
          <b>Tax Amount (in words):</b> INR {capitalizeWords(numberToWordsIndian(totalTax))} Only
        </div>
        <GstFooter co={co} />
      </>
    )
  };
}

function GstFooter({ co }) {
  return (
    <div className="foot-grid">
      <div className="half">
        <div className="f-title">Bank details</div>
        {co.bankName && <div>Bank: {co.bankName}</div>}
        {co.accName && <div>Account name: {co.accName}</div>}
        {co.accNo && <div>Account no: {co.accNo}</div>}
        {co.ifsc && <div>IFSC: {co.ifsc}</div>}
      </div>
      <div className="half">
        <div>{co.jurisdiction || ''}</div>
        <div className="sign-box">
          for {co.companyName || ''}
          <div className="sign-line">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}

function MRow({ label, value }) {
  return (
    <div className="m-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Multiline({ text }) {
  const parts = String(text || '').split('\n');
  return parts.map((line, i) => (
    <span key={i}>
      {line}
      {i < parts.length - 1 && <br />}
    </span>
  ));
}
