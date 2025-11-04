// amplify/storage.ts

import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'inspectionStorage',
  access: (allow) => ({
    // For inspection images - organized by vehicle reg and date
    "inspections/*": [
      allow.authenticated.to(['read', 'write', 'delete']), 
      allow.guest.to(['read', 'write'])
    ],
    // For break and lux test PDFs
    "documents/*": [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read', 'write'])
    ],
    // specific HR paths for better organization
    "hr/employees/{employeeId}/documents/*": [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read', 'write'])
    ],
    "hr/employees/{employeeId}/certificates/*": [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read', 'write'])
    ]
  })
});


// inspections/
//   ├── VIN123456/
//   │   ├── 2024-01-15/
//   │   │   ├── front.jpg
//   │   │   └── interior.jpg
//   │   └── 2024-02-01/
//   │       ├── front.jpg
//   │       └── tires.jpg

// documents/
//   ├── fleet/
//   │   ├── break-lux-tests/
//   │   │   └── VIN123456_2024-12.pdf
//   │   └── service-records/
//   │       └── VIN123456_service.pdf
//   └── hr/                          # New HR section
//       ├── employees/
//       │   ├── EMP001/
//       │   │   ├── passport.pdf
//       │   │   ├── drivers_license.pdf
//       │   │   └── cv.pdf
//       │   └── EMP002/
//       │       ├── passport.pdf
//       │       └── license.pdf
//       └── certificates/
//           ├── EMP001/
//           │   ├── medical_clinic_plus.pdf
//           │   ├── training_firefighting.pdf
//           │   └── additional_safety_course.pdf
//           └── EMP002/
//               ├── medical_heartly.pdf
//               └── training_first_aid.pdf