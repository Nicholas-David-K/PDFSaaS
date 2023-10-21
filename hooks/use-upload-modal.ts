import { create } from 'zustand';

type useUploadModalStore = {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
};

const useUploadModal = create<useUploadModalStore>((set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
}));

export default useUploadModal;
