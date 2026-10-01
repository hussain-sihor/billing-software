import { useState } from 'react';
import { apiDelete } from '../lib/api';
import { useStore } from '../lib/store';
import { Topbar, Card, Button, DTable, EmptyState } from '../components/ui';
import PartyModal from '../components/PartyModal';

export default function Parties() {
  const parties = useStore((s) => s.parties);
  const refreshParties = useStore((s) => s.refreshParties);
  const toast = useStore((s) => s.toast);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const add = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const edit = (p) => {
    setEditing(p);
    setModalOpen(true);
  };

  async function remove(id) {
    if (!confirm('Remove this party?')) return;
    try {
      await apiDelete('/parties/' + id);
      await refreshParties();
    } catch (err) {
      toast(err.message || 'Could not delete party');
    }
  }

  return (
    <section>
      <Topbar title="Parties" desc="Manage customer / buyer details.">
        <Button variant="primary" onClick={add}>
          + Add party
        </Button>
      </Topbar>

      <Card>
        {parties.length === 0 ? (
          <EmptyState emoji="👥">No parties yet. Add your buyers here.</EmptyState>
        ) : (
          <DTable head={['Name', 'GSTIN', 'Email', 'Phone', '']}>
            {parties.map((p) => (
              <tr key={p._id} className="hover:bg-[#FAFBFD]">
                <Td>{p.name}</Td>
                <Td>{p.gstNo || ''}</Td>
                <Td>{p.email || ''}</Td>
                <Td>{p.phone || ''}</Td>
                <Td nowrap>
                  <Button variant="ghost" sm onClick={() => edit(p)}>
                    Edit
                  </Button>{' '}
                  <Button variant="danger" sm onClick={() => remove(p._id)}>
                    Delete
                  </Button>
                </Td>
              </tr>
            ))}
          </DTable>
        )}
      </Card>

      <PartyModal open={modalOpen} party={editing} onClose={() => setModalOpen(false)} />
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
