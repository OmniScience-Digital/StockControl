import * as constants from "@/app/constants";
import { NextRequest, NextResponse } from "next/server";
import { DateTime } from 'luxon';

export async function POST(req: NextRequest) {
  try {
    const { vehicleId, vehicleReg, odometer, username, inspectionResults } = await req.json();

    // Format inspection questions
    const questionLines = inspectionResults.length > 0
      ? inspectionResults
          .map(
            (item: any, index: number) =>
              `${index + 1}. ${item.question}\nAnswer: ${item.answer === 'true' ? 'Yes' : 'No'}`
          )
          .join('\n\n')
      : 'No inspection results provided.';

    // Create ClickUp task with your original datetime format
    const timestamp = getJhbTimestamp();

    const taskBody = {
      name: `Vehicle Inspection - ${vehicleReg} ${timestamp}`,
      description: `Vehicle Reg: ${vehicleReg}\nVehicle ID: ${vehicleId}\nOdometer: ${odometer}\nUsername: ${username}\n\nInspection Results:\n\n${questionLines}`,
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

// Your original helper functions
function getJhbTimestamp(): string {
  return DateTime.now().setZone('Africa/Johannesburg').toFormat('yyyy-MM-dd HH:mm:ss');
}

function normalize(str: any): string {
  if (typeof str !== 'string') return String(str);
  return str.trim().replace(/^"+|"+$/g, '');
}