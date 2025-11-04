"use client";

import { client } from "@/services/schema";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Save,
    ArrowLeft,
    User,
    Loader2,
    Upload,
    Camera,
    Shield,
    FileText,
    Calendar,
    Mail,
    Phone,
    MapPin
} from "lucide-react";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import Loading from "@/components/widgets/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Employee {
    id: string;
    employeeId: string;
    employeeNumber?: string;
    firstName: string;
    surname: string;
    knownAs?: string;
    idNumber?: string;
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

export default function CreateEmployeePage() {
    const router = useRouter();
    const isEditing = false;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Employee>>({
        authorizedDriver: false
    });

    const [fileUploads, setFileUploads] = useState({
        passport: null as File | null,
        driversLicense: null as File | null,
        pdp: null as File | null,
        cv: null as File | null,
        ppeList: null as File | null,
        employeeId: null as File | null,
    });

    const handleInputChange = (field: keyof Employee, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (field: keyof typeof fileUploads, file: File | null) => {
        setFileUploads(prev => ({ ...prev, [field]: file }));
        // You can also set the attachment field in formData if needed
        if (file) {
            const attachmentField = getAttachmentFieldName(field);
            if (attachmentField) {
                handleInputChange(attachmentField, file.name);
            }
        }
    };

    const getAttachmentFieldName = (fileField: keyof typeof fileUploads): keyof Employee | null => {
        const fieldMap: Record<keyof typeof fileUploads, keyof Employee> = {
            passport: 'passportAttachment',
            driversLicense: 'driversLicenseAttachment',
            pdp: 'pdpAttachment',
            cv: 'cvAttachment',
            ppeList: 'ppeListAttachment',
            employeeId: 'employeeIdAttachment'
        };
        return fieldMap[fileField] || null;
    };

    const formatDateForAmplify = (dateValue: string | null | undefined): string | null => {
        if (!dateValue || dateValue.trim() === "") return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
        if (dateValue.includes('T')) return dateValue.split('T')[0];
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return null;
            return date.toISOString().split('T')[0];
        } catch {
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

    const uploadFileToStorage = async (file: File, employeeId: string, fileType: string): Promise<string | null> => {
        try {
            // Implement your file upload logic here
            // This could be to S3, your server, or any storage solution
            // For now, we'll return a placeholder
            console.log(`Uploading ${fileType} for employee ${employeeId}:`, file.name);

            // Simulate file upload
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Return a mock file path - replace with actual file path from your storage
            return `employees/${employeeId}/${fileType}/${file.name}`;
        } catch (error) {
            console.error(`Error uploading ${fileType}:`, error);
            return null;
        }
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

            // Wait for all file uploads to complete
            await Promise.all(uploadPromises);

            const employeeData = {
                employeeId: formData.employeeId!,
                firstName: formData.firstName!,
                surname: formData.surname!,
                employeeNumber: formData.employeeNumber || null,
                knownAs: formData.knownAs || null,
                idNumber: formData.idNumber || null,
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
                toast.success("Employee created successfully!");
                console.log("New employee created:", newEmployee);
                // Redirect after short delay to show success message
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

    const FileUploadButton = ({
        onFileSelect,
        currentFile,
        accept = "*"
    }: {
        onFileSelect: (file: File | null) => void;
        currentFile: File | null;
        accept?: string;
    }) => {
        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0] || null;
            onFileSelect(file);
        };

        return (
            <div className="flex flex-col gap-2">
                <Input
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                />
                <Button
                    variant="outline"
                    className="w-full border-slate-300 hover:bg-white"
                    onClick={() => document.getElementById('file-upload')?.click()}
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

    return (
        <div className="flex flex-col min-h-screen bg-background from-slate-50 to-blue-50/30">
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
                                className="h-9 w-9 p-0 hover:bg-white"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    Add New Employee
                                </h1>
                                <p className="text-slate-600 mt-2">
                                    Create a new employee profile
                                </p>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex items-center justify-center mb-8">
                            <div className="flex items-center">
                                <Badge className="h-8 w-8 rounded-full bg-blue-600 text-white">1</Badge>
                                <div className="w-24 h-1 bg-blue-600 mx-2"></div>
                                <Badge className="h-8 w-8 rounded-full bg-blue-600 text-white">2</Badge>
                                <div className="w-24 h-1 bg-slate-300 mx-2"></div>
                                <Badge className="h-8 w-8 rounded-full bg-slate-300">3</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="bg-background border-slate-200 shadow-sm sticky top-24">
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
                                            <h3 className="font-semibold text-foreground">
                                                {formData.firstName || 'First'} {formData.surname || 'Last'}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                {formData.employeeId || 'EMP ID'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <Label className="text-sm font-medium text-slate-500">Employee Status</Label>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm text-slate-500">Active Employee</span>
                                                <Switch defaultChecked />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-slate-500">Driver Status</Label>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm text-slate-500">Authorized Driver</span>
                                                <Switch
                                                    checked={formData.authorizedDriver || false}
                                                    onCheckedChange={(checked) => handleInputChange('authorizedDriver', checked)}
                                                />
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
                                    <TabsTrigger value="personal" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 cursor-pointer">
                                        Personal
                                    </TabsTrigger>
                                    <TabsTrigger value="documents" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 cursor-pointer">
                                        Documents
                                    </TabsTrigger>
                                    <TabsTrigger value="employment" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 cursor-pointer">
                                        Employment
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 cursor-pointer">
                                        History
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="personal">
                                    <Card className="bg-background border-slate-200 shadow-sm">
                                        <CardHeader className="bg-background border-b border-slate-200">
                                            <CardTitle className="flex items-center gap-2 text-foreground">
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
                                                        <Label htmlFor="employeeId" className="text-sm font-medium text-slate-700">
                                                            Employee ID *
                                                        </Label>
                                                        <Input
                                                            id="employeeId"
                                                            value={formData.employeeId || ''}
                                                            onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                            placeholder="EMP001"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                                                            First Name *
                                                        </Label>
                                                        <Input
                                                            id="firstName"
                                                            value={formData.firstName || ''}
                                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                            placeholder="John"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="surname" className="text-sm font-medium text-slate-700">
                                                            Surname *
                                                        </Label>
                                                        <Input
                                                            id="surname"
                                                            value={formData.surname || ''}
                                                            onChange={(e) => handleInputChange('surname', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                            placeholder="Doe"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="knownAs" className="text-sm font-medium text-slate-700">
                                                            Known As
                                                        </Label>
                                                        <Input
                                                            id="knownAs"
                                                            value={formData.knownAs || ''}
                                                            onChange={(e) => handleInputChange('knownAs', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                            placeholder="Johnny"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="employeeNumber" className="text-sm font-medium text-slate-700">
                                                            Employee Number
                                                        </Label>
                                                        <Input
                                                            id="employeeNumber"
                                                            value={formData.employeeNumber || ''}
                                                            onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                            placeholder="001"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="idNumber" className="text-sm font-medium text-slate-700">
                                                            ID Number
                                                        </Label>
                                                        <Input
                                                            id="idNumber"
                                                            value={formData.idNumber || ''}
                                                            onChange={(e) => handleInputChange('idNumber', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                            placeholder="1234567890123"
                                                        />
                                                    </div>

                                                    <div className="pt-2">
                                                        <Label className="text-sm font-medium text-slate-700 mb-2 block">
                                                            Employee ID Attachment
                                                        </Label>
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
                                    <Card className="bg-background border-slate-200 shadow-sm">
                                        <CardHeader className="bg-background border-b border-slate-200">
                                            <CardTitle className="flex items-center gap-2 text-foreground">
                                                <FileText className="h-5 w-5" />
                                                Documents & Certifications
                                            </CardTitle>
                                            <CardDescription>
                                                Upload and manage employee documents and certifications
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Passport Section */}
                                                <div className="space-y-4">
                                                    <h4 className="font-semibold text-slate-800 border-b pb-2">Passport Details</h4>
                                                    <div>
                                                        <Label htmlFor="passportNumber" className="text-sm font-medium text-slate-700">
                                                            Passport Number
                                                        </Label>
                                                        <Input
                                                            id="passportNumber"
                                                            value={formData.passportNumber || ''}
                                                            onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                            placeholder="A12345678"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="passportExpiry" className="text-sm font-medium text-slate-700">
                                                            Passport Expiry
                                                        </Label>
                                                        <Input
                                                            id="passportExpiry"
                                                            type="date"
                                                            value={formData.passportExpiry || ''}
                                                            onChange={(e) => handleInputChange('passportExpiry', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
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
                                                    <h4 className="font-semibold text-slate-800 border-b pb-2">Driver's License</h4>
                                                    <div>
                                                        <Label htmlFor="driversLicenseCode" className="text-sm font-medium text-slate-700">
                                                            License Code
                                                        </Label>
                                                        <Input
                                                            id="driversLicenseCode"
                                                            value={formData.driversLicenseCode || ''}
                                                            onChange={(e) => handleInputChange('driversLicenseCode', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                            placeholder="B, C1, etc."
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="driversLicenseExpiry" className="text-sm font-medium text-slate-700">
                                                            License Expiry
                                                        </Label>
                                                        <Input
                                                            id="driversLicenseExpiry"
                                                            type="date"
                                                            value={formData.driversLicenseExpiry || ''}
                                                            onChange={(e) => handleInputChange('driversLicenseExpiry', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                        />
                                                    </div>

                                                    <FileUploadButton
                                                        onFileSelect={(file) => handleFileUpload('driversLicense', file)}
                                                        currentFile={fileUploads.driversLicense}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                </div>
                                            </div>

                                            {/* Additional Documents */}
                                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <h4 className="font-semibold text-slate-800 border-b pb-2">Professional Documents</h4>

                                                    <div>
                                                        <Label htmlFor="pdpExpiry" className="text-sm font-medium text-slate-700">
                                                            PDP Expiry
                                                        </Label>
                                                        <Input
                                                            id="pdpExpiry"
                                                            type="date"
                                                            value={formData.pdpExpiry || ''}
                                                            onChange={(e) => handleInputChange('pdpExpiry', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                        />
                                                    </div>

                                                    <FileUploadButton
                                                        onFileSelect={(file) => handleFileUpload('pdp', file)}
                                                        currentFile={fileUploads.pdp}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />

                                                    <FileUploadButton
                                                        onFileSelect={(file) => handleFileUpload('cv', file)}
                                                        currentFile={fileUploads.cv}
                                                        accept=".pdf,.doc,.docx"
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <h4 className="font-semibold text-slate-800 border-b pb-2">Safety Documents</h4>

                                                    <div>
                                                        <Label htmlFor="ppeExpiry" className="text-sm font-medium text-slate-700">
                                                            PPE Expiry
                                                        </Label>
                                                        <Input
                                                            id="ppeExpiry"
                                                            type="date"
                                                            value={formData.ppeExpiry || ''}
                                                            onChange={(e) => handleInputChange('ppeExpiry', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
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

                                <TabsContent value="employment">
                                    <Card className="bg-background border-slate-200 shadow-sm">
                                        <CardHeader className="bg-background border-b border-slate-200">
                                            <CardTitle className="flex items-center gap-2 text-foreground">
                                                <Calendar className="h-5 w-5" />
                                                Employment Details
                                            </CardTitle>
                                            <CardDescription>
                                                Employment-specific information and certifications
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <Label htmlFor="pdpExpiry" className="text-sm font-medium text-slate-700">
                                                            PDP Expiry Date
                                                        </Label>
                                                        <Input
                                                            id="pdpExpiry"
                                                            type="date"
                                                            value={formData.pdpExpiry || ''}
                                                            onChange={(e) => handleInputChange('pdpExpiry', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                        />
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Professional Driving Permit expiry date
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="ppeExpiry" className="text-sm font-medium text-slate-700">
                                                            PPE Expiry Date
                                                        </Label>
                                                        <Input
                                                            id="ppeExpiry"
                                                            type="date"
                                                            value={formData.ppeExpiry || ''}
                                                            onChange={(e) => handleInputChange('ppeExpiry', e.target.value)}
                                                            className="mt-1 border-slate-300 focus:border-blue-500"
                                                        />
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Personal Protective Equipment expiry date
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                    <h4 className="font-semibold text-slate-800 mb-2">Driver Authorization</h4>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            checked={formData.authorizedDriver || false}
                                                            onCheckedChange={(checked) => handleInputChange('authorizedDriver', checked)}
                                                        />
                                                        <Label htmlFor="authorizedDriver" className="text-sm font-medium text-slate-700">
                                                            This employee is authorized to drive company vehicles
                                                        </Label>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        When enabled, this employee will be allowed to operate company vehicles
                                                        and will appear in driver assignment lists.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="history">
                                    <Card className="bg-background border-slate-200 shadow-sm">
                                        <CardHeader className="bg-background border-b border-slate-200">
                                            <CardTitle className="flex items-center gap-2 text-foreground">
                                                <FileText className="h-5 w-5" />
                                                History & Notes
                                            </CardTitle>
                                            <CardDescription>
                                                Employee history and additional notes
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="history" className="text-sm font-medium text-slate-700">
                                                        Employee History
                                                    </Label>
                                                    <Textarea
                                                        id="history"
                                                        value={formData.history || ''}
                                                        onChange={(e) => handleInputChange('history', e.target.value)}
                                                        className="min-h-[200px] text-sm resize-vertical border-slate-300 focus:border-blue-500"
                                                        placeholder="Add any relevant history or notes about the employee..."
                                                    />
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        This field will automatically record creation and updates. You can add additional notes here.
                                                    </p>
                                                </div>

                                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                    <p className="text-sm text-blue-800">
                                                        <strong>Note:</strong> System-generated history entries will be automatically
                                                        added when creating or updating this employee record.
                                                    </p>
                                                </div>
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
                                    className="border-slate-300 hover:bg-white"
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !formData.employeeId || !formData.firstName || !formData.surname}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
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