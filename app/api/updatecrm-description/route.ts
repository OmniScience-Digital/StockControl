import * as constants from "@/app/constants";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File;
    const taskId = formData.get("taskId") as string;
    const newExpiry = formData.get("newExpiry") as string;
    const username = formData.get("savedUser") as string;
    const taskType = formData.get("taskType") as string;
    const certificateName = formData.get("certificateName") as string;

    if (!taskId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing taskId' 
      }, { status: 400 });
    }

    console.log('Processing task update:', { taskId, newExpiry, username, taskType, certificateName });

    // 1. Get the current task details from ClickUp
    const getTaskResponse = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: constants.API_TOKEN,
      },
    });

    if (!getTaskResponse.ok) {
      throw new Error(`Failed to fetch task: ${getTaskResponse.status}`);
    }

    const existingTask = await getTaskResponse.json();
    const currentDescription = existingTask.description || '';
    
    // 2. Build the updated description
    const timestamp = new Date().toLocaleString("en-ZA", { 
      timeZone: "Africa/Johannesburg" 
    });
    
    let updatedDescription = currentDescription;
    
    // Add update section if not already there
    const updateSection = `\n\n--- COMPLIANCE UPDATE ---\n` +
      `📅 Certificate Updated: ${certificateName || 'Unknown Certificate'}\n` +
      `🔄 Updated Expiry: ${newExpiry || 'No expiry date'}\n` +
      `👤 Updated by: ${username || 'Unknown User'}\n` +
      `📝 Via: Personnel Dashboard\n` +
      `⏰ Update Time: ${timestamp}\n`;
    
    updatedDescription += updateSection;

    // 3. Update the task description and mark as complete
    const updateBody = {
      name: existingTask.name,
      description: updatedDescription,
      status: 'complete', // Mark task as complete
    };

    const updateResponse = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      method: 'PUT',
      headers: {
        Authorization: constants.API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update task: ${updateResponse.status}`);
    }

    const updateResult = await updateResponse.json();
    console.log('Task updated successfully:', updateResult.id);

    // 4. Upload attachment if provided
    let attachmentResult = null;
    if (file && file.size > 0) {
      const attachmentFormData = new FormData();
      attachmentFormData.append('attachment', file, file.name);

      const uploadResponse = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/attachment`, {
        method: 'POST',
        headers: {
          Authorization: constants.API_TOKEN,
        },
        body: attachmentFormData,
      });

      if (uploadResponse.ok) {
        attachmentResult = await uploadResponse.json();
        console.log('Attachment uploaded:', file.name);
      } else {
        console.warn('Failed to upload attachment, but task was updated');
      }
    }

    // 5. Log the update
    console.log(' Task completed successfully:', {
      taskId,
      taskType,
      certificateName,
      newExpiry,
      username,
      timestamp,
      hasAttachment: !!(file && file.size > 0)
    });

    return NextResponse.json({
      success: true,
      message: `Task ${taskId} updated and marked as complete`,
      data: {
        task: updateResult,
        attachment: attachmentResult
      }
    });

  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error',
      details: error.toString()
    }, { status: 500 });
  }
}