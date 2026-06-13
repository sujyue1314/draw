import { create } from 'zustand';

interface ConfirmStore {
  isOpen: boolean;
  question: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;

  showConfirm: (question: string, onConfirm: () => void) => void;
  cancel: () => void;
  confirm: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  question: '',
  onConfirm: null,
  onCancel: null,

  showConfirm: (question, onConfirm) =>
    set({
      isOpen: true,
      question,
      onConfirm,
      onCancel: () => set({ isOpen: false, question: '', onConfirm: null, onCancel: null }),
    }),

  cancel: () => {
    const { onCancel } = get();
    onCancel?.();
    set({ isOpen: false, question: '', onConfirm: null, onCancel: null });
  },

  confirm: () => {
    const { onConfirm } = get();
    onConfirm?.();
    set({ isOpen: false, question: '', onConfirm: null, onCancel: null });
  },
}));
