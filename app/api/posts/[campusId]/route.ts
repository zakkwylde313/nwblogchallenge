import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { getPostsByCampusId } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { campusId: string } }) {
  try {
    console.log(`캠퍼스 ID ${params.campusId}의 포스트 목록 요청 시작`)

    // 인증 확인
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("인증 헤더 누락 또는 잘못된 형식")
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
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // 관리자 권한 확인 - 더 유연하게 처리
    const isAdmin =
      decodedToken.admin === true ||
      ["admin@eie-gyeonggi.org", "admin2@eie-gyeonggi.org"].includes(decodedToken.email || "")

    if (!isAdmin) {
      console.log("관리자 권한 없음:", decodedToken.email)
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // 포스트 목록 가져오기
    try {
      // 캠퍼스 ID 유효성 검사
      if (!params.campusId || typeof params.campusId !== "string") {
        console.error("유효하지 않은 캠퍼스 ID:", params.campusId)
        return NextResponse.json(
          { error: "유효하지 않은 캠퍼스 ID입니다." },
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
      }

      console.log(`Firestore에서 캠퍼스 ID ${params.campusId}의 포스트 조회 시작`)

      // 포스트 가져오기 시도
      let posts
      try {
        posts = await getPostsByCampusId(params.campusId)
        console.log(`캠퍼스 ID ${params.campusId}의 포스트 ${posts.length}개 조회 완료`)
      } catch (dbError) {
        console.error("Firestore 데이터 조회 오류:", dbError)
        return NextResponse.json(
          {
            error: "데이터베이스에서 포스트를 조회하는 중 오류가 발생했습니다.",
            details: dbError instanceof Error ? dbError.message : String(dbError),
          },
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
      }

      // 날짜 필드 직렬화 문제 해결
      const serializedPosts = []

      for (const post of posts) {
        try {
          const serializedPost = {
            ...post,
            date: post.date ? post.date.toMillis() : null,
            publishDate: post.publishDate ? post.publishDate.toMillis() : null,
            scrapedAt: post.scrapedAt ? post.scrapedAt.toMillis() : null,
            createdAt: post.createdAt ? post.createdAt.toMillis() : null,
            updatedAt: post.updatedAt ? post.updatedAt.toMillis() : null,
          }
          serializedPosts.push(serializedPost)
        } catch (serializeError) {
          console.error(`포스트 ID ${post.id} 직렬화 오류:`, serializeError)
          // 오류가 발생한 경우 기본값으로 대체
          serializedPosts.push({
            ...post,
            date: null,
            publishDate: null,
            scrapedAt: null,
            createdAt: null,
            updatedAt: null,
          })
        }
      }

      return NextResponse.json(
        {
          success: true,
          posts: serializedPosts,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    } catch (error) {
      console.error("포스트 목록 조회 오류:", error)
      return NextResponse.json(
        {
          error: "포스트 목록을 조회하는 중 오류가 발생했습니다.",
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
    console.error("API 오류:", error)
    // 모든 예외 상황에서도 JSON 응답 반환
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
