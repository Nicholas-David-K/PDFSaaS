'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import UploadDropZone from './UploadDropZone';
import useUploadModal from '@/hooks/use-upload-modal';

type Props = {};

const UploadModal = (props: Props) => {
    const uploadModal = useUploadModal();

    return (
        <Dialog open={uploadModal.isOpen} onOpenChange={uploadModal.onClose}>
            <DialogContent>
                <div className="flex flex-col justify-center w-full gap-y-2">
                    <UploadDropZone />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UploadModal;
