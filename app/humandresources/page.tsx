"use client";

import { client } from "@/services/schema";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/table/datatable";
import { 
  Edit, 
  User, 
  Search, 
  Plus, 
  Calendar,
  BadgeCheck,
  Shield,
  FileText,
  MoreVertical,
  Filter,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import Loading from "@/components/widgets/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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

export default function HumanResourcesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    console.log("Setting up real-time subscription for employees...");

    const subscription = client.models.Employee.observeQuery().subscribe({
      next: ({ items, isSynced }) => {
        console.log("Real-time employee update received:", items.length, "items, synced:", isSynced);

        const mappedEmployees: Employee[] = (items || []).map(item => ({
          id: item.id,
          employeeId: item.employeeId,
          employeeNumber: item.employeeNumber ?? undefined,
          firstName: item.firstName,
          surname: item.surname,
          knownAs: item.knownAs ?? undefined,
          idNumber: item.idNumber ?? undefined,
          passportNumber: item.passportNumber ?? undefined,
          passportExpiry: item.passportExpiry ?? undefined,
          passportAttachment: item.passportAttachment ?? undefined,
          driversLicenseCode: item.driversLicenseCode ?? undefined,
          driversLicenseExpiry: item.driversLicenseExpiry ?? undefined,
          driversLicenseAttachment: item.driversLicenseAttachment ?? undefined,
          authorizedDriver: item.authorizedDriver ?? false,
          pdpExpiry: item.pdpExpiry ?? undefined,
          pdpAttachment: item.pdpAttachment ?? undefined,
          cvAttachment: item.cvAttachment ?? undefined,
          ppeListAttachment: item.ppeListAttachment ?? undefined,
          ppeExpiry: item.ppeExpiry ?? undefined,
        //   history: item.history ?? undefined
        }));

        setEmployees(mappedEmployees);
        setFilteredEmployees(mappedEmployees);

        if (isSynced) {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error("Error subscribing to employees:", error);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Filter employees based on search and active tab
  useEffect(() => {
    let filtered = employees;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        `${employee.firstName} ${employee.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.knownAs?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply tab filter
    if (activeTab === "drivers") {
      filtered = filtered.filter(employee => employee.authorizedDriver);
    } else if (activeTab === "expiring") {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filtered = filtered.filter(employee => 
        employee.passportExpiry && new Date(employee.passportExpiry) <= thirtyDaysFromNow ||
        employee.driversLicenseExpiry && new Date(employee.driversLicenseExpiry) <= thirtyDaysFromNow
      );
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, activeTab, employees]);

  const getInitials = (firstName: string, surname: string) => {
    return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (employee: Employee) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (employee.passportExpiry && new Date(employee.passportExpiry) <= thirtyDaysFromNow) {
      return <Badge variant="destructive" className="text-xs">Passport Expiring</Badge>;
    }
    if (employee.driversLicenseExpiry && new Date(employee.driversLicenseExpiry) <= thirtyDaysFromNow) {
      return <Badge variant="destructive" className="text-xs">License Expiring</Badge>;
    }
    if (employee.authorizedDriver) {
      return <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">Driver</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Active</Badge>;
  };

  // Mobile-friendly columns
  const columns: ColumnDef<object, any>[] = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-slate-100">
            <AvatarFallback className="bg-background from-blue-500 to-purple-600 text-white font-semibold">
              {getInitials(row.original.firstName, row.original.surname)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">
              {row.original.firstName} {row.original.surname}
            </span>
            <span className="text-sm text-slate-500">
              {row.original.employeeId}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "knownAs",
      header: "Known As",
      cell: ({ row }: { row: any }) => (
        <div className="text-sm text-slate-600 hidden md:block">
          {row.original.knownAs || "-"}
        </div>
      ),
    },
    {
      accessorKey: "employeeNumber",
      header: "Employee No",
      cell: ({ row }: { row: any }) => (
        <div className="text-sm font-medium text-slate-700 hidden lg:block">
          {row.original.employeeNumber || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: any }) => (
        <div className="flex justify-start">
          {getStatusBadge(row.original)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: { row: any }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
              <MoreVertical className="h-4 w-4 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => router.push(`/humanresources/edit/${row.original.id}`)}
              className="cursor-pointer text-slate-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              // onClick={() => router.push(`/humanresources/certificates/${row.original.id}`)}
              className="cursor-pointer text-slate-700"
            >
              <BadgeCheck className="h-4 w-4 mr-2" />
              View Certificates
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const data = Array.isArray(filteredEmployees)
    ? filteredEmployees.map((employee) => ({
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        surname: employee.surname,
        knownAs: employee.knownAs,
        employeeNumber: employee.employeeNumber,
        authorizedDriver: employee.authorizedDriver,
        passportExpiry: employee.passportExpiry,
        driversLicenseExpiry: employee.driversLicenseExpiry,
      }))
    : [];

  const stats = {
    total: employees.length,
    drivers: employees.filter(e => e.authorizedDriver).length,
    expiring: employees.filter(e => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return (e.passportExpiry && new Date(e.passportExpiry) <= thirtyDaysFromNow) ||
             (e.driversLicenseExpiry && new Date(e.driversLicenseExpiry) <= thirtyDaysFromNow);
    }).length
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

  return (
    <div className="flex flex-col min-h-screen bg-background from-slate-50 to-blue-50/30">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 mt-20 pb-20">
        <div className="container mx-auto max-w-7xl mt-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Employee Management
                </h1>
                <p className="text-slate-600 max-w-2xl">
                  Manage your workforce, track certifications, and ensure compliance across your organization.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => router.push('/humanresources/create')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-background border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Employees</p>
                    <p className="text-3xl font-bold text-shadow-slate-400 mt-2">{stats.total}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Authorized Drivers</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stats.drivers}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className=" border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-background">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Expiring Soon</p>
                    <p className="text-3xl font-bold text-shadow-slate-400 mt-2">{stats.expiring}</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card className="border-slate-200 shadow-sm bg-background">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background">
                <div>
                  <CardTitle className="text-xl text-shadow-slate-400 bg-background">Employees</CardTitle>
                  <CardDescription>
                    Manage all employees in your organization
                  </CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 bg-background">
                  {/* Search */}
                  <div className="relative bg-background">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 h-10 w-full sm:w-64 border-slate-300 focus:border-blue-500"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-slate-300 hover:bg-white">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setActiveTab("all")}>
                        All Employees
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveTab("drivers")}>
                        Authorized Drivers
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setActiveTab("expiring")}>
                        Documents Expiring
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="all" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    All Employees
                    <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">
                      {employees.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="drivers" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                    Drivers
                    <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">
                      {stats.drivers}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="expiring" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                    Expiring
                    <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">
                      {stats.expiring}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Data Table */}
              <div className="border-t border-slate-200">
                <DataTable
                  title="Employees"
                  data={data}
                  columns={columns}
                  pageSize={10}
                  storageKey="employeeTablePagination"
                  searchColumn="knownAs"
                  
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}