   

// export async function POST(req: Request) {
//   try {
//     // Extract the raw body (form-data)
//     const formData = await req.formData();

//     const response = await fetch(`${constants.securebaseUrltest}/vifclickup`, {
//       method: "POST",
//       body: formData, // send same FormData forward
//       cache: "no-store",
//     });

//     if (!response.ok) {
//       throw new Error(`Backend returned ${response.status}`);
//     }

//     const externalResponse = await response.json();

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Task created successfully",
//         data: externalResponse,
//       },
//       { status: 200, headers: { "Cache-Control": "no-store" } }
//     );
//   } catch (error) {
//     console.error("Error posting to ClickUp:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to publish to ClickUp: " + (error as Error).message,
//         data: null,
//       },
//       { status: 500, headers: { "Cache-Control": "no-store" } }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { DateTime } from 'luxon';

const API_TOKEN = 'pk_230674953_NCM5RWFNCTW278728K0DP79NHZNII0HN';
const LIST_ID = '901213458480';
const USERNAME_FIELD_ID = 'daf6f996-8096-473b-b9e4-9e20f4568d63';



export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Extract ALL data in one request
    const photos = formData.getAll("photos") as File[];
    const vehicleId = formData.get("vehicleId") as string;
    const vehicleReg = formData.get("vehicleReg") as string;
    const odometer = formData.get("odometer") as string;
    const username = formData.get("username") as string;

    console.log(`Processing ${photos.length} photos for vehicle ${vehicleReg}`);

    // Extract inspection results
    const inspectionResults: Array<{question: string; answer: string}> = [];
    let index = 0;
    
    while (formData.get(`inspectionResults[${index}][question]`)) {
      const question = formData.get(`inspectionResults[${index}][question]`) as string;
      const answer = formData.get(`inspectionResults[${index}][answer]`) as string;
      
      inspectionResults.push({ 
        question, 
        answer 
      });
      index++;
    }

    // Validation
    if (!photos || photos.length === 0) {
      return NextResponse.json({ message: 'No photos uploaded' }, { status: 400 });
    }

    // Format inspection questions
    const questionLines = inspectionResults.length > 0
      ? inspectionResults
          .map(
            (item, index) =>
              `${index + 1}. ${item.question}\nAnswer: ${item.answer === 'true' ? 'Yes' : ' No'}`
          )
          .join('\n\n')
      : 'No inspection results provided.';

    // Create ONE ClickUp task
    const timestamp = getJhbTimestamp();

    const body = {
      name: `Vehicle Inspection - ${vehicleReg} ${timestamp}`,
      description: `Vehicle Reg: ${vehicleReg}\nVehicle ID: ${vehicleId}\nOdometer: ${odometer}\n\nInspection Results:\n\n${questionLines}`,
      custom_fields: [
        {
          id: USERNAME_FIELD_ID,
          value: normalize(username || ''),
        },
      ],
      status: 'to do',
    };

    // Create task in ClickUp
    const createTask = await fetch(`https://api.clickup.com/api/v2/list/${LIST_ID}/task`, {
      method: 'POST',
      headers: {
        Authorization: API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const taskData = await createTask.json();

    if (!taskData.id) {
      console.error('Failed to create ClickUp task', taskData);
      return NextResponse.json({ success: false, error: 'Failed to create ClickUp task' }, { status: 500 });
    }

    const taskId = taskData.id;
    console.log(`Created ClickUp task: ${taskId} for vehicle ${vehicleReg}`);

    // Upload ALL photos to the SAME task
    const uploadedResults: any[] = [];

    for (const file of photos) {
      const fileBuffer = await file.arrayBuffer();
      const attachmentFormData = new FormData();
      
      attachmentFormData.append(
        'attachment',
        new Blob([fileBuffer], { type: file.type }),
        file.name
      );

      const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/attachment`, {
        method: 'POST',
        headers: {
          Authorization: API_TOKEN,
        },
        body: attachmentFormData,
      });

      const result = await response.json();
      uploadedResults.push(result);

      console.log(`📎 Uploaded ${file.name} to ClickUp task ${taskId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'VIF task created and photos uploaded successfully',
      taskId,
      uploadedCount: uploadedResults.length,
      results: uploadedResults,
    });

  } catch (error: any) {
    console.error('Error uploading to ClickUp', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Helper functions remain the same
function getJhbTimestamp() {
  return DateTime.now().setZone('Africa/Johannesburg').toFormat('yyyy-MM-dd HH:mm:ss');
}

function normalize(str: any) {
  if (typeof str !== 'string') return String(str);
  return str.trim().replace(/^"+|"+$/g, '');
}