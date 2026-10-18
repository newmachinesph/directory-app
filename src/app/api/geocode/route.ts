import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache for 1 hour
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.[0]) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;
    const formatted = result.formatted_address;

    // Extract city and state from address components
    const components = result.address_components as Array<{ long_name: string; short_name: string; types: string[] }>;
    const city = components.find(c => c.types.includes("locality"))?.long_name || "";
    const state = components.find(c => c.types.includes("administrative_area_level_1"))?.short_name || "";

    return NextResponse.json({ lat, lng, formatted, city, state });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
