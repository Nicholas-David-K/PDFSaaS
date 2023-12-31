'use client';

import { Cloud, FileText, Loader2 } from 'lucide-react';

import Dropzone from 'react-dropzone';
import { Progress } from './ui/progress';
import { ToastAction } from '@/components/ui/toast';
import { trpc } from '@/app/_trpc/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import useUploadModal from '@/hooks/use-upload-modal';
import { useUploadThing } from '@/lib/upload-thing';

const UploadDropZone = ({ isPro }: { isPro: boolean }) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const uploadModal = useUploadModal();

    const { startUpload } = useUploadThing(
        isPro ? 'proPlanUploader' : 'freePlanUploader'
    );

    const { mutate: startPolling } = trpc.getFile.useMutation({
        onSuccess: (file) => {
            uploadModal.onClose();
            router.push(`/dashboard/${file.id}`);
        },
        retry: true,
        retryDelay: 500,
    });

    const startSimulatedProgress = () => {
        setUploadProgress(0);

        const interval = setInterval(() => {
            setUploadProgress((prevProgress) => {
                if (prevProgress >= 95) {
                    clearInterval(interval);
                    return prevProgress;
                } else {
                    return prevProgress + 5;
                }
            });
        }, 500);

        return interval;
    };

    return (
        <Dropzone
            multiple={false}
            onDrop={async (acceptedFile) => {
                setIsUploading(true);

                const progressInterval = startSimulatedProgress();

                // Upload file
                const res = await startUpload(acceptedFile);

                if (!res) {
                    setIsUploading(false);

                    return toast({
                        variant: 'destructive',
                        title: 'Uh oh! Something went wrong.',
                        description: 'There was a problem with your request.',
                    });
                }

                const [fileResponse] = res;

                const key = fileResponse?.key;

                if (!key) {
                    setIsUploading(false);

                    return toast({
                        variant: 'destructive',
                        title: 'Uh oh! Something went wrong.',
                        description: 'There was a problem with your request.',
                    });
                }

                clearInterval(progressInterval);
                setUploadProgress(100);
                startPolling({ key });
            }}
        >
            {({ getRootProps, getInputProps, acceptedFiles }) => (
                <div
                    {...getRootProps()}
                    className="border h-64 m-4 border-dashed border-gray-300 rounded-lg"
                >
                    <input {...getInputProps()} />
                    <div className="flex items-center justify-center h-full w-full">
                        <label
                            htmlFor="dropzone-file"
                            className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Cloud className="h-6 w-6 text-zinc-500 mb-2" />
                                <p className="mb-2 text-sm text-zinc-700">
                                    <span className="font-semibold">
                                        Click to upload
                                    </span>{' '}
                                    or drag and drop
                                </p>
                                <p className="text-xs text-zinc-500">
                                    PDF (up to {isPro ? '16' : '4'}MB)
                                </p>
                            </div>

                            {acceptedFiles && acceptedFiles[0] ? (
                                <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
                                    <div className="px-3 py-2 h-full grid place-items-center">
                                        <FileText className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <div className="px-3 py-2 h-full text-sm truncate">
                                        {acceptedFiles[0].name}
                                    </div>
                                </div>
                            ) : null}

                            {isUploading ? (
                                <div className="w-full mt-4 max-w-xs mx-auto">
                                    <Progress
                                        indicatorColor={
                                            uploadProgress === 100
                                                ? 'bg-green-500'
                                                : ''
                                        }
                                        value={uploadProgress}
                                        className="h-1 w-full bg-zinc-200"
                                    />
                                    {uploadProgress === 100 ? (
                                        <div className="flex items-center gap-1 justify-center text-sm text-zinc-700 text-center pt-2">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Redirecting...
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </label>
                    </div>
                </div>
            )}
        </Dropzone>
    );
};

export default UploadDropZone;
