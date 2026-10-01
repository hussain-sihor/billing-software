import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { registry } from './registry';

const PAGE_PX = 1123;

// Measure whether a candidate page (given template + props) fits within one A4
// page. Renders synchronously into an off-screen host and reads scrollHeight.
function makeFits(templateId, doc, parties, settings) {
  const PageComp = registry[templateId]?.Page || registry.classic.Page;

  // Reuse a single off-screen host + React root across measurements.
  let host = document.getElementById('pageMeasureHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'pageMeasureHost';
    host.setAttribute('aria-hidden', 'true');
    document.body.appendChild(host);
  }
  host.className = `doc-tpl-${templateId}`;
  const root = createRoot(host);

  const fits = (slice, isLast) => {
    flushSync(() => {
      root.render(
        <PageComp
          doc={doc}
          items={slice}
          isLast={isLast}
          pageNo={1}
          pageCount={1}
          parties={parties}
          settings={settings}
          measuring
        />
      );
    });
    const page = host.querySelector('.doc-page');
    const ok = !page || page.scrollHeight <= PAGE_PX + 1;
    return ok;
  };

  const cleanup = () => {
    flushSync(() => root.unmount());
  };

  return { fits, cleanup };
}

// Split a document's items across A4 pages. Direct port of chunkItemsForPages:
// greedy fill with a binary search for how many items fit on each page, always
// reserving at least one item for the last page (which carries the totals).
export function chunkItemsForPages(templateId, doc, parties, settings) {
  const items = Array.isArray(doc.items) ? doc.items : [];
  if (items.length === 0) return [[]];

  const { fits, cleanup } = makeFits(templateId, doc, parties, settings);
  try {
    const chunks = [];
    let i = 0;
    let guard = 0;
    while (i < items.length) {
      if (++guard > 400) break;
      const rest = items.slice(i);
      if (fits(rest, true)) {
        chunks.push(rest);
        break;
      }
      let lo = 1;
      let hi = rest.length;
      let best = 0;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (fits(rest.slice(0, mid), false)) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      if (best <= 0) best = 1;
      if (best >= rest.length) {
        if (rest.length > 1) {
          chunks.push(rest.slice(0, rest.length - 1));
          i += rest.length - 1;
        } else {
          chunks.push(rest);
          chunks.push([]);
          break;
        }
        continue;
      }
      chunks.push(rest.slice(0, best));
      i += best;
    }
    return chunks.length ? chunks : [[]];
  } finally {
    cleanup();
  }
}

// Hook: returns the array of item-chunks (one per page) for a doc + template.
// Measurement renders into an off-screen React root, so it runs in an effect
// (never during render — flushSync must not be called while rendering).
// Until the first measurement completes it returns a single page with all
// items, which is correct for short documents and gets refined for long ones.
export function usePaginatedPages(templateId, doc, parties, settings) {
  const [chunks, setChunks] = useState(() => [doc && Array.isArray(doc.items) ? doc.items : []]);

  useEffect(() => {
    if (!doc) {
      setChunks([[]]);
      return;
    }
    const id = registry[templateId] ? templateId : 'classic';
    const result = chunkItemsForPages(id, doc, parties, settings);
    setChunks(result);
  }, [templateId, doc, parties, settings]);

  return chunks;
}
