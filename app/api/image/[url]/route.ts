import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ url: string }> }) {
  try {
    const url = (await params).url;
    const imageUrl = decodeURIComponent(url); // Decode the image URL

    // Fetch the image
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("Failed to fetch image");

    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }
}