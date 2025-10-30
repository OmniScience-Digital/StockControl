import * as constants from "@/app/constants";
import { normalize } from "@/utils/helper/time";
import { NextRequest, NextResponse } from "next/server";



export async function POST(req: NextRequest) {
  try {
    const { issuetype, title, servicePlanStatus, lastRotationdate, lastRotationkm, servicePlan, lastServiceDate, lastServicekm, vehicleReg, odometer, username, serviceRequired, reviewRequired, tyreRotationRequired, vehicleVin } = await req.json();

    let description = '';

    if (issuetype === "service") {
      description = `Vehicle Reg: ${vehicleReg}\nVehicle Vin: ${vehicleVin}\nService Plan Status: ${servicePlanStatus}\nService Plan: ${servicePlan}\nPrevious Service km: ${lastServicekm}\nPrevious Service Date: ${lastServiceDate}\nCurrent Driver: ${username}\nCurrent Km: ${odometer}`;
    }
    else if (issuetype === "rotation") {
      description = `Vehicle Reg: ${vehicleReg}\nVehicle Vin: ${vehicleVin}\nService Plan Status: ${servicePlanStatus}\nService Plan: ${servicePlan}\nPrevious Rotation km: ${lastRotationkm}\nPrevious Rotation Date: ${lastRotationdate}\nCurrent Driver: ${username}\nCurrent Km: ${odometer}`;
    }

    const taskBody = {
      name: `${title}`,
      description: description,
      custom_fields: [
        {
          id: constants.USERNAME_FIELD_ID,
          value: normalize(username || ''),
        },
        {
          id: constants.SERVICE_FIELD_ID,
          value: normalize(serviceRequired),
        },
        {
          id: constants.TYRE_FIELD_ID,
          value: normalize(tyreRotationRequired),
        },
        {
          id: constants.REVIEW_FIELD_ID,
          value: normalize(reviewRequired),
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

