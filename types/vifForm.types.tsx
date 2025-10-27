
export interface vifForm {
  id: string;
  vehicleReg: string;
  vehicleVin:string;
}

export interface Fleet {
    id: string;
    vehicleVin: string | null;
    vehicleReg: string | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    transmitionType: string | null;
    ownershipStatus: string | null;
    fleetIndex: string | null;
    fleetNumber: string | null;
    lastServicedate: string | null;
    lastServicekm: number | null;
    lastRotationdate: string | null;
    lastRotationkm: number | null;
    servicePlanStatus: boolean;
    servicePlan: string | null;
    currentDriver: string | null;
    currentkm: number | null;
    codeRequirement: string | null;
    pdpRequirement: boolean;
    breakandLuxTest: string[];
    serviceplankm: number | null;
    breakandLuxExpirey: string | null;
    history: string | null;
}

export interface PrintMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onDownloadCSV: () => void;
    onDownloadPDF: () => void;
    position: { top: number; left: number };
}
