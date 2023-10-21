import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import BillingForm from '@/components/BillingForm';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import { checkSubscription } from '@/lib/subscription';
import { trpc } from '@/app/_trpc/client';
import { useToast } from '@/components/ui/use-toast';

const BillingPage = async () => {
    const isPro = await checkSubscription();
    return <BillingForm isPro={isPro} />;
};

export default BillingPage;
