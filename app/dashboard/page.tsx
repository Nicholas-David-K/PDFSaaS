import Dashboard from '@/components/Dashboard';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prismadb from '@/lib/prismadb';
import { redirect } from 'next/navigation';

export default async function Page() {
    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user || !user.id) redirect('/auth-callback?origin=dashboard');

    const dbUser = await prismadb.user.findFirst({
        where: {
            userId: user.id,
        },
    });

    if (!dbUser) redirect('/auth-callback?origin=dashboard');

    return <Dashboard />;
}
