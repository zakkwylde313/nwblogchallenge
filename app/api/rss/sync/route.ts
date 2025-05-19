import { NextResponse } from "next/server"
import { syncCampusRssFeed } from "@/lib/rss-parser"
import { adminAuth } from "@/lib/firebase-admin"
import { getCampusById, updateCampus } from "@/lib/db"

// RSS 피드 동기화 API 엔드포인트
export async function POST(request: Request) {
  try {
    console.log("RSS 동기화 API 요청 시작")

    // 인증 확인
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("인증 헤더 누락 또는 잘못된 형식")
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]

    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
      console.log("토큰 검증 성공:", decodedToken.email)
    } catch (error) {
      console.error("토큰 검증 오류:", error)
      return NextResponse.json(
        {
          error: "유효하지 않은 인증 토큰입니다.",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 401 },
      )
    }

    // 관리자 권한 확인
    const isAdmin =
      decodedToken.admin === true ||
      ["admin@eie-gyeonggi.org", "admin2@eie-gyeonggi.org"].includes(decodedToken.email || "")

    if (!isAdmin) {
      console.log("관리자 권한 없음:", decodedToken.email)
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
    }

    // 요청 데이터 파싱
    let campusId, feedUrl
    try {
      const body = await request.json()
      campusId = body.campusId
      feedUrl = body.feedUrl
      console.log(`요청 본문 파싱 성공: campusId=${campusId}, feedUrl=${feedUrl}`)
    } catch (error) {
      console.error("요청 본문 파싱 오류:", error)
      return NextResponse.json(
        {
          error: "요청 본문을 파싱할 수 없습니다.",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 },
      )
    }

    if (!campusId || !feedUrl) {
      console.log("필수 파라미터 누락")
      return NextResponse.json({ error: "캠퍼스 ID와 피드 URL이 필요합니다." }, { status: 400 })
    }

    // 캠퍼스 존재 확인
    let campus
    try {
      campus = await getCampusById(campusId)
      if (!campus) {
        console.log(`캠퍼스 ID ${campusId}를 찾을 수 없음`)
        return NextResponse.json({ error: "캠퍼스를 찾을 수 없습니다." }, { status: 404 })
      }
      console.log(`캠퍼스 조회 성공: ${campus.name}`)
    } catch (error) {
      console.error("캠퍼스 조회 오류:", error)
      return NextResponse.json(
        {
          error: "캠퍼스 정보를 조회하는 중 오류가 발생했습니다.",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    // RSS 피드 동기화
    try {
      console.log(`RSS 피드 동기화 시작: 캠퍼스 ID ${campusId}, URL ${feedUrl}`)
      const result = await syncCampusRssFeed(campusId, feedUrl)

      // 오류 확인
      if (result.error) {
        console.error(`RSS 피드 동기화 오류: ${result.error}`)
        return NextResponse.json(
          {
            error: result.error,
            added: result.added,
            skipped: result.skipped,
          },
          { status: 500 },
        )
      }

      // 캠퍼스 RSS 피드 URL 업데이트
      try {
        await updateCampus(campusId, { feedUrl })
        console.log(`캠퍼스 feedUrl 업데이트 성공: ${feedUrl}`)
      } catch (updateError) {
        console.error("캠퍼스 업데이트 오류:", updateError)
        // 업데이트 실패해도 동기화 결과는 반환
      }

      console.log(`RSS 동기화 완료: ${result.added}개 추가, ${result.skipped}개 건너뜀`)
      return NextResponse.json(
        {
          success: true,
          added: result.added,
          skipped: result.skipped,
          message: `${result.added}개의 새 포스트가 추가되었습니다. ${result.skipped}개의 포스트가 이미 존재합니다.`,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    } catch (error) {
      console.error("RSS 동기화 처리 오류:", error)
      return NextResponse.json(
        {
          error: "RSS 피드 동기화 중 오류가 발생했습니다.",
          details: error instanceof Error ? error.message : String(error),
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }
  } catch (error) {
    console.error("RSS 동기화 API 오류:", error)
    return NextResponse.json(
      {
        error: "알 수 없는 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
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
