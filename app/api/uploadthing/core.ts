import prismadb from '@/lib/prismadb';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { LanceDB } from 'langchain/vectorstores/lancedb';
import { Chroma } from 'langchain/vectorstores/chroma';
import { client } from '@/lib/redis';
import { RedisVectorStore } from 'langchain/vectorstores/redis';

const f = createUploadthing();

export const ourFileRouter = {
    pdfUploader: f({ pdf: { maxFileSize: '4MB' } })
        .middleware(async ({ req }) => {
            const { getUser } = getKindeServerSession();
            const user = getUser();

            if (!user || !user.id) throw new Error('Unauthorized');

            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return { userId: user.id };
        })

        .onUploadComplete(async ({ metadata, file }) => {
            const newFile = await prismadb.file.create({
                data: {
                    userId: metadata.userId,
                    key: file.key,
                    name: file.name,
                    url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
                    uploadStatus: 'PROCESSING',
                },
            });

            try {
                const response = await fetch(
                    `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
                );
                const blob = await response.blob();
                const loader = new PDFLoader(blob);

                const pageLevelDocs = await loader.load();
                const pagesAmts = pageLevelDocs.length;

                const embeddings = new OpenAIEmbeddings({
                    openAIApiKey: process.env.OPENAI_API_KEY,
                });

                await client.connect();

                await RedisVectorStore.fromDocuments(pageLevelDocs, embeddings, {
                    redisClient: client,
                    indexName: 'pagebot',
                });

                await client.disconnect();

                await prismadb.file.update({
                    data: {
                        uploadStatus: 'SUCCESS',
                    },
                    where: {
                        id: newFile.id,
                    },
                });
            } catch (error) {
                console.log(error);
                await prismadb.file.update({
                    data: {
                        uploadStatus: 'FAILED',
                    },
                    where: {
                        id: newFile.id,
                    },
                });
            }
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
