import { NextRequest, NextResponse } from 'next/server';
import { OpenAIStream, StreamingTextResponse } from 'ai';

import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RedisVectorStore } from 'langchain/vectorstores/redis';
import { SendMessageValidator } from '@/lib/validators/send-message-validator';
import { client } from '@/lib/redis';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { openai } from '@/lib/openai';
import prismadb from '@/lib/prismadb';

export const POST = async (req: NextRequest) => {
    // asking questions to the PDF
    const body = await req.json();

    const { getUser } = getKindeServerSession();
    const user = getUser();

    const { id: userId } = user;

    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { fileId, message } = SendMessageValidator.parse(body);

    const file = await prismadb.file.findFirst({
        where: {
            id: fileId,
            userId,
        },
    });

    if (!file) return new NextResponse('Not Found', { status: 404 });

    await prismadb.message.create({
        data: {
            text: message,
            isUserMessage: true,
            userId,
            fileId: fileId,
        },
    });

    // vectorize the message
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
    });

    await client.connect();

    const vectorStore = new RedisVectorStore(embeddings, {
        redisClient: client,
        indexName: 'pagebot',
    });

    const results = await vectorStore.similaritySearch(message, 4);

    const prevMessages = await prismadb.message.findMany({
        where: {
            fileId,
        },
        orderBy: {
            createdAt: 'asc',
        },
        take: 6,
    });

    const formattedPrevMessages: any = prevMessages.map((msg) => ({
        role: msg.isUserMessage ? ('user' as const) : ('assistant' as const),
        content: msg.text,
    }));

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0,
        stream: true,
        messages: [
            {
                role: 'system',
                content:
                    'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
            },
            {
                role: 'user',
                content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
              
        \n----------------\n
        
        PREVIOUS CONVERSATION:
        ${formattedPrevMessages.map((message: any) => {
            if (message.role === 'user') return `User: ${message.content}\n`;
            return `Assistant: ${message.content}\n`;
        })}
        
        \n----------------\n
        
        CONTEXT:
        ${results.map((r) => r.pageContent).join('\n\n')}
        
        USER INPUT: ${message}`,
            },
        ],
    });

    console.log(response);

    const stream = OpenAIStream(response, {
        async onCompletion(completion) {
            await prismadb.message.create({
                data: {
                    text: completion,
                    isUserMessage: false,
                    fileId,
                    userId,
                },
            });
        },
    });

    await client.disconnect();

    return new StreamingTextResponse(stream);
};
