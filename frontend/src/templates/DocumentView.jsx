import { registry, resolveTemplateId } from './registry';
import { usePaginatedPages } from './usePaginatedPages';
import './templates.css';
import './bill.css';

// Renders a full document as a stack of A4 pages for a given template, with
// items paginated to fit. Used by the preview modal and the export mount.
export default function DocumentView({ doc, templateId, parties, settings }) {
  const id = resolveTemplateId(templateId);
  const { Page } = registry[id];
  const chunks = usePaginatedPages(id, doc, parties, settings);

  if (!doc) return null;

  return (
    <div className={`doc-tpl-${id}`}>
      <div className="doc-sheet">
        {chunks.map((slice, idx) => (
          <Page
            key={idx}
            doc={doc}
            items={slice}
            isLast={idx === chunks.length - 1}
            pageNo={idx + 1}
            pageCount={chunks.length}
            parties={parties}
            settings={settings}
          />
        ))}
      </div>
    </div>
  );
}
