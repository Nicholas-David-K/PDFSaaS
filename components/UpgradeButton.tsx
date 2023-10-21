'use client';

import { ArrowRight, Loader2 } from 'lucide-react';

import { Button } from './ui/button';
import { trpc } from '@/app/_trpc/client';

const UpgradeButton = () => {
    const { mutate: createStripeSession, isLoading } =
        trpc.createStripeSession.useMutation({
            onSuccess: ({ url }: any) => {
                console.log('STIPE_SESSION_URL: ', url);
                window.location.href = url ?? '/dashboard/billing';
            },
        });

    return (
        <Button onClick={() => createStripeSession()} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 mr-4 animate-spin" />} Upgrade
            now
            <ArrowRight className="h-5 w-5 ml-1.5" />
        </Button>
    );
};

export default UpgradeButton;
