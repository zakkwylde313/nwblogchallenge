import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

// 관리자 계정 생성 API 엔드포인트
// 실제 구현에서는 보안을 위해 추가적인 인증 및 권한 검사가 필요합니다
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 이메일 형식 검증
    if (!email || !email.includes("@") || !password || password.length < 6) {
      return NextResponse.json({ error: "유효하지 않은 이메일 또는 비밀번호입니다." }, { status: 400 })
    }

    // Firebase Admin SDK를 사용하여 사용자 생성
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true, // 이메일 인증 완료 상태로 설정
    })

    // 사용자에게 관리자 커스텀 클레임 추가
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true })

    return NextResponse.json({ success: true, uid: userRecord.uid })
  } catch (error: any) {
    console.error("관리자 계정 생성 오류:", error)

    // Firebase 오류 처리
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "이미 존재하는 이메일 주소입니다." }, { status: 400 })
    }

    return NextResponse.json({ error: "관리자 계정 생성 중 오류가 발생했습니다." }, { status: 500 })
  }
}
