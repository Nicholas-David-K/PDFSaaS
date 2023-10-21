'use client';

import { Button } from './ui/button';
import { File } from 'lucide-react';
import useUploadModal from '@/hooks/use-upload-modal';

type Props = {};

const UploadButton = (props: Props) => {
    const uploadModal = useUploadModal();

    return (
        <Button onClick={uploadModal.onOpen}>
            Upload PDF <File className="ml-2 h-5 w-5" />
        </Button>
    );
};

export default UploadButton;
