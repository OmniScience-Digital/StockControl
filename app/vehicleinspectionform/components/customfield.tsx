import { client } from "@/services/schema";

export const calculateCustomFields = async (
    formState: any,
    vehicles: any[],
    currentInspectionNumber: Number,
    timestamp: string
) => {
    const savedUser = localStorage.getItem("user");
    const vehicle = vehicles.find(v => v.id === formState.selectedVehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const odometer = parseInt(formState.odometerValue);
    const today = new Date();
    const lastServiceDate = new Date(vehicle.lastServicedate);

    // --- Conditions ---
    const serviceRequired =
        odometer > (Number(vehicle.lastServicekm) + 11999) ||
        today > new Date(lastServiceDate.getTime() + (334 * 24 * 60 * 60 * 1000));

    const tyreRotationRequired =
        vehicle.lastRotationkm && odometer > (Number(vehicle.lastRotationkm) + 7000);

    const reviewRequired = formState.booleanQuestions.some((q: any) => {
        const question = q.question.toLowerCase();
        const value = q.value;

        if (question.includes("oil and coolant")) return !value;
        if (question.includes("full tank")) return !value;
        if (question.includes("seatbelt")) return !value;
        if (question.includes("handbrake")) return !value;
        if (question.includes("tyre") && question.includes("wear")) return !value;
        if (question.includes("spare tyre")) return !value;
        if (question.includes("number plate")) return !value;
        if (question.includes("license disc")) return !value;
        if (question.includes("leaks")) return value;
        if (question.includes("light")) return !value;
        if (question.includes("defrost") || question.includes("air condition")) return !value;
        if (question.includes("emergency kit")) return !value;
        if (question.includes("clean")) return !value;
        if (question.includes("warning light")) return value;
        if (question.includes("windscreen wiper")) return !value;
        if (question.includes("service book")) return !value;
        return false;
    });

    //  secondary index query
    const checkExistingTask = async (vehicleReg: string, taskType: "service" | "rotation") => {
        const { data: existingTasks } = await client.models.TaskTable.listTaskTableByVehicleRegAndTaskType({
            vehicleReg: vehicleReg,  // Partition key
            taskType: { eq: taskType }  // Sort key 
        });
        return existingTasks && existingTasks.length > 0;
    };

    // --- Service Task ---
    if (serviceRequired) {
        const taskExists = await checkExistingTask(formState.selectedVehicleReg, "service");

        if (!taskExists) {
            const createTaskResponse = await fetch("/api/customfield-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Service Required",
                    vehicleId: formState.selectedVehicleId,
                    inspectionNo: currentInspectionNumber,
                    vehicleReg: formState.selectedVehicleReg,
                    vehicleVin: formState.selectedVehicleVin,
                    odometer: formState.odometerValue,
                    timestamp,
                    username: savedUser,
                    serviceRequired,
                    reviewRequired,
                    tyreRotationRequired,
                }),
            });

            const taskResult = await createTaskResponse.json();


            if (!taskResult.success) {
                throw new Error(taskResult.error || 'Failed to create task');
            }


            if (taskResult.success && taskResult.taskId) {
                await client.models.TaskTable.create({
                    vehicleReg: formState.selectedVehicleReg,
                    taskType: "service",
                    clickupTaskId: taskResult.taskId,
                });
            }
        }
    }

    // --- Tyre Rotation Task ---
    if (tyreRotationRequired) {
        console.log('tyreRotationRequired ',tyreRotationRequired);

        const taskExists = await checkExistingTask(formState.selectedVehicleReg, "rotation");
        if (!taskExists) {
            const createTaskResponse = await fetch("/api/customfield-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Tyre Rotation Required",
                    vehicleId: formState.selectedVehicleId,
                    inspectionNo: currentInspectionNumber,
                    vehicleReg: formState.selectedVehicleReg,
                    vehicleVin: formState.selectedVehicleVin,
                    odometer: formState.odometerValue,
                    timestamp,
                    username: savedUser,
                    serviceRequired,
                    reviewRequired,
                    tyreRotationRequired,
                }),
            });

            const taskResult = await createTaskResponse.json();


            if (!taskResult.success) {
                throw new Error(taskResult.error || 'Failed to create task');
            }

            if (taskResult.success && taskResult.taskId) {
                await client.models.TaskTable.create({
                    vehicleReg: formState.selectedVehicleReg,
                    taskType: "rotation",
                    clickupTaskId: taskResult.taskId,
                });
            }
        }
    }

    return { serviceRequired, tyreRotationRequired, reviewRequired };
};