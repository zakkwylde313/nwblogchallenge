// 클라이언트 측에서 사용할 RSS 관련 유틸리티 함수

/**
 * RSS 피드 URL의 기본적인 유효성을 검사합니다.
 * 이 함수는 클라이언트 측에서 실행됩니다.
 */
export function validateRssUrl(url: string): { valid: boolean; message: string } {
  if (!url) {
    return { valid: false, message: "RSS 피드 URL을 입력해주세요." }
  }

  try {
    const urlObj = new URL(url)
    if (!urlObj.protocol.startsWith("http")) {
      return { valid: false, message: "URL은 http:// 또는 https://로 시작해야 합니다." }
    }

    return { valid: true, message: "URL 형식이 유효합니다." }
  } catch (e) {
    return { valid: false, message: "유효하지 않은 URL 형식입니다." }
  }
}

/**
 * 일반적인 블로그 플랫폼의 RSS 피드 URL 형식을 반환합니다.
 */
export function getRssFeedExamples(): { platform: string; format: string }[] {
  return [
    { platform: "네이버 블로그", format: "https://rss.blog.naver.com/[블로그ID].xml" },
    { platform: "티스토리", format: "https://[블로그주소]/rss" },
    { platform: "워드프레스", format: "https://[블로그주소]/feed" },
    { platform: "미디엄", format: "https://medium.com/feed/@[사용자명]" },
    { platform: "브런치", format: "https://brunch.co.kr/rss/@@[사용자ID]" },
  ]
}
