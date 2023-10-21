'use client';

import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import { trpc } from '@/app/_trpc/client';
import { useToast } from '@/components/ui/use-toast';

type Props = {
    isPro: boolean;
};

const BillingForm = ({ isPro }: Props) => {
    const { toast } = useToast();
    const { mutate: createStripeSession, isLoading } =
        trpc.createStripeSession.useMutation({
            onSuccess: ({ url }: any) => {
                if (url) window.location.href = url;
                if (!url) {
                    toast({
                        title: 'There was a problem...',
                        description: 'Please try again in a moment',
                        variant: 'destructive',
                    });
                }
            },
        });
    return (
        <MaxWidthWrapper className="max-w-5xl">
            <form
                className="mt-12"
                onSubmit={(e) => {
                    e.preventDefault();
                    createStripeSession();
                }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Plan</CardTitle>
                        <CardDescription>
                            You are currently one the{' '}
                            <strong>{isPro ? 'Pro Plan' : 'Free Plan'}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
                        <Button type="submit">
                            {isLoading ? (
                                <Loader2 className="mr-4 h-4 w-4 animate-spin" />
                            ) : null}
                            {isPro ? 'Manage subscription' : 'Upgrade to pro'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </MaxWidthWrapper>
    );
};

export default BillingForm;
