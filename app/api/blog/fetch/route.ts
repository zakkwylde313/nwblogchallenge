import { NextRequest, NextResponse } from "next/server"
import { getBlogPostsForCampus, getScriptStatus } from "@/lib/blog-fetcher"
import { getCampusById } from "@/lib/db"
import { adminAuth } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    // 개발 환경에서는 인증을 건너뛰도록 수정
    if (process.env.NODE_ENV === 'development') {
      // 인증 검증 건너뛰기 (개발 환경에서만)
      console.log("개발 환경에서 인증 검증을 건너뜁니다.");
    } else {
      // 프로덕션 환경에서는 인증 확인
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
    }
    
    // 요청 본문 파싱
    const body = await request.json()
    const { campusId } = body
    
    if (!campusId) {
      return NextResponse.json({ error: "campusId가 필요합니다" }, { status: 400 })
    }
    
    // 캠퍼스 정보 가져오기
    const campus = await getCampusById(campusId)
    
    if (!campus) {
      return NextResponse.json({ error: "캠퍼스를 찾을 수 없습니다" }, { status: 404 })
    }
    
    // 블로그 포스트 가져오기
    const result = await getBlogPostsForCampus(campusId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("블로그 포스트 가져오기 오류:", error)
    return NextResponse.json(
      { error: `서버 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}

// 스크립트 상태 확인 API
export async function GET(request: NextRequest) {
  try {
    // 개발 환경에서는 인증을 건너뛰도록 수정
    if (process.env.NODE_ENV === 'development') {
      // 인증 검증 건너뛰기 (개발 환경에서만)
      console.log("개발 환경에서 인증 검증을 건너뜁니다.");
    } else {
      // 프로덕션 환경에서는 인증 확인
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
    }
    
    // 스크립트 상태 가져오기
    const status = await getScriptStatus()
    
    return NextResponse.json(status)
  } catch (error) {
    console.error("스크립트 상태 확인 오류:", error)
    return NextResponse.json(
      { error: `서버 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
} 