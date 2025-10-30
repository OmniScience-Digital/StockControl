import { client } from "@/services/schema";

export const calculateCustomFields = async (
    formState: any,
    vehicles: any[],
    timestamp: string
) => {
    const savedUser = localStorage.getItem("user");
    const vehicle = vehicles.find(v => v.id === formState.selectedVehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const odometer = parseInt(formState.odometerValue);
    const today = new Date();
    const stringlastServiceDate = vehicle.lastServicedate;
    const lastServiceDate = new Date(vehicle.lastServicedate);



    const fleetno = vehicle.fleetNumber;
    const servicePlanStatus = vehicle.servicePlanStatus;
    const servicePlan = vehicle.servicePlan;
    const lastServicekm = vehicle.lastServicekm;

    const lastRotationdate = vehicle.lastRotationdate;;
    const lastRotationkm = vehicle.lastRotationkm;


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
    //  secondary index query - return the actual tasks data
    const getExistingTasks = async (vehicleReg: string, taskType: "service" | "rotation") => {
        const { data: existingTasks } = await client.models.TaskTable.listTaskTableByVehicleRegAndTaskType({
            vehicleReg: vehicleReg,
            taskType: { eq: taskType }
        });
        return existingTasks || [];
    };

    // --- Service Task ---
     if (serviceRequired) {
    
        const existingServiceTasks = await getExistingTasks(formState.selectedVehicleReg, "service");
        const taskExists = existingServiceTasks.length > 0;

        if (!taskExists) {
            const createTaskResponse = await fetch("/api/customfield-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    issuetype: "service",
                    title: `${fleetno} Service Due , ${timestamp}`,
                    vehicleReg: formState.selectedVehicleReg,
                    vehicleVin: formState.selectedVehicleVin,
                    servicePlanStatus: servicePlanStatus,
                    servicePlan: servicePlan,
                    lastServiceDate: stringlastServiceDate,
                    lastServicekm: lastServicekm,
                    lastRotationdate: lastRotationdate,
                    lastRotationkm: lastRotationkm,
                    odometer: formState.odometerValue,
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
        } else {
            
            //update description with timestamp
            await fetch("/api/update-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    taskId: existingServiceTasks[0].clickupTaskId,
                    timestamp,
                }),
            });
        }
    }

    // --- Tyre Rotation Task ---
     if (tyreRotationRequired) {
    
        const existingRotationTasks = await getExistingTasks(formState.selectedVehicleReg, "rotation");
        const taskExists = existingRotationTasks.length > 0;

        if (!taskExists) {
            const createTaskResponse = await fetch("/api/customfield-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    issuetype: "rotation",
                    title: `${fleetno} Tyre Rotation Due ,${timestamp}`,
                    vehicleReg: formState.selectedVehicleReg,
                    vehicleVin: formState.selectedVehicleVin,
                    servicePlanStatus: servicePlanStatus,
                    servicePlan: servicePlan,
                    lastRotationdate: lastRotationdate,
                    lastRotationkm: lastRotationkm,
                    lastServicekm: lastServicekm,
                    lastServiceDate: stringlastServiceDate,
                    odometer: formState.odometerValue,
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
        } else {
            
            //update description with timestamp
            await fetch("/api/update-description", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    taskId: existingRotationTasks[0].clickupTaskId,
                    timestamp,
                }),
            });
        }
    }
    return { serviceRequired, tyreRotationRequired, reviewRequired };
};