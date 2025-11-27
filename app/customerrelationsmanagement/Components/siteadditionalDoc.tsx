import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponseModal from "@/components/widgets/response";
import { FileText, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FileUploadUpdate } from "./fileupdate";
import { FileUpload, FileUploadMany, PDFState } from "./fileUpload";
import { Checkbox } from "@/components/ui/checkbox";
import { client } from "@/services/schema";
import { handleUpload } from "@/services/s3.service";

//    additipnal docs panel , select that visa applies to employees not site then it appears under ppe List
// but if allocated to customer we add the doc , set an expiry ,and does not appear under ppe list


// employee requirement are created in the crm section then it apppears ,in hrd where we upload .

// Additional require sites specific add [ critical requirement  ] 10% ech critical doc hold 10% ,if they are not expired they are worth the same as other docs

// in a set of 90 docs - work permit holds 10% and employee requirements make 1 %

interface SiteAdditionalProps {
    complianceData: any;
}
interface ComplianceAdditionals {
    complianceid: string;
    name: string;
    expirey: string;
    requirementDoc: string;
    critical: string;
}


export default function SiteAdditional({ complianceData }: SiteAdditionalProps) {
    const [additionalCerts, setAdditionalCerts] = useState<any[]>([]);
    const [additionaldoc, setAdditionalDocs] = useState<ComplianceAdditionals[]>([]);

    const [certificateFiles, setCertificateFiles] = useState<{ [key: number]: PDFState[] }>({});
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");
    const [history, setHistory] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {

        const fetchAdditionalDoc = async () => {
            try {
                const result = await client.models.ComplianceAdditionals.listComplianceAdditionalsByComplianceid({
                    complianceid: complianceData?.id
                });
                console.log(result);

            } catch (error) {
                console.error("Error fetching certificates:", error);
                setMessage("Error fetching additional certificates");
                setSuccessful(false);
                setShow(true);
            }
        }


        fetchAdditionalDoc();
        console.log(additionaldoc);
        console.log('nothing');
    }, [])


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
        setAdditionalCerts(prev => [...prev, { certificateName: "", expiryDate: "", attachment: "" }]);
    };

    // Handle file changes for each certificate
    const handleCertificateFilesChange = (index: number) => (files: PDFState[]) => {
        setCertificateFiles(prev => ({
            ...prev,
            [index]: files
        }));
    };

    // In your save function, handle multiple files
    const handleSave = async () => {
        try {
            setSaving(true);

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
                    complianceid: complianceData?.id,
                    name: cert.certificateName,
                    expirey: cert.expiryDate,
                    requirementDoc: cert.attachment || "",
                    critical: cert.critical ? "true" : "false"
                })
            );

            const results = await Promise.all(savePromises);

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
                setHistory(prev => `${historyText}\n${prev}`);

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
        }
    };

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
            <CardContent className="p-6">
                <div className="space-y-6">
                    {additionalCerts.map((cert, index) => (
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
                        </div>
                    ))}
                    {additionalCerts.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No additional certificates added yet.
                        </div>
                    )}



                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-8">

                    <Button
                        onClick={handleSave}
                        // disabled={!saving}
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
                                Save
                            </>
                        )}
                    </Button>
                </div>

                {show && (
                    <ResponseModal
                        successful={successful}
                        message={message}
                        setShow={setShow}
                    />
                )}
            </CardContent>
        </Card>

    );
}