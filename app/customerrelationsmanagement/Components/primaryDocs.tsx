import { Employee } from "@/types/hrd.types";
import { useEffect } from "react";

interface PrimaryDocProps {
    employees: Employee[];
    complianceData: any;
}

export default function PrimaryDoc({ employees, complianceData }: PrimaryDocProps) {

    const getEmployeeRequirements = (employeeId: string): string[] => {
        if (!complianceData?.employeeLookup) return [];

        try {
            const lookup = JSON.parse(complianceData.employeeLookup);
            return lookup[employeeId] || [];
        } catch (error) {
            console.error("Error parsing employee lookup:", error);
            return [];
        }
    };
    useEffect(() => {
        console.log(employees);
        console.log(complianceData);
    }, [])

    return (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

        </div>
    );
}