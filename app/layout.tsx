import 'react-loading-skeleton/dist/skeleton.css';
import 'simplebar-react/dist/simplebar.min.css';
import './globals.css';

import { Inter } from 'next/font/google';
import ModalProvider from '@/components/ModalProvider';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';
import { Toaster } from '@/components/ui/toaster';
import { checkSubscription } from '@/lib/subscription';
import { constructMetadata } from '@/lib/utils';
import { twMerge } from 'tailwind-merge';

const inter = Inter({ subsets: ['latin'] });

export const metadata = constructMetadata();

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isPro = await checkSubscription();
    return (
        <html lang="en" className="light">
            <Providers>
                <body
                    className={twMerge(
                        inter.className,
                        'min-h-screen font-sans antialiased grainy'
                    )}
                >
                    <ModalProvider isPro={isPro} />
                    <Toaster />
                    <Navbar />
                    {children}
                </body>
            </Providers>
        </html>
    );
}
