import { NextResponse } from "next/server"

// RSS 피드 URL 유효성 검사 API 엔드포인트
export async function POST(request: Request) {
  try {
    // 요청 데이터 파싱
    const { feedUrl } = await request.json()

    if (!feedUrl) {
      return NextResponse.json({ error: "피드 URL이 필요합니다." }, { status: 400 })
    }

    // URL 형식 검사
    try {
      new URL(feedUrl)
    } catch (error) {
      return NextResponse.json({ valid: false, message: "유효하지 않은 URL 형식입니다." })
    }

    // RSS 피드 가져오기 시도
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃

      const response = await fetch(feedUrl, {
        headers: {
          "User-Agent": "EiE-Blog-Challenge/1.0",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json({
          valid: false,
          message: `피드를 가져올 수 없습니다: ${response.status} ${response.statusText}`,
        })
      }

      const contentType = response.headers.get("content-type")
      const isXml =
        contentType && (contentType.includes("xml") || contentType.includes("rss") || contentType.includes("atom"))

      if (!isXml) {
        return NextResponse.json({
          valid: false,
          message: `XML 형식이 아닙니다. 콘텐츠 타입: ${contentType}`,
        })
      }

      // 간단한 내용 확인
      const text = await response.text()
      const hasRssTag = text.includes("<rss") || text.includes("<feed")

      if (!hasRssTag) {
        return NextResponse.json({
          valid: false,
          message: "RSS 또는 Atom 피드 형식이 아닙니다.",
        })
      }

      return NextResponse.json({
        valid: true,
        message: "유효한 RSS 피드입니다.",
      })
    } catch (error) {
      return NextResponse.json({
        valid: false,
        message: `피드 검증 오류: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        message: `요청 처리 오류: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
