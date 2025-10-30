import * as constants from "@/app/constants";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { taskId, timestamp } = await req.json();

    // Get current task to preserve the base title
    const getTaskResponse = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: constants.API_TOKEN,
      },
    });

    const existingTask = await getTaskResponse.json();
    
    // Extract base title without timestamp (remove everything after last comma)
    const currentName = existingTask.name || '';
    const baseTitle = currentName.split(',')[0].trim();
    
    // Update with new timestamp
    const updateBody = {
      name: `${baseTitle} , ${timestamp}`,
    };

    const updateResponse = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      method: 'PUT',
      headers: {
        Authorization: constants.API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    });

    const updateData = await updateResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Task name updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating task name:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}