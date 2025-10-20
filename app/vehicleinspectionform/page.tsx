"use client";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/widgets/loading";
import { client } from "@/services/schema";
import VifForm from "./components/vifForm";
import Footer from "@/components/layout/footer";
import { vifForm } from "@/types/vifForm.types";
import { mapApiCategoryToVehicle } from "../stockcontrolform/Components/map.categories.helper";
import { booleanQuestions as initialQuestions } from "./components/questions";
import ResponseModal from "@/components/widgets/response";
import { baseUrl, securebaseUrltest } from "../constants";
import { Loader2 } from "lucide-react";

export default function Vehicle_Inspection_Form() {
    const [loading, setLoading] = useState(false);
    const [loadingbtn, setLoadingbtn] = useState(false);
    const [vehicles, setvehicles] = useState<vifForm[]>([]);


    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");

    // Lift all form state to parent
    const [formState, setFormState] = useState({
        selectedVehicleId: "",
        selectedVehicleReg: "",
        odometerValue: "",
        booleanQuestions: initialQuestions,
        photos: [] as File[]
    });

    // Use useCallback to prevent infinite re-renders
    const handleVehicleChange = useCallback((vehicleId: string, vehicleReg: string) => {
        setFormState(prev => ({ ...prev, selectedVehicleId: vehicleId }));
        setFormState(prev => ({ ...prev, selectedVehicleReg: vehicleReg }));
    }, []);

    const handleOdometerChange = useCallback((value: string) => {
        setFormState(prev => ({ ...prev, odometerValue: value }));
    }, []);

    const handleBooleanQuestionsChange = useCallback((questions: typeof initialQuestions) => {
        setFormState(prev => ({ ...prev, booleanQuestions: questions }));
    }, []);

    const handlePhotosChange = useCallback((photos: File[]) => {
        setFormState(prev => ({ ...prev, photos }));
    }, []);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingbtn(true);

        const formData = new FormData();
        const savedUser = localStorage.getItem("user");
        formData.append("vehicleId", formState.selectedVehicleId);
        formData.append("vehicleReg", formState.selectedVehicleReg);
        formData.append("odometer", formState.odometerValue || "");
        formData.append("username", savedUser || "");

        formState.booleanQuestions.forEach((q, index) => {
            formData.append(`inspectionResults[${index}][question]`, q.question);
            formData.append(`inspectionResults[${index}][answer]`, String(q.value ?? ""));
        });


        formState.photos.forEach((photo, index) => {
            // if using File objects from <input type="file" />
            formData.append("photos", photo);
        });


        try {
            const res = await fetch(`${securebaseUrltest}/vifclickup`, {
                method: "POST",
                body: formData,
            });

            const resResponse = await res.json();


            setMessage(resResponse.message || "Successfully published to ClickUp");
            setShow(true);
            setSuccessful(resResponse.success);

        } catch (err) {
            console.error("Error uploading:", err);
            setLoadingbtn(false);
        } finally {
            setLoadingbtn(false);
                setFormState({
                selectedVehicleId: "",
                selectedVehicleReg: "",
                odometerValue: "",
                booleanQuestions: initialQuestions,
                photos: [] as File[]
            });
        }
    };

    // Subscribe to fleets
    useEffect(() => {
        const subscription = client.models.Fleet.observeQuery().subscribe({
            next: ({ items: allVehicles, isSynced }) => {
                if (isSynced) {
                    console.log('isSynced ', isSynced);
                    const mappedCategories: vifForm[] = (allVehicles || []).map(mapApiCategoryToVehicle);
                    setvehicles(mappedCategories);
                    console.log(allVehicles);
                    setLoading(false);
                }
            },
            error: (error) => {
                console.log(`Error subscribing to fleet: ${error}`);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [vehicles.length]);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />
            {loading ? (
                <Loading />
            ) : (
                <main className="flex-1 p-6 mt-20 min-h-screen">
                    <div className="max-w-4xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vehicle Inspection Form</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <form className="space-y-6 mt-2" onSubmit={handleSubmit}>
                                        <VifForm
                                            onVehicleChange={handleVehicleChange}
                                            onOdometerChange={handleOdometerChange}
                                            onBooleanQuestionsChange={handleBooleanQuestionsChange}
                                            onPhotosChange={handlePhotosChange}
                                            formState={formState}
                                        />
                                        <div className="flex justify-end mt-2">

                                            <Button type="submit" className="cursor-pointer" disabled={loadingbtn}>
                                                Submit
                                                {loadingbtn && (
                                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {show && (
                        <ResponseModal
                            successful={successful}
                            message={message}
                            setShow={setShow}
                        />
                    )}
                </main>
            )}
            <Footer />
        </div>
    );
}