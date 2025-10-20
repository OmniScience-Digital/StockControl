import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Boolean questions array
export const booleanQuestions = [
  {
    question: "Are the engine oil and Coolant Level Acceptable?",
    value: null as boolean | null
  },
  {
    question: "Is there a full tank of Fuel?",
    value: null
  },
  {
    question: "Are the Seatbelts, Doors and Mirror's Functioning Correctly?",
    value: null
  },
  {
    question: "Is the handbrake Tested and Functional?",
    value: null
  },
  {
    question: "Are all the Tyres wear, Tread, and Pressure Acceptable?",
    value: null
  },
  {
    question: "Is there a Spare tyre, jack, Spanner on the vehicle and in good condition?",
    value: null
  },
  {
    question: "Is there a valid number plate on the Front and Back of the vehicle?",
    value: null
  },
  {
    question: "Is the License Disc Clearly Visible in the windscreen?",
    value: null
  },
  {
    question: "Is there any signs of leaks under the vehicle prior to start?",
    value: null
  },
  {
    question: "Are the headlights, Taillights, Fog Lights, indicators and hazards functioning correctly?",
    value: null
  },
  {
    question: "Are the defrosters, heaters and air conditioners functional?",
    value: null
  },
  {
    question: "Is the Emergency Kit within the Vehicle?",
    value: null
  },
  {
    question: "Is the car interior and Exterior Clean?",
    value: null
  },
  {
    question: "Are there any warning Lights present on the Dash at start up?",
    value: null
  },
  {
    question: "Are the Windscreen Wipers in working condition?",
    value: null
  },
  {
    question: "Is the Service book within the vehicle?",
    value: null
  },
  {
    question: "Is there Reflectors, Buggy Whip, Strobe Light within the Vehicle?",
    value: null
  }
];

// Boolean Question Component
export const BooleanQuestion = ({ question, value, onChange }: {
  question: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between p-3 border rounded-lg">
    <span className="text-sm flex-1">{question}</span>
    <div className="flex gap-2">
      <Button 
      
        type="button" 
        variant={value === true ? "default" : "outline"} 
        size="sm"
        onClick={() => onChange(true)}
      >
        Yes
      </Button>
      <Button 
        type="button" 
        variant={value === false ? "destructive" : "outline"} 
        size="sm"
        onClick={() => onChange(false)}
      >
        No
      </Button>
    </div>
  </div>
);


interface PhotoUploadProps {
    onPhotosChange: (photos: File[]) => void;
}

export const PhotoUpload = ({ onPhotosChange }: PhotoUploadProps) => {
    const [photos, setPhotos] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setIsUploading(true);
        
        setTimeout(() => {
            const newPhotos = Array.from(files).slice(0, 20 - photos.length);
            const updatedPhotos = [...photos, ...newPhotos];
            setPhotos(updatedPhotos);
            onPhotosChange(updatedPhotos); // Call callback directly
            setIsUploading(false);
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }, 100);
    };

    const removePhoto = (index: number) => {
        const updatedPhotos = photos.filter((_, i) => i !== index);
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos); // Call callback directly
    };

    return (
        <div className="space-y-4">
            <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
            />
            
            <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= 20 || isUploading}
                className="w-full"
            >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : `Upload Photos (${photos.length}/20)`}
            </Button>

            {photos.length > 0 && (
                <div className="space-y-2">
                    <div className="flex gap-4 overflow-x-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {photos.map((photo, index) => (
                            <div 
                                key={index} 
                                className="flex-shrink-0 w-32 h-32 relative border rounded-lg p-2"
                            >
                                <img
                                    src={URL.createObjectURL(photo)}
                                    alt={`Upload ${index + 1}`}
                                    className="w-full h-full object-cover rounded"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6"
                                    onClick={() => removePhoto(index)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                        {photos.length} photo(s) uploaded • Scroll horizontally to view more
                    </div>
                </div>
            )}
        </div>
    );
};