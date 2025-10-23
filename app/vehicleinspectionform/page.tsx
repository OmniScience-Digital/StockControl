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
import { Loader2 } from "lucide-react";
import ImageUploadLoader from "./components/imageLoader";
import { getJhbTimestamp } from "@/utils/helper/time";
import { uploadData } from 'aws-amplify/storage';


export default function Vehicle_Inspection_Form() {
    const [loading, setLoading] = useState(false);
    const [loadingbtn, setLoadingbtn] = useState(false);
    const [vehicles, setvehicles] = useState<vifForm[]>([]);
    const [show, setShow] = useState(false);
    const [successful, setSuccessful] = useState(false);
    const [message, setMessage] = useState("");

    // Add upload progress state
    const [uploadProgress, setUploadProgress] = useState({
        isUploading: false,
        currentImage: 0,
        totalImages: 0
    });

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

    // Get the most recent inspection number for a fleet
    const getNextInspectionNumber = async (fleetId: string): Promise<number> => {
        try {
            const existingInspections = await client.models.Inspection.inspectionsByFleetAndDate(
                {
                    fleetid: fleetId
                },
                {
                    sortDirection: 'DESC',
                    limit: 1
                }
            );

            if (existingInspections.data && existingInspections.data.length > 0) {
                const latestInspection = existingInspections.data[0];
                return (latestInspection.inspectionNo || 0) + 1;
            }

            return 1; // No existing inspections, start with 0
        } catch (error) {
            console.error('Error fetching existing inspections:', error);
            return 1; // Fallback to 1 on error
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const inspectionNumber = await getNextInspectionNumber(formState.selectedVehicleId);

            setLoadingbtn(true);
            const savedUser = localStorage.getItem("user");

            // Create ClickUp task with your original datetime format
            const timestamp = getJhbTimestamp();

            // Array to store S3 URLs
            const s3PhotoUrls: string[] = [];

            // Validation
            let missingItems = [];
            if (!formState.odometerValue) missingItems.push("Odometer value missing");
            if (!formState.photos || formState.photos.length === 0) missingItems.push("Photos missing");
            if (formState.booleanQuestions.some(q => q.value === null || q.value === undefined))
                missingItems.push("Some questions not answered");

            if (missingItems.length > 0) {
                setMessage(`Missing required information: ${missingItems.join(", ")}`);
                setShow(true);
                setSuccessful(false);
                setLoadingbtn(false);
                return;
            }


            // Start upload progress
            setUploadProgress({
                isUploading: true,
                currentImage: 0,
                totalImages: formState.photos.length
            });

            // Step 1: Create ClickUp task first (small payload)
            const inspectionResults = formState.booleanQuestions.map(q => ({
                question: q.question,
                answer: String(q.value)
            }));

            const createTaskResponse = await fetch("/api/create-task", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vehicleId: formState.selectedVehicleId,
                    inspectionNo: inspectionNumber,
                    vehicleReg: formState.selectedVehicleReg,
                    odometer: formState.odometerValue,
                    username: savedUser,
                    inspectionResults,
                    timestamp
                }),
            });

            const taskResult = await createTaskResponse.json();

            if (!taskResult.success || !taskResult.taskId) {
                throw new Error(taskResult.error || 'Failed to create task');
            }

            const taskId = taskResult.taskId;

            // Step 2: Upload photos one by one
            for (let i = 0; i < formState.photos.length; i++) {
                // Update progress
                setUploadProgress(prev => ({
                    ...prev,
                    currentImage: i + 1
                }));

                const file = formState.photos[i];

                // ADD S3 UPLOAD HERE - before ClickUp upload
                const s3FileKey = `inspections/${formState.selectedVehicleReg}/${inspectionNumber}/${timestamp}-${i + 1}-${file.name}`;
                s3PhotoUrls.push(s3FileKey); // Store the S3 key/path
                try {
                    // Upload to AWS S3
                    await uploadData({
                        path: s3FileKey,
                        data: file,
                    }).result;

                } catch (s3Error) {
                    console.error('S3 upload failed:', s3Error);
                    // Continue with ClickUp upload even if S3 fails
                }

                // Your existing ClickUp upload
                const photoFormData = new FormData();
                photoFormData.append("photo", file);
                photoFormData.append("taskId", taskId);
                photoFormData.append("timestamp", timestamp);
                photoFormData.append('vehicleReg', formState.selectedVehicleReg);
                photoFormData.append('inspectionNo', inspectionNumber.toString());
                photoFormData.append('dbimages', JSON.stringify(s3PhotoUrls));

                const uploadResponse = await fetch("/api/upload-photo", {
                    method: "POST",
                    body: photoFormData,
                });

                const uploadResult = await uploadResponse.json();

                if (!uploadResult.success) {
                    throw new Error(`Failed to upload photo ${i + 1}: ${file.name}`);
                }
            }

            // Upload complete
            setUploadProgress({
                isUploading: false,
                currentImage: 0,
                totalImages: 0
            });

            setMessage("All photos uploaded successfully! Task created in ClickUp.");
            setShow(true);
            setSuccessful(true);

        } catch (err) {
            console.error("Error uploading:", err);

            // Stop upload progress on error
            setUploadProgress({
                isUploading: false,
                currentImage: 0,
                totalImages: 0
            });

            setMessage("Failed to publish to ClickUp: " + (err instanceof Error ? err.message : 'Unknown error'));
            setShow(true);
            setSuccessful(false);
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
                console.log(`Error subscribing to fleets: ${error}`);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [vehicles.length]);



    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Image Upload Loader */}
            {uploadProgress.isUploading && (
                <ImageUploadLoader
                    currentImage={uploadProgress.currentImage}
                    totalImages={uploadProgress.totalImages}
                    message={`Uploading image ${uploadProgress.currentImage} of ${uploadProgress.totalImages}`}
                />
            )}

            {loading ? (
                <Loading />
            ) : (
                <main className="flex-1 p-6 mt-20 min-h-screen">
                    {show && (
                        <ResponseModal
                            successful={successful}
                            message={message}
                            setShow={setShow}
                        />
                    )}
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
                                            vehicles={vehicles}
                                        />
                                        <div className="flex justify-end mt-2">
                                            <Button
                                                type="submit"
                                                className="cursor-pointer"
                                                disabled={loadingbtn || uploadProgress.isUploading}
                                            >
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
                </main>
            )}
            <Footer />
        </div>
    );
}