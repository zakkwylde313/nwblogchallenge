import { NextRequest, NextResponse } from "next/server";
import { deleteCampus } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "캠퍼스 ID가 필요합니다." }, { status: 400 });
    await deleteCampus(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
} 