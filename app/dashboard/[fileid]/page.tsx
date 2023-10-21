import { notFound, redirect } from 'next/navigation';

import ChatWrapper from '@/components/chat/ChatWrapper';
import PdfRenderer from '@/components/PdfRenderer';
import React from 'react';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prismadb from '@/lib/prismadb';

type Props = {
    params: {
        fileid: string;
    };
};

const FilePage = async ({ params }: Props) => {
    let { fileid } = params;

    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user || !user.id) redirect(`/auth-callback?origin=dashboard/${fileid}`);

    const file = await prismadb.file.findFirst({
        where: {
            userId: user.id,
            id: fileid,
        },
    });

    if (!file) return notFound();

    let plan = {
        isSubscribed: true,
    };

    return (
        <div className="flex-1 justify-between flex flex-col h-[calc(100vh - 3.5rem)]">
            <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
                <div className="flex-1 xl:flex">
                    <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
                        {/* Main area */}
                        <PdfRenderer url={file.url} />
                    </div>
                </div>

                <div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
                    <ChatWrapper isSubscribed={plan.isSubscribed} fileId={file.id} />
                </div>
            </div>
        </div>
    );
};

export default FilePage;
