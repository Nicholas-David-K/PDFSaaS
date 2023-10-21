'use client';

import { useEffect, useState } from 'react';

import UploadModal from './UploadModal';

const ModalProvider = () => {
    const [mounted, setIsmounted] = useState(false);

    useEffect(() => {
        setIsmounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <>
            <UploadModal />
        </>
    );
};

export default ModalProvider;
