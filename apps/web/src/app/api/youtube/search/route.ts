// apps/web/src/app/api/youtube/search/route.ts

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SERVER_URL =
  process.env.SERVER_URL ||
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "http://localhost:3001";

interface ProxyResponse {
  results?: unknown[];
  message?: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      {
        results: [],
        message: "Query parameter q is required",
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${SERVER_URL}/youtube/search?q=${encodeURIComponent(query)}`,
      {
        cache: "no-store",
      },
    );
    const payload = (await response.json()) as ProxyResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          results: [],
          message: payload.message || "Failed to search YouTube",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      results: payload.results || [],
    });
  } catch (error) {
    console.error("YouTube search proxy error:", error);
    return NextResponse.json(
      {
        results: [],
        message: "Could not reach the music server",
      },
      { status: 502 },
    );
  }
}
