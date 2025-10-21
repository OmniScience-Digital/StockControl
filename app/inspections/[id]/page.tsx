"use client";

import { client } from "@/services/schema";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DataTable } from "@/components/table/datatable";
import { EditIcon, ArrowUpDown, Plus, Save, Trash2, MoreVertical, Car, Calendar, ArrowLeft } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import Loading from "@/components/widgets/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/widgets/deletedialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function InspectionsPage() {
    const router = useRouter();
    const params = useParams();
    const fleetId = decodeURIComponent(params.id as string);

    const [loading, setLoading] = useState(true);
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [fleetInfo, setFleetInfo] = useState<any>(null);
    const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
    const [editedInspection, setEditedInspection] = useState<Partial<Inspection>>({});
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [opendelete, setOpendelete] = useState(false);
    const [inspectionToDelete, setInspectionToDelete] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        // Fetch fleet information
        const fetchFleetInfo = async () => {
            try {
                const { data: fleet } = await client.models.Fleet.get({ id: fleetId });
                setFleetInfo(fleet);
            } catch (error) {
                console.error("Error fetching fleet info:", error);
            }
        };

        fetchFleetInfo();

        // Subscribe to real-time updates for inspections
        const subscription = client.models.Inspection.observeQuery({
            filter: { fleetid: { eq: fleetId } }
        }).subscribe({
            next: ({ items, isSynced }) => {
                const mappedInspections: Inspection[] = (items || []).map(item => ({
                    id: item.id,
                    fleetid: item.fleetid,
                    inspectionNo: item.inspectionNo,
                    vehicleVin: item.vehicleVin,
                    inspectionDate: item.inspectionDate,
                    inspectionTime: item.inspectionTime,
                    odometerStart: item.odometerStart,
                    vehicleReg: item.vehicleReg,
                    inspectorOrDriver: item.inspectorOrDriver,
                    oilAndCoolant: item.oilAndCoolant,
                    fuelLevel: item.fuelLevel,
                    seatbeltDoorsMirrors: item.seatbeltDoorsMirrors,
                    handbrake: item.handbrake,
                    tyreCondition: item.tyreCondition,
                    spareTyre: item.spareTyre,
                    numberPlate: item.numberPlate,
                    licenseDisc: item.licenseDisc,
                    leaks: item.leaks,
                    lights: item.lights,
                    defrosterAircon: item.defrosterAircon,
                    emergencyKit: item.emergencyKit,
                    clean: item.clean,
                    warnings: item.warnings,
                    windscreenWipers: item.windscreenWipers,
                    serviceBook: item.serviceBook,
                    siteKit: item.siteKit,
                    photo: item.photo,
                    history: item.history
                }));
                setInspections(mappedInspections);

                if (isSynced) {
                    setLoading(false);
                }
            },
            error: (error) => {
                console.error("Error subscribing to inspections:", error);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fleetId]);

    // Mobile-friendly columns
    const columns: ColumnDef<object, any>[] = [
        {
            accessorKey: "inspectionNo",
            header: ({ column }: { column: any }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 h-auto font-medium"
                >
                    Inspect No
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }: { row: any }) => (
                <div className="font-medium text-sm">
                    #{row.original.inspectionNo}
                </div>
            ),
        },
        {
            accessorKey: "inspectionDate",
            header: "Date",
            cell: ({ row }: { row: any }) => (
                <div className="text-sm">{row.original.inspectionDate}</div>
            ),
        },
        {
            accessorKey: "inspectorOrDriver",
            header: "Inspector",
            cell: ({ row }: { row: any }) => (
                <div className="text-sm hidden lg:block">{row.original.inspectorOrDriver}</div>
            ),
        },
        {
            accessorKey: "odometerStart",
            header: "Odometer",
            cell: ({ row }: { row: any }) => (
                <div className="text-sm hidden md:block">{row.original.odometerStart?.toLocaleString()}</div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }: { row: any }) => {
                const passed = [
                    row.original.oilAndCoolant,
                    row.original.fuelLevel,
                    row.original.lights,
                    row.original.tyreCondition
                ].filter(Boolean).length;

                return (
                    <Badge
                        variant={passed >= 3 ? "default" : "destructive"}
                        className="text-xs"
                    >
                        {passed >= 3 ? "Pass" : "Fail"}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: any }) => (
                <div className="flex justify-end">
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    const data = Array.isArray(inspections)
        ? inspections.map((inspection) => {
            return {
                id: inspection.id || "",
                inspectionNo: inspection.inspectionNo || 0,
                inspectionDate: inspection.inspectionDate || "",
                inspectorOrDriver: inspection.inspectorOrDriver || "",
                odometerStart: inspection.odometerStart || 0,
                oilAndCoolant: inspection.oilAndCoolant || false,
                fuelLevel: inspection.fuelLevel || false,
                lights: inspection.lights || false,
                tyreCondition: inspection.tyreCondition || false,
            };
        })
        : [];

    // Handle edit
    const handleEdit = (inspection: any) => {
        const fullInspection = inspections.find(i => i.id === inspection.id) || inspection;
        setEditingInspection(fullInspection);
        setEditedInspection({ ...fullInspection });
        setIsCreating(false);
    };

    // Handle create new
    const handleCreateNew = () => {
        setEditingInspection({
            id: '',
            fleetid: fleetId,
            inspectionNo: inspections.length + 1,
            vehicleVin: fleetInfo?.vehicleVin || '',
            inspectionDate: new Date().toISOString().split('T')[0],
            inspectionTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
            odometerStart: fleetInfo?.currentkm || 0,
            vehicleReg: fleetInfo?.vehicleReg || '',
            inspectorOrDriver: '',
            oilAndCoolant: false,
            fuelLevel: false,
            seatbeltDoorsMirrors: false,
            handbrake: false,
            tyreCondition: false,
            spareTyre: false,
            numberPlate: false,
            licenseDisc: false,
            leaks: false,
            lights: false,
            defrosterAircon: false,
            emergencyKit: false,
            clean: false,
            warnings: false,
            windscreenWipers: false,
            serviceBook: false,
            siteKit: false,
            photo: '',
            history: ''
        });
        setEditedInspection({});
        setIsCreating(true);
    };

    // Handle save
    const handleSave = async () => {
        if (!editingInspection) return;

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
            if (editingInspection.id && !isCreating) {
                Object.keys(editedInspection).forEach(key => {
                    const typedKey = key as keyof Inspection;
                    if (editedInspection[typedKey] !== editingInspection[typedKey]) {
                        historyEntries += `${storedName} updated ${typedKey} from ${editingInspection[typedKey]} to ${editedInspection[typedKey]} at ${johannesburgTime}\n`;
                    }
                });
            } else if (isCreating) {
                historyEntries = `${storedName} created new inspection at ${johannesburgTime}\n`;
            }

            // Helper function to handle date fields for AWS Amplify
            const formatDateForAmplify = (dateValue: string | null): string | null => {
                if (!dateValue || dateValue.trim() === "") return null;
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
                if (dateValue.includes('T')) return dateValue.split('T')[0];
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

            const inspectionData = {
                ...editingInspection,
                ...editedInspection,
                inspectionDate: formatDateForAmplify(editedInspection.inspectionDate || editingInspection.inspectionDate),
                history: historyEntries ? (editingInspection.history || "") + historyEntries : editingInspection.history
            };

            console.log("Saving inspection data:", inspectionData);

            if (isCreating) {
                // Create new inspection - remove the id field for creation
                const { id, ...createData } = inspectionData;
                const result = await client.models.Inspection.create(createData);
                console.log("Create result:", result);
            } else {
                // Update existing inspection
                const result = await client.models.Inspection.update({
                    id: inspectionData.id,
                    fleetid: inspectionData.fleetid,
                    inspectionNo: inspectionData.inspectionNo,
                    vehicleVin: inspectionData.vehicleVin || null,
                    inspectionDate: inspectionData.inspectionDate,
                    inspectionTime: inspectionData.inspectionTime || null,
                    odometerStart: inspectionData.odometerStart || null,
                    vehicleReg: inspectionData.vehicleReg || null,
                    inspectorOrDriver: inspectionData.inspectorOrDriver || null,
                    oilAndCoolant: inspectionData.oilAndCoolant || false,
                    fuelLevel: inspectionData.fuelLevel || false,
                    seatbeltDoorsMirrors: inspectionData.seatbeltDoorsMirrors || false,
                    handbrake: inspectionData.handbrake || false,
                    tyreCondition: inspectionData.tyreCondition || false,
                    spareTyre: inspectionData.spareTyre || false,
                    numberPlate: inspectionData.numberPlate || false,
                    licenseDisc: inspectionData.licenseDisc || false,
                    leaks: inspectionData.leaks || false,
                    lights: inspectionData.lights || false,
                    defrosterAircon: inspectionData.defrosterAircon || false,
                    emergencyKit: inspectionData.emergencyKit || false,
                    clean: inspectionData.clean || false,
                    warnings: inspectionData.warnings || false,
                    windscreenWipers: inspectionData.windscreenWipers || false,
                    serviceBook: inspectionData.serviceBook || false,
                    siteKit: inspectionData.siteKit || false,
                    photo: inspectionData.photo || null,
                    history: inspectionData.history || null
                });
                console.log("Update result:", result);
            }

            setEditingInspection(null);
            setEditedInspection({});
            setIsCreating(false);

            // Show success message
            alert(isCreating ? "Inspection created successfully!" : "Inspection updated successfully!");

        } catch (error) {
            console.error("Error saving inspection:", error);
            alert("Error saving inspection. Check console for details.");
        } finally {
            setSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setEditingInspection(null);
        setEditedInspection({});
        setIsCreating(false);
    };

    // Handle change
    const handleChange = (field: keyof Inspection, value: string | number | boolean) => {
        setEditedInspection(prev => ({ ...prev, [field]: value }));
    };

    // Handle delete
    const handleDelete = async (inspectionId: string) => {
        try {
            await client.models.Inspection.delete({
                id: inspectionId
            });
            setInspectionToDelete(null);
            setOpendelete(false);
        } catch (error) {
            console.error("Error deleting inspection:", error);
        }
    };

    const handleDeleteClick = (inspectionId: string, inspectionName: string) => {
        setInspectionToDelete({ id: inspectionId, name: inspectionName });
        setOpendelete(true);
    };

    const handleConfirmWrapper = () => {
        if (inspectionToDelete) {
            handleDelete(inspectionToDelete.id);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />

            {loading ? (
                <Loading />
            ) : (
                <main className="flex-1 px-2 sm:px-4 mt-25 pb-8">
                    <div className="container mx-auto max-w-7xl">
                        {/* Header */}
                        <div className="mb-4 sm:mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push('/vehicleinspectionsystem')}
                                    className="h-8 w-8 p-0"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <Car className="h-5 w-5 text-primary" />
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold">
                                        {fleetInfo?.vehicleReg || 'Vehicle'} Inspections
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {fleetInfo?.fleetNumber} • {fleetInfo?.vehicleMake} {fleetInfo?.vehicleModel}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Header Card */}
                        <Card className="mb-4 sm:mb-6">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                                        Inspection Management
                                        <Badge variant="secondary" className="text-xs">
                                            {inspections.length}
                                        </Badge>
                                    </CardTitle>
                                    <Button
                                        onClick={handleCreateNew}
                                        className="h-9 cursor-pointer bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Inspection
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Edit/Create Form */}
                        {editingInspection && (
                            <Card className="mb-4 sm:mb-6">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <span className="text-base sm:text-lg">
                                            {isCreating ? "New Inspection" : "Edit Inspection"}
                                        </span>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                size="sm"
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="h-8 text-xs cursor-pointer bg-[#165b8c] text-white hover:bg-[#1e6fae] flex-1 sm:flex-none"
                                            >
                                                <Save className="h-3 w-3 mr-1" />
                                                {saving ? "Saving..." : "Save"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleCancel}
                                                className="h-8 text-xs cursor-pointer flex-1 sm:flex-none"
                                            >
                                                <ArrowLeft className="h-3 w-3 mr-1" />
                                                Cancel
                                            </Button>
                                            {!isCreating && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteClick(editingInspection.id, `Inspection #${editingInspection.inspectionNo}`)}
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
                                            <label className="text-sm font-medium">Inspection Number</label>
                                            <Input
                                                type="number"
                                                value={editedInspection.inspectionNo || editingInspection.inspectionNo || 0}
                                                onChange={(e) => handleChange("inspectionNo", parseInt(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Vehicle Registration</label>
                                            <Input
                                                value={editedInspection.vehicleReg || editingInspection.vehicleReg || ''}
                                                onChange={(e) => handleChange("vehicleReg", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Vehicle VIN</label>
                                            <Input
                                                value={editedInspection.vehicleVin || editingInspection.vehicleVin || ''}
                                                onChange={(e) => handleChange("vehicleVin", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Inspection Date</label>
                                            <Input
                                                type="date"
                                                value={editedInspection.inspectionDate || editingInspection.inspectionDate || ''}
                                                onChange={(e) => handleChange("inspectionDate", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Inspection Time</label>
                                            <Input
                                                type="time"
                                                value={editedInspection.inspectionTime || editingInspection.inspectionTime || ''}
                                                onChange={(e) => handleChange("inspectionTime", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Odometer Start</label>
                                            <Input
                                                type="number"
                                                value={editedInspection.odometerStart || editingInspection.odometerStart || 0}
                                                onChange={(e) => handleChange("odometerStart", parseFloat(e.target.value) || 0)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Inspector/Driver</label>
                                            <Input
                                                value={editedInspection.inspectorOrDriver || editingInspection.inspectorOrDriver || ''}
                                                onChange={(e) => handleChange("inspectorOrDriver", e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Inspection Checklist */}
                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-4">Inspection Checklist</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[
                                                { key: 'oilAndCoolant', label: 'Oil & Coolant' },
                                                { key: 'fuelLevel', label: 'Fuel Level' },
                                                { key: 'seatbeltDoorsMirrors', label: 'Seatbelts, Doors & Mirrors' },
                                                { key: 'handbrake', label: 'Handbrake' },
                                                { key: 'tyreCondition', label: 'Tyre Condition' },
                                                { key: 'spareTyre', label: 'Spare Tyre' },
                                                { key: 'numberPlate', label: 'Number Plate' },
                                                { key: 'licenseDisc', label: 'License Disc' },
                                                { key: 'leaks', label: 'No Leaks' },
                                                { key: 'lights', label: 'Lights' },
                                                { key: 'defrosterAircon', label: 'Defroster & Aircon' },
                                                { key: 'emergencyKit', label: 'Emergency Kit' },
                                                { key: 'clean', label: 'Clean' },
                                                { key: 'warnings', label: 'No Warning Lights' },
                                                { key: 'windscreenWipers', label: 'Windscreen & Wipers' },
                                                { key: 'serviceBook', label: 'Service Book' },
                                                { key: 'siteKit', label: 'Site Kit' },
                                            ].map((item) => (
                                                <div key={item.key} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!(editedInspection[item.key as keyof Inspection] ?? editingInspection[item.key as keyof Inspection])}
                                                        onChange={(e) => handleChange(item.key as keyof Inspection, e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <label className="text-sm font-medium">{item.label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Additional Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Photo URL</label>
                                            <Input
                                                value={editedInspection.photo || editingInspection.photo || ''}
                                                onChange={(e) => handleChange("photo", e.target.value)}
                                                className="h-9 text-sm"
                                                placeholder="https://example.com/photo.jpg"
                                            />
                                        </div>
                                    </div>

                                    {/* History */}
                                    {!isCreating && (
                                        <div className="mt-4 space-y-2">
                                            <label className="text-sm font-medium">History</label>
                                            <Textarea
                                                value={editedInspection.history || editingInspection.history || ''}
                                                onChange={(e) => handleChange("history", e.target.value)}
                                                className="min-h-[80px] text-sm resize-vertical"
                                                placeholder="Inspection history and notes..."
                                                readOnly
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <div className="bg-white rounded-lg border">
                            <DataTable
                                title={"Vehicle Inspections"}
                                data={data}
                                columns={columns}
                                pageSize={10}
                                storageKey="inspectionsTablePagination"
                                searchColumn="vehicleReg"
                            />
                        </div>
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


interface Inspection {
    id: string;
    fleetid: string;
    inspectionNo: number | null;
    vehicleVin: string | null;
    inspectionDate: string | null;
    inspectionTime: string | null;
    odometerStart: number | null;
    vehicleReg: string | null;
    inspectorOrDriver: string | null;
    oilAndCoolant: boolean | null;
    fuelLevel: boolean | null;
    seatbeltDoorsMirrors: boolean | null;
    handbrake: boolean | null;
    tyreCondition: boolean | null;
    spareTyre: boolean | null;
    numberPlate: boolean | null;
    licenseDisc: boolean | null;
    leaks: boolean | null;
    lights: boolean | null;
    defrosterAircon: boolean | null;
    emergencyKit: boolean | null;
    clean: boolean | null;
    warnings: boolean | null;
    windscreenWipers: boolean | null;
    serviceBook: boolean | null;
    siteKit: boolean | null;
    photo: string | null;
    history: string | null;
}