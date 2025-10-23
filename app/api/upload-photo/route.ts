import { NextRequest, NextResponse } from "next/server";
import * as constants from "@/app/constants";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File;
    const taskId = formData.get("taskId") as string;
    const timestamp = formData.get("timestamp") as string;

    
    if (!file || !taskId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing file or taskId' 
      }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const attachmentFormData = new FormData();
    
    attachmentFormData.append(
      'attachment',
      new Blob([fileBuffer], { type: file.type }),
      file.name
    );

    // taskId in the URL
    const uploadResponse = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/attachment`, {
      method: 'POST',
      headers: {
        Authorization: constants.API_TOKEN,
      },
      body: attachmentFormData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload attachment: ${file.name}`);
    }

    const result = await uploadResponse.json();

    return NextResponse.json({
      success: true,
      message: `Uploaded ${file.name} successfully`,
      data: result
    });

  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}