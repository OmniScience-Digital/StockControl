import * as constants from "@/app/constants";
import { NextResponse } from "next/server";

export const maxBodySize = '50mb';

export async function POST(req: Request) {
  try {
    // Extract the raw body (form-data)
    const formData = await req.formData();

    const response = await fetch(`${constants.securebaseUrltest}/vifclickup`, {
      method: "POST",
      body: formData, // send same FormData forward
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const externalResponse = await response.json();

    return NextResponse.json(
      {
        success: true,
        message: "Task created successfully",
        data: externalResponse,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error posting to ClickUp:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to publish to ClickUp: " + (error as Error).message,
        data: null,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
