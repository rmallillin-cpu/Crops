import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 480,
      color: { dark: "#172E7C", light: "#F8F9FC" },
    });
    return NextResponse.json({ ok: true, dataUrl });
  } catch (err) {
    return NextResponse.json({ error: "Could not generate QR code." }, { status: 500 });
  }
}
