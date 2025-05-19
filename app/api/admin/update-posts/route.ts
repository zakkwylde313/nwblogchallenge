import { NextResponse } from "next/server"

// 디버깅 헬퍼 함수
function logError(message: string, error: any) {
  console.error(`[update-posts] ${message}:`, error)
  return `${message}: ${error instanceof Error ? error.message : String(error)}`
}

export async function POST(request: Request) {
  console.log("[update-posts] API 요청 시작")

  try {
    // 1. 기본 응답 테스트 - 가장 간단한 응답부터 시작
    return NextResponse.json(
      { success: true, message: "API 엔드포인트가 정상적으로 동작합니다." },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    // 아래 코드는 기본 응답이 성공하면 주석을 해제하고 단계별로 테스트

    /*
    // 2. 요청 본문 파싱 테스트
    let body
    try {
      body = await request.json()
      console.log("[update-posts] 요청 본문:", body)
    } catch (error) {
      const errorMsg = logError("요청 본문 파싱 오류", error)
      return NextResponse.json(
        { error: "요청 본문을 파싱할 수 없습니다.", details: errorMsg },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // 3. 인증 테스트
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[update-posts] 인증 헤더 누락")
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    const token = authHeader.split("Bearer ")[1]
    console.log("[update-posts] 토큰 추출 완료")

    // 4. Firebase Admin 초기화 테스트
    if (!adminAuth || typeof adminAuth.verifyIdToken !== "function") {
      console.error("[update-posts] Firebase Auth가 초기화되지 않았습니다.")
      return NextResponse.json(
        { error: "서버 구성 오류: 인증 서비스를 사용할 수 없습니다." },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // 5. 토큰 검증 테스트
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
      console.log("[update-posts] 토큰 검증 성공:", decodedToken.email)
    } catch (error) {
      const errorMsg = logError("토큰 검증 오류", error)
      return NextResponse.json(
        { error: "유효하지 않은 인증 토큰입니다.", details: errorMsg },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // 6. Firestore 초기화 테스트
    if (!adminDb || typeof adminDb.collection !== "function") {
      console.error("[update-posts] Firestore가 초기화되지 않았습니다.")
      return NextResponse.json(
        { error: "서버 구성 오류: 데이터베이스 서비스를 사용할 수 없습니다." },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // 7. Firestore 컬렉션 접근 테스트
    try {
      const testRef = adminDb.collection("test")
      console.log("[update-posts] Firestore 컬렉션 접근 성공")
    } catch (error) {
      const errorMsg = logError("Firestore 컬렉션 접근 오류", error)
      return NextResponse.json(
        { error: "데이터베이스 접근 오류", details: errorMsg },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }
    */
  } catch (error) {
    // 최상위 예외 처리
    const errorMsg = logError("API 처리 중 예상치 못한 오류", error)
    console.error("[update-posts] 치명적 오류:", errorMsg)

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details: errorMsg,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
