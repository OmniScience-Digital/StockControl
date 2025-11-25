import { uploadData } from "aws-amplify/storage"

export const handleUpload = async (pdfFile: any) => {
    if (!pdfFile) return null;

    try {
        await uploadData({
            path: pdfFile.s3Key,
            data: pdfFile.file
        }).result;

        return pdfFile.s3Key;
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
};