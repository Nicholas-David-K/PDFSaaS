import { privateProcedure, publicProcedure, router } from './trpc';

import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
import { NextResponse } from 'next/server';
import { PLANS } from '@/config/constants';
import { TRPCError } from '@trpc/server';
import { absoluteUrl } from '@/lib/utils';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prismadb from '@/lib/prismadb';
import { stripe } from '@/lib/stripe';
import z from 'zod';

const billingUrl = absoluteUrl('/dashboard/billing');

const ProPlanAmount = PLANS.find((plan) => plan.name === 'Pro')?.price.amount || 0;

export const appRouter = router({
    authCallback: publicProcedure.query(async () => {
        const { getUser } = getKindeServerSession();
        const user = getUser();

        if (!user || !user.id || !user.email)
            throw new TRPCError({ code: 'UNAUTHORIZED' });

        // TODO: save the user in the db
        let dbUser = await prismadb.user.findFirst({
            where: {
                userId: user.id,
            },
        });

        if (!dbUser) {
            await prismadb.user.create({
                data: {
                    userId: user.id,
                    email: user.email,
                },
            });
        }

        return { success: true };
    }),

    createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
        const { userId, user } = ctx;

        if (!userId || !user.email) return new TRPCError({ code: 'UNAUTHORIZED' });

        const userSubscription = await prismadb.userSubscription.findUnique({
            where: {
                userId,
            },
        });

        if (userSubscription && userSubscription.stripeCustomerId) {
            // Redirect to billing page
            const stripeSession = await stripe.billingPortal.sessions.create({
                customer: userSubscription.stripeCustomerId,
                return_url: billingUrl,
            });

            return { url: stripeSession.url };
        }

        const stripeSession = await stripe.checkout.sessions.create({
            success_url: billingUrl,
            cancel_url: billingUrl,
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'auto',
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: 'KES',
                        product_data: {
                            name: 'Pagebot',
                            description: 'Ulimited PDF page numbers',
                        },
                        unit_amount: ProPlanAmount,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId,
            },
        });

        return { url: stripeSession.url };
    }),

    getUserFiles: privateProcedure.query(async ({ ctx }) => {
        const { userId } = ctx;

        return await prismadb.file.findMany({
            where: {
                userId,
            },
        });
    }),

    deleteFile: privateProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = ctx;

            const file = await prismadb.file.findFirst({
                where: {
                    userId,
                    id: input.id,
                },
            });

            if (!file) throw new TRPCError({ code: 'NOT_FOUND' });

            await prismadb.file.delete({
                where: {
                    id: input.id,
                    userId,
                },
            });

            return { success: true };
        }),

    getFileUploadStatus: privateProcedure
        .input(z.object({ fileId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { userId } = ctx;

            const file = await prismadb.file.findFirst({
                where: {
                    id: input.fileId,
                    userId: userId,
                },
            });

            if (!file) return { status: 'PENDING' as const };

            return { status: file.uploadStatus };
        }),

    getFile: privateProcedure
        .input(z.object({ key: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = ctx;

            const file = await prismadb.file.findFirst({
                where: {
                    key: input.key,
                    userId,
                },
            });

            if (!file) throw new TRPCError({ code: 'NOT_FOUND' });

            return file;
        }),

    getFileMessages: privateProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).nullish(),
                cursor: z.string().nullish(),
                fileId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { userId } = ctx;
            const { fileId, cursor } = input;
            const limit = input.limit ?? INFINITE_QUERY_LIMIT;

            const file = await prismadb.file.findFirst({
                where: {
                    id: fileId,
                    userId,
                },
            });

            if (!file) throw new TRPCError({ code: 'NOT_FOUND' });

            const messages = await prismadb.message.findMany({
                take: limit + 1,
                where: {
                    fileId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                cursor: cursor ? { id: cursor } : undefined,
                select: {
                    id: true,
                    isUserMessage: true,
                    createdAt: true,
                    text: true,
                },
            });

            let nextCursor: typeof cursor | undefined = undefined;

            if (messages.length > limit) {
                const nextItem = messages.pop();
                nextCursor = nextItem?.id;
            }

            return {
                messages,
                nextCursor,
            };
        }),
});
export type AppRouter = typeof appRouter;
