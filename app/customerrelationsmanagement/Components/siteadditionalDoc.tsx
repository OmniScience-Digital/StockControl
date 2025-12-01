import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponseModal from "@/components/widgets/response";
import { FileText, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FileUploadUpdate } from "./fileupdate";
import { FileUploadMany } from "./fileUpload";
import { Checkbox } from "@/components/ui/checkbox";
import { client } from "@/services/schema";
import { handleUpload } from "@/services/s3.service";
import Loading from "@/app/stockcontrolform/Components/component_loading";
import { remove } from "aws-amplify/storage";
import { ConfirmDialog } from "@/components/widgets/deletedialog";
import { PDFState } from "@/types/schema";
import { ComplianceAdditionals } from "@/types/crm.types";
import { Textarea } from "@/components/ui/textarea";


interface SiteAdditionalProps {
    complianceData: any;
    complianceexistingdocs: ComplianceAdditionals[];
    loading: boolean;
}



export default function SiteAdditional({ complianceData, complianceexistingdocs, loading }: SiteAdditionalProps) {
    const [additionalCerts, setAdditionalCerts] = useState<any[]>([]);
    const [existingdocs, setAdditionalDocs] = useState<ComplianceAdditionals[]>(complianceexistingdocs);
    const [digitalContractorsPack, setDigitalContractorsPack] = useState<string[]>([]);
    const [contractorFiles, setContractorFiles] = useState<{ [key: number]: PDFState[] }>({});

    const [certificateFiles, setCertificateFiles] = useState<{ [key: number]: PDFState[] }>({});
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [updating, setUpdating] = useState(false);

    const [notes, setNotes] = useState<string>("");
    const [hasChanges, setHasChanges] = useState(false);

    //handle delete site file 
    const [opendelete, setOpendelete] = useState(false);
    const [docToDelete, setDocToDelete] = useState<{ id: string, name: string } | null>(null);

    const [hasContractorsPackChanges, setHasContractorsPackChanges] = useState(false);
    const [updatingContractorsPack, setUpdatingContractorsPack] = useState(false);


    // Initialize states
    useEffect(() => {
        setAdditionalDocs(complianceexistingdocs);
    }, [complianceexistingdocs]);

    useEffect(() => {
        if (complianceData?.digitalContractorsPack) {
            setDigitalContractorsPack(complianceData.digitalContractorsPack);
        }
        if (complianceData?.notes) {
            setNotes(complianceData.notes);
        } else {
            setNotes("");
        }
    }, [complianceData]);



    const handleCriticalChange = (index: number, checked: boolean) => {
        const updated = [...additionalCerts];
        updated[index] = { ...updated[index], critical: checked };
        setAdditionalCerts(updated);
    };

    const removeAdditionalCertificate = (index: number) => {
        setAdditionalCerts(prev => prev.filter((_, i) => i !== index));

    };

    const handleAdditionalCertChange = (index: number, field: string, value: string) => {
        setHasChanges(true);
        const updated = [...additionalCerts];
        updated[index] = { ...updated[index], [field]: value };
        setAdditionalCerts(updated);
    };

    const addAdditionalCertificate = () => {
        setHasChanges(false);
        setAdditionalCerts(prev => [...prev, { certificateName: "", expiryDate: "", attachment: "" }]);
    };

    // Handle file changes for each certificate
    const handleCertificateFilesChange = (index: number) => (files: PDFState[]) => {
        setCertificateFiles(prev => ({
            ...prev,
            [index]: files
        }));
    };


    const handleDeleteClick = (docId: string, docName: string) => {
        setDocToDelete({ id: docId, name: docName });
        setOpendelete(true);
    };

    const handleExistingCertChange = (index: number, field: string, value: string) => {
        setHasChanges(true);
        const updated = [...existingdocs];
        updated[index] = { ...updated[index], [field]: value };
        setAdditionalDocs(updated);
    };

    const handleExistingFileChange = (index: number) => (files: PDFState[]) => {
        setHasChanges(true);

        // Update the certificateFiles state - THIS IS WHAT'S MISSING
        setCertificateFiles(prev => ({
            ...prev,
            [index]: files
        }));

        // Also update the existingdocs if needed
        const updated = [...existingdocs];
        if (index >= 0 && index < updated.length && files.length > 0) {
            updated[index].requirementDoc = files[0]?.s3Key || "";
            setAdditionalDocs(updated);
        }
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setHasChanges(true);
        setNotes(e.target.value);
    };
    // ====== DIGITAL CONTRACTORS PACK FUNCTIONS ======

    // Handle file changes for each contractors pack document
    const handleContractorsPackFileChange = (index: number) => (files: PDFState[]) => {
        setHasContractorsPackChanges(true);
        setContractorFiles(prev => ({
            ...prev,
            [index]: files
        }));
    };

    // Add new empty slot for contractors pack
    const addContractorsPackSlot = () => {
        setHasContractorsPackChanges(true);
        setDigitalContractorsPack(prev => [...prev, ""]); // Add empty string for new slot
    };
    const handleConfirmDelete = () => {
        if (docToDelete) {
            handleDelete(docToDelete.id, docToDelete.name);
        }
    };

    const handleDelete = async (docId: string, docName: string) => {
        try {
            setOpendelete(false);

            // Find the document to get the S3 key
            const docToDelete = existingdocs.find(doc => doc.id === docId);

            if (docToDelete?.requirementDoc) {
                // Delete from S3 first
                await remove({ path: docToDelete.requirementDoc });
            }

            // Then delete from database
            await client.models.ComplianceAdditionals.delete({ id: docId });

            // Remove from state
            setAdditionalDocs(prev => prev.filter(doc => doc.id !== docId));
            setDocToDelete(null);

            // History tracking for certificate deletion
            const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
            const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

            await client.models.History.create({
                entityType: "COMPLIANCE",
                entityId: complianceData?.customerSiteId,
                action: "DELETE_CERTIFICATE",
                timestamp: new Date().toISOString(),
                details: `\n${storedName} DELETED site additional certificate "${docName}" at ${johannesburgTime}\n`
            });

            setMessage(`Successfully deleted certificate: ${docName}`);
            setSuccessful(true);
            setShow(true);

        } catch (error) {
            console.error("Error deleting certificate:", error);
            setMessage("Error deleting certificate");
            setSuccessful(false);
            setShow(true);
        }
    };

    // Remove a contractors pack slot

    const removeContractorsPackSlot = async (index: number) => {
        try {
            const s3Key = digitalContractorsPack[index];

            // If there's a file in S3, delete it
            if (s3Key && s3Key.trim() !== "") {
                await remove({ path: s3Key });
            }

            // Remove from state
            const updatedPack = digitalContractorsPack.filter((_, i) => i !== index);
            setDigitalContractorsPack(updatedPack);


            await client.models.Compliance.update({
                id: complianceData.id,
                digitalContractorsPack: updatedPack
            });

            // Remove file from contractorFiles state
            setContractorFiles(prev => {
                const newFiles = { ...prev };
                delete newFiles[index];
                return newFiles;
            });

            setHasContractorsPackChanges(true);

            setMessage("Document slot removed successfully");
            setSuccessful(true);
            setShow(true);

        } catch (error) {
            console.error("Error removing contractors pack slot:", error);
            setMessage("Error removing document");
            setSuccessful(false);
            setShow(true);
        }
    };

    // Save contractors pack updates
    const saveContractorsPack = async () => {
        try {
            setUpdatingContractorsPack(true);

            if (!complianceData?.id) {
                setMessage("Compliance data not loaded yet");
                setSuccessful(false);
                setShow(true);
                return;
            }

            let updatedPack = [...digitalContractorsPack];
            let uploadCount = 0;

            // Upload files in parallel (like handleSave)
            const uploadPromises = Object.keys(contractorFiles).map(async (key) => {
                const index = parseInt(key);
                const files = contractorFiles[index];

                if (files && files.length > 0 && files[0].file) {
                    try {
                        const uploadedKey = await handleUpload(files[0]);
                        if (uploadedKey) {
                            updatedPack[index] = uploadedKey;
                            uploadCount++;
                        }
                    } catch (uploadError) {
                        console.error(`Failed to upload file at index ${index}:`, uploadError);
                    }
                }
                return null;
            });

            await Promise.all(uploadPromises);

            // Update the Compliance record
            await client.models.Compliance.update({
                id: complianceData.id,
                digitalContractorsPack: updatedPack
            });

            // Update local state (clear like handleSave)
            setDigitalContractorsPack(updatedPack);
            setContractorFiles({});
            setHasContractorsPackChanges(false);

            // History tracking
            if (uploadCount > 0) {
                const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
                const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

                await client.models.History.create({
                    entityType: "COMPLIANCE",
                    entityId: complianceData?.customerSiteId,
                    action: "UPDATE_CONTRACTORS_PACK",
                    timestamp: new Date().toISOString(),
                    details: `\n${storedName} UPDATED Digital Contractors Pack with ${uploadCount} new file(s) at ${johannesburgTime}\n`
                });
            }

            setMessage(uploadCount > 0
                ? `Successfully updated Digital Contractors Pack with ${uploadCount} new file(s)`
                : "No changes to save"
            );
            setSuccessful(true);
            setShow(true);

        } catch (error) {
            console.error("Error saving contractors pack:", error);
            setMessage("Error saving contractors pack files");
            setSuccessful(false);
            setShow(true);
        } finally {
            setUpdatingContractorsPack(false);
        }
    };


    // Handle file removal from FileUploadUpdate component
    const handleContractorsFileRemove = async (s3Key: string, index: number) => {
        try {
            // Delete from S3
            await remove({ path: s3Key });

            // Update state to empty string
            const updatedPack = [...digitalContractorsPack];
            updatedPack[index] = "";
            setDigitalContractorsPack(updatedPack);

            setHasContractorsPackChanges(true);

            // History tracking
            const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
            const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

            await client.models.History.create({
                entityType: "COMPLIANCE",
                entityId: complianceData?.customerSiteId,
                action: "REMOVE_CONTRACTORS_PACK_FILE",
                timestamp: new Date().toISOString(),
                details: `\n${storedName} REMOVED file from Digital Contractors Pack at ${johannesburgTime}\nFile: ${s3Key.split('/').pop() || 'Unknown'}\n`
            });

            setMessage("File removed from Digital Contractors Pack");
            setSuccessful(true);
            setShow(true);

        } catch (error) {
            console.error("Error deleting contractors pack file:", error);
            setMessage("Error deleting file");
            setSuccessful(false);
            setShow(true);
        }
    };

    // In your save function, handle multiple files
    const handleSave = async () => {
        try {
            setSaving(true);
            // Check if complianceData.id exists
            if (!complianceData?.id) {
                setMessage("Compliance data not loaded yet");
                setSuccessful(false);
                setShow(true);
                return;
            }

            // Filter out empty certificates
            const validCerts = additionalCerts.filter(cert =>
                cert.certificateName?.trim() && (cert.expiryDate || cert.attachment)
            );

            if (validCerts.length === 0) {
                setMessage("No valid certificates to save");
                setSuccessful(false);
                setShow(true);
                return;
            }

            // Upload files in parallel
            const uploadPromises = validCerts.map(async (cert, index) => {
                if (certificateFiles[index]?.[0]) {
                    const uploadedKey = await handleUpload(certificateFiles[index][0]);
                    return { ...cert, attachment: uploadedKey || cert.attachment };
                }
                return cert;
            });

            const uploadedCerts = await Promise.all(uploadPromises);

            // Save to ComplianceAdditionals table
            const savePromises = uploadedCerts.map(cert =>
                client.models.ComplianceAdditionals.create({
                    complianceid: complianceData.id,
                    name: cert.certificateName,
                    expirey: cert.expiryDate,
                    requirementDoc: cert.attachment || "",
                    critical: cert.critical ? "true" : "false"
                })
            );

            const results = await Promise.all(savePromises);
            // Add these 3 lines at the end of handleSave function:
            setAdditionalCerts([]);
            setCertificateFiles({});
            setAdditionalDocs(prev => [...prev, ...results.map(result => result.data).filter(Boolean) as ComplianceAdditionals[]]);

            // Show success message
            setMessage(`Successfully saved ${results.length} additional certificates`);
            setSuccessful(true);
            setShow(true);

            // History tracking
            const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
            const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

            const changedFields = uploadedCerts.map(cert =>
                `${storedName} added Additional Certificate "${cert.certificateName}" at ${johannesburgTime}.\n`
            );

            // Create specific history entries for each certificate created
            for (const cert of uploadedCerts) {
                const historyEntry = `\n${storedName} CREATED site additional certificate "${cert.certificateName}" with expiry ${cert.expiryDate || 'No expiry'} at ${johannesburgTime}\n`;

                await client.models.History.create({
                    entityType: "COMPLIANCE",
                    entityId: complianceData?.customerSiteId,
                    action: "CREATE_CERTIFICATE",
                    timestamp: new Date().toISOString(),
                    details: historyEntry
                });
            }

        } catch (error) {
            console.error("Error saving certificates:", error);
            setMessage("Error saving additional certificates");
            setSuccessful(false);
            setShow(true);
        } finally {
            setSaving(false);
            setHasChanges(false);
        }
    };

    const handleUpdate = async () => {
        try {
            setUpdating(true);

            let updateCount = 0;
            const updatedCertificates: string[] = [];

            // Process all existing documents
            for (let i = 0; i < existingdocs.length; i++) {
                const currentDoc = existingdocs[i];
                if (!currentDoc.id) continue;

                let requirementDoc = currentDoc.requirementDoc || "";
                let wasUpdated = false;

                // Handle new file upload ONLY (no deletion logic here)
                const newFile = certificateFiles[i]?.[0];
                if (newFile) {
                    try {
                        const newFileKey = await handleUpload(newFile);
                        if (newFileKey) {
                            requirementDoc = newFileKey;
                            wasUpdated = true;
                        }
                    } catch (uploadError) {
                        console.error(`Failed to upload file:`, uploadError);
                        throw uploadError;
                    }
                }

                // Check if other fields changed
                const originalDoc = complianceexistingdocs.find(doc => doc.id === currentDoc.id);
                if (originalDoc) {
                    if (currentDoc.name !== originalDoc.name ||
                        currentDoc.expirey !== originalDoc.expirey ||
                        currentDoc.critical !== originalDoc.critical ||
                        wasUpdated) {
                        wasUpdated = true;
                    }
                }


                // Update the document if changes detected
                if (wasUpdated) {
                    try {
                        await client.models.ComplianceAdditionals.update({
                            id: currentDoc.id,
                            name: currentDoc.name || "",
                            expirey: currentDoc.expirey || "",
                            requirementDoc: requirementDoc,
                            critical: currentDoc.critical || "false"
                        });

                        updateCount++;
                        updatedCertificates.push(currentDoc.name || "Unnamed Certificate");
                        console.log(`Updated document ${currentDoc.id}`);
                    } catch (error) {
                        console.error(`Failed to update document ${currentDoc.id}:`, error);
                        throw error;
                    }
                }
            }
            // Update notes if they've changed
            if (notes !== complianceData?.notes) {
                try {
                    await client.models.Compliance.update({
                        id: complianceData.id,
                        notes: notes
                    });
                    updateCount++; // Count this as an update
                } catch (error) {
                    console.error("Failed to update notes:", error);
                    throw error;
                }
            }

            // Clear states
            setCertificateFiles({});

            // Show success message
            const successMessage = updateCount > 0
                ? `Successfully updated ${updateCount} certificate${updateCount !== 1 ? 's' : ''}`
                : "No changes were made";

            setMessage(successMessage);
            setSuccessful(true);
            setShow(true);

            // History tracking - SPECIFIC ACTION FOR UPDATES
            if (updateCount > 0) {
                const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
                const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

                const historyEntry = `\n${storedName} UPDATED site additional certificates: ${updatedCertificates.join(', ')} at ${johannesburgTime}\n`;

                // Check if notes were updated
                if (notes !== complianceData?.notes) {
                    await client.models.History.create({
                        entityType: "COMPLIANCE",
                        entityId: complianceData?.customerSiteId,
                        action: "UPDATE_NOTES",
                        timestamp: new Date().toISOString(),
                        details: `\n${storedName} UPDATED compliance notes at ${johannesburgTime}\nNew notes: ${notes}\n`
                    });
                }

                await client.models.History.create({
                    entityType: "COMPLIANCE",
                    entityId: complianceData?.customerSiteId,
                    action: "UPDATE_CERTIFICATES",
                    timestamp: new Date().toISOString(),
                    details: historyEntry
                });

                // Refresh data if updates were made
                try {
                    const result = await client.models.ComplianceAdditionals.listComplianceAdditionalsByComplianceid({
                        complianceid: complianceData.id
                    });
                    if (result.data) {
                        setAdditionalDocs(result.data as ComplianceAdditionals[]);
                    }
                } catch (error) {
                    console.error("Error refreshing data:", error);
                }
            }

        } catch (error) {
            console.error("Error updating certificates:", error);
            setMessage("Error updating certificates. Please try again.");
            setSuccessful(false);
            setShow(true);
        } finally {
            setUpdating(false);
            setHasChanges(false);
        }
    };

    if (loading) {
        return (
            <Card className="mt-2">
                <CardContent className="p-6">
                    <div className="space-y-6">
                        <Loading />
                    </div>
                </CardContent>

            </Card>
        );
    }

    return (
        <>
            <Card className="mt-2">

                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Site Additional Documents
                        </CardTitle>
                        <Button onClick={addAdditionalCertificate} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Certificate
                        </Button>
                    </div>

                </CardHeader>
                <CardContent className="p-6 ">

                    {additionalCerts.length > 0 && additionalCerts.map((cert, index) => (

                        <div key={index} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-semibold">Additional Certificate #{index + 1}</h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAdditionalCertificate(index)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-row md:col-span-2 text-xss">
                                    <Label className="mr-3">Critical (optional)</Label>
                                    <Checkbox
                                        className="cursor-pointer"
                                        checked={cert.critical || false}
                                        onCheckedChange={(checked) => handleCriticalChange(index, checked === true)}
                                    />
                                </div>
                                <div>
                                    <Label>Certificate Name</Label>
                                    <Input
                                        value={cert.certificateName || ''}
                                        onChange={(e) => handleAdditionalCertChange(index, 'certificateName', e.target.value)}
                                        placeholder="Enter certificate name"
                                    />
                                </div>
                                <div>
                                    <Label>Expiry Date</Label>
                                    <Input
                                        type="date"
                                        value={cert.expiryDate || ''}
                                        onChange={(e) => handleAdditionalCertChange(index, 'expiryDate', e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <FileUploadMany
                                        assetName={cert.certificateName}
                                        title={cert.certificateName || "Additional Certificate"}
                                        folder="site-additionals"
                                        onFilesChange={handleCertificateFilesChange(index)}
                                    />

                                </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 mt-8">

                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                    className=" hover:bg-blue-700"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Create
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                    {additionalCerts.length === 0 && existingdocs.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No additional certificates added yet.
                        </div>
                    )}

                    {additionalCerts.length > 0 && (<div className="mb-10" />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {
                            existingdocs.map((cert, index) => (

                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold">Existing Certificate</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteClick(cert.id!, cert.name || "Unnamed Certificate")}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div >
                                        <Label>Certificate Name</Label>
                                        <Input
                                            value={cert.name || ''}
                                            onChange={(e) => handleExistingCertChange(index, 'name', e.target.value)}
                                            placeholder="Enter certificate name"
                                        />
                                    </div>
                                    <div>
                                        <Label>Expiry Date</Label>
                                        <Input
                                            type="date"
                                            value={cert.expirey || ''}
                                            onChange={(e) => handleExistingCertChange(index, 'expirey', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <FileUploadUpdate
                                            assetName={cert.name || ""}
                                            title={cert.name || ""}
                                            folder="site-additionals"
                                            existingFiles={cert.requirementDoc ? [cert.requirementDoc] : []}
                                            onFilesChange={handleExistingFileChange(index)}
                                            onFileRemove={async (s3Key) => {
                                                if (s3Key && cert.id) {
                                                    try {
                                                        setUpdating(true);
                                                        setHasChanges(false);
                                                        // 1. Delete from S3 immediately
                                                        await remove({ path: s3Key });

                                                        // 2. Update the database to remove the file reference
                                                        await client.models.ComplianceAdditionals.update({
                                                            id: cert.id,
                                                            requirementDoc: ""
                                                        });

                                                        // 3. Update local state - THIS WAS MISSING
                                                        const updatedDocs = [...existingdocs];
                                                        updatedDocs[index] = {
                                                            ...updatedDocs[index],
                                                            requirementDoc: ""
                                                        };
                                                        setAdditionalDocs(updatedDocs);
                                                        // 4. History tracking for file removal
                                                        const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
                                                        const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

                                                        await client.models.History.create({
                                                            entityType: "COMPLIANCE",
                                                            entityId: complianceData?.customerSiteId,
                                                            action: "REMOVE_CERTIFICATE_FILE",
                                                            timestamp: new Date().toISOString(),
                                                            details: `\n${storedName} REMOVED file from certificate "${cert.name}" at ${johannesburgTime}\n`
                                                        });

                                                        // 5. Show success message
                                                        setMessage(`File deleted successfully`);
                                                        setSuccessful(true);
                                                        setShow(true);

                                                    } catch (error) {
                                                        console.error(`Failed to delete file: ${s3Key}`, error);
                                                        setMessage("Error deleting file");
                                                        setSuccessful(false);
                                                        setShow(true);
                                                    } finally {
                                                        setUpdating(false);
                                                    }
                                                }
                                            }}
                                        />

                                    </div>


                                </div>



                            )

                            )
                        }



                    </div>

                    {existingdocs.length > 0 && (
                        <div className="flex justify-end gap-3 mt-8">

                            <Button
                                onClick={handleUpdate}
                                disabled={!hasChanges}

                            >
                                {updating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Update
                                    </>
                                )}
                            </Button>
                        </div>
                    )
                    }

                </CardContent>
            </Card>

            {/* Digital Contractors Pack Card - NEW COMPONENT */}
            <Card className="mt-2">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Digital Contractors Pack
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button onClick={addContractorsPackSlot} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Document Slot
                            </Button>
                            {(hasContractorsPackChanges || Object.keys(contractorFiles).length > 0) && (
                                <Button
                                    onClick={saveContractorsPack}
                                    size="sm"
                                    disabled={updatingContractorsPack}
                                >
                                    {updatingContractorsPack ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Pack
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Digital Contractors Pack Documents */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {digitalContractorsPack.map((s3Key, index) => {
                            const fileName = s3Key && s3Key.trim() !== ""
                                ? s3Key.split('/').pop() || `Document ${index + 1}`
                                : `New Document ${index + 1}`;

                            return (
                                <div key={index} className="space-y-2 border rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold">
                                            {s3Key && s3Key.trim() !== "" ? "Existing Document" : "New Document"}
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeContractorsPackSlot(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div>
                                        <FileUploadUpdate
                                            assetName={`contractors-pack-${index}`}
                                            title={fileName}
                                            folder="contractors-pack"
                                            existingFiles={s3Key && s3Key.trim() !== "" ? [s3Key] : []}
                                            onFilesChange={handleContractorsPackFileChange(index)}
                                            onFileRemove={async (s3KeyToRemove) => {
                                                await handleContractorsFileRemove(s3KeyToRemove, index);
                                            }}
                                        />
                                    </div>

                                    {contractorFiles[index]?.[0] && (
                                        <div className="text-xs text-green-600">
                                            New file selected for upload
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {digitalContractorsPack.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No documents in Digital Contractors Pack yet. Click "Add Document Slot" to get started.
                        </div>
                    )}

          
                    {/* Notes Section */}
                    <div className="mt-6 border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium">Compliance Notes</label>
                            <span className="text-xs text-muted-foreground">
                                {notes !== complianceData?.notes ? "(Modified)" : ""}
                            </span>
                        </div>
                        <Textarea
                            value={notes}
                            onChange={handleNotesChange}
                            className="min-h-[80px] text-sm resize-vertical"
                            placeholder="Additional notes about site compliance..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Shared Modals */}
            {show && (
                <ResponseModal
                    successful={successful}
                    message={message}
                    setShow={setShow}
                />
            )}

            <ConfirmDialog
                open={opendelete}
                setOpen={setOpendelete}
                handleConfirm={() => {
                    handleConfirmDelete();
                }}
            />

        </>
    );
}