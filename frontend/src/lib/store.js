import { create } from 'zustand';
import { apiGet } from './api';

// Central app state — replaces the global settings/products/parties/documents
// variables from public/index.html. Components read slices and call the
// refresh actions after mutations to re-sync from the server.
let toastTimer = null;

export const useStore = create((set, get) => ({
  settings: null,
  products: [],
  parties: [],
  documents: [],

  // Loading/error gate for the initial fetch.
  loaded: false,
  loadError: null,

  // Toast replaces the old global showToast().
  toastMsg: '',

  async loadAll() {
    try {
      const [settings, products, parties, documents] = await Promise.all([
        apiGet('/settings'),
        apiGet('/products'),
        apiGet('/parties'),
        apiGet('/documents')
      ]);
      set({ settings, products, parties, documents, loaded: true, loadError: null });
    } catch (err) {
      set({ loadError: err.message || 'Failed to load data', loaded: false });
    }
  },

  async refreshSettings() {
    set({ settings: await apiGet('/settings') });
  },
  async refreshProducts() {
    set({ products: await apiGet('/products') });
  },
  async refreshParties() {
    set({ parties: await apiGet('/parties') });
  },
  async refreshDocuments() {
    set({ documents: await apiGet('/documents') });
  },

  // Re-sync documents + settings together (used after a save so the number
  // counters/snapshots reflect what's really stored).
  async refreshDocsAndSettings() {
    const [documents, settings] = await Promise.all([
      apiGet('/documents'),
      apiGet('/settings')
    ]);
    set({ documents, settings });
  },

  toast(msg) {
    set({ toastMsg: msg });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      // Only clear if it's still the same message showing.
      if (get().toastMsg === msg) set({ toastMsg: '' });
    }, 2200);
  }
}));
