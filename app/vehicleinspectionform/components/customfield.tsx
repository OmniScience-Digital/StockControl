export const calculateCustomFields = async (formState: any, vehicles: any[]) => {
    const vehicle = vehicles.find(v => v.id === formState.selectedVehicleId);
    if (!vehicle) throw new Error("Vehicle not found");

    const odometer = parseInt(formState.odometerValue);
    const today = new Date();
    const lastServiceDate = new Date(vehicle.lastServicedate);
    
    // Service Required
    const serviceRequired = 
        odometer > (Number(vehicle.lastServicekm) + 11999) || 
        today > new Date(lastServiceDate.getTime() + (334 * 24 * 60 * 60 * 1000));

    // Tyre Rotation Required
    const tyreRotationRequired = 
        vehicle.lastRotationkm && odometer > (Number(vehicle.lastRotationkm) + 7000);

    // Review Required - check if any question fails
    const reviewRequired = formState.booleanQuestions.some((q: any) => {
        const question = q.question.toLowerCase();
        const value = q.value;

        if (question.includes('oil and coolant')) return !value;
        if (question.includes('full tank')) return !value;
        if (question.includes('seatbelt')) return !value;
        if (question.includes('handbrake')) return !value;
        if (question.includes('tyre') && question.includes('wear')) return !value;
        if (question.includes('spare tyre')) return !value;
        if (question.includes('number plate')) return !value;
        if (question.includes('license disc')) return !value;
        if (question.includes('leaks')) return value; // Should be false
        if (question.includes('light')) return !value;
        if (question.includes('defrost') || question.includes('air condition')) return !value;
        if (question.includes('emergency kit')) return !value;
        if (question.includes('clean')) return !value;
        if (question.includes('warning light')) return value; // Should be false
        if (question.includes('windscreen wiper')) return !value;
        if (question.includes('service book')) return !value;
        
        return false;
    });

    //create task table and handle it

    return { serviceRequired, tyreRotationRequired, reviewRequired };
};



