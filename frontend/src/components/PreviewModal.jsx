import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useStore } from '../lib/store';
import { docParty } from '../templates/templateData';
import { TEMPLATE_LIST, resolveTemplateId } from '../templates/registry';
import DocumentView from '../templates/DocumentView';
import { Button, Select } from './ui';

// Full-document preview with Print and Download PDF. The visible preview is a
// scaled-down DocumentView; print/PDF use an unscaled copy rendered into the
// off-screen #exportMount (portal) so output stays pixel-exact A4.
export default function PreviewModal({ open, doc, onClose }) {
  const settings = useStore((s) => s.settings);
  const parties = useStore((s) => s.parties);

  const [templateId, setTemplateId] = useState('classic');
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [mountEl, setMountEl] = useState(null);

  useEffect(() => {
    if (open) {
      setTemplateId(resolveTemplateId((settings && settings.template) || 'classic'));
      setStatus('');
    }
  }, [open, settings]);

  useEffect(() => {
    setMountEl(document.getElementById('exportMount'));
  }, []);

  if (!open || !doc) return null;

  const exportEl = () => mountEl?.firstElementChild || null;

  async function printDoc() {
    const el = exportEl();
    if (!el) {
      setStatus('Nothing to print yet.');
      return;
    }
    document.body.classList.add('is-exporting-print');
    const done = () => {
      window.removeEventListener('afterprint', done);
      document.body.classList.remove('is-exporting-print');
    };
    window.addEventListener('afterprint', done);
    window.print();
  }

  async function downloadPdf() {
    const mount = mountEl;
    const el = exportEl();
    if (!el) {
      setStatus('Nothing to export yet.');
      return;
    }
    setExporting(true);
    setStatus('Preparing PDF…');

    // Filename: PartyName-DocNumber.pdf
    const party = docParty(doc, parties);
    const partyName =
      (party.name || '').trim().replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') || 'Party';
    const docNum = (doc.docNumber || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '') || 'document';
    const filename = `${partyName}-${docNum}.pdf`;

    // Bring the mount on-screen (offscreen left:-10000 can blank html2canvas).
    mount.dataset.busy = '1';
    mount.style.left = '0px';
    mount.style.top = '0px';

    const capture = document.createElement('div');
    capture.className = el.className;
    capture.style.cssText =
      'position:fixed;left:0;top:0;width:794px;background:#fff;z-index:0;pointer-events:none;';
    document.body.appendChild(capture);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready.catch(() => {});
      }
      const pages = [...el.querySelectorAll('.doc-page')];
      if (pages.length === 0) throw new Error('No pages to export');

      const canvases = [];
      for (let i = 0; i < pages.length; i++) {
        setStatus(`Preparing PDF… page ${i + 1} of ${pages.length}`);
        capture.innerHTML = '';
        const clone = pages[i].cloneNode(true);
        clone.style.margin = '0';
        clone.style.transform = 'none';
        clone.style.width = '794px';
        clone.style.height = '1123px';
        capture.appendChild(clone);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        canvases.push(
          await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 794,
            height: 1123,
            windowWidth: 794,
            scrollX: 0,
            scrollY: 0,
            logging: false
          })
        );
      }

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const w = 210;
      const h = 297;
      for (let i = 0; i < canvases.length; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(canvases[i].toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
      }
      pdf.save(filename);
      setStatus(`PDF downloaded as "${filename}". Check your Downloads folder.`);
    } catch (err) {
      console.error('PDF generation failed', err);
      setStatus('Could not generate the PDF. Error: ' + err.message);
    } finally {
      capture.remove();
      delete mount.dataset.busy;
      mount.style.left = '';
      mount.style.top = '';
      setExporting(false);
    }
  }

  const view = (
    <DocumentView doc={doc} templateId={templateId} parties={parties} settings={settings} />
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-[rgba(15,25,40,.45)] flex items-start justify-center px-4 py-10 z-[900] overflow-y-auto"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div className="bg-white rounded-xl w-[97%] max-w-[880px] p-4 mt-5">
          <div className="flex justify-between items-center mb-3 gap-2.5 flex-wrap">
            <h3 className="text-[15px] font-semibold text-navy m-0">Document preview</h3>
            <div className="flex gap-2 flex-wrap items-center">
              <Select
                className="w-auto"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {TEMPLATE_LIST.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
              <Button variant="ghost" sm onClick={printDoc} disabled={exporting}>
                🖨 Print
              </Button>
              <Button variant="primary" sm onClick={downloadPdf} disabled={exporting}>
                ⬇ Download PDF
              </Button>
              <Button variant="ghost" sm onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="max-h-[74vh] overflow-auto bg-[#E7EAEF] border border-bordr p-4 flex justify-center">
            <div style={{ zoom: 0.82 }}>{view}</div>
          </div>

          <div className="text-xs text-muted mt-2 min-h-[16px]">{status}</div>
        </div>
      </div>

      {/* Unscaled copy for print + PDF capture, portaled into #exportMount. */}
      {mountEl && createPortal(view, mountEl)}
    </>
  );
}
