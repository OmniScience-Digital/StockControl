import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResponseModal from "@/components/widgets/response";
import { FileText, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FileUploadUpdate } from "./fileupdate";

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
    const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
    //const [siteadditionaldoc, setAdditionalDocs] = useState<ComplianceAdditionals[]>(complianceData?.ComplianceAdditionals);

const [siteadditionaldoc, setAdditionalDocs] = useState<ComplianceAdditionals[]>([
  {
    complianceid: "cpl-001",
    name: "Medical Certificate",
    expirey: "2025-06-30",
    requirementDoc: "medical_cert.pdf",
    critical: "yes",
  },
  {
    complianceid: "cpl-002",
    name: "Police Clearance",
    expirey: "2026-01-15",
    requirementDoc: "police_clearance.pdf",
    critical: "no",
  },
]);


    useEffect(() => {
        console.log(siteadditionaldoc);
    }, [])
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");
    const [history, setHistory] = useState("");
    const [saving, setSaving] = useState(false);

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


    const handleSave = () => {
        try {


            // Check if there are any certificates with actual data
            const hasValidCertificates = additionalCerts.some(cert =>
                cert.certificateName?.trim() || cert.expiryDate || cert.attachment
            );

            if (!hasValidCertificates) {
                console.log("No valid certificates to save");
                return;
            }

            const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
            const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

            // Track additional certificate changes
            const changedFields: string[] = [];

            additionalCerts.forEach(cert => {
                if (cert.certificateName?.trim() || cert.expiryDate || cert.attachment) {
                    changedFields.push(`${storedName} added Additional Certificate "${cert.certificateName}" at ${johannesburgTime}.\n`);
                }
            });

            // Update history state
            if (changedFields.length > 0) {
                const historyText = `\nSite Additional Documents updated by ${storedName}. Changes:\n${changedFields.join('')}`;
                setHistory(prev => `${historyText}\n${prev}`);
            }

            // Print the data for your query
            console.log("Additional certificates data:", additionalCerts);
            console.log("History:", history);

        } catch (error) {
            console.error("Error in handleSave:", error);
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

                                {
                                    siteadditionaldoc.map((site) => (
                                        <>
                                            <div className="space-y-2">
                                                <div >
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

                                            </div>

                                            <Label>Attachment</Label>
                                            <FileUploadUpdate
                                                assetName={site.name || ""}
                                                title="Scale Datasheet"
                                                folder="site-additionals"
                                                existingFiles={site.requirementDoc ? [site.requirementDoc] : []}
                                                onFilesChange={setAdditionalCerts}
                                                onFileRemove={() => {
                                                    if (site.requirementDoc) {
                                                        setFilesToDelete(prev => [...prev, site.requirementDoc!]);
                                                    }
                                                }}
                                            />
                                        </>


                                    )

                                    )
                                }




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
                                Update Site
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
        </Card >

    );
}