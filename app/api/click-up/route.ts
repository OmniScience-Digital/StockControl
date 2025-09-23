import * as constants from "@/app/constants";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json(); // get data from frontend

    // Forward body to your external backend
    const response = await fetch(`${constants.baseUrl}/clickuppost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), // send the body
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Backend returned ${response.status}`);

    const externalResponse = await response.json();

    if (!externalResponse) throw new Error("Backend returned no data");

    return NextResponse.json(
      {
        success: true,
        data: externalResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error stopping simulator:", error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: (error as Error).message || "Backend unreachable",
      },
      { status: 500 }
    );
  }
}
