"use client";

import { client } from "@/services/schema";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Save,
    ArrowLeft,
    User,
    Loader2,
    Upload,
    FileText,
    Plus,
    Trash2,
    BriefcaseMedical
} from "lucide-react";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDateForAmplify } from "@/utils/helper/time";
import { Employee, MEDICAL_CERTIFICATE_TYPES, TRAINING_CERTIFICATE_TYPES } from "@/types/hrd.types";
import { HrdPDFUpload } from "../components/hrdimages";
import ResponseModal from "@/components/widgets/response";


export default function CreateEmployeePage() {
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Employee>>({
        authorizedDriver: false
    });

    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");

    const [medicalCerts, setMedicalCerts] = useState<any[]>(() =>
        MEDICAL_CERTIFICATE_TYPES.map(type => ({
            certificateType: type,
            expiryDate: "",
            attachment: ""
        }))
    );

    const [trainingCerts, setTrainingCerts] = useState<any[]>(() =>
        TRAINING_CERTIFICATE_TYPES.map(type => ({
            certificateType: type,
            expiryDate: "",
            attachment: ""
        }))
    );
    const [additionalCerts, setAdditionalCerts] = useState<any[]>([]);


    // Add state to track which certificate is being uploaded
    const [uploadingCertIndex, setUploadingCertIndex] = useState<{
        type: 'medical' | 'training' | 'additional';
        index: number;
    } | null>(null);


    const handleInputChange = (field: keyof Employee, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMedicalCertChange = (index: number, field: string, value: string) => {
        const updated = [...medicalCerts];
        updated[index] = { ...updated[index], [field]: value };
        setMedicalCerts(updated);
    };

    const handleTrainingCertChange = (index: number, field: string, value: string) => {
        const updated = [...trainingCerts];
        updated[index] = { ...updated[index], [field]: value };
        setTrainingCerts(updated);
    };

    const handleAdditionalCertChange = (index: number, field: string, value: string) => {
        const updated = [...additionalCerts];
        updated[index] = { ...updated[index], [field]: value };
        setAdditionalCerts(updated);
    };


    const addAdditionalCertificate = () => {
        setAdditionalCerts(prev => [...prev, { certificateName: "", expiryDate: "", attachment: "" }]);

    };

    const removeAdditionalCertificate = (index: number) => {
        setAdditionalCerts(prev => prev.filter((_, i) => i !== index));

    };

    const handleChange = async (dbkey: string, urls: string[]) => {
        try {

            // Take only the first URL since we're now doing single file uploads
            const url = urls.length > 0 ? urls[0] : '';

            switch (dbkey) {
                case "employeeId":
                    setFormData(prev => ({ ...prev, employeeIdAttachment: url }));
                    break;

                case "passport":
                    setFormData(prev => ({ ...prev, passportAttachment: url }));
                    break;

                case "driversLicense":
                    setFormData(prev => ({ ...prev, driversLicenseAttachment: url }));
                    break;

                case "pdp":
                    setFormData(prev => ({ ...prev, pdpAttachment: url }));
                    break;

                case "ppeList":
                    setFormData(prev => ({ ...prev, ppeListAttachment: url }));
                    break;

                case "cv":
                    setFormData(prev => ({ ...prev, cvAttachment: url }));
                    break;

                case "medicalCerts":
                    // Update the specific medical certificate that was being uploaded
                    if (uploadingCertIndex?.type === 'medical') {
                        const updatedCerts = [...medicalCerts];
                        updatedCerts[uploadingCertIndex.index] = {
                            ...updatedCerts[uploadingCertIndex.index],
                            attachment: url
                        };
                        setMedicalCerts(updatedCerts);
                    }
                    break;

                case "trainingCerts":
                    if (uploadingCertIndex?.type === 'training') {
                        const updatedCerts = [...trainingCerts];
                        updatedCerts[uploadingCertIndex.index] = {
                            ...updatedCerts[uploadingCertIndex.index],
                            attachment: url
                        };
                        setTrainingCerts(updatedCerts);
                    }
                    break;

                case "additionalCerts":
                    if (uploadingCertIndex?.type === 'additional') {
                        const updatedCerts = [...additionalCerts];
                        updatedCerts[uploadingCertIndex.index] = {
                            ...updatedCerts[uploadingCertIndex.index],
                            attachment: url
                        };
                        setAdditionalCerts(updatedCerts);
                    }
                    break;

                default:
                    console.warn(`Unknown dbkey: ${dbkey}`);
            }

            // Reset uploading index
            setUploadingCertIndex(null);

        } catch (error) {
            console.error('Error handling file change:', error);
            setMessage("Failed to update file attachment!");
            setShow(true);
            setSuccessful(false);
            setUploadingCertIndex(null);
        }
    }


    const validateForm = (): boolean => {
        if (!formData.employeeId?.trim()) {

            setMessage("Employee ID is required!");
            setShow(true);
            setSuccessful(false);
            return false;
        }
        if (!formData.firstName?.trim()) {

            setMessage("First name is required!");
            setShow(true);
            setSuccessful(false);
            return false;
        }
        if (!formData.surname?.trim()) {

            setMessage("Surname is required!");
            setShow(true);
            setSuccessful(false);
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        try {
            if (!validateForm()) {
                return;
            }

            setSaving(true);

            const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
            const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });
            const historyEntries = `${storedName} created new employee at ${johannesburgTime}.\n`;

            // Upload files and get their paths
            const employeeId = formData.employeeId!;

            const employeeData = {
                employeeId: formData.employeeId!,
                firstName: formData.firstName!,
                surname: formData.surname!,
                employeeNumber: formData.employeeNumber || null,
                knownAs: formData.knownAs || null,
                passportNumber: formData.passportNumber || null,
                passportExpiry: formatDateForAmplify(formData.passportExpiry),
                passportAttachment: formData.passportAttachment || null,
                driversLicenseCode: formData.driversLicenseCode || null,
                driversLicenseExpiry: formatDateForAmplify(formData.driversLicenseExpiry),
                driversLicenseAttachment: formData.driversLicenseAttachment || null,
                authorizedDriver: formData.authorizedDriver!,
                pdpExpiry: formatDateForAmplify(formData.pdpExpiry),
                pdpAttachment: formData.pdpAttachment || null,
                cvAttachment: formData.cvAttachment || null,
                ppeListAttachment: formData.ppeListAttachment || null,
                ppeExpiry: formatDateForAmplify(formData.ppeExpiry),
                employeeIdAttachment: formData.employeeIdAttachment || null,
            };

            const newEmployee = await client.models.Employee.create(employeeData);

            if (!newEmployee.errors) {
                // Create medical certificates
                for (const cert of medicalCerts) {
                    if (cert.certificateType) {
                        await client.models.EmployeeMedicalCertificate.create({
                            employeeId: employeeId,
                            certificateType: cert.certificateType,
                            expiryDate: formatDateForAmplify(cert.expiryDate) || "",
                            attachment: cert.attachment || null
                        });
                    }
                }

                // Create training certificates
                for (const cert of trainingCerts) {
                    if (cert.certificateType) {
                        await client.models.EmployeeTrainingCertificate.create({
                            employeeId: employeeId,
                            certificateType: cert.certificateType,
                            expiryDate: formatDateForAmplify(cert.expiryDate) || "",
                            attachment: cert.attachment || null
                        });
                    }
                }

                // Create additional certificates
                for (const cert of additionalCerts) {
                    if (cert.certificateName) {
                        await client.models.EmployeeAdditionalCertificate.create({
                            employeeId: employeeId,
                            certificateName: cert.certificateName,
                            expiryDate: formatDateForAmplify(cert.expiryDate) || "",
                            attachment: cert.attachment || null
                        });
                    }
                }

                    // Add History table entry
                  await client.models.History.create({
                    entityType: "EMPLOYEE",
                    entityId: employeeId,
                    action: "CREATE",
                    timestamp: new Date().toISOString(),
                    details:historyEntries
                    });
                  router.push('/humanresourcesdepartment');

            } else {
                
                setMessage("Failed to create employee!");
                setShow(true);
                setSuccessful(false);


            }

        } catch (error: any) {
            console.error("Error saving employee:", error);
            const errorMessage = error.message || "Error creating employee. Please check the console for details.";
            setMessage(errorMessage);
            setShow(true);
            setSuccessful(false);

        } finally {
            setSaving(false);
        }
    };

    const getInitials = (firstName: string, surname: string) => {
        return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Navbar />

            <main className="flex-1 px-4 sm:px-6 mt-20 pb-20">
                <div className="container mx-auto max-w-6xl mt-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/humanresourcesdepartment')}
                                className="h-9 w-9 p-0"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Add New Employee
                                </h1>
                                <p className="text-muted-foreground mt-2 text-base">
                                    Create a new employee profile
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-24">
                                <CardContent className="p-6">
                                    <div className="text-center mb-6">
                                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg mx-auto mb-4">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                                                {formData.firstName && formData.surname
                                                    ? getInitials(formData.firstName, formData.surname)
                                                    : <User className="h-6 w-6" />
                                                }
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <h3 className="font-semibold">
                                                {formData.firstName || 'First'} {formData.surname || 'Last'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {formData.employeeId || 'EMP ID'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <Label>Employee Status</Label>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm">Active Employee</span>
                                                <Switch defaultChecked />
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Driver Status</Label>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm">Authorized Driver</span>
                                                <Switch
                                                    checked={formData.authorizedDriver || false}
                                                    onCheckedChange={(checked) => handleInputChange('authorizedDriver', checked)}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Label className="mb-2 block">Document Summary</Label>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Medical Certs:</span>
                                                    <Badge variant={medicalCerts.length > 0 ? "default" : "secondary"}>
                                                        {medicalCerts.length}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Training Certs:</span>
                                                    <Badge variant={trainingCerts.length > 0 ? "default" : "secondary"}>
                                                        {trainingCerts.length}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Additional Certs:</span>
                                                    <Badge variant={additionalCerts.length > 0 ? "default" : "secondary"}>
                                                        {additionalCerts.length}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Form */}
                        <div className="lg:col-span-3">

                            <Tabs defaultValue="personal" className="space-y-6">

                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="personal" className="cursor-pointer">Basic</TabsTrigger>
                                    <TabsTrigger value="medical" className="cursor-pointer">Medical / Induction</TabsTrigger>
                                    <TabsTrigger value="training" className="cursor-pointer">Training / Certification</TabsTrigger>
                                    <TabsTrigger value="additional" className="cursor-pointer">Additional</TabsTrigger>

                                </TabsList>

                                {/* Personal Information Tab */}
                                <TabsContent value="personal" >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <User className="h-5 w-5" />
                                                Basic Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label>Employee ID *</Label>
                                                        <Input
                                                            value={formData.employeeId || ''}
                                                            onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                                            placeholder="1234567890123"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>First Name *</Label>
                                                        <Input
                                                            value={formData.firstName || ''}
                                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                            placeholder="John"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>Surname *</Label>
                                                        <Input
                                                            value={formData.surname || ''}
                                                            onChange={(e) => handleInputChange('surname', e.target.value)}
                                                            placeholder="Doe"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label>Known As</Label>
                                                        <Input
                                                            value={formData.knownAs || ''}
                                                            onChange={(e) => handleInputChange('knownAs', e.target.value)}
                                                            placeholder="Johnny"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">

                                                    <div>
                                                        <Label>Employee Number</Label>
                                                        <Input
                                                            value={formData.employeeNumber || ''}
                                                            onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                                                            placeholder="001"
                                                        />
                                                    </div>

                                                    <div>
                                                        <HrdPDFUpload
                                                            employeeID={formData.employeeId || ""}
                                                            filetitle="Employee ID Attachment"
                                                            filename="employeeId"
                                                            folder="ID"
                                                            existingFiles={formData.employeeIdAttachment ? [formData.employeeIdAttachment] : []}

                                                            onPDFsChange={(pdfs) => {
                                                                const pdfUrls = pdfs.map(pdf => pdf.s3Key);
                                                                handleChange("employeeId", pdfUrls);
                                                            }}
                                                        />

                                                    </div>
                                                </div>

                                                {/* Passport Section */}
                                                <div>
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold border-b ">Passport Details</h4>
                                                        <div>
                                                            <Label>Passport Number</Label>
                                                            <Input
                                                                value={formData.passportNumber || ''}
                                                                onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                                                                placeholder="A12345678"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label>Passport Expiry</Label>
                                                            <Input
                                                                type="date"
                                                                value={formData.passportExpiry || ''}
                                                                onChange={(e) => handleInputChange('passportExpiry', e.target.value)}
                                                            />
                                                        </div>

                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <HrdPDFUpload
                                                                employeeID={formData.employeeId || ""}
                                                                filetitle="Passport Attachment"
                                                                filename="passport"
                                                                folder="Passport"
                                                                existingFiles={formData.passportAttachment ? [formData.passportAttachment] : []}
                                                                onPDFsChange={(pdfs) => {
                                                                    const pdfUrls = pdfs.map(pdf => pdf.s3Key);
                                                                    handleChange("passport", pdfUrls);
                                                                }}
                                                            />

                                                        </div>
                                                    </div>

                                                </div>


                                                {/* Driver's License Section */}
                                                <div>
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold border-b ">Driver's License</h4>
                                                        <div>
                                                            <Label>License Code</Label>
                                                            <Input
                                                                value={formData.driversLicenseCode || ''}
                                                                onChange={(e) => handleInputChange('driversLicenseCode', e.target.value)}
                                                                placeholder="Code 10, etc."
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label>License Expiry</Label>
                                                            <Input
                                                                type="date"
                                                                value={formData.driversLicenseExpiry || ''}
                                                                onChange={(e) => handleInputChange('driversLicenseExpiry', e.target.value)}
                                                            />
                                                        </div>


                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <HrdPDFUpload
                                                                employeeID={formData.employeeId || ""}
                                                                filetitle="Driver's License Attachment"
                                                                filename="driversLicense"
                                                                folder="License"
                                                                existingFiles={formData.driversLicenseAttachment ? [formData.driversLicenseAttachment] : []}
                                                                onPDFsChange={(pdfs) => {
                                                                    const pdfUrls = pdfs.map(pdf => pdf.s3Key);
                                                                    handleChange("driversLicense", pdfUrls);
                                                                }}
                                                            />

                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Pdp and PPE Documents */}
                                                <div>
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold border-b ">PDP</h4>

                                                        <div>
                                                            <Label>PDP Expiry</Label>
                                                            <Input
                                                                type="date"
                                                                value={formData.pdpExpiry || ''}
                                                                onChange={(e) => handleInputChange('pdpExpiry', e.target.value)}
                                                            />
                                                        </div>
                                                        <HrdPDFUpload
                                                            employeeID={formData.employeeId || ""}
                                                            filetitle="Pdp  Attachment"
                                                            filename="pdp"
                                                            folder="pdp"
                                                            existingFiles={formData.pdpAttachment ? [formData.pdpAttachment] : []}
                                                            onPDFsChange={(pdfs) => {
                                                                const pdfUrls = pdfs.map(pdf => pdf.s3Key);
                                                                handleChange("pdp", pdfUrls);
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="space-y-4 mt-4">
                                                        <h4 className="font-semibold border-b ">Curriculum Vitae</h4>

                                                        <Label>CV Doc</Label>

                                                        <HrdPDFUpload
                                                            employeeID={formData.employeeId || ""}
                                                            filetitle="CV  Attachment"
                                                            filename="cv"
                                                            folder="Cv"
                                                            existingFiles={formData.cvAttachment ? [formData.cvAttachment] : []}
                                                            onPDFsChange={(pdfs) => {
                                                                const pdfUrls = pdfs.map(pdf => pdf.s3Key);
                                                                handleChange("cv", pdfUrls);
                                                            }}
                                                        />

                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold border-b ">PPE</h4>

                                                        <div>
                                                            <Label>PPE Expiry</Label>
                                                            <Input
                                                                type="date"
                                                                value={formData.ppeExpiry || ''}
                                                                onChange={(e) => handleInputChange('ppeExpiry', e.target.value)}
                                                            />
                                                        </div>

                                                        <HrdPDFUpload
                                                            employeeID={formData.employeeId || ""}
                                                            filetitle="PPE List  Attachment"
                                                            filename="ppeList"
                                                            folder="PPE"
                                                            existingFiles={formData.ppeListAttachment ? [formData.ppeListAttachment] : []}
                                                            onPDFsChange={(pdfs) => {
                                                                const pdfUrls = pdfs.map(pdf => pdf.s3Key);
                                                                handleChange("ppeList", pdfUrls);
                                                            }}
                                                        />
                                                    </div>
                                                </div>




                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Medical Induction Tab */}
                                <TabsContent value="medical">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BriefcaseMedical className="h-5 w-5" />
                                                Medical Documents
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                {medicalCerts.map((cert, index) => (
                                                    <div key={cert.certificateType} className="p-4 border rounded-lg">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <h4 className="font-semibold">{cert.certificateType.replace(/_/g, ' ')}</h4>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Certificate Type</Label>
                                                                <Input
                                                                    value={cert.certificateType}
                                                                    disabled
                                                                    className="bg-gray-50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Expiry Date</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={cert.expiryDate || ''}
                                                                    onChange={(e) => handleMedicalCertChange(index, 'expiryDate', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <Label>Attachment</Label>
                                                                <HrdPDFUpload
                                                                    key={`medical-${cert.certificateType}-${index}`}
                                                                    employeeID={formData.employeeId || ""}
                                                                    filetitle={`${cert.certificateType} Attachment`}
                                                                    filename={`medical-${cert.certificateType}`}
                                                                    folder="Medical"
                                                                    existingFiles={cert.attachment ? [cert.attachment] : []}
                                                                    onPDFsChange={(pdfs) => {
                                                                        const pdfUrls = pdfs.map(pdf => pdf.s3Key);
                                                                        // Update the specific medical certificate directly
                                                                        const updatedCerts = [...medicalCerts];
                                                                        updatedCerts[index] = {
                                                                            ...updatedCerts[index],
                                                                            attachment: pdfUrls[0] || ''
                                                                        };
                                                                        setMedicalCerts(updatedCerts);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                {/* Training Certificates Tab */}
                                <TabsContent value="training">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                Training Certificates
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                {trainingCerts.map((cert, index) => (
                                                    <div key={cert.certificateType} className="p-4 border rounded-lg">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <h4 className="font-semibold">{cert.certificateType.replace(/_/g, ' ')}</h4>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Certificate Type</Label>
                                                                <Input
                                                                    value={cert.certificateType}
                                                                    disabled
                                                                    className="bg-gray-50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Expiry Date</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={cert.expiryDate || ''}
                                                                    onChange={(e) => handleTrainingCertChange(index, 'expiryDate', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <Label>Attachment</Label>
                                                                <HrdPDFUpload
                                                                    key={`training-${cert.certificateType}-${index}`}
                                                                    employeeID={formData.employeeId || ""}
                                                                    filetitle={`${cert.certificateType} Attachment`}
                                                                    filename={`training-${cert.certificateType}`}
                                                                    folder="Training"
                                                                    existingFiles={cert.attachment ? [cert.attachment] : []}
                                                                    onPDFsChange={(pdfs) => {
                                                                        const pdfUrls = pdfs.map(pdf => pdf.s3Key);
                                                                        const updatedCerts = [...trainingCerts];
                                                                        updatedCerts[index] = {
                                                                            ...updatedCerts[index],
                                                                            attachment: pdfUrls[0] || ''
                                                                        };
                                                                        setTrainingCerts(updatedCerts);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                {/* Additional Certificates Tab */}
                                <TabsContent value="additional">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5" />
                                                    Additional Certificates
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
                                                                <Label>Attachment</Label>

                                                                <HrdPDFUpload
                                                                    key={`additional-${index}-${cert.certificateName}`}
                                                                    employeeID={formData.employeeId || ""}
                                                                    filetitle={`${cert.certificateName || 'Additional'} Attachment`}
                                                                    filename={`additional-${index}`}
                                                                    folder="Additional"
                                                                    existingFiles={cert.attachment ? [cert.attachment] : []}
                                                                    onPDFsChange={(pdfs) => {
                                                                        const pdfUrls = pdfs.map(pdf => pdf.s3Key);

                                                                        // Update the specific additional certificate directly
                                                                        const updatedCerts = [...additionalCerts];
                                                                        updatedCerts[index] = {
                                                                            ...updatedCerts[index],
                                                                            attachment: pdfUrls[0] || ''
                                                                        };
                                                                        setAdditionalCerts(updatedCerts);
                                                                    }}
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
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                            </Tabs>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/humanresourcesdepartment')}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !formData.employeeId || !formData.firstName || !formData.surname}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Create Employee
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
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}





