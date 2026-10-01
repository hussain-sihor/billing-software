import { fmtMoney, fmtDate, numberToWordsIndian, capitalizeWords } from '../lib/format';
import { docParty, docCompany, itemAmount } from './templateData';

// One A4 page for the five "simple" templates (classic/modern/compact/bold/
// ledger). They share this markup and differ only via .doc-tpl-<id> CSS.
// Mirrors buildGenericPage + its header/rows/totals/footer helpers.
export default function GenericPage({ doc, items, isLast, pageNo, pageCount, parties, settings, measuring }) {
  return (
    <div
      className="doc-page doc-border"
      style={measuring ? { height: 'auto', minHeight: 0, maxHeight: 'none', overflow: 'visible' } : undefined}
    >
      <GenericHeader doc={doc} parties={parties} settings={settings} />
      <table className="pitems">
        <thead>
          <tr>
            <th style={{ width: 30 }}>Sl</th>
            <th>Description</th>
            <th style={{ width: 55 }}>Qty</th>
            <th style={{ width: 50 }}>Unit</th>
            <th style={{ width: 75 }}>Rate</th>
            <th style={{ width: 55 }}>Disc</th>
            <th style={{ width: 90 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className="c">{it.slNo ?? i + 1}</td>
              <td>{it.description}</td>
              <td className="c">{it.qty}</td>
              <td className="c">{it.unit}</td>
              <td className="r">{fmtMoney(it.rate)}</td>
              <td className="c">{it.disc ? it.disc + '%' : '-'}</td>
              <td className="r">{fmtMoney(itemAmount(it))}</td>
            </tr>
          ))}
          {!isLast && (
            <tr className="continue-line">
              <td colSpan={7}>Continued...</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="doc-bottom">
        {isLast ? (
          <GenericTotals doc={doc} settings={settings} />
        ) : (
          <GenericFooter doc={doc} settings={settings} />
        )}
        <div className="page-no">
          Page {pageNo} of {pageCount}
        </div>
      </div>
    </div>
  );
}

function GenericHeader({ doc, parties, settings }) {
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
            {co.gstNo ? `GSTIN: ${co.gstNo}` : ''}
          </div>
        </div>
        <div className="doc-type">{isInvoice ? 'Tax Invoice' : 'Quotation'}</div>
      </div>
      <div className="doc-meta">
        <div className="half">
          <div className="m-title">Bill to</div>
          <div>
            <b>{party.name || '—'}</b>
          </div>
          <div>
            <Multiline text={party.address || ''} />
          </div>
          {party.gstNo && <div>GSTIN: {party.gstNo}</div>}
          {party.email && <div>Email: {party.email}</div>}
          {party.phone && <div>Phone: {party.phone}</div>}
        </div>
        <div className="half">
          <MRow label={isInvoice ? 'Invoice No.' : 'Quotation No.'} value={doc.docNumber} />
          <MRow label="Date" value={fmtDate(doc.date)} />
          {doc.deliveryNote && <MRow label="Delivery note" value={doc.deliveryNote} />}
          {doc.terms && <MRow label="Terms" value={doc.terms} />}
        </div>
      </div>
    </>
  );
}

function GenericTotals({ doc, settings }) {
  const co = docCompany(doc, settings);
  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr className="ptot-row">
            <td colSpan={5} style={{ border: 'none' }} />
            <td>Subtotal</td>
            <td className="r">{fmtMoney(doc.subtotal)}</td>
          </tr>
          <GstRows doc={doc} />
          <tr className="ptot-row">
            <td colSpan={5} style={{ border: 'none' }} />
            <td>Round off</td>
            <td className="r">{fmtMoney(doc.roundOff)}</td>
          </tr>
          <tr className="ptot-row grand">
            <td colSpan={5} style={{ border: 'none' }} />
            <td>Grand total</td>
            <td className="r">{fmtMoney(doc.grandTotal)}</td>
          </tr>
        </tbody>
      </table>
      <div className="words-row">
        <b>Amount in words:</b> Rupees {capitalizeWords(numberToWordsIndian(doc.grandTotal))} Only
      </div>
      <FootGrid co={co} />
    </>
  );
}

function GenericFooter({ doc, settings }) {
  return <FootGrid co={docCompany(doc, settings)} />;
}

function GstRows({ doc }) {
  if (doc.gstMode === 'split') {
    return (
      <>
        <tr className="ptot-row">
          <td colSpan={5} style={{ border: 'none' }} />
          <td>CGST @ {(doc.gstRate / 2).toFixed(2)}%</td>
          <td className="r">{fmtMoney(doc.cgst)}</td>
        </tr>
        <tr className="ptot-row">
          <td colSpan={5} style={{ border: 'none' }} />
          <td>SGST @ {(doc.gstRate / 2).toFixed(2)}%</td>
          <td className="r">{fmtMoney(doc.sgst)}</td>
        </tr>
      </>
    );
  }
  if (doc.gstMode === 'igst') {
    return (
      <tr className="ptot-row">
        <td colSpan={5} style={{ border: 'none' }} />
        <td>IGST @ {doc.gstRate}%</td>
        <td className="r">{fmtMoney(doc.igst)}</td>
      </tr>
    );
  }
  return null;
}

function FootGrid({ co }) {
  return (
    <div className="foot-grid">
      <div className="half">
        <div className="f-title">Bank details</div>
        {co.bankName && <div>Bank: {co.bankName}</div>}
        {co.accName && <div>Account name: {co.accName}</div>}
        {co.accNo && <div>Account no: {co.accNo}</div>}
        {co.ifsc && <div>IFSC: {co.ifsc}</div>}
        {co.branch && <div>Branch: {co.branch}</div>}
        {co.upi && <div>UPI: {co.upi}</div>}
      </div>
      <div className="half">
        <div className="f-title">Terms</div>
        <div>{co.jurisdiction || ''}</div>
        <div className="sign-box">
          For {co.companyName || ''}
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

// Render text with \n as <br>, safely (no innerHTML).
function Multiline({ text }) {
  const parts = String(text || '').split('\n');
  return parts.map((line, i) => (
    <span key={i}>
      {line}
      {i < parts.length - 1 && <br />}
    </span>
  ));
}
