"use client";
import { Input } from "@/components/ui/input";
import { Plus, PlusCircle, Search, Trash2, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Loading from "@/components/widgets/loading";
import { BooleanQuestion, booleanQuestions as initialQuestions, PhotoUpload } from "./questions";
import { vifForm } from "@/types/vifForm.types";

interface VifFormProps {
    onVehicleChange: (vehicleId: string,vehicleReg: string) => void;
    onOdometerChange: (value: string) => void;
    onBooleanQuestionsChange: (questions: typeof initialQuestions) => void;
    onPhotosChange: (photos: File[]) => void;
    formState: {
        selectedVehicleReg:string;
        selectedVehicleId: string;
        odometerValue: string;
        booleanQuestions: typeof initialQuestions;
        photos: File[];
    };
}

export default function VifForm({ 
    onVehicleChange, 
    onOdometerChange, 
    onBooleanQuestionsChange, 
    onPhotosChange,
    formState 
}: VifFormProps) {
    const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
    const [isAddingNewVehicle, setIsAddingNewVehicle] = useState(false);
    const [newVehicleInput, setNewVehicleInput] = useState("");
    const [vehiclesLoading, setvehiclesLoading] = useState(false);
    
    // Use local state for temporary vehicles only
    const [temporaryVehicles, setTemporaryVehicles] = useState<vifForm[]>([]);

    // useEffect(() => {
    //     console.log('selectedVehicleId ', formState.selectedVehicleId);
    //     console.log('selectedVehicleId ', formState.selectedVehicleReg);
    // }, [formState.selectedVehicleId]);

    // Memoized filtered categories including temporary ones
    const filteredVehicles = useMemo(() => {
        const allVehicles = [...temporaryVehicles];
        return allVehicles.filter(vehicle =>
            vehicle.vehicleReg?.toLowerCase().includes(vehicleSearchTerm.toLowerCase())
        ).sort((a, b) => a.vehicleReg?.localeCompare(b.vehicleReg));
    }, [temporaryVehicles, vehicleSearchTerm]);

    // confirmNewVehicle function
    const confirmNewVehicle = () => {
        if (newVehicleInput.trim()) {
            const newVehicleId = `new-Vehicle-${Date.now()}`;
            const newVehicle: vifForm = {
                id: newVehicleId,
                vehicleReg: newVehicleInput.trim(),
            };

            setTemporaryVehicles(prev => [...prev, newVehicle]);
            onVehicleChange(newVehicleId,newVehicleInput.trim());
        }
        cancelAddingNewVehicle();
    };

    const handleVehicleChange = (vehicleId: string) => {
        if (vehicleId === "__add_new_vehicle__") {
            setIsAddingNewVehicle(true);
            setNewVehicleInput("");
            setVehicleSearchTerm("");
            return;
        }
        onVehicleChange(vehicleId,newVehicleInput.trim());
    };

    const cancelAddingNewVehicle = () => {
        setIsAddingNewVehicle(false);
        setNewVehicleInput("");
        setVehicleSearchTerm("");
    };

    // Handle boolean changes
    const handleBooleanChange = (index: number, value: boolean) => {
        const updatedQuestions = [...formState.booleanQuestions];
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            value: value
        };
        onBooleanQuestionsChange(updatedQuestions);
    };

    // Handle odometer change
    const handleOdometerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onOdometerChange(e.target.value);
    };

    return (
        <div className="p-4 border rounded-lg space-y-4 bg-background shadow-sm">
            {/* Vehicle Selection */}
            <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">Vehicle Registration</label>
                    {isAddingNewVehicle ? (
                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <Input
                                    value={newVehicleInput}
                                    onChange={(e) => setNewVehicleInput(e.target.value)}
                                    placeholder="Enter new vehicle..."
                                    className="flex-1"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') confirmNewVehicle();
                                        if (e.key === 'Escape') cancelAddingNewVehicle();
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={cancelAddingNewVehicle}
                                >
                                    <X className="h-4 w-4 cursor-pointer" />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={confirmNewVehicle}
                                    disabled={!newVehicleInput.trim()}
                                >
                                    <Plus className="h-4 w-4 cursor-pointer" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Select value={formState.selectedVehicleId} onValueChange={handleVehicleChange}>
                            <SelectTrigger className="cursor-pointer">
                                <SelectValue placeholder="Select a vehicle">
                                    {formState.selectedVehicleId ? filteredVehicles.find(vehicle => vehicle.id === formState.selectedVehicleId)?.vehicleReg : "Select a vehicle"}
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

                                        <div className="border-t mt-1 pt-1">
                                            <SelectItem
                                                value="__add_new_vehicle__"
                                                className="text-blue-600 font-medium flex items-center gap-2 cursor-pointer"
                                            >
                                                <PlusCircle className="h-4 w-4 cursor-pointer" />
                                                Add New Vehicle...
                                            </SelectItem>
                                        </div>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Inspection */}
            {formState.selectedVehicleId && (
                <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Inspection</label>
                    </div>

                    {/* Odometer Start */}
                    <div className="space-y-2 animate-in fade-in-0 duration-500 delay-150">
                        <label className="text-sm font-medium">Odometer Start</label>
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
                        {formState.booleanQuestions.map((question, index) => (
                            <BooleanQuestion
                                key={index}
                                question={question.question}
                                value={question.value}
                                onChange={(value) => handleBooleanChange(index, value)}
                            />
                        ))}
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