import { NextRequest, NextResponse } from "next/server";
import * as constants from "@/app/constants";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File;
    const taskId = formData.get("taskId") as string;
    


    if (!file || !taskId ) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    

    const attachmentFormData = new FormData();
    attachmentFormData.append(
      'attachment',
      new Blob([fileBuffer], { type: file.type }),
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
    console.error('Error uploading photo:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

