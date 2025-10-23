"use client";

import { client } from "@/services/schema";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/table/datatable";
import { EditIcon, ArrowUpDown, FileArchive, Download, X, Car, Search, Plus, Save, Trash2, MoreVertical, Loader2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import Loading from "@/components/widgets/loading";
import PropLoading from "@/components/widgets/prop_loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/widgets/deletedialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Add type declaration for autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
        lastAutoTable?: {
            finalY: number;
        };
    }
}

// Helper function to convert data to CSV
const convertToCSV = (fleetData: Fleet[]): string => {
    const rows: string[] = [];

    // Headers
    const headers = [
        'Fleet Number',
        'Vehicle Reg',
        'Vehicle VIN',
        'Vehicle Make',
        'Vehicle Model',
        'Transmission Type',
        'Ownership Status',
        'Current Driver',
        'Current KM',
        'Service Plan Status',
        'Last Service Date',
        'Last Service KM'
    ];
    rows.push(headers.join(','));

    // Fleet data
    fleetData.forEach(fleet => {
        const row = [
            fleet.fleetNumber || '',
            fleet.vehicleReg || '',
            fleet.vehicleVin || '',
            fleet.vehicleMake || '',
            fleet.vehicleModel || '',
            fleet.transmitionType || '',
            fleet.ownershipStatus || '',
            fleet.currentDriver || '',
            fleet.currentkm?.toString() || '0',
            fleet.servicePlanStatus ? 'Active' : 'Inactive',
            fleet.lastServicedate || '',
            fleet.lastServicekm?.toString() || '0'
        ];

        const escapedRow = row.map(value => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });

        rows.push(escapedRow.join(','));
    });

    return rows.join('\n');
};

// Helper function to download CSV
const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper function to generate PDF
const generatePDF = (fleetData: Fleet[]) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 15);

    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`Fleet Management Report`, 14, 22);

    let startY = 30;

    if (fleetData.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text('No fleet vehicles found', 20, startY);
        return doc;
    }

    // Prepare table data
    const tableData = fleetData.map(fleet => [
        fleet.fleetNumber || '-',
        fleet.vehicleReg || '-',
        fleet.vehicleMake || '-',
        fleet.vehicleModel || '-',
        fleet.currentDriver || '-',
        fleet.currentkm?.toString() || '0',
        fleet.servicePlanStatus ? 'Active' : 'Inactive',
        fleet.lastServicedate || '-'
    ]);

    // Add table
    autoTable(doc, {
        startY: startY,
        head: [['Fleet No', 'Reg', 'Make', 'Model', 'Driver', 'Current KM', 'Service Plan', 'Last Service']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [66, 66, 66],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        margin: { left: 14, right: 14 }
    });

    return doc;
};

export default function FleetPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prop_loading, propsetLoading] = useState(false);
    const [fleets, setFleets] = useState<Fleet[]>([]);
    const [filteredFleets, setFilteredFleets] = useState<Fleet[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState<"reg" | "driver">("reg");
    const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);
    const [editedFleet, setEditedFleet] = useState<Partial<Fleet>>({});
    const [isCreating, setIsCreating] = useState(false);
    const [opendelete, setOpendelete] = useState(false);
    const [fleetToDelete, setFleetToDelete] = useState<{ id: string, name: string } | null>(null);

    const [printMenu, setPrintMenu] = useState<{
        isOpen: boolean;
        fleetId: string | null;
        position: { top: number; left: number };
    }>({
        isOpen: false,
        fleetId: null,
        position: { top: 0, left: 0 }
    });

    useEffect(() => {
        console.log("Setting up real-time subscription..."); // Debug log

        // Subscribe to real-time updates
        const subscription = client.models.Fleet.observeQuery().subscribe({
            next: ({ items, isSynced }) => {
                console.log("Real-time update received:", items.length, "items, synced:", isSynced); // Debug log

                const mappedFleets: Fleet[] = (items || []).map(item => ({
                    id: item.id,
                    vehicleVin: item.vehicleVin,
                    vehicleReg: item.vehicleReg,
                    vehicleMake: item.vehicleMake,
                    vehicleModel: item.vehicleModel,
                    transmitionType: item.transmitionType,
                    ownershipStatus: item.ownershipStatus,
                    fleetIndex: item.fleetIndex,
                    fleetNumber: item.fleetNumber,
                    lastServicedate: item.lastServicedate,
                    lastServicekm: item.lastServicekm,
                    lastRotationdate: item.lastRotationdate,
                    lastRotationkm: item.lastRotationkm,
                    servicePlanStatus: item.servicePlanStatus,
                    servicePlan: item.servicePlan,
                    currentDriver: item.currentDriver,
                    currentkm: item.currentkm,
                    codeRequirement: item.codeRequirement,
                    pdpRequirement: item.pdpRequirement,
                    breakandLuxTest: (item.breakandLuxTest ?? []).filter(
                        (x): x is string => x !== null
                    ),
                    breakandLuxExpirey: item.breakandLuxExpirey,
                    history: item.history
                }));
                setFleets(mappedFleets);
                setFilteredFleets(mappedFleets);

                if (isSynced) {
                    setLoading(false);
                    console.log("Initial data loaded"); // Debug log
                }
            },
            error: (error) => {
                console.error("Error subscribing to fleets:", error);
                setLoading(false);
            }
        });

        return () => {
            console.log("Cleaning up subscription"); // Debug log
            subscription.unsubscribe();
        };
    }, []);

    // Filter fleets based on search
    useEffect(() => {
        if (!searchTerm) {
            setFilteredFleets(fleets);
            return;
        }

        const filtered = fleets.filter(fleet => {
            if (searchType === "reg") {
                return fleet.vehicleReg?.toLowerCase().includes(searchTerm.toLowerCase());
            } else {
                return fleet.currentDriver?.toLowerCase().includes(searchTerm.toLowerCase());
            }
        });

        setFilteredFleets(filtered);
    }, [searchTerm, searchType, fleets]);

    // Mobile-friendly columns
    const columns: ColumnDef<object, any>[] = [
        {
            accessorKey: "fleetNumber",
            header: ({ column }: { column: any }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 h-auto font-medium"
                >
                    Fleet No
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }: { row: any }) => (
                <div className="font-medium text-sm">
                    {row.original.fleetNumber}
                </div>
            ),
        },
        {
            accessorKey: "vehicleReg",
            header: "Reg",
            cell: ({ row }: { row: any }) => (
                <div className="text-sm">{row.original.vehicleReg}</div>
            ),
        },
        {
            accessorKey: "vehicleMake",
            header: "Make",
            cell: ({ row }: { row: any }) => (
                <div className="text-sm hidden sm:block">{row.original.vehicleMake}</div>
            ),
        },
        {
            accessorKey: "vehicleModel",
            header: "Model",
            cell: ({ row }: { row: any }) => (
                <div className="text-sm hidden md:block">{row.original.vehicleModel}</div>
            ),
        },
        {
            accessorKey: "currentDriver",
            header: "Driver",
            cell: ({ row }: { row: any }) => (
                <div className="text-sm hidden lg:block">{row.original.currentDriver}</div>
            ),
        },
        {
            accessorKey: "servicePlanStatus",
            header: "Service",
            cell: ({ row }: { row: any }) => (
                <Badge
                    variant={row.original.servicePlanStatus ? "default" : "destructive"}
                    className="text-xs"
                >
                    {row.original.servicePlanStatus ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: any }) => (
                <div className="flex justify-start cursor-pointer">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => handleEdit(row.original)}
                                className="cursor-pointer"
                            >
                                <EditIcon className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => redirectToInspections(row.original.id)}
                                className="cursor-pointer"
                            >
                                <Car className="h-4 w-4 mr-2" />
                                Inspections
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => handlePrintClick(e, row.original.id)}
                                className="cursor-pointer"
                            >
                                <FileArchive className="h-4 w-4 mr-2" />
                                Export
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    const data = Array.isArray(filteredFleets)
        ? filteredFleets.map((fleet) => {
            return {
                id: fleet.id || "",
                fleetNumber: fleet.fleetNumber || "",
                vehicleReg: fleet.vehicleReg || "",
                vehicleMake: fleet.vehicleMake || "",
                vehicleModel: fleet.vehicleModel || "",
                currentDriver: fleet.currentDriver || "",
                currentkm: fleet.currentkm || 0,
                servicePlanStatus: fleet.servicePlanStatus || false,
            };
        })
        : [];

    // Handle edit
    const handleEdit = (fleet: any) => {
        const fullFleet = fleets.find(f => f.id === fleet.id) || fleet;
        setEditingFleet(fullFleet);
        setEditedFleet({ ...fullFleet });
        setIsCreating(false);
    };

    // Handle create new
    const handleCreateNew = () => {
        setEditingFleet({
            id: '',
            vehicleVin: '',
            vehicleReg: '',
            vehicleMake: '',
            vehicleModel: '',
            transmitionType: '',
            ownershipStatus: '',
            fleetIndex: '',
            fleetNumber: '',
            lastServicedate: '',
            lastServicekm: 0,
            lastRotationdate: '',
            lastRotationkm: 0,
            servicePlanStatus: false,
            servicePlan: '',
            currentDriver: '',
            currentkm: 0,
            codeRequirement: '',
            pdpRequirement: false,
            breakandLuxTest: [],
            breakandLuxExpirey: '',
            history: ''
        });
        setEditedFleet({});
        setIsCreating(true);
    };

    // Handle save
    const handleSave = async () => {
        if (!editingFleet) return;

        try {
            setSaving(true);
            // Get user from localStorage
            let storedName = "Unknown User";
            try {
                const userData = localStorage.getItem("user");
                if (userData) {
                    storedName = userData.replace(/^"|"$/g, '').trim();
                }
            } catch (error) {
                console.error("Error getting user from localStorage:", error);
            }

            const johannesburgTime = new Date().toLocaleString("en-ZA", {
                timeZone: "Africa/Johannesburg"
            });

            let historyEntries = "";

            // Create history for changes
            if (editingFleet.id && !isCreating) {
                Object.keys(editedFleet).forEach(key => {
                    const typedKey = key as keyof Fleet;
                    if (editedFleet[typedKey] !== editingFleet[typedKey]) {
                        historyEntries += `${storedName} updated ${typedKey} from ${editingFleet[typedKey]} to ${editedFleet[typedKey]} at ${johannesburgTime}\n`;
                    }
                });
            } else if (isCreating) {
                historyEntries = `${storedName} created new fleet vehicle at ${johannesburgTime}\n`;
            }

            // Helper function to handle date fields for AWS Amplify
            const formatDateForAmplify = (dateValue: string | null): string | null => {
                if (!dateValue || dateValue.trim() === "") return null;

                // If it's already in YYYY-MM-DD format, return as is
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    return dateValue;
                }

                // If it's in ISO format, extract just the date part
                if (dateValue.includes('T')) {
                    return dateValue.split('T')[0];
                }

                // Try to parse and format
                try {
                    const date = new Date(dateValue);
                    if (isNaN(date.getTime())) return null;

                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');

                    return `${year}-${month}-${day}`;
                } catch {
                    return null;
                }
            };

            const fleetData = {
                ...editingFleet,
                ...editedFleet,
                lastServicedate: formatDateForAmplify(editedFleet.lastServicedate || editingFleet.lastServicedate),
                lastRotationdate: formatDateForAmplify(editedFleet.lastRotationdate || editingFleet.lastRotationdate),
                breakandLuxExpirey: formatDateForAmplify(editedFleet.breakandLuxExpirey || editingFleet.breakandLuxExpirey),
                history: historyEntries ? (editingFleet.history || "") + historyEntries : editingFleet.history
            };

            console.log("Saving fleet data:", fleetData);

            if (isCreating) {
                // Create new fleet - remove the id field for creation
                const { id, ...createData } = fleetData;
                const result = await client.models.Fleet.create(createData);
                console.log("Create result:", result);
            } else {
                // Update existing fleet
                const result = await client.models.Fleet.update({
                    id: fleetData.id,
                    vehicleVin: fleetData.vehicleVin || null,
                    vehicleReg: fleetData.vehicleReg || null,
                    vehicleMake: fleetData.vehicleMake || null,
                    vehicleModel: fleetData.vehicleModel || null,
                    transmitionType: fleetData.transmitionType || null,
                    ownershipStatus: fleetData.ownershipStatus || null,
                    fleetIndex: fleetData.fleetIndex || null,
                    fleetNumber: fleetData.fleetNumber || null,
                    lastServicedate: fleetData.lastServicedate, // Already formatted
                    lastServicekm: fleetData.lastServicekm || null,
                    lastRotationdate: fleetData.lastRotationdate, // Already formatted
                    lastRotationkm: fleetData.lastRotationkm || null,
                    servicePlanStatus: fleetData.servicePlanStatus || false,
                    servicePlan: fleetData.servicePlan || null,
                    currentDriver: fleetData.currentDriver || null,
                    currentkm: fleetData.currentkm || null,
                    codeRequirement: fleetData.codeRequirement || null,
                    pdpRequirement: fleetData.pdpRequirement || false,
                    breakandLuxTest: fleetData.breakandLuxTest || null,
                    breakandLuxExpirey: fleetData.breakandLuxExpirey,
                    history: fleetData.history || null
                });

            }

            setEditingFleet(null);
            setEditedFleet({});
            setIsCreating(false);

            // Show success message
            alert(isCreating ? "Vehicle created successfully!" : "Vehicle updated successfully!");

        } catch (error) {
            console.error("Error saving fleet:", error);
            alert("Error saving vehicle. Check console for details.");
        } finally {
            setSaving(false);
        }
    };


    // Handle cancel
    const handleCancel = () => {
        setEditingFleet(null);
        setEditedFleet({});
        setIsCreating(false);
    };

    // Handle change
    const handleChange = (field: keyof Fleet, value: string | number | boolean) => {
        setEditedFleet(prev => ({ ...prev, [field]: value }));
    };

    // Handle delete
    const handleDelete = async (fleetId: string) => {
        try {
            await client.models.Fleet.delete({
                id: fleetId
            });
            setFleetToDelete(null);
            setOpendelete(false);
        } catch (error) {
            console.error("Error deleting fleet:", error);
        }
    };

    const handleDeleteClick = (fleetId: string, fleetName: string) => {
        setFleetToDelete({ id: fleetId, name: fleetName });
        setOpendelete(true);
    };

    const handleConfirmWrapper = () => {
        if (fleetToDelete) {
            handleDelete(fleetToDelete.id);
        }
    };

    // Redirect to inspections
    const redirectToInspections = (id: string) => {
        localStorage.setItem('fleetId', id);
        router.push(`/inspections/${id}`);
    };

    // Handle print button click to show menu
    const handlePrintClick = (event: React.MouseEvent, id: string) => {
        const button = event.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();

        setPrintMenu({
            isOpen: true,
            fleetId: id,
            position: {
                top: rect.bottom,
                left: rect.left
            }
        });
    };

    // Close print menu
    const closePrintMenu = () => {
        setPrintMenu(prev => ({ ...prev, isOpen: false }));
    };

    // Download CSV function
    const handleDownloadCSV = async () => {
        try {
            propsetLoading(true);
            const csvContent = convertToCSV(fleets);
            const filename = `fleet_management_${new Date().toISOString().split('T')[0]}.csv`;
            downloadCSV(csvContent, filename);
        } catch (error) {
            console.error("Error downloading CSV:", error);
        } finally {
            propsetLoading(false);
        }
    };

    // Download PDF function
    const handleDownloadPDF = async () => {
        try {
            propsetLoading(true);
            const pdf = generatePDF(fleets);
            const filename = `fleet_management_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(filename);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            propsetLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />

            {loading ? (
                <Loading />
            ) : (
                <main className="flex-1 px-2 sm:px-4 mt-20 pb-8">
                    <div className="container mx-auto max-w-7xl mt-5">
                        {/* Search Card */}
                        <Card className="mb-4 sm:mb-6">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                                        <Car className="h-4 w-4 sm:h-5 sm:w-5" />
                                        Fleet Management
                                        <Badge variant="secondary" className="text-xs">
                                            {filteredFleets.length}
                                        </Badge>
                                    </CardTitle>
                                    <Button
                                        onClick={handleCreateNew}
                                        className="h-9 cursor-pointer bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Vehicle
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex flex-col gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Search Type</label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant={searchType === "reg" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSearchType("reg")}
                                                className="h-9 text-xs cursor-pointer flex-1 sm:flex-none"
                                            >
                                                Registration
                                            </Button>
                                            <Button
                                                variant={searchType === "driver" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSearchType("driver")}
                                                className="h-9 text-xs cursor-pointer flex-1 sm:flex-none"
                                            >
                                                Driver
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {searchType === "reg" ? "Search by Registration" : "Search by Driver"}
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={searchType === "reg" ? "Enter registration..." : "Enter driver name..."}
                                                value={searchTerm}
                                                onChange={handleSearch}
                                                className="pl-8 h-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {searchTerm && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Showing {filteredFleets.length} of {fleets.length} vehicles
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Edit/Create Form */}
                        {editingFleet && (
                            <Card className="mb-4 sm:mb-6">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <span className="text-base sm:text-lg">
                                            {isCreating ? "Add New Vehicle" : "Edit Vehicle"}
                                        </span>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                size="sm"
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="h-8 text-xs cursor-pointer bg-[#165b8c] text-white hover:bg-[#1e6fae] flex-1 sm:flex-none"
                                            >
                                                <Save className="h-3 w-3 mr-1" />
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    "Save"
                                                )}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleCancel}
                                                className="h-8 text-xs cursor-pointer flex-1 sm:flex-none"
                                            >
                                                <X className="h-3 w-3 mr-1" />
                                                Cancel
                                            </Button>
                                            {!isCreating && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteClick(editingFleet.id, editingFleet.vehicleReg || editingFleet.fleetNumber || 'Vehicle')}
                                                    className="h-8 text-xs cursor-pointer flex-1 sm:flex-none"
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                        {/* Basic Information */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Fleet Number *</label>
                                            <Input
                                                value={editedFleet.fleetNumber || editingFleet.fleetNumber || ''}
                                                onChange={(e) => handleChange("fleetNumber", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Vehicle Registration *</label>
                                            <Input
                                                value={editedFleet.vehicleReg || editingFleet.vehicleReg || ''}
                                                onChange={(e) => handleChange("vehicleReg", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Vehicle VIN</label>
                                            <Input
                                                value={editedFleet.vehicleVin || editingFleet.vehicleVin || ''}
                                                onChange={(e) => handleChange("vehicleVin", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Vehicle Make</label>
                                            <Input
                                                value={editedFleet.vehicleMake || editingFleet.vehicleMake || ''}
                                                onChange={(e) => handleChange("vehicleMake", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Vehicle Model</label>
                                            <Input
                                                value={editedFleet.vehicleModel || editingFleet.vehicleModel || ''}
                                                onChange={(e) => handleChange("vehicleModel", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Transmission Type</label>
                                            <Select
                                                value={editedFleet.transmitionType || editingFleet.transmitionType || ''}
                                                onValueChange={(value) => handleChange("transmitionType", value)}
                                            >
                                                <SelectTrigger className="h-9 text-sm cursor-pointer">
                                                    <SelectValue placeholder="Select transmission" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Automatic" className="cursor-pointer">Automatic</SelectItem>
                                                    <SelectItem value="Manual" className="cursor-pointer">Manual</SelectItem>
                                                    <SelectItem value="Hybrid" className="cursor-pointer">Hybrid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Ownership Status</label>
                                            <Select
                                                value={editedFleet.ownershipStatus || editingFleet.ownershipStatus || ''}
                                                onValueChange={(value) => handleChange("ownershipStatus", value)}
                                            >
                                                <SelectTrigger className="h-9 text-sm cursor-pointer">
                                                    <SelectValue placeholder="Select ownership" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Owned" className="cursor-pointer">Owned</SelectItem>
                                                    <SelectItem value="Leased" className="cursor-pointer">Leased</SelectItem>
                                                    <SelectItem value="Rented" className="cursor-pointer">Rented</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Current Driver</label>
                                            <Input
                                                value={editedFleet.currentDriver || editingFleet.currentDriver || ''}
                                                onChange={(e) => handleChange("currentDriver", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Current KM</label>
                                            <Input
                                                type="number"
                                                value={editedFleet.currentkm || editingFleet.currentkm || 0}
                                                onChange={(e) => handleChange("currentkm", parseFloat(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Service Plan Status</label>
                                            <Select
                                                value={editedFleet.servicePlanStatus?.toString() || editingFleet.servicePlanStatus?.toString() || 'false'}
                                                onValueChange={(value) => handleChange("servicePlanStatus", value === 'true')}
                                            >
                                                <SelectTrigger className="h-9 text-sm cursor-pointer">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true" className="cursor-pointer">Active</SelectItem>
                                                    <SelectItem value="false" className="cursor-pointer">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Last Service Date</label>
                                            <Input
                                                type="date"
                                                value={editedFleet.lastServicedate || editingFleet.lastServicedate || ''}
                                                onChange={(e) => handleChange("lastServicedate", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Last Rotation Date</label>
                                            <Input
                                                type="date"
                                                value={editedFleet.lastRotationdate || editingFleet.lastRotationdate || ''}
                                                onChange={(e) => handleChange("lastRotationdate", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Brake & Lux Expiry</label>
                                            <Input
                                                type="date"
                                                value={editedFleet.breakandLuxExpirey || editingFleet.breakandLuxExpirey || ''}
                                                onChange={(e) => handleChange("breakandLuxExpirey", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Last Service KM</label>
                                            <Input
                                                type="number"
                                                value={editedFleet.lastServicekm || editingFleet.lastServicekm || 0}
                                                onChange={(e) => handleChange("lastServicekm", parseFloat(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* History */}
                                    {!isCreating && (
                                        <div className="mt-4 space-y-2">
                                            <label className="text-sm font-medium">History</label>
                                            <Textarea
                                                value={editedFleet.history || editingFleet.history || ''}
                                                onChange={(e) => handleChange("history", e.target.value)}
                                                className="min-h-[80px] text-sm resize-vertical"
                                                placeholder="Vehicle history and maintenance records..."
                                                readOnly
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <div className="bg-white rounded-lg border">
                            <DataTable
                                title={"Fleet Vehicles"}
                                data={data}
                                columns={columns}
                                pageSize={10}
                                storageKey="fleetTablePagination"
                                searchColumn="vehicleReg"
                            />
                        </div>

                        {prop_loading && <PropLoading name="Downloading file" />}

                        {/* Print Menu */}
                        <PrintMenu
                            isOpen={printMenu.isOpen}
                            onClose={closePrintMenu}
                            onDownloadCSV={handleDownloadCSV}
                            onDownloadPDF={handleDownloadPDF}
                            position={printMenu.position}
                        />
                    </div>

                    <ConfirmDialog
                        open={opendelete}
                        setOpen={setOpendelete}
                        handleConfirm={handleConfirmWrapper}
                    />
                </main>
            )}
            <Footer />
        </div>
    )
}



interface PrintMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onDownloadCSV: () => void;
    onDownloadPDF: () => void;
    position: { top: number; left: number };
}

interface Fleet {
    id: string;
    vehicleVin: string | null;
    vehicleReg: string | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    transmitionType: string | null;
    ownershipStatus: string | null;
    fleetIndex: string | null;
    fleetNumber: string | null;
    lastServicedate: string | null;
    lastServicekm: number | null;
    lastRotationdate: string | null;
    lastRotationkm: number | null;
    servicePlanStatus: boolean | null;
    servicePlan: string | null;
    currentDriver: string | null;
    currentkm: number | null;
    codeRequirement: string | null;
    pdpRequirement: boolean | null;
    breakandLuxTest: string[] | [];
    breakandLuxExpirey: string | null;
    history: string | null;
}

const PrintMenu: React.FC<PrintMenuProps> = ({
    isOpen,
    onClose,
    onDownloadCSV,
    onDownloadPDF,
    position
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Download As</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-6 w-6 p-0 hover:bg-gray-100 cursor-pointer"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <button
                onClick={() => {
                    onDownloadCSV();
                    onClose();
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
                <Download className="h-4 w-4 mr-3 text-green-600" />
                <span>Download CSV</span>
            </button>

            <button
                onClick={() => {
                    onDownloadPDF();
                    onClose();
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
                <FileArchive className="h-4 w-4 mr-3 text-red-600" />
                <span>Download PDF</span>
            </button>
        </div>
    );
};