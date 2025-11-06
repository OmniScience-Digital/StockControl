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
    Trash2
} from "lucide-react";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDateForAmplify } from "@/utils/helper/time";

interface Employee {
    id: string;
    employeeId: string;
    employeeNumber?: string;
    firstName: string;
    surname: string;
    knownAs?: string;
    passportNumber?: string;
    passportExpiry?: string;
    passportAttachment?: string;
    driversLicenseCode?: string;
    driversLicenseExpiry?: string;
    driversLicenseAttachment?: string;
    authorizedDriver: boolean;
    pdpExpiry?: string;
    pdpAttachment?: string;
    cvAttachment?: string;
    ppeListAttachment?: string;
    ppeExpiry?: string;
    employeeIdAttachment?: string;
    history?: string;
}

const MEDICAL_CERTIFICATE_TYPES = [
    "CLINIC_PLUS",
    "CLINIC_PLUS_INDUCTION",
    "HEARTLY_HEALTH",
    "KLIPSPRUIT_MEDICAL",
    "LUYUYO_MEDICAL",
    "KRIEL_MEDICAL",
    "PRO_HEALTH_MEDICAL",
    "LEGAL_LIABILITY"
];

const TRAINING_CERTIFICATE_TYPES = [
    "FIREFIGHTING",
    "FIRST_AID_LEVEL_1",
    "FIRST_AID_LEVEL_2",
    "WORKING_AT_HEIGHTS",
    "WORKING_WITH_HAND_TOOLS",
    "WORKING_WITH_POWER_TOOLS",
    "SATS_CONVEYOR",
    "SATS_COP_SOP",
    "SATS_ILOT",
    "WILGE_VXR",
    "OHS_ACT",
    "MHSA",
    "HIRA_TRAINING",
    "APPOINTMENT_2_9_2",
    "OEM_CERT"
];

export default function CreateEmployeePage() {
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Employee>>({
        authorizedDriver: false
    });

    const [medicalCerts, setMedicalCerts] = useState<any[]>([]);
    const [trainingCerts, setTrainingCerts] = useState<any[]>([]);
    const [additionalCerts, setAdditionalCerts] = useState<any[]>([]);

    const [fileUploads, setFileUploads] = useState({
        passport: null as File | null,
        driversLicense: null as File | null,
        pdp: null as File | null,
        cv: null as File | null,
        ppeList: null as File | null,
        employeeId: null as File | null,
        medicalCerts: [] as (File | null)[],
        trainingCerts: [] as (File | null)[],
        additionalCerts: [] as (File | null)[]
    });

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

    const handleFileUpload = (field: keyof typeof fileUploads, file: File | null, index?: number) => {
        if (index !== undefined) {
            // For certificate arrays
            const updated = [...fileUploads[field] as (File | null)[]];
            updated[index] = file;
            setFileUploads(prev => ({ ...prev, [field]: updated }));

            // Update the attachment field in the certificate data
            if (field === 'medicalCerts') {
                handleMedicalCertChange(index, 'attachment', file ? file.name : '');
            } else if (field === 'trainingCerts') {
                handleTrainingCertChange(index, 'attachment', file ? file.name : '');
            } else if (field === 'additionalCerts') {
                handleAdditionalCertChange(index, 'attachment', file ? file.name : '');
            }
        } else {
            // For single files
            setFileUploads(prev => ({ ...prev, [field]: file }));

            // Update formData with filename
            const attachmentFieldMap: Record<string, keyof Employee> = {
                passport: 'passportAttachment',
                driversLicense: 'driversLicenseAttachment',
                pdp: 'pdpAttachment',
                cv: 'cvAttachment',
                ppeList: 'ppeListAttachment',
                employeeId: 'employeeIdAttachment'
            };

            if (attachmentFieldMap[field]) {
                handleInputChange(attachmentFieldMap[field], file ? file.name : '');
            }
        }
    };

    const addMedicalCertificate = () => {
        setMedicalCerts(prev => [...prev, { certificateType: "", expiryDate: "", attachment: "" }]);
        setFileUploads(prev => ({
            ...prev,
            medicalCerts: [...prev.medicalCerts, null]
        }));
    };

    const addTrainingCertificate = () => {
        setTrainingCerts(prev => [...prev, { certificateType: "", expiryDate: "", attachment: "" }]);
        setFileUploads(prev => ({
            ...prev,
            trainingCerts: [...prev.trainingCerts, null]
        }));
    };

    const addAdditionalCertificate = () => {
        setAdditionalCerts(prev => [...prev, { certificateName: "", expiryDate: "", attachment: "" }]);
        setFileUploads(prev => ({
            ...prev,
            additionalCerts: [...prev.additionalCerts, null]
        }));
    };

    const removeMedicalCertificate = (index: number) => {
        setMedicalCerts(prev => prev.filter((_, i) => i !== index));
        setFileUploads(prev => ({
            ...prev,
            medicalCerts: prev.medicalCerts.filter((_, i) => i !== index)
        }));
    };

    const removeTrainingCertificate = (index: number) => {
        setTrainingCerts(prev => prev.filter((_, i) => i !== index));
        setFileUploads(prev => ({
            ...prev,
            trainingCerts: prev.trainingCerts.filter((_, i) => i !== index)
        }));
    };

    const removeAdditionalCertificate = (index: number) => {
        setAdditionalCerts(prev => prev.filter((_, i) => i !== index));
        setFileUploads(prev => ({
            ...prev,
            additionalCerts: prev.additionalCerts.filter((_, i) => i !== index)
        }));
    };

    const FileUploadButton = ({
        onFileSelect,
        currentFile,
        accept = "*",
        className = ""
    }: {
        onFileSelect: (file: File | null) => void;
        currentFile: File | null;
        accept?: string;
        className?: string;
    }) => {
        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0] || null;
            onFileSelect(file);
        };

        return (
            <div className={`flex flex-col gap-2 ${className}`}>
                <Input
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                    id={`file-upload-${Math.random()}`}
                />
                <Button
                    variant="outline"
                    className="w-full border-slate-300 hover:bg-gray-300"
                    onClick={() => document.getElementById(`file-upload-${Math.random()}`)?.click()}
                    type="button"
                >
                    <Upload className="h-4 w-4 mr-2" />
                    {currentFile ? `Change File (${currentFile.name})` : "Upload File"}
                </Button>
                {currentFile && (
                    <span className="text-xs text-green-600">
                        Selected: {currentFile.name}
                    </span>
                )}
            </div>
        );
    };

    const uploadFileToStorage = async (file: File, employeeId: string, fileType: string): Promise<string | null> => {
        try {
            console.log(`Uploading ${fileType} for employee ${employeeId}:`, file.name);

            // Simulate file upload - replace with your actual storage upload
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Return mock file path - replace with actual path from your storage
            return `employees/${employeeId}/${fileType}/${file.name}`;
        } catch (error) {
            console.error(`Error uploading ${fileType}:`, error);
            return null;
        }
    };

    const validateForm = (): boolean => {
        if (!formData.employeeId?.trim()) {
            toast.error("Employee ID is required");
            return false;
        }
        if (!formData.firstName?.trim()) {
            toast.error("First name is required");
            return false;
        }
        if (!formData.surname?.trim()) {
            toast.error("Surname is required");
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
            const historyEntries = `${storedName} created new employee at ${johannesburgTime}\n`;

            // Upload files and get their paths
            const employeeId = formData.employeeId!;
            const uploadPromises = [];

            // Upload single files
            if (fileUploads.passport) {
                uploadPromises.push(
                    uploadFileToStorage(fileUploads.passport, employeeId, 'passport')
                        .then(path => { if (path) formData.passportAttachment = path; })
                );
            }

            if (fileUploads.driversLicense) {
                uploadPromises.push(
                    uploadFileToStorage(fileUploads.driversLicense, employeeId, 'driversLicense')
                        .then(path => { if (path) formData.driversLicenseAttachment = path; })
                );
            }

            if (fileUploads.pdp) {
                uploadPromises.push(
                    uploadFileToStorage(fileUploads.pdp, employeeId, 'pdp')
                        .then(path => { if (path) formData.pdpAttachment = path; })
                );
            }

            if (fileUploads.cv) {
                uploadPromises.push(
                    uploadFileToStorage(fileUploads.cv, employeeId, 'cv')
                        .then(path => { if (path) formData.cvAttachment = path; })
                );
            }

            if (fileUploads.ppeList) {
                uploadPromises.push(
                    uploadFileToStorage(fileUploads.ppeList, employeeId, 'ppeList')
                        .then(path => { if (path) formData.ppeListAttachment = path; })
                );
            }

            if (fileUploads.employeeId) {
                uploadPromises.push(
                    uploadFileToStorage(fileUploads.employeeId, employeeId, 'employeeId')
                        .then(path => { if (path) formData.employeeIdAttachment = path; })
                );
            }

            // Upload medical certificate files
            fileUploads.medicalCerts.forEach((file, index) => {
                if (file) {
                    uploadPromises.push(
                        uploadFileToStorage(file, employeeId, `medical-${medicalCerts[index]?.certificateType || 'cert'}`)
                            .then(path => { if (path) medicalCerts[index].attachment = path; })
                    );
                }
            });

            // Upload training certificate files
            fileUploads.trainingCerts.forEach((file, index) => {
                if (file) {
                    uploadPromises.push(
                        uploadFileToStorage(file, employeeId, `training-${trainingCerts[index]?.certificateType || 'cert'}`)
                            .then(path => { if (path) trainingCerts[index].attachment = path; })
                    );
                }
            });

            // Upload additional certificate files
            fileUploads.additionalCerts.forEach((file, index) => {
                if (file) {
                    uploadPromises.push(
                        uploadFileToStorage(file, employeeId, `additional-${additionalCerts[index]?.certificateName || 'cert'}`)
                            .then(path => { if (path) additionalCerts[index].attachment = path; })
                    );
                }
            });

            // Wait for all file uploads to complete
            await Promise.all(uploadPromises);

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
                history: historyEntries || ""
            };

            console.log("Saving employee data:", employeeData);

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

                toast.success("Employee created successfully!");
                setTimeout(() => {
                    router.push('/humanresources');
                }, 1500);
            } else {
                throw new Error("Failed to create employee");
            }

        } catch (error: any) {
            console.error("Error saving employee:", error);
            const errorMessage = error.message || "Error creating employee. Please check the console for details.";
            toast.error(errorMessage);
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
                                onClick={() => router.push('/humanresources')}
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
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="personal" className="cursor-pointer">Personal</TabsTrigger>
                                    <TabsTrigger value="documents" className="cursor-pointer">Documents</TabsTrigger>
                                    <TabsTrigger value="medical" className="cursor-pointer">Medical</TabsTrigger>
                                    <TabsTrigger value="training" className="cursor-pointer">Training</TabsTrigger>
                                    <TabsTrigger value="additional" className="cursor-pointer">Additional</TabsTrigger>

                                </TabsList>

                                <TabsContent value="personal">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <User className="h-5 w-5" />
                                                Personal Information
                                            </CardTitle>
                                            <CardDescription>
                                                Basic personal details and identification information
                                            </CardDescription>
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
                                                        <Label>Employee ID Attachment</Label>
                                                        <FileUploadButton
                                                            onFileSelect={(file) => handleFileUpload('employeeId', file)}
                                                            currentFile={fileUploads.employeeId}
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="documents">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                Core Documents
                                            </CardTitle>
                                            <CardDescription>
                                                Upload and manage employee documents and certifications
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Passport Section */}
                                                <div className="space-y-4">
                                                    <h4 className="font-semibold border-b pb-2">Passport Details</h4>
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

                                                    <FileUploadButton
                                                        onFileSelect={(file) => handleFileUpload('passport', file)}
                                                        currentFile={fileUploads.passport}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                </div>

                                                {/* Driver's License Section */}
                                                <div className="space-y-4">
                                                    <h4 className="font-semibold border-b pb-2">Driver's License</h4>
                                                    <div>
                                                        <Label>License Code</Label>
                                                        <Input
                                                            value={formData.driversLicenseCode || ''}
                                                            onChange={(e) => handleInputChange('driversLicenseCode', e.target.value)}
                                                            placeholder="B, C1, etc."
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

                                                    <FileUploadButton
                                                        onFileSelect={(file) => handleFileUpload('driversLicense', file)}
                                                        currentFile={fileUploads.driversLicense}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                </div>
                                            </div>

                                            {/* Additional Core Documents */}
                                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <h4 className="font-semibold border-b pb-2">Professional Documents</h4>

                                                    <div>
                                                        <Label>PDP Expiry</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.pdpExpiry || ''}
                                                            onChange={(e) => handleInputChange('pdpExpiry', e.target.value)}
                                                        />
                                                    </div>

                                                    <FileUploadButton
                                                        onFileSelect={(file) => handleFileUpload('pdp', file)}
                                                        currentFile={fileUploads.pdp}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />

                                                    <Label>CV Doc</Label>
                                                    <FileUploadButton
                                                        onFileSelect={(file) => handleFileUpload('cv', file)}
                                                        currentFile={fileUploads.cv}
                                                        accept=".pdf,.doc,.docx"
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <h4 className="font-semibold border-b pb-2">Safety Documents</h4>

                                                    <div>
                                                        <Label>PPE Expiry</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.ppeExpiry || ''}
                                                            onChange={(e) => handleInputChange('ppeExpiry', e.target.value)}
                                                        />
                                                    </div>

                                                    <FileUploadButton
                                                        onFileSelect={(file) => handleFileUpload('ppeList', file)}
                                                        currentFile={fileUploads.ppeList}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="medical">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5" />
                                                    Medical Certificates
                                                </CardTitle>
                                                <Button onClick={addMedicalCertificate} size="sm">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Medical Certificate
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                {medicalCerts.map((cert, index) => (
                                                    <div key={index} className="p-4 border rounded-lg">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <h4 className="font-semibold">Medical Certificate #{index + 1}</h4>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeMedicalCertificate(index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Certificate Type</Label>
                                                                <Select
                                                                    value={cert.certificateType || ''}
                                                                    onValueChange={(value) => handleMedicalCertChange(index, 'certificateType', value)}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select certificate type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent position="popper" className="max-h-60 overflow-auto">
                                                                        {MEDICAL_CERTIFICATE_TYPES.map(type => (
                                                                            <SelectItem key={type} value={type}>
                                                                                {type.replace(/_/g, ' ')}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
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
                                                                <FileUploadButton
                                                                    onFileSelect={(file) => handleFileUpload('medicalCerts', file, index)}
                                                                    currentFile={fileUploads.medicalCerts[index]}
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {medicalCerts.length === 0 && (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        No medical certificates added yet.
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="training">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5" />
                                                    Training Certificates
                                                </CardTitle>
                                                <Button onClick={addTrainingCertificate} size="sm">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add Training Certificate
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                {trainingCerts.map((cert, index) => (
                                                    <div key={index} className="p-4 border rounded-lg">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <h4 className="font-semibold">Training Certificate #{index + 1}</h4>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeTrainingCertificate(index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Certificate Type</Label>
                                                                <Select
                                                                    value={cert.certificateType || ''}
                                                                    onValueChange={(value) => handleTrainingCertChange(index, 'certificateType', value)}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select certificate type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent position="popper" className="max-h-60 overflow-auto">
                                                                        {TRAINING_CERTIFICATE_TYPES.map(type => (
                                                                            <SelectItem key={type} value={type}>
                                                                                {type.replace(/_/g, ' ')}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
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
                                                                <FileUploadButton
                                                                    onFileSelect={(file) => handleFileUpload('trainingCerts', file, index)}
                                                                    currentFile={fileUploads.trainingCerts[index]}
                                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {trainingCerts.length === 0 && (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        No training certificates added yet.
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

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
                                                                <FileUploadButton
                                                                    onFileSelect={(file) => handleFileUpload('additionalCerts', file, index)}
                                                                    currentFile={fileUploads.additionalCerts[index]}
                                                                    accept=".pdf,.jpg,.jpeg,.png"
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
                                    onClick={() => router.push('/humanresources')}
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
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}