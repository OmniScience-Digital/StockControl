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

//    additipnal docs panel , select that visa applies to employees not site then it appears under ppe List
// but if allocated to customer we add the doc , set an expiry ,and does not appear under ppe list


// employee requirement are created in the crm section then it apppears ,in hrd where we upload .

// Additional require sites specific add [ critical requirement  ] 10% ech critical doc hold 10% ,if they are not expired they are worth the same as other docs

// in a set of 90 docs - work permit holds 10% and employee requirements make 1 %

interface SiteAdditionalProps {
    complianceData: any;
}
interface ComplianceAdditionals {
    id?: string;
    complianceid?: string;
    name?: string;
    expirey?: string;
    requirementDoc?: string;
    critical?: string;
    createdAt?: string;
    updatedAt?: string;
}


export default function SiteAdditional({ complianceData }: SiteAdditionalProps) {
    const [additionalCerts, setAdditionalCerts] = useState<any[]>([]);
    const [existingdocs, setAdditionalDocs] = useState<ComplianceAdditionals[]>([]);

    const [certificateFiles, setCertificateFiles] = useState<{ [key: number]: PDFState[] }>({});
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [updating, setUpdating] = useState(false);


    const [loadingcompliance, setloadingcompliance] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);


    //handle delete site file 
    const [opendelete, setOpendelete] = useState(false);
    const [docToDelete, setDocToDelete] = useState<{ id: string, name: string } | null>(null);



    useEffect(() => {
        setloadingcompliance(true);
        const fetchAdditionalDoc = async () => {
            try {
                // Check if complianceData and id are available
                if (!complianceData?.id) {
                    console.log("Waiting for compliance data...");
                    return;
                }

                const result = await client.models.ComplianceAdditionals.listComplianceAdditionalsByComplianceid({
                    complianceid: complianceData.id
                });


                if (result.data) {
                    setAdditionalDocs(result.data as ComplianceAdditionals[]);
                }


            } catch (error) {
                console.error("Error fetching certificates:", error);
                setMessage("Error fetching additional certificates");
                setSuccessful(false);
                setShow(true);
            } finally {
                setloadingcompliance(false);
            }
        }

        fetchAdditionalDoc();

    }, [complianceData?.id])


    const handleCriticalChange = (index: number, checked: boolean) => {
        const updated = [...additionalCerts];
        updated[index] = { ...updated[index], critical: checked };
        setAdditionalCerts(updated);
    };


    const removeAdditionalCertificate = (index: number) => {
        setAdditionalCerts(prev => prev.filter((_, i) => i !== index));

    };

    const handleAdditionalCertChange = (index: number, field: string, value: string) => {
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

    // Delete handler for existing documents
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

    const handleConfirmDelete = () => {
        if (docToDelete) {
            handleDelete(docToDelete.id, docToDelete.name);
        }
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

            if (changedFields.length > 0) {
                const historyText = `\nSite Additional Documents updated by ${storedName}. Changes:\n${changedFields.join('')}`;
                await client.models.History.create({
                    entityType: "COMPLIANCE",
                    entityId: complianceData?.id,
                    action: "UPDATE",
                    timestamp: new Date().toISOString(),
                    details: historyText
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

            // Process all existing documents
            for (let i = 0; i < existingdocs.length; i++) {
                const currentDoc = existingdocs[i];
                if (!currentDoc.id) continue;

                let requirementDoc = currentDoc.requirementDoc || "";

                // Handle new file upload ONLY (no deletion logic here)
                const newFile = certificateFiles[i]?.[0];
                if (newFile) {
                    try {
                        const newFileKey = await handleUpload(newFile);
                        if (newFileKey) {
                            requirementDoc = newFileKey;
                        }
                    } catch (uploadError) {
                        console.error(`Failed to upload file:`, uploadError);
                        throw uploadError;
                    }
                }

                // Update the document
                try {
                    await client.models.ComplianceAdditionals.update({
                        id: currentDoc.id,
                        name: currentDoc.name || "",
                        expirey: currentDoc.expirey || "",
                        requirementDoc: requirementDoc,
                        critical: currentDoc.critical || "false"
                    });

                    updateCount++;
                    console.log(`Updated document ${currentDoc.id}`);
                } catch (error) {
                    console.error(`Failed to update document ${currentDoc.id}:`, error);
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

            // Refresh data if updates were made
            if (updateCount > 0) {
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

                // History tracking
                const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
                const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

                await client.models.History.create({
                    entityType: "COMPLIANCE",
                    entityId: complianceData?.id,
                    action: "UPDATE",
                    timestamp: new Date().toISOString(),
                    details: `Site Additional Documents updated by ${storedName} at ${johannesburgTime}. ${successMessage}`
                });
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

    if (loadingcompliance) {
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
                                                        requirementDoc: "" // Clear the file reference
                                                    });

                                                    // 3. Update local state - THIS WAS MISSING
                                                    const updatedDocs = [...existingdocs];
                                                    updatedDocs[index] = {
                                                        ...updatedDocs[index],
                                                        requirementDoc: ""
                                                    };
                                                    setAdditionalDocs(updatedDocs);

                                                    // 4. Show success message
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
                    handleConfirm={handleConfirmDelete}
                />
            </CardContent>
        </Card>

    );
}