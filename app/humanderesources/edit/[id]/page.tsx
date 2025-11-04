"use client";

import { client } from "@/services/schema";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Save, 
  ArrowLeft, 
  User, 
  Loader2, 
  Upload,
  Camera,
  FileText,
  Calendar
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
  history?: string;
}

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = decodeURIComponent(params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const { data: employeeData } = await client.models.Employee.get({ id: employeeId });
        if (employeeData) {
          const mappedEmployee: Employee = {
            id: employeeData.id,
            employeeId: employeeData.employeeId,
            employeeNumber: employeeData.employeeNumber ?? undefined,
            firstName: employeeData.firstName,
            surname: employeeData.surname,
            knownAs: employeeData.knownAs ?? undefined,
            idNumber: employeeData.idNumber ?? undefined,
            passportNumber: employeeData.passportNumber ?? undefined,
            passportExpiry: employeeData.passportExpiry ?? undefined,
            passportAttachment: employeeData.passportAttachment ?? undefined,
            driversLicenseCode: employeeData.driversLicenseCode ?? undefined,
            driversLicenseExpiry: employeeData.driversLicenseExpiry ?? undefined,
            driversLicenseAttachment: employeeData.driversLicenseAttachment ?? undefined,
            authorizedDriver: employeeData.authorizedDriver ?? false,
            pdpExpiry: employeeData.pdpExpiry ?? undefined,
            pdpAttachment: employeeData.pdpAttachment ?? undefined,
            cvAttachment: employeeData.cvAttachment ?? undefined,
            ppeListAttachment: employeeData.ppeListAttachment ?? undefined,
            ppeExpiry: employeeData.ppeExpiry ?? undefined,
            // history: employeeData.
          };
          setEmployee(mappedEmployee);
          setFormData(mappedEmployee);
        }
      } catch (error) {
        console.error("Error fetching employee:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  const handleInputChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

      const employeeData = {
        id: employeeId,
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
        history: historyEntries + (employee.history || "")
      };

      await client.models.Employee.update(employeeData);
      router.push('/humanresources');
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Error updating employee. Please check the console for details.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName: string, surname: string) => {
    return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background from-slate-50 to-blue-50/30">
        <Navbar />
        <Loading />
        <Footer />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col min-h-screen bg-background from-slate-50 to-blue-50/30">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p>Employee not found</p>
        </div>
        <Footer />
      </div>
    );
  }

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
                <h1 className="text-3xl font-bold text-slate-900">
                  Edit {employee.firstName} {employee.surname}
                </h1>
                <p className="text-slate-600 mt-2">
                  Update employee information and documents
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white border-slate-200 shadow-sm sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg mx-auto mb-4">
                      <AvatarFallback className="bg-background from-blue-500 to-purple-600 text-white text-xl font-bold">
                        {getInitials(formData.firstName || '', formData.surname || '')}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="border-slate-300">
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Employee Status</Label>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-slate-600">Active Employee</span>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-700">Completion</Label>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">85% complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Personal
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="employment" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Employment
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal">
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
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

                          <div className="flex items-center space-x-2 pt-6">
                            <Switch
                              checked={formData.authorizedDriver || false}
                              onCheckedChange={(checked) => handleInputChange('authorizedDriver', checked)}
                            />
                            <Label htmlFor="authorizedDriver" className="text-sm font-medium text-slate-700">
                              Authorized Driver
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents">
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <FileText className="h-5 w-5" />
                        Documents & Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="passportNumber" className="text-sm font-medium text-slate-700">
                              Passport Number
                            </Label>
                            <Input
                              id="passportNumber"
                              value={formData.passportNumber || ''}
                              onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                              className="mt-1 border-slate-300 focus:border-blue-500"
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

                          <Button variant="outline" className="w-full border-slate-300 hover:bg-white">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Passport
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="driversLicenseCode" className="text-sm font-medium text-slate-700">
                              Driver's License Code
                            </Label>
                            <Input
                              id="driversLicenseCode"
                              value={formData.driversLicenseCode || ''}
                              onChange={(e) => handleInputChange('driversLicenseCode', e.target.value)}
                              className="mt-1 border-slate-300 focus:border-blue-500"
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

                          <Button variant="outline" className="w-full border-slate-300 hover:bg-white">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload License
                          </Button>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="border-slate-300 hover:bg-white">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload CV
                        </Button>
                        <Button variant="outline" className="border-slate-300 hover:bg-white">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload PPE List
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="employment">
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Calendar className="h-5 w-5" />
                        Employment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
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
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <FileText className="h-5 w-5" />
                        History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Textarea
                        value={formData.history || ''}
                        onChange={(e) => handleInputChange('history', e.target.value)}
                        className="min-h-[200px] text-sm resize-vertical border-slate-300 focus:border-blue-500"
                        placeholder="Employee history will be automatically recorded here..."
                        readOnly
                      />
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
                      Update Employee
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