import { fmtMoney, fmtDate, numberToWordsIndian, capitalizeWords } from '../lib/format';
import { docParty, docCompany, itemAmount } from './templateData';

// Tally-style GST Tax Invoice page. Fixed to the bill/invoice layout and
// styled via .doc-tpl-bill in bill.css. The header reproduces the classic
// Tally box grid (seller + buyer on the left, invoice meta on the right);
// item rows carry HSN/Quantity/Rate/per/Amount; the final page adds round
// off, totals, amount-in-words and the HSN tax summary + bank/signature.
export default function BillPage({ doc, items, isLast, pageNo, parties, settings }) {
  const co = docCompany(doc, settings);
  const extras = isLast ? billExtras(doc, co) : null;

  return (
    <div className="doc-page">
      <div className="bill-title">
        <span className="bill-title-main">
          GST TAX INVOICE{pageNo > 1 ? ` (Page ${pageNo})` : ''}
        </span>
        <span className="bill-title-sub">(ORIGINAL FOR RECIPIENT)</span>
      </div>

      <BillHeader doc={doc} parties={parties} settings={settings} />

      <table className="pitems">
        <thead>
          <tr style={{borderTop:"none"}}>
            <th style={{ width: 24 }}>SL<br />No:</th>
            <th>Description of Goods</th>
            <th style={{ width: 60 }}>HSN/SAC</th>
            <th style={{ width: 70 }}>Quantity</th>
            <th style={{ width: 60 }}>Rate</th>
            <th style={{ width: 32 }}>Per</th>
            <th style={{ width: 80 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className="c">{it.slNo ?? i + 1}</td>
              <td className="b">{it.description}</td>
              <td className="c">{it.hsn || ''}</td>
              <td className="c b">{it.qty} {it.unit}</td>
              <td className="r">{numOnly(it.rate)}</td>
              <td className="c">{it.unit}</td>
              <td className="r b">{numOnly(itemAmount(it))}</td>
            </tr>
          ))}
          {isLast ? (
            extras.rows
          ) : (
            <tr className="fill-row">
              <td colSpan={7} className="continued">continued ...</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="doc-bottom">
        {isLast ? extras.footer : <div className="bill-pagefoot">continued ...</div>}
        <div className="gen-note">This Is Computer Generated Invoice</div>
      </div>
    </div>
  );
}

function BillHeader({ doc, parties, settings }) {
  const party = docParty(doc, parties);
  const co = docCompany(doc, settings);
  return (
    <div className="bill-head">
      {/* Left column: seller + buyer */}
      <div className="bill-head-left">
        <div className="seller">
          <div className="co-name">{co.companyName || ''}</div>
          <div className="co-sub">
            <Multiline text={co.address || ''} />
            {co.phone && <div>{co.phone}</div>}
            {co.gstNo && <div>GSTIN/UIN: {co.gstNo}</div>}
            {co.stateName && <div>State Name : {co.stateName}</div>}
            {co.email && <div>E-Mail : {co.email}</div>}
          </div>
        </div>
        <div className="buyer">
          <div className="label">Buyer (Bill to)</div>
          <div className="party-name">{party.name || '—'}</div>
          <div className="co-sub-buyer">
            <Multiline text={party.address || ''} />
            {party.gstNo && (
              <div className="kv">GSTIN/UIN: {party.gstNo}</div>
            )}
            {party.stateName && (
              <div className="kv">State Name: {party.stateName}</div>
            )}
            {party.phone && (
              <div className="kv">Phone: {party.phone}</div>
            )}
            {party.email && (
              <div className="kv">E-Mail: {party.email}</div>
            )}
          </div>
        </div>
      </div>

      {/* Right column: invoice meta grid */}
      <div className="bill-head-right">
        <MetaCell label="Invoice No:" value={doc.docNumber} strong />
        <MetaCell label="Dated:" value={fmtDate(doc.date)} strong />
        <MetaCell label="Delivery Note:" value={doc.deliveryNote} />
        <MetaCell label="Mode/Terms of Payment:" value="" />
        <MetaCell label="Reference No & Date:" value="" />
        <MetaCell label="Other References:" value="" />
        <MetaCell label="Buyer's Order No:" value="" />
        <MetaCell label="Dated:" value="" />
        <MetaCell label="Dispatch Doc No:" value="" />
        <MetaCell label="Delivery Note Date:" value="" />
        <MetaCell label="Dispatched through:" value="" />
        <MetaCell label="Destination:" value="" />
        <MetaCell label="Terms of Delivery:" value={doc.terms} span2 />
      </div>
    </div>
  );
}

// Returns { rows, footer } for the final page: tax rows + totals inside the
// items table, then amount-in-words + HSN tax summary + bank/signature.
function billExtras(doc, co) {
  const items = doc.items || [];
  const isSplit = doc.gstMode === 'split';
  const isIgst = doc.gstMode === 'igst';
  const half = (doc.gstRate / 2).toFixed(0);

  const taxRows = [];
  if (isSplit) {
    taxRows.push(
      <tr key="cgst" className="tax-row">
        <td /><td className="tax-label">Output CGST@{half}%</td><td /><td /><td /><td className="c">{half} %</td>
        <td className="r">{numOnly(doc.cgst)}</td>
      </tr>,
      <tr key="sgst" className="tax-row">
        <td /><td className="tax-label">Output SGST@{half}%</td><td /><td /><td /><td className="c">{half} %</td>
        <td className="r">{numOnly(doc.sgst)}</td>
      </tr>
    );
  } else if (isIgst) {
    taxRows.push(
      <tr key="igst" className="tax-row">
        <td /><td className="tax-label">Output IGST@{doc.gstRate}%</td><td /><td /><td /><td className="c">{doc.gstRate} %</td>
        <td className="r">{numOnly(doc.igst)}</td>
      </tr>
    );
  }

  const roundRow = doc.roundOff ? (
    <tr key="round" className="tax-row">
      <td /><td className="tax-label"><i>Less :</i> <b style={{ float: 'right' }}>Round Off</b></td>
      <td /><td /><td /><td /><td className="r">{roundOffStr(doc.roundOff)}</td>
    </tr>
  ) : null;

  const subtotalRow = (
    <tr key="subtotal" className="subtotal-row">
      <td /><td /><td /><td /><td /><td /><td className="r">{numOnly(doc.subtotal)}</td>
    </tr>
  );

  // Tall spacer that pushes totals toward the bottom while keeping the
  // vertical column rules, mirroring the Tally sample's empty area.
  const fillRow = (
    <tr key="fill" className="fill-row">
      <td /><td /><td /><td /><td /><td /><td />
    </tr>
  );

  const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  const commonUnit = (items[0] && items[0].unit) || '';
  const totalRow = (
    <tr key="total" className="grand-row">
      <td /><td className="r"><b>Total</b></td><td /><td className="r"><b>{totalQty} {commonUnit}</b></td>
      <td /><td /><td className="r"><b>₹ {numOnly(doc.grandTotal)}</b></td>
    </tr>
  );

  return {
    rows: (
      <>
        {subtotalRow}
        {taxRows}
        {roundRow}
        {fillRow}
        {totalRow}
      </>
    ),
    footer: <BillFooter doc={doc} co={co} />
  };
}

function BillFooter({ doc, co }) {
  const isSplit = doc.gstMode === 'split';
  const isIgst = doc.gstMode === 'igst';
  const totalTax = (doc.cgst || 0) + (doc.sgst || 0) + (doc.igst || 0);

  // Group taxable value per HSN for the tax summary table.
  const hsnGroups = {};
  (doc.items || []).forEach((it) => {
    const key = it.hsn || '—';
    hsnGroups[key] = (hsnGroups[key] || 0) + itemAmount(it);
  });
  const cRate = isSplit ? doc.gstRate / 2 : isIgst ? doc.gstRate : 0;
  const sRate = isSplit ? doc.gstRate / 2 : 0;

  const summaryRows = Object.entries(hsnGroups).map(([hsn, amt]) => {
    const cAmt = (amt * cRate) / 100;
    const sAmt = (amt * sRate) / 100;
    return (
      <tr key={hsn}>
        <td className="l">{hsn}</td>
        <td className="r">{numOnly(amt)}</td>
        <td className="c">{cRate ? cRate.toFixed(0) + '%' : '-'}</td>
        <td className="r">{cRate ? numOnly(cAmt) : '-'}</td>
        <td className="c">{sRate ? sRate.toFixed(0) + '%' : '-'}</td>
        <td className="r">{sRate ? numOnly(sAmt) : '-'}</td>
        <td className="r">{numOnly(cAmt + sAmt)}</td>
      </tr>
    );
  });

  return (
    <div className="bill-foot">
      <div className="words-row">
        <div>
          <span className="small">Amount Chargeable (In words):</span>
          <div className="words-strong">{capitalizeWords(numberToWordsIndian(doc.grandTotal))} Rupees Only</div>
        </div>
        <div className="eoe">E. &amp; O.E</div>
      </div>

      <table className="taxsummary">
        <thead>
          <tr>
            <th rowSpan={2}>HSN/SAC</th>
            <th rowSpan={2}>Taxable<br />Value</th>
            <th colSpan={2}>CGST</th>
            <th colSpan={2}>SGST/UTGST</th>
            <th rowSpan={2}>Total<br />Tax Amount</th>
          </tr>
          <tr>
            <th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {summaryRows}
          <tr className="sum-total">
            <td className="r"><b>Total</b></td>
            <td className="r"><b>{numOnly(doc.subtotal)}</b></td>
            <td />
            <td className="r"><b>{numOnly(doc.cgst || 0)}</b></td>
            <td />
            <td className="r"><b>{numOnly(doc.sgst || 0)}</b></td>
            <td className="r"><b>{numOnly(totalTax)}</b></td>
          </tr>
        </tbody>
      </table>

      <div className="taxwords-row">
        <b>Tax Amount (In words):</b> {capitalizeWords(numberToWordsIndian(totalTax))} Rupees Only
      </div>

      <div className="bill-foot-grid">
        <div className="decl">
          <div className="label">Declaration</div>
          <div>
            We declare that this invoice shows the actual price of the goods
            described and that all particulars are true and correct.
          </div>
        </div>
        <div className="bank">
          <div className="label">Company's Bank Details</div>
          {co.bankName && <div className="kv"><span>Bank Name:</span><span> {co.bankName}</span></div>}
           {/* {co.accName && <div>Account Name: {co.accName}</div>} */}
          {co.accName && <div className="kv"><span>Account Name:</span><span> {co.accName}</span></div>}
          {co.accNo && <div className="kv"><span>A/c No:</span><span> {co.accNo}</span></div>}
          {(co.branch || co.ifsc) && (
            <div className="kv"><span>Branch &amp; IFS Code:</span><span> {[co.branch, co.ifsc].filter(Boolean).join(' & ')}</span></div>
          )}
          <div className="sign-box">
            For {co.companyName || ''}
            <div className="sign-line">Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCell({ label, value, strong, span2 }) {
  return (
    <div className={'meta-cell' + (span2 ? ' span2' : '')}>
      <div className="meta-label">{label}</div>
      <div className={'meta-value' + (strong ? ' strong' : '')}>{value || '\u00A0'}</div>
    </div>
  );
}

// Plain number with 2 decimals + Indian grouping (no ₹ symbol) — matches the
// Tally columns where the currency symbol only appears on the grand total.
function numOnly(n) {
  return fmtMoney(n).replace('₹', '');
}

function roundOffStr(n) {
  const v = numOnly(Math.abs(n));
  return n < 0 ? `(-)${v}` : v;
}

// Render text with \n as <br>, safely (no innerHTML).
function Multiline({ text }) {
  const parts = String(text || '').split('\n').filter((_, i, a) => i < a.length - 1 || a[i] !== '');
  return parts.map((line, i) => <div key={i}>{line}</div>);
}
