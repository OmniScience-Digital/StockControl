import * as constants from "@/app/constants";
import { normalize } from "@/utils/helper/time";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const { vehicleId, vehicleReg, odometer, username, inspectionResults,timestamp,inspectionNo } = await req.json();

    // Format inspection questions
    const questionLines = inspectionResults.length > 0
      ? inspectionResults
          .map(
            (item: any, index: number) =>
              `${index + 1}. ${item.question}\nAnswer: ${item.answer === 'true' ? 'Yes' : 'No'}`
          )
          .join('\n\n')
      : 'No inspection results provided.';


    const taskBody = {
      name: `Vehicle Inspection - ${vehicleReg} ${timestamp}`,
      description: `Inspection No: ${inspectionNo}\nVehicle Reg: ${vehicleReg}\nVehicle ID: ${vehicleId}\nOdometer: ${odometer}\nUsername: ${username}\n\nInspection Results:\n\n${questionLines}`,
      custom_fields: [
        {
          id: constants.USERNAME_FIELD_ID,
          value: normalize(username || ''),
        },
      ],
      status: 'to do',
    };

    const createTaskResponse = await fetch(`https://api.clickup.com/api/v2/list/${constants.LIST_ID}/task`, {
      method: 'POST',
      headers: {
        Authorization: constants.API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskBody),
    });

    const taskData = await createTaskResponse.json();

    if (!taskData.id) {
      console.error('Failed to create ClickUp task', taskData);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create ClickUp task',
        details: taskData 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      taskId: taskData.id,
      message: 'ClickUp task created successfully',
    });

  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

