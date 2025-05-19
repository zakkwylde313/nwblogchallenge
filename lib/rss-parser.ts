// 파일 상단에 주석 추가
// 주의: 이 파일은 서버 측에서만 사용됩니다.
// 클라이언트 측에서 직접 import하지 마세요.

import { parseStringPromise } from "xml2js"
import { JSDOM } from "jsdom"
import { Timestamp } from "firebase/firestore"
import { createPost, getPostsByCampusId } from "./db"

// RSS 피드 파싱 결과 타입
export interface ParsedPost {
  title: string
  url: string
  content: string
  date: Date
  wordCount: number
  imageCount: number
}

// 안전한 fetch 함수 - 타임아웃 및 오류 처리 포함
async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15초 타임아웃

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// RSS 피드 파싱 함수
export async function parseRssFeed(feedUrl: string): Promise<ParsedPost[]> {
  try {
    console.log(`RSS 피드 파싱 시작: ${feedUrl}`)

    // RSS 피드 URL 유효성 검사
    if (!feedUrl || !feedUrl.startsWith("http")) {
      throw new Error("유효하지 않은 RSS 피드 URL입니다")
    }

    // RSS 피드 가져오기
    let response
    try {
      response = await safeFetch(feedUrl, {
        headers: {
          "User-Agent": "EiE-Blog-Challenge/1.0",
        },
      })

      if (!response.ok) {
        throw new Error(`RSS 피드를 가져올 수 없습니다: ${response.status} ${response.statusText}`)
      }
    } catch (fetchError) {
      console.error("RSS 피드 가져오기 오류:", fetchError)
      throw new Error(
        `RSS 피드를 가져올 수 없습니다: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
      )
    }

    const contentType = response.headers.get("content-type")
    console.log(`RSS 피드 콘텐츠 타입: ${contentType}`)

    // 응답 본문을 한 번만 읽음
    let xml
    try {
      xml = await response.text()
      console.log(`RSS 피드 내용 가져옴, 길이: ${xml.length} 바이트`)

      if (!xml || xml.trim().length === 0) {
        throw new Error("RSS 피드가 비어 있습니다")
      }
    } catch (textError) {
      console.error("응답 본문 읽기 오류:", textError)
      throw new Error(
        `응답 본문을 읽을 수 없습니다: ${textError instanceof Error ? textError.message : String(textError)}`,
      )
    }

    // XML 파싱 시도
    let result
    try {
      result = await parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true,
      })
    } catch (parseError) {
      console.error("XML 파싱 오류:", parseError)
      throw new Error(`XML 파싱 오류: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
    }

    // 파싱 결과 검증
    if (!result) {
      throw new Error("XML 파싱 결과가 비어 있습니다")
    }

    console.log("XML 파싱 완료, 결과 구조:", Object.keys(result))

    // RSS 또는 Atom 형식 확인
    let items: any[] = []

    if (result.rss && result.rss.channel) {
      // RSS 2.0 형식
      console.log("RSS 2.0 형식 감지됨")
      const channel = result.rss.channel
      items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : []
    } else if (result.feed && result.feed.entry) {
      // Atom 형식
      console.log("Atom 형식 감지됨")
      items = Array.isArray(result.feed.entry) ? result.feed.entry : result.feed.entry ? [result.feed.entry] : []
    } else {
      // 알 수 없는 형식
      console.error("지원되지 않는 피드 형식:", Object.keys(result))
      throw new Error("지원되지 않는 RSS/Atom 피드 형식입니다")
    }

    console.log(`포스트 항목 ${items.length}개 발견`)

    // 포스트 파싱
    const parsedPosts = items.map((item, index) => {
      try {
        console.log(`포스트 #${index + 1} 파싱 중...`)

        // 제목 추출
        let title = "제목 없음"
        if (item.title) {
          title = typeof item.title === "object" ? item.title._ || "제목 없음" : item.title
        }

        // URL 추출
        let url = ""
        if (item.link) {
          if (typeof item.link === "object" && item.link.href) {
            // Atom 형식
            url = item.link.href
          } else if (Array.isArray(item.link)) {
            // 여러 링크가 있는 경우
            const alternateLink = item.link.find((l: any) => l.rel === "alternate")
            url = alternateLink ? alternateLink.href : item.link[0].href || item.link[0]
          } else {
            // 일반 RSS 형식
            url = item.link
          }
        }

        // 내용 추출
        let content = ""
        if (item.content) {
          content = typeof item.content === "object" ? item.content._ || "" : item.content
        } else if (item["content:encoded"]) {
          content = item["content:encoded"]
        } else if (item.description) {
          content = item.description
        } else if (item.summary) {
          content = item.summary
        }

        // 날짜 추출
        let date = new Date()
        try {
          if (item.pubDate) {
            date = new Date(item.pubDate)
          } else if (item.published) {
            date = new Date(item.published)
          } else if (item.updated) {
            date = new Date(item.updated)
          }

          // 날짜가 유효한지 확인
          if (isNaN(date.getTime())) {
            console.warn(`포스트 #${index + 1}의 날짜가 유효하지 않습니다. 현재 날짜로 설정합니다.`)
            date = new Date()
          }
        } catch (dateError) {
          console.warn(`포스트 #${index + 1}의 날짜 파싱 오류:`, dateError)
          date = new Date()
        }

        // HTML 파싱하여 단어 수와 이미지 수 계산
        const { wordCount, imageCount } = countWordsAndImages(content)

        return {
          title,
          url,
          content,
          date,
          wordCount,
          imageCount,
        }
      } catch (itemError) {
        console.error(`포스트 #${index + 1} 파싱 오류:`, itemError)
        // 오류가 발생해도 기본값으로 포스트 반환
        return {
          title: `파싱 오류 포스트 #${index + 1}`,
          url: "",
          content: "",
          date: new Date(),
          wordCount: 0,
          imageCount: 0,
        }
      }
    })

    // 유효한 포스트만 필터링 (URL이 있는 포스트만)
    const validPosts = parsedPosts.filter((post) => post.url)
    console.log(`유효한 포스트 ${validPosts.length}개 파싱 완료`)

    return validPosts
  } catch (error) {
    console.error("RSS 피드 파싱 오류:", error)
    throw error
  }
}

// HTML 콘텐츠에서 단어 수와 이미지 수 계산
function countWordsAndImages(htmlContent: string): { wordCount: number; imageCount: number } {
  try {
    if (!htmlContent) {
      return { wordCount: 0, imageCount: 0 }
    }

    // JSDOM 생성 시 오류 방지를 위한 옵션 추가
    const dom = new JSDOM(htmlContent, {
      contentType: "text/html",
      includeNodeLocations: false,
    })

    const document = dom.window.document

    // 텍스트 추출 및 단어 수 계산
    const textContent = document.body ? document.body.textContent || "" : ""
    const words = textContent
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
    const wordCount = words.length

    // 이미지 수 계산
    const images = document.querySelectorAll("img")
    const imageCount = images.length

    return { wordCount, imageCount }
  } catch (error) {
    console.error("HTML 파싱 오류:", error)
    return { wordCount: 0, imageCount: 0 }
  }
}

// 캠퍼스 RSS 피드 동기화 함수
export async function syncCampusRssFeed(
  campusId: string,
  feedUrl: string,
): Promise<{
  added: number
  skipped: number
  error?: string
}> {
  try {
    console.log(`캠퍼스 ID ${campusId}의 RSS 피드 동기화 시작`)

    // 기존 포스트 URL 목록 가져오기
    const existingPosts = await getPostsByCampusId(campusId)
    const existingUrls = new Set(existingPosts.map((post) => post.url))
    console.log(`기존 포스트 URL ${existingUrls.size}개 로드됨`)

    // RSS 피드 파싱
    let parsedPosts: ParsedPost[] = []
    try {
      parsedPosts = await parseRssFeed(feedUrl)
    } catch (parseError) {
      console.error("RSS 피드 파싱 실패:", parseError)
      return {
        added: 0,
        skipped: 0,
        error: `RSS 피드 파싱 실패: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      }
    }

    if (parsedPosts.length === 0) {
      return {
        added: 0,
        skipped: 0,
        error: "파싱된 포스트가 없습니다. RSS 피드 URL을 확인해주세요.",
      }
    }

    // 새 포스트 추가
    let added = 0
    let skipped = 0
    let errors = 0

    for (const post of parsedPosts) {
      try {
        // URL이 비어있거나 유효하지 않은 경우 건너뛰기
        if (!post.url || !post.url.startsWith("http")) {
          console.warn(`유효하지 않은 URL을 가진 포스트 건너뛰기: ${post.title}`)
          skipped++
          continue
        }

        // 이미 존재하는 URL인지 확인
        if (existingUrls.has(post.url)) {
          console.log(`이미 존재하는 URL 건너뛰기: ${post.url}`)
          skipped++
          continue
        }

        // 새 포스트 추가
        await createPost({
          campusId,
          title: post.title || "제목 없음",
          url: post.url,
          wordCount: post.wordCount || 0,
          imageCount: post.imageCount || 0,
          date: Timestamp.fromDate(post.date || new Date()),
          feedback: "",
          number: existingPosts.length + added + 1, // 번호 자동 부여
        })

        added++
        console.log(`새 포스트 추가됨: ${post.title}`)
      } catch (postError) {
        console.error(`포스트 추가 오류:`, postError)
        errors++
      }
    }

    console.log(`RSS 동기화 완료: ${added}개 추가, ${skipped}개 건너뜀, ${errors}개 오류`)

    if (errors > 0) {
      return {
        added,
        skipped,
        error: `${errors}개의 포스트를 추가하는 중 오류가 발생했습니다.`,
      }
    }

    return { added, skipped }
  } catch (error) {
    console.error(`캠퍼스 ID ${campusId}의 RSS 피드 동기화 오류:`, error)
    return {
      added: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    }
  }
}
