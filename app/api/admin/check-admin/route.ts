import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

// 관리자 권한 확인 API 엔드포인트
export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: "인증 토큰이 제공되지 않았습니다." }, { status: 400 })
    }

    // Firebase Admin SDK를 사용하여 토큰 검증
    const decodedToken = await adminAuth.verifyIdToken(idToken)

    // 관리자 권한 확인 (커스텀 클레임 또는 이메일 기반)
    const isAdmin =
      decodedToken.admin === true ||
      ["admin@eie-gyeonggi.org", "admin2@eie-gyeonggi.org"].includes(decodedToken.email || "")

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error("관리자 권한 확인 오류:", error)
    return NextResponse.json({ error: "인증 토큰 검증 중 오류가 발생했습니다." }, { status: 401 })
  }
}
