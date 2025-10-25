// parent component
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
import { booleanQuestions as initialQuestions, PhotoState } from "./components/questions";
import ResponseModal from "@/components/widgets/response";
import { Loader2 } from "lucide-react";
import { getJhbTimestamp } from "@/utils/helper/time";

export default function Vehicle_Inspection_Form() {
  const [loading, setLoading] = useState(false);
  const [loadingbtn, setLoadingbtn] = useState(false);
  const [vehicles, setvehicles] = useState<vifForm[]>([]);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");
//State for inspection number
  const [currentInspectionNumber, setCurrentInspectionNumber] = useState<number | null>(null);

  const [formState, setFormState] = useState({
    selectedVehicleId: "",
    selectedVehicleReg: "",
    selectedVehicleVin: "",
    odometerValue: "",
    booleanQuestions: initialQuestions,
    photos: [] as PhotoState[]
  });

useEffect(() => {
  const getNextInspectionNumber = async (fleetId: string) => {
    try {
      const existingInspections = await client.models.Inspection.inspectionsByFleetAndDate(
        { fleetid: fleetId },
        { sortDirection: 'DESC', limit: 1 }
      );
      console.log(existingInspections);
      if (existingInspections.data && existingInspections.data.length > 0) {
        setCurrentInspectionNumber((existingInspections.data[0].inspectionNo || 0) + 1);
      } else {
        setCurrentInspectionNumber(1);
      }
    } catch (error) {
      console.error('Error fetching existing inspections:', error);
      setCurrentInspectionNumber(1);
    }
  };

  console.log(formState.selectedVehicleId);
  if (formState.selectedVehicleId) {
    getNextInspectionNumber(formState.selectedVehicleId);
  }
}, [formState.selectedVehicleId]);


  const handleVehicleChange = useCallback((vehicleId: string, vehicleReg: string, vehicleVin: string) => {
    setFormState(prev => ({ 
      ...prev, 
      selectedVehicleId: vehicleId,
      selectedVehicleReg: vehicleReg,
      selectedVehicleVin: vehicleVin
    }));
  }, []);

  const handleOdometerChange = useCallback((value: string) => {
    setFormState(prev => ({ ...prev, odometerValue: value }));
  }, []);

  const handleBooleanQuestionsChange = useCallback((questions: typeof initialQuestions) => {
    setFormState(prev => ({ ...prev, booleanQuestions: questions }));
  }, []);

  const handlePhotosChange = useCallback((photos: PhotoState[]) => {
    setFormState(prev => ({ ...prev, photos }));
  }, []);

  const getNextInspectionNumber = async (fleetId: string): Promise<number> => {
    try {
      const existingInspections = await client.models.Inspection.inspectionsByFleetAndDate(
        { fleetid: fleetId },
        { sortDirection: 'DESC', limit: 1 }
      );

      if (existingInspections.data && existingInspections.data.length > 0) {
        return (existingInspections.data[0].inspectionNo || 0) + 1;
      }
      return 1;
    } catch (error) {
      console.error('Error fetching existing inspections:', error);
      return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingbtn(true);

      // Quick validation
      const hasUnuploadedPhotos = formState.photos.some(photo => photo.status !== 'success');
      if (hasUnuploadedPhotos) {
        setMessage("Please wait for all photos to finish uploading");
        setShow(true);
        setSuccessful(false);
        setLoadingbtn(false);
        return;
      }

      if (!formState.odometerValue || formState.booleanQuestions.some(q => q.value === null)) {
        setMessage("Please complete all required fields");
        setShow(true);
        setSuccessful(false);
        setLoadingbtn(false);
        return;
      }

      const inspectionNumber = await getNextInspectionNumber(formState.selectedVehicleId);
      console.log(inspectionNumber);
      const savedUser = localStorage.getItem("user");
      const timestamp = getJhbTimestamp();

      return;
      // Extract S3 keys from successfully uploaded photos
      const s3PhotoKeys = formState.photos
        .filter(photo => photo.status === 'success')
        .map(photo => photo.s3Key);

      // Prepare inspection results
      const inspectionResults = formState.booleanQuestions.map(q => ({
        question: q.question,
        answer: String(q.value)
      }));

      // Create ClickUp task with S3 references (FAST - no file uploads)
      const createTaskResponse = await fetch("/api/create-task", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: formState.selectedVehicleId,
          inspectionNo: inspectionNumber,
          vehicleReg: formState.selectedVehicleReg,
          vehicleVin: formState.selectedVehicleVin,
          odometer: formState.odometerValue,
          username: savedUser,
          inspectionResults,
          timestamp,
          s3PhotoKeys, // Send S3 keys instead of uploading files
          photoCount: formState.photos.length
        }),
      });

      const taskResult = await createTaskResponse.json();

      if (!taskResult.success) {
        throw new Error(taskResult.error || 'Failed to create task');
      }

      setMessage("Inspection submitted successfully! Photos are already securely stored.");
      setShow(true);
      setSuccessful(true);

      // Reset form
      setFormState({
        selectedVehicleId: "",
        selectedVehicleReg: "",
        selectedVehicleVin: "",
        odometerValue: "",
        booleanQuestions: initialQuestions,
        photos: []
      });

    } catch (err) {
      console.error("Error submitting form:", err);
      setMessage("Failed to submit inspection: " + (err instanceof Error ? err.message : 'Unknown error'));
      setShow(true);
      setSuccessful(false);
    } finally {
      setLoadingbtn(false);
    }
  };

  console.log(formState.photos);
  // Check if form can be submitted
  const canSubmit = formState.selectedVehicleId &&
                   formState.odometerValue &&
                   formState.photos.length > 0 &&
                //    formState.photos.every(photo => photo.status === 'success') && 
                   !formState.booleanQuestions.some(q => q.value === null);

                   console.log(formState.photos.every(photo => photo.status === 'success'));
                   

  useEffect(() => {
    const subscription = client.models.Fleet.observeQuery().subscribe({
      next: ({ items: allVehicles, isSynced }) => {
        if (isSynced) {
          const mappedCategories: vifForm[] = (allVehicles || []).map(mapApiCategoryToVehicle);
          setvehicles(mappedCategories);
          setLoading(false);
        }
      },
      error: (error) => {
        console.log(`Error subscribing to fleets: ${error}`);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

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
                      inspectionNumber={currentInspectionNumber}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        type="submit"
                        className="cursor-pointer"
                        disabled={!canSubmit || loadingbtn}
                      >
                        {loadingbtn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Inspection'
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