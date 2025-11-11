import * as constants from "@/app/constants";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File; // Use "photo" like your working API
    const taskId = formData.get("taskId") as string;
    const newExpiry = formData.get("newExpiry") as string;

    if (!file || !taskId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // First update the task description with new expiry
    if (newExpiry) {
      const getTaskResponse = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
        method: 'GET',
        headers: {
          Authorization: constants.API_TOKEN,
        },
      });

      const existingTask = await getTaskResponse.json();
      const currentDescription = existingTask.description || '';
      const updatedDescription = `${currentDescription}\nUpdated Expiry: ${newExpiry}`;

      const updateBody = {
        name: existingTask.name,
        description: updatedDescription,
        status: 'complete',
      };

      await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
        method: 'PUT',
        headers: {
          Authorization: constants.API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBody),
      });
    }

    // Then upload the file attachment - EXACTLY like your working upload-photo API
    const attachmentFormData = new FormData();
    attachmentFormData.append(
      'attachment',
      file, // Use the file directly
      file.name
    );

    const uploadResponse = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/attachment`, {
      method: 'POST',
      headers: {
        Authorization: constants.API_TOKEN,
      },
      body: attachmentFormData,
    });

    const clickUpResult = await uploadResponse.json();

    return NextResponse.json({
      success: true,
      message: `Uploaded ${file.name} successfully`,
      data: {
        clickUp: clickUpResult
      }
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}