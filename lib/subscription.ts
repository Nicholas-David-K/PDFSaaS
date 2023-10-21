import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prismadb from './prismadb';

const DAY_IN_MS = 86_400_000;

export const checkSubscription = async () => {
    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user.id) {
        return false;
    }

    const userSubscription = await prismadb.userSubscription.findUnique({
        where: {
            userId: user.id,
        },
        select: {
            stripeSubscriptionId: true,
            stripeCurrentPeriodEnd: true,
            stripeCustomerId: true,
            stripePriceId: true,
        },
    });

    if (!userSubscription) {
        return false;
    }

    const isValid =
        userSubscription.stripePriceId &&
        userSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

    return !!isValid;
};
