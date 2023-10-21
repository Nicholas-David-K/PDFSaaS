'use client';

import { useEffect, useState } from 'react';

import UploadModal from './UploadModal';

const ModalProvider = ({ isPro }: { isPro: boolean }) => {
    const [mounted, setIsmounted] = useState(false);

    useEffect(() => {
        setIsmounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <>
            <UploadModal isPro={isPro} />
        </>
    );
};

export default ModalProvider;
