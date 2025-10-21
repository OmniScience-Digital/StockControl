"use client";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMemo, useState, useEffect } from "react";
import { BooleanQuestion, booleanQuestions as initialQuestions, PhotoUpload } from "./questions";
import { vifForm } from "@/types/vifForm.types";
import { client } from "@/services/schema";
import Loading from "@/components/widgets/loading";

interface VifFormProps {
    onVehicleChange: (vehicleId: string, vehicleReg: string) => void;
    onOdometerChange: (value: string) => void;
    onBooleanQuestionsChange: (questions: typeof initialQuestions) => void;
    onPhotosChange: (photos: File[]) => void;
    formState: {
        selectedVehicleReg: string;
        selectedVehicleId: string;
        odometerValue: string;
        booleanQuestions: typeof initialQuestions;
        photos: File[];
    };
    vehicles: vifForm[];
}

export default function VifForm({
    onVehicleChange,
    onOdometerChange,
    onBooleanQuestionsChange,
    onPhotosChange,
    formState,
    vehicles
}: VifFormProps) {
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
    const [vehiclesLoading, setvehiclesLoading] = useState(false);
    const [recentInspection, setRecentInspection] = useState<any>(null);
    const [loadingInspection, setLoadingInspection] = useState(false);

    // Memoized filtered categories using the vehicles prop
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(vehicle =>
            vehicle.vehicleReg?.toLowerCase().includes(vehicleSearchTerm.toLowerCase())
        ).sort((a, b) => a.vehicleReg?.localeCompare(b.vehicleReg));
    }, [vehicles, vehicleSearchTerm]);

    // Fetch recent inspection when vehicle changes
    useEffect(() => {
        const fetchRecentInspection = async () => {
            if (!formState.selectedVehicleId) {
                setRecentInspection(null);
                return;
            }

            setLoadingInspection(true);
            try {
                const { data: inspections } = await client.models.Inspection.list({
                    filter: { fleetid: { eq: formState.selectedVehicleId } }
                });

                // Get the most recent inspection
                const mostRecent = inspections && inspections.length > 0
                    ? inspections.sort((a: any, b: any) =>
                        new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime()
                    )[0]
                    : null;

                setRecentInspection(mostRecent);

                // Pre-populate form with recent inspection data
                if (mostRecent) {
                    // Pre-populate odometer
                    if (mostRecent.odometerStart) {
                        onOdometerChange(mostRecent.odometerStart.toString());
                    }

                    // Pre-populate boolean questions - simple approach
                    const updatedQuestions = initialQuestions.map((question, index) => {
                        // Use type assertion to avoid TypeScript error
                        const inspection: any = mostRecent;
                        const fieldNames = [
                            'oilAndCoolant', 'fuelLevel', 'seatbeltDoorsMirrors', 'handbrake',
                            'tyreCondition', 'spareTyre', 'numberPlate', 'licenseDisc',
                            'leaks', 'lights', 'defrosterAircon', 'emergencyKit', 'clean',
                            'warnings', 'windscreenWipers', 'serviceBook', 'siteKit'
                        ];

                        const fieldName = fieldNames[index];
                        if (fieldName && inspection[fieldName] !== undefined && inspection[fieldName] !== null) {
                            return {
                                ...question,
                                value: inspection[fieldName]
                            };
                        }
                        return question;
                    });

                    onBooleanQuestionsChange(updatedQuestions);
                }
            } catch (error) {
                console.error('Error fetching inspection:', error);
            } finally {
                setLoadingInspection(false);
            }
        };

        fetchRecentInspection();
    }, [formState.selectedVehicleId]);

    const handleVehicleChange = (vehicleId: string) => {
        const selectedVehicle = vehicles.find(vehicle => vehicle.id === vehicleId);
        if (selectedVehicle) {
            onVehicleChange(vehicleId, selectedVehicle.vehicleReg || "");
        }
    };

    const handleBooleanChange = (index: number, value: boolean) => {
        const updatedQuestions = [...formState.booleanQuestions];
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            value: value
        };
        onBooleanQuestionsChange(updatedQuestions);
    };

    const handleOdometerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onOdometerChange(e.target.value);
    };

    // Simple function to get previous answer for a question
    const getPreviousAnswer = (index: number) => {
        if (!recentInspection) return null;

        const fieldNames = [
            'oilAndCoolant', 'fuelLevel', 'seatbeltDoorsMirrors', 'handbrake',
            'tyreCondition', 'spareTyre', 'numberPlate', 'licenseDisc',
            'leaks', 'lights', 'defrosterAircon', 'emergencyKit', 'clean',
            'warnings', 'windscreenWipers', 'serviceBook', 'siteKit'
        ];

        const fieldName = fieldNames[index];
        // Use type assertion to avoid TypeScript error
        const inspection: any = recentInspection;
        return fieldName ? inspection[fieldName] : null;
    };

    return (
        <div className="p-4 border rounded-lg space-y-4 bg-background shadow-sm">
            {/* Vehicle Selection */}
            <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Vehicle Registration</label>
                    <Select value={formState.selectedVehicleId} onValueChange={handleVehicleChange}>
                        <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder="Select a vehicle">
                                {formState.selectedVehicleId ? vehicles.find(vehicle => vehicle.id === formState.selectedVehicleId)?.vehicleReg : "Select a vehicle"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
                            <div className="sticky top-0 z-10 bg-background p-2 border-b">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Search vehicles..."
                                        value={vehicleSearchTerm}
                                        onChange={(e) => setVehicleSearchTerm(e.target.value)}
                                        className="pl-8 pr-8 h-9"
                                    />
                                    {vehicleSearchTerm && (
                                        <X
                                            className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 cursor-pointer"
                                            onClick={() => setVehicleSearchTerm("")}
                                        />
                                    )}
                                </div>
                            </div>

                            {vehiclesLoading ? (
                                <div className="p-4 text-center">
                                    <Loading />
                                </div>
                            ) : (
                                <>
                                    {filteredVehicles.map((vehicle: any) => (
                                        <SelectItem key={vehicle.id} value={vehicle.id}>
                                            {vehicle.vehicleReg}
                                        </SelectItem>
                                    ))}
                                </>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Inspection */}
            {formState.selectedVehicleId && (
                <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">


                    {/* Recent Inspection Info */}
                    {recentInspection && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-700 font-medium">
                                📋 Last inspection: {new Date(recentInspection.inspectionDate).toLocaleDateString()}
                            </p>
                        </div>
                    )}

                    {/* Odometer Start */}
                    <div className="space-y-2 animate-in fade-in-0 duration-500 delay-150">
                        <label className="text-sm font-medium mb-5">
                            Odometer Start
                            {recentInspection?.odometerStart && (
                                <span className="text-blue-600 ml-2">
                                    (Last: {recentInspection.odometerStart} km)
                                </span>
                            )}
                        </label>
                        <Input
                            type="number"
                            placeholder="Enter odometer reading"
                            className="w-full"
                            value={formState.odometerValue}
                            onChange={handleOdometerChange}
                        />
                    </div>

                    {/* Boolean Questions */}
                    <div className="space-y-4 animate-in fade-in-0 duration-500 delay-300">
                        {formState.booleanQuestions.map((question, index) => {
                            const previousAnswer = getPreviousAnswer(index);

                            return (
                                <div key={index} className={previousAnswer !== null ? 'border-l-4 border-l-blue-500 pl-3' : ''}>
                                    <BooleanQuestion
                                        question={question.question}
                                        value={question.value}
                                        onChange={(value) => handleBooleanChange(index, value)}
                                    />
                                    {previousAnswer !== null && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            Previous: {previousAnswer ? '✅ Yes' : '❌ No'}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2 animate-in fade-in-0 duration-500 delay-500">
                        <label className="text-sm font-medium">Please attach inspection Photos</label>
                        <PhotoUpload onPhotosChange={onPhotosChange} />
                    </div>


                </div>
            )}
        </div>
    );
}