// components/pdf-upload.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, X, Eye, Loader2, CheckCircle, AlertCircle, Replace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadData, remove, getUrl } from 'aws-amplify/storage';

export interface PDFState {
    id: string;
    file: File;
    s3Key: string;
    status: 'uploading' | 'success' | 'error';
    url?: string;
    error?: string;
    previewUrl?: string;
    name: string;
    size: string;
    uploadDate: string;
}

interface PDFUploadProps {
    onPDFsChange: (pdfs: PDFState[]) => void;
    employeeID: string;
    filetitle: string;
    filename: string;
    folder: string;
    existingFiles?: string[];
}

export const HrdPDFUpload = ({ onPDFsChange, employeeID, folder, existingFiles = [], filetitle, filename }: PDFUploadProps) => {
    const [pdfs, setPdfs] = useState<PDFState[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewUrlsRef = useRef<Set<string>>(new Set());

    // Use refs to track the last state to prevent loops
    const lastPdfsRef = useRef<PDFState[]>([]);
    const hasInitialized = useRef(false);

    // Initialize existing files - only run once
    useEffect(() => {
        if (hasInitialized.current) return;

        const initializeExistingFiles = async () => {
            if (existingFiles.length > 0) {
                const existingFile = existingFiles[0];
                if (existingFile) {
                    const fileName = existingFile.split('/').pop() || `${filename}_1.pdf`;

                    const existingPDF: PDFState = {
                        id: `existing-0`,
                        file: new File([], fileName),
                        s3Key: existingFile,
                        status: 'success',
                        url: existingFile,
                        name: fileName,
                        size: "Unknown",
                        uploadDate: new Date().toLocaleDateString()
                    };

                    setPdfs([existingPDF]);
                    lastPdfsRef.current = [existingPDF];
                    hasInitialized.current = true;

                    onPDFsChange([existingPDF]);
                }
            } else {
                hasInitialized.current = true;
            }
        };

        initializeExistingFiles();
    }, [existingFiles, filename, onPDFsChange]);

    // Only call onPDFsChange when pdfs actually change due to user actions
    useEffect(() => {
        // Skip if not initialized or if pdfs haven't actually changed
        if (!hasInitialized.current ||
            JSON.stringify(pdfs) === JSON.stringify(lastPdfsRef.current)) {
            return;
        }

        // Only notify parent for success states (after upload completes)
        const hasSuccessfulUpload = pdfs.some(pdf => pdf.status === 'success');
        const hasNewUpload = pdfs.some(pdf =>
            !lastPdfsRef.current.find(lastPdf => lastPdf.id === pdf.id && lastPdf.status === 'success')
        );

        if (hasSuccessfulUpload && hasNewUpload) {
            
            onPDFsChange(pdfs);
        }

        lastPdfsRef.current = [...pdfs];
    }, [pdfs, onPDFsChange]);

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
            previewUrlsRef.current.clear();
        };
    }, []);

    const generateS3Key = useCallback((file: File): string => {
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const timestamp = Date.now();
        return `hr/${employeeID}/${folder}/${cleanFileName}`;
    }, [employeeID, folder]);

    const createPreviewUrl = useCallback((file: File): string => {
        const url = URL.createObjectURL(file);
        previewUrlsRef.current.add(url);
        return url;
    }, []);

    const uploadToS3 = async (pdf: PDFState): Promise<void> => {
        try {

            const { result } = await uploadData({
                path: pdf.s3Key,
                data: pdf.file,
                options: {
                    contentType: 'application/pdf',
                }
            });
            await result;


            setPdfs(prev => prev.map(p =>
                p.id === pdf.id ? { ...p, status: 'success' } : p
            ));
        } catch (error) {
            console.error('S3 upload failed:', error);
            setPdfs(prev => prev.map(p =>
                p.id === pdf.id ? {
                    ...p,
                    status: 'error',
                    error: 'Upload failed'
                } : p
            ));
        }
    };

    const deleteFromS3 = async (s3Key: string): Promise<void> => {
        try {
            await remove({ path: s3Key });
            console.log(`Deleted from S3: ${s3Key}`);
        } catch (error) {
            console.error('S3 delete failed:', error);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || !employeeID) return;

        handleFiles(files);
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);

        const files = event.dataTransfer.files;
        handleFiles(files);
    };

    const handleFiles = async (files: FileList) => {
        const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
        if (pdfFiles.length === 0) return;

        const newFile = pdfFiles[0];


        setIsUploading(true);

        // Clean up existing file preview URL
        if (pdfs.length > 0) {
            const existingPdf = pdfs[0];
            if (existingPdf.previewUrl) {
                URL.revokeObjectURL(existingPdf.previewUrl);
                previewUrlsRef.current.delete(existingPdf.previewUrl);
            }
            // Delete existing file from S3 if it was uploaded
            if (existingPdf.status === 'success' && existingPdf.s3Key) {
                await deleteFromS3(existingPdf.s3Key);
            }
        }

        const newPDF: PDFState = {
            id: Math.random().toString(36).substring(2, 9),
            file: newFile,
            s3Key: generateS3Key(newFile),
            status: 'uploading',
            previewUrl: createPreviewUrl(newFile),
            name: newFile.name,
            size: `${(newFile.size / (1024 * 1024)).toFixed(1)} MB`,
            uploadDate: new Date().toLocaleDateString()
        };


        setPdfs([newPDF]);
        await uploadToS3(newPDF);

        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePDF = useCallback(async (index: number) => {
        const pdfToRemove = pdfs[index];

        // Delete from S3 if it was uploaded
        if (pdfToRemove.status === 'success' && pdfToRemove.s3Key) {
            await deleteFromS3(pdfToRemove.s3Key);
        }

        // Clean up preview URL
        if (pdfToRemove.previewUrl) {
            URL.revokeObjectURL(pdfToRemove.previewUrl);
            previewUrlsRef.current.delete(pdfToRemove.previewUrl);
        }

        // Remove file completely and notify parent
        setPdfs([]);
        onPDFsChange([]);
    }, [pdfs, onPDFsChange]);

    const replacePDF = useCallback(async (index: number) => {
        const pdfToRemove = pdfs[index];

        // Clean up preview URL
        if (pdfToRemove.previewUrl) {
            URL.revokeObjectURL(pdfToRemove.previewUrl);
            previewUrlsRef.current.delete(pdfToRemove.previewUrl);
        }

        // Remove file completely
        setPdfs([]);
        onPDFsChange([]);

        // Trigger file input for new selection
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
    }, [pdfs, onPDFsChange]);

    const retryUpload = useCallback((pdfId: string) => {
        const pdf = pdfs.find(p => p.id === pdfId);
        if (pdf) {

            setPdfs(prev => prev.map(p =>
                p.id === pdfId ? { ...p, status: 'uploading', error: undefined } : p
            ));
            uploadToS3(pdf);
        }
    }, [pdfs]);

    const getUploadStatusIcon = (pdf: PDFState) => {
        switch (pdf.status) {
            case 'uploading':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    const handlePreview = async (pdf: PDFState) => {
        let url = pdf.previewUrl;

        if (!url && pdf.s3Key && pdf.status === 'success') {
            try {
                const { url: s3Url } = await getUrl({ path: pdf.s3Key });
                url = s3Url.toString();
            } catch (error) {
                console.error('Error generating preview URL:', error);
            }
        }

        if (url) {
            window.open(url, '_blank');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const allPDFsUploaded = pdfs.length > 0 && pdfs.every(pdf => pdf.status === 'success');

    return (
        <div className="space-y-4 mt-2">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {filetitle}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {/* Upload Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                            } ${pdfs.length >= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={pdfs.length >= 1 ? undefined : triggerFileInput}
                    >
                        <Upload className="h-4 w-4 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium mb-1">
                            {pdfs.length >= 1 ? 'Document Uploaded' : 'Upload PDF Document'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {pdfs.length >= 1 ? 'Remove current file to upload new one' : 'Drag and drop file here or click to browse'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Only PDF files are accepted • Maximum 1 file
                        </p>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".pdf"
                        multiple={false}
                        className="hidden"
                        disabled={!employeeID || pdfs.length >= 1}
                    />

                    {!employeeID && (
                        <p className="text-sm text-amber-600 mt-2">
                            Please enter Employee ID registration first to upload PDFs
                        </p>
                    )}

                    {/* Uploaded PDF */}
                    {pdfs.length > 0 && (
                        <div className="mt-4 space-y-3">
                            <h4 className="text-sm font-medium">
                                Uploaded Document
                            </h4>

                            <div className="bg-background border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                                        <span
                                            className="text-sm font-medium truncate flex-1 text-foreground"
                                            title={pdfs[0].name}
                                        >
                                            {pdfs[0].name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <div className="flex-shrink-0">
                                            {getUploadStatusIcon(pdfs[0])}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => replacePDF(0)}
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-500 flex-shrink-0"
                                        >
                                            <Replace className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removePDF(0)}
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 flex-shrink-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs text-gray-500">
                                        {pdfs[0].size}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {pdfs[0].uploadDate}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePreview(pdfs[0])}
                                        className="flex-1 h-8 text-xs"
                                        disabled={pdfs[0].status === 'uploading'}
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                    </Button>
                                </div>

                                {pdfs[0].status === 'error' && (
                                    <div className="mt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-6 text-xs bg-white"
                                            onClick={() => retryUpload(pdfs[0].id)}
                                        >
                                            Retry Upload
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="text-xs text-gray-500 text-center">
                                {pdfs[0]?.status === 'success' && 'Document uploaded to cloud'}
                                {pdfs[0]?.status === 'uploading' && 'Uploading document...'}
                                {pdfs[0]?.status === 'error' && 'Upload failed - Please retry'}
                            </div>

                            {allPDFsUploaded && (
                                <div className="flex items-center justify-center text-green-600 text-sm">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Document uploaded to cloud
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};