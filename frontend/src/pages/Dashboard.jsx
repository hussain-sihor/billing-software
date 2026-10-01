import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { fmtMoney, fmtDate } from '../lib/format';
import { partyNameForDoc } from '../lib/docHelpers';
import { Topbar, Card, Button, Pill, DTable, EmptyState } from '../components/ui';

export default function Dashboard() {
  const navigate = useNavigate();
  const documents = useStore((s) => s.documents);
  const products = useStore((s) => s.products);
  const parties = useStore((s) => s.parties);

  const invoices = documents.filter((d) => d.type === 'invoice');
  const quotations = documents.filter((d) => d.type === 'quotation');
  const totalBilled = invoices.reduce((s, d) => s + d.grandTotal, 0);
  const recent = [...documents]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  const openDoc = (id) => navigate(`/new?edit=${id}`);

  return (
    <section>
      <Topbar title="Dashboard" desc="Overview of your billing activity.">
        <Button variant="primary" onClick={() => navigate('/new?type=invoice')}>
          + New bill
        </Button>
        <Button variant="ghost" onClick={() => navigate('/new?type=quotation')}>
          + New quotation
        </Button>
      </Topbar>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        <Stat num={invoices.length} label="Bills raised" />
        <Stat num={quotations.length} label="Quotations sent" />
        <Stat num={fmtMoney(totalBilled)} label="Total billed value" />
        <Stat num={`${products.length} / ${parties.length}`} label="Products / parties" />
      </div>

      <Card title="Recent documents">
        {recent.length === 0 ? (
          <EmptyState emoji="🧾">
            No documents yet. Create your first bill or quotation.
          </EmptyState>
        ) : (
          <DTable head={['No.', 'Type', 'Date', 'Party', 'Amount', '']}>
            {recent.map((d) => (
              <tr key={d._id} className="hover:bg-[#FAFBFD]">
                <Td>{d.docNumber}</Td>
                <Td>
                  <Pill type={d.type} />
                </Td>
                <Td>{fmtDate(d.date)}</Td>
                <Td>{partyNameForDoc(d, parties)}</Td>
                <Td>{fmtMoney(d.grandTotal)}</Td>
                <Td>
                  <Button variant="ghost" sm onClick={() => openDoc(d._id)}>
                    Open
                  </Button>
                </Td>
              </tr>
            ))}
          </DTable>
        )}
      </Card>
    </section>
  );
}

function Stat({ num, label }) {
  return (
    <div className="bg-paper border border-bordr rounded-[10px] px-[18px] py-4">
      <div className="text-2xl font-bold text-navy">{num}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}

function Td({ children }) {
  return <td className="px-2 py-[9px] border-b border-bordr align-middle">{children}</td>;
}
