import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDelete } from '../lib/api';
import { useStore } from '../lib/store';
import { fmtMoney, fmtDate } from '../lib/format';
import { partyNameForDoc } from '../lib/docHelpers';
import { Topbar, Card, Button, Pill, DTable, EmptyState, Input, Select } from '../components/ui';
import PreviewModal from '../components/PreviewModal';

export default function SavedDocuments() {
  const navigate = useNavigate();
  const documents = useStore((s) => s.documents);
  const parties = useStore((s) => s.parties);
  const refreshDocuments = useStore((s) => s.refreshDocuments);
  const toast = useStore((s) => s.toast);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [previewDoc, setPreviewDoc] = useState(null);

  const list = useMemo(() => {
    let l = [...documents].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    if (filter !== 'all') l = l.filter((d) => d.type === filter);
    const query = q.trim().toLowerCase();
    if (query) {
      l = l.filter((d) => {
        const name = partyNameForDoc(d, parties).toLowerCase();
        return d.docNumber.toLowerCase().includes(query) || name.includes(query);
      });
    }
    return l;
  }, [documents, parties, filter, q]);

  async function remove(id) {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    try {
      await apiDelete('/documents/' + id);
      await refreshDocuments();
      toast('Deleted');
    } catch (err) {
      toast(err.message || 'Could not delete');
    }
  }

  const preview = (id) => {
    const doc = documents.find((d) => d._id === id);
    if (doc) setPreviewDoc(doc);
  };

  return (
    <section>
      <Topbar title="Saved documents" desc="All bills and quotations you've saved." />

      <Card>
        <div className="flex gap-2.5 mb-3.5 flex-wrap">
          <Input
            className="flex-1 min-w-[220px]"
            placeholder="Search by number or party name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            className="w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="invoice">Bills only</option>
            <option value="quotation">Quotations only</option>
          </Select>
        </div>

        {list.length === 0 ? (
          <EmptyState emoji="📄">No documents found.</EmptyState>
        ) : (
          <DTable head={['No.', 'Type', 'Date', 'Party', 'Amount', '']}>
            {list.map((d) => (
              <tr key={d._id} className="hover:bg-[#FAFBFD]">
                <Td>{d.docNumber}</Td>
                <Td>
                  <Pill type={d.type} />
                </Td>
                <Td>{fmtDate(d.date)}</Td>
                <Td>{partyNameForDoc(d, parties)}</Td>
                <Td>{fmtMoney(d.grandTotal)}</Td>
                <Td nowrap>
                  <Button variant="ghost" sm onClick={() => navigate(`/new?edit=${d._id}`)}>
                    Edit
                  </Button>{' '}
                  <Button variant="ghost" sm onClick={() => preview(d._id)}>
                    Print
                  </Button>{' '}
                  <Button variant="ghost" sm onClick={() => preview(d._id)}>
                    PDF
                  </Button>{' '}
                  <Button variant="danger" sm onClick={() => remove(d._id)}>
                    Delete
                  </Button>
                </Td>
              </tr>
            ))}
          </DTable>
        )}
      </Card>

      <PreviewModal
        open={!!previewDoc}
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </section>
  );
}

function Td({ children, nowrap }) {
  return (
    <td
      className={[
        'px-2 py-[9px] border-b border-bordr align-middle',
        nowrap ? 'whitespace-nowrap' : ''
      ].join(' ')}
    >
      {children}
    </td>
  );
}
