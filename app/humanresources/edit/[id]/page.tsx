"use client";

import { client } from "@/services/schema";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Save,
  ArrowLeft,
  User,
  Loader2,
  FileText,
  Plus,
  Trash2,
  BriefcaseMedical
} from "lucide-react";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import Loading from "@/components/widgets/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ResponseModal from "@/components/widgets/response";
import { formatDateForAmplify } from "@/utils/helper/time";
import { Textarea } from "@/components/ui/textarea";
import { HrdPDFUpload } from "../../components/hrdimages";
import { Employee, MEDICAL_CERTIFICATE_TYPES, TRAINING_CERTIFICATE_TYPES } from "@/types/hrd.types";
import { handleEmployeeTasks } from "../../components/employeetasks";



export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = decodeURIComponent(params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [medicalCerts, setMedicalCerts] = useState<any[]>([]);
  const [trainingCerts, setTrainingCerts] = useState<any[]>([]);
  const [additionalCerts, setAdditionalCerts] = useState<any[]>([]);

  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  const [totalDocuments, setTotalDocuments] = useState(0);
  const [totalExpiringDocuments, setTotalExpiringDocuments] = useState(0);


  // Add state to track which certificate is being uploaded
  const [uploadingCertIndex, setUploadingCertIndex] = useState<{
    type: 'medical' | 'training' | 'additional';
    index: number;
  } | null>(null);

  const fetchEmployeeWithRelations = async (): Promise<Employee | null> => {
    try {
      // Fetch employee base record
      const { data: employee, errors } = await client.models.Employee.get(
        { id: employeeId }
      );

      if (errors || !employee) {
        console.error("Error fetching employee:", errors);
        return null;
      }

      // Fetch all related certificates using GSIs
      const [
        { data: medicalCertificates },
        { data: trainingCertificates },
        { data: additionalCertificates }
      ] = await Promise.all([
        client.models.EmployeeMedicalCertificate.medicalCertsByEmployee({
          employeeId: employee.employeeId
        }),
        client.models.EmployeeTrainingCertificate.trainingCertsByEmployee({
          employeeId: employee.employeeId
        }),
        client.models.EmployeeAdditionalCertificate.additionalCertsByEmployee({
          employeeId: employee.employeeId
        })
      ]);


      return {
        ...employee,
        medicalCertificates: medicalCertificates || [],
        trainingCertificates: trainingCertificates || [],
        additionalCertificates: additionalCertificates || []
      } as unknown as Employee;
    } catch (error) {
      console.error("Error in fetchEmployeeWithRelations:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const employeeData = await fetchEmployeeWithRelations();
   

        if (employeeData) {
        // Option 1
const expiringtask = await client.models.EmployeeTaskTable.listEmployeeTaskTableByEmployeeIdAndDocumentIdentifier({
  employeeId: employeeId
});


           console.log(expiringtask);
          setEmployee(employeeData);
          setFormData(employeeData);

          // Create array with ALL 8 certificate types, fill with existing data
          const certsMap = new Map(
            employeeData.medicalCertificates?.map(cert => [cert.certificateType, cert])
          );

          
     
          const totalDocs = countUploadedDocuments(employeeData);
          setTotalDocuments(totalDocs);
          setTotalExpiringDocuments(expiringtask.data.length);

          const allMedicalCerts = MEDICAL_CERTIFICATE_TYPES.map(type =>
            certsMap.get(type) || {
              certificateType: type,
              expiryDate: "",
              attachment: ""
            }
          );

          // Create array with ALL 15 certificate types, fill with existing data
          const trainingcertsMap = new Map(
            employeeData.trainingCertificates?.map(cert => [cert.certificateType, cert])
          );


          const alltrainingCerts = TRAINING_CERTIFICATE_TYPES.map(type =>
            trainingcertsMap.get(type) || {
              certificateType: type,
              expiryDate: "",
              attachment: ""
            }
          );



          setMedicalCerts(allMedicalCerts);
          setTrainingCerts(alltrainingCerts);
          const sortedAdditionalCerts = (employeeData.additionalCertificates || [])
            .slice()
            .sort((a, b) => a.certificateName.localeCompare(b.certificateName));

          setAdditionalCerts(sortedAdditionalCerts);

        }
      } catch (error) {
        console.error("Error fetching employee:", error);

        setMessage("Failed to load employee data!");
        setShow(true);
        setSuccessful(false);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  const countUploadedDocuments = (employeeData: any) => {
    let total = 0;

    // Direct attachments
    const directAttachments = [
      employeeData.employeeIdAttachment,
      employeeData.passportAttachment,
      employeeData.driversLicenseAttachment,
      employeeData.pdpAttachment,
      employeeData.cvAttachment,
      employeeData.ppeListAttachment
    ];

    directAttachments.forEach(att => {
      if (att) total++;
    });

    // Certificate attachments
    const medicalCount = employeeData.medicalCertificates?.length || 0;
    const trainingCount = employeeData.trainingCertificates?.length || 0;
    const additionalCount = employeeData.additionalCertificates?.length || 0;

    total += medicalCount + trainingCount + additionalCount;

    return total;
  };

  const getInitials = (firstName: string, surname: string) => {
    return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };
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


  const handleSave = async () => {
    if (!employee) return;

    try {
      setSaving(true);

      const storedName = localStorage.getItem("user")?.replace(/^"|"$/g, '').trim() || "Unknown User";
      const johannesburgTime = new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });

      let historyEntries = "";
      Object.keys(formData).forEach(key => {
        const typedKey = key as keyof Employee;
        if (formData[typedKey] !== employee[typedKey]) {
          historyEntries += `${storedName} updated ${typedKey} from ${employee[typedKey]} to ${formData[typedKey]} at ${johannesburgTime}\n`;
        }
      });

      // Update main employee record
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
        history: historyEntries + (employee.history || "")
      };

      const result = await client.models.Employee.update({
        id: employee.id,
        ...employeeData
      });

      if (result.errors) {
        throw new Error("Failed to update employee");
      }

      // Update medical certificates - only if changed
      const existingMedicalCerts = employee.medicalCertificates || [];
      for (const cert of medicalCerts) {
        const existingCert = existingMedicalCerts.find(ec => ec.certificateType === cert.certificateType);

        // Check if data actually changed or is new
        const expiryChanged = existingCert?.expiryDate !== cert.expiryDate;
        const attachmentChanged = existingCert?.attachment !== cert.attachment;
        const hasNewData = cert.expiryDate || cert.attachment;

        if ((expiryChanged || attachmentChanged || !existingCert) && hasNewData) {
          if (existingCert) {

            await client.models.EmployeeMedicalCertificate.update({
              id: existingCert.id,
              certificateType: cert.certificateType,
              expiryDate: formatDateForAmplify(cert.expiryDate) || "",
              attachment: cert.attachment || null
            });
          } else {

            await client.models.EmployeeMedicalCertificate.create({
              employeeId: employee.employeeId,
              certificateType: cert.certificateType,
              expiryDate: formatDateForAmplify(cert.expiryDate) || "",
              attachment: cert.attachment || null
            });
          }
        }
      }

      // Update training certificates - only if changed
      const existingTrainingCerts = employee.trainingCertificates || [];
      for (const cert of trainingCerts) {
        const existingCert = existingTrainingCerts.find(ec => ec.certificateType === cert.certificateType);

        // Check if data actually changed or is new
        const expiryChanged = existingCert?.expiryDate !== cert.expiryDate;
        const attachmentChanged = existingCert?.attachment !== cert.attachment;
        const hasNewData = cert.expiryDate || cert.attachment;

        if ((expiryChanged || attachmentChanged || !existingCert) && hasNewData) {
          if (existingCert) {

            await client.models.EmployeeTrainingCertificate.update({
              id: existingCert.id,
              certificateType: cert.certificateType,
              expiryDate: formatDateForAmplify(cert.expiryDate) || "",
              attachment: cert.attachment || null
            });
          } else {

            await client.models.EmployeeTrainingCertificate.create({
              employeeId: employee.employeeId,
              certificateType: cert.certificateType,
              expiryDate: formatDateForAmplify(cert.expiryDate) || "",
              attachment: cert.attachment || null
            });
          }
        }
      }

      // Update additional certificates - only if changed
      const existingAdditionalCerts = employee.additionalCertificates || [];
      for (const cert of additionalCerts) {
        const existingCert = existingAdditionalCerts.find(ec => ec.id === cert.id);

        // Check if data actually changed or is new
        const nameChanged = existingCert?.certificateName !== cert.certificateName;
        const expiryChanged = existingCert?.expiryDate !== cert.expiryDate;
        const attachmentChanged = existingCert?.attachment !== cert.attachment;
        const hasNewData = cert.expiryDate || cert.attachment || cert.certificateName;

        if ((nameChanged || expiryChanged || attachmentChanged || !existingCert) && hasNewData) {
          if (existingCert) {

            await client.models.EmployeeAdditionalCertificate.update({
              id: existingCert.id,
              certificateName: cert.certificateName,
              expiryDate: formatDateForAmplify(cert.expiryDate) || "",
              attachment: cert.attachment || null
            });
          } else if (cert.certificateName) {

            await client.models.EmployeeAdditionalCertificate.create({
              employeeId: employee.employeeId,
              certificateName: cert.certificateName,
              expiryDate: formatDateForAmplify(cert.expiryDate) || "",
              attachment: cert.attachment || null
            });
          }
        }
      }

      // Call the task checking function after all updates are complete
      await checkAndPrintTasks(
        employee, // oldEmployee
        {
          ...employeeData,
          medicalCertificates: medicalCerts,
          trainingCertificates: trainingCerts,
          additionalCertificates: additionalCerts
        }, // newData
        storedName // username
      );

      // router.push('/humanresources');

    } catch (error) {
      console.error("Error saving employee:", error);

      setMessage("Error saving employee data!");
      setShow(true);
      setSuccessful(false);


    } finally {
      setSaving(false);
    }
  };

  // Helper function to check tasks using GSI for ALL document types - PRINT ONLY
  const checkAndPrintTasks = async (oldEmployee: Employee, newData: any, username: string) => {
    // Check main employee documents - USE LOWERCASE to match database
    const mainDocumentTypes = [
      { key: 'passportExpiry', type: 'passport', attachment: newData.passportAttachment },
      { key: 'driversLicenseExpiry', type: 'drivers_license', attachment: newData.driversLicenseAttachment },
      { key: 'pdpExpiry', type: 'pdp', attachment: newData.pdpAttachment },
      { key: 'ppeExpiry', type: 'ppe', attachment: newData.ppeListAttachment }
    ];

    for (const doc of mainDocumentTypes) {
      const oldExpiry = oldEmployee[doc.key as keyof Employee];
      const newExpiry = newData[doc.key as keyof Employee];

      if (newExpiry && newExpiry !== oldExpiry) {
        const documentIdentifier = `${oldEmployee.employeeId}_${doc.type}`;

        // Check if task exists using GSI
        const { data: existingTasks } = await client.models.EmployeeTaskTable.listEmployeeTaskTableByDocumentIdentifier({
          documentIdentifier: documentIdentifier
        });
        const existingTask = existingTasks?.[0];

        if (existingTask) {
          await handleEmployeeTasks(newExpiry, existingTask, doc);
        } else {
          console.log(`No task found for: ${documentIdentifier}`);
        }
      }
    }

    // Check medical certificates
    const oldMedicalCerts = oldEmployee.medicalCertificates || [];
    const newMedicalCerts = newData.medicalCertificates || [];
    for (const newCert of newMedicalCerts) {
      const oldCert = oldMedicalCerts.find(oc => oc.certificateType === newCert.certificateType);

      if (newCert.expiryDate && newCert.expiryDate !== oldCert?.expiryDate) {
        const documentIdentifier = `${oldEmployee.employeeId}_medical_${newCert.certificateType}`;

        const { data: existingTasks } = await client.models.EmployeeTaskTable.listEmployeeTaskTableByDocumentIdentifier({
          documentIdentifier: documentIdentifier
        });
        const existingTask = existingTasks?.[0];

        if (existingTask) {
          await handleEmployeeTasks(newCert.expiryDate, existingTask, {
            key: 'expiryDate',
            type: `medical_${newCert.certificateType}`,
            attachment: newCert.attachment
          });
        }
      }
    }

    // Check training certificates
    const oldTrainingCerts = oldEmployee.trainingCertificates || [];
    const newTrainingCerts = newData.trainingCertificates || [];
    for (const newCert of newTrainingCerts) {
      const oldCert = oldTrainingCerts.find(oc => oc.certificateType === newCert.certificateType);

      if (newCert.expiryDate && newCert.expiryDate !== oldCert?.expiryDate) {
        const documentIdentifier = `${oldEmployee.employeeId}_training_${newCert.certificateType}`;

        const { data: existingTasks } = await client.models.EmployeeTaskTable.listEmployeeTaskTableByDocumentIdentifier({
          documentIdentifier: documentIdentifier
        });
        const existingTask = existingTasks?.[0];

        if (existingTask) {
          await handleEmployeeTasks(newCert.expiryDate, existingTask, {
            key: 'expiryDate',
            type: `training_${newCert.certificateType}`,
            attachment: newCert.attachment
          });
        }
      }
    }

    // Check additional certificates
    const oldAdditionalCerts = oldEmployee.additionalCertificates || [];
    const newAdditionalCerts = newData.additionalCertificates || [];
    for (const newCert of newAdditionalCerts) {
      const oldCert = oldAdditionalCerts.find(oc => oc.id === newCert.id);

      if (newCert.expiryDate && newCert.expiryDate !== oldCert?.expiryDate) {
        const documentIdentifier = `${oldEmployee.employeeId}_additional_${newCert.certificateName}`;

        const { data: existingTasks } = await client.models.EmployeeTaskTable.listEmployeeTaskTableByDocumentIdentifier({
          documentIdentifier: documentIdentifier
        });
        const existingTask = existingTasks?.[0];

        if (existingTask) {
          await handleEmployeeTasks(newCert.expiryDate, existingTask, {
            key: 'expiryDate',
            type: `additional_${newCert.certificateName}`,
            attachment: newCert.attachment
          });
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <Loading />
        <Footer />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p>Employee not found</p>
        </div>
        <Footer />
      </div>
    );
  }

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
                  Edit {employee.firstName} {employee.surname}
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                  Update employee information and documents
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
                        {getInitials(formData.firstName || '', formData.surname || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <h3 className="font-semibold">
                        {formData.firstName} {formData.surname}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formData.employeeId}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
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
                          <span>Total Documents uploaded:</span>
                          <Badge variant={totalDocuments > 0 ? "default" : "secondary"}>
                            {totalDocuments}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span >Documents expiring:</span>
                          <Badge variant={totalExpiringDocuments > 0 ? "destructive" : "secondary"}>
                            {totalExpiringDocuments}
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
                  <TabsTrigger value="personal" className="cursor-pointer">Basic</TabsTrigger>
                  <TabsTrigger value="medical" className="cursor-pointer">Medical / Induction</TabsTrigger>
                  <TabsTrigger value="training" className="cursor-pointer">Training / Certification</TabsTrigger>
                  <TabsTrigger value="additional" className="cursor-pointer">Additional</TabsTrigger>
                  <TabsTrigger value="history" className="cursor-pointer">History</TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent value="personal">
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
                              employeeID={employee.employeeId}
                              filetitle="Employee ID Attachment"
                              filename="employeeId"
                              folder="ID"
                              existingFiles={employee.employeeIdAttachment ? [employee.employeeIdAttachment] : []}

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
                                employeeID={employee.employeeId}
                                filetitle="Passport Attachment"
                                filename="passport"
                                folder="Passport"
                                existingFiles={employee.passportAttachment ? [employee.passportAttachment] : []}
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
                                employeeID={employee.employeeId}
                                filetitle="Driver's License Attachment"
                                filename="driversLicense"
                                folder="License"
                                existingFiles={employee.driversLicenseAttachment ? [employee.driversLicenseAttachment] : []}
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
                              employeeID={employee.employeeId}
                              filetitle="Pdp  Attachment"
                              filename="pdp"
                              folder="pdp"
                              existingFiles={employee.pdpAttachment ? [employee.pdpAttachment] : []}
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
                              employeeID={employee.employeeId}
                              filetitle="CV  Attachment"
                              filename="cv"
                              folder="Cv"
                              existingFiles={employee.cvAttachment ? [employee.cvAttachment] : []}
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
                              employeeID={employee.employeeId}
                              filetitle="PPE List  Attachment"
                              filename="ppeList"
                              folder="PPE"
                              existingFiles={employee.ppeListAttachment ? [employee.ppeListAttachment] : []}
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
                                  employeeID={employee.employeeId}
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
                                  employeeID={employee.employeeId}
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
                                  employeeID={employee.employeeId}
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
                <TabsContent value="history" >
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
                            readOnly
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
                      Update Employee
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