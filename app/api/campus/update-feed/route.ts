import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

// 이 API는 더 이상 RSS 피드 URL을 업데이트하는 데 사용되지 않습니다.
// 대신 로컬에서 실행하는 runDailyUpdateLocally.js 스크립트를 사용합니다.

export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다" }, { status: 401 })
    }
    
    const token = authHeader.split("Bearer ")[1]
    
    try {
      await adminAuth.verifyIdToken(token)
    } catch (authError) {
      console.error("인증 오류:", authError)
      return NextResponse.json({ error: "유효하지 않은 인증 토큰입니다" }, { status: 403 })
    }
    
    // 사용자에게 로컬 스크립트 사용 안내 메시지 제공
    return NextResponse.json({
      success: false,
      message: "이 API는 더 이상 사용되지 않습니다. 대신 'runDailyUpdateLocally.js' 스크립트를 로컬에서 실행하여 블로그 데이터를 업데이트하세요.",
      localScriptInfo: {
        path: "./runDailyUpdateLocally.js",
        description: "이 스크립트는 로컬에서 블로그 정보를 스크래핑하여 Firebase에 저장합니다.",
        howToRun: "node runDailyUpdateLocally.js"
      }
    }, { status: 200 })
    
  } catch (error) {
    console.error("API 요청 오류:", error)
    return NextResponse.json(
      { error: `서버 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
} 