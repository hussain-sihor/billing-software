import { useState } from 'react';
import { apiDelete } from '../lib/api';
import { useStore } from '../lib/store';
import { fmtMoney } from '../lib/format';
import { Topbar, Card, Button, DTable, EmptyState } from '../components/ui';
import ProductModal from '../components/ProductModal';

export default function Products() {
  const products = useStore((s) => s.products);
  const refreshProducts = useStore((s) => s.refreshProducts);
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
    if (!confirm('Remove this product?')) return;
    try {
      await apiDelete('/products/' + id);
      await refreshProducts();
    } catch (err) {
      toast(err.message || 'Could not delete product');
    }
  }

  return (
    <section>
      <Topbar title="Products" desc="Manage the product list used in bills and quotations.">
        <Button variant="primary" onClick={add}>
          + Add product
        </Button>
      </Topbar>

      <Card>
        {products.length === 0 ? (
          <EmptyState emoji="📦">
            No products yet. Add the items you sell.
          </EmptyState>
        ) : (
          <DTable head={['Name', 'Description', 'Unit', 'Default rate', '']}>
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-[#FAFBFD]">
                <Td>{p.name}</Td>
                <Td>{p.description || ''}</Td>
                <Td>{p.unit || ''}</Td>
                <Td>{fmtMoney(p.rate || 0)}</Td>
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

      <ProductModal
        open={modalOpen}
        product={editing}
        onClose={() => setModalOpen(false)}
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
