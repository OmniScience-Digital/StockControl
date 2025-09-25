import * as constants from "@/app/constants";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${constants.baseUrl}/clickuppost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const externalResponse = await response.json();

    // ✅ Check if task object exists instead of message
    if (!externalResponse || Object.keys(externalResponse).length === 0) {
      throw new Error("Backend returned no data");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Task created successfully",
        data: externalResponse,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Error posting to ClickUp:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to publish to ClickUp: " + (error as Error).message,
        data: null,
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
