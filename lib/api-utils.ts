/**
 * API 응답을 안전하게 처리하는 유틸리티 함수
 */

/**
 * 응답을 JSON으로 파싱하거나, 실패 시 텍스트로 처리
 */
export async function safeParseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type")

  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch (error) {
      // JSON 파싱 실패 시 텍스트로 처리
      const clonedResponse = response.clone()
      const text = await clonedResponse.text()
      throw new Error(`JSON 파싱 오류: ${error}. 응답 본문: ${text.substring(0, 200)}...`)
    }
  } else {
    // JSON이 아닌 경우 텍스트로 처리
    const text = await response.text()
    throw new Error(`서버가 JSON이 아닌 응답을 반환했습니다: ${text.substring(0, 200)}...`)
  }
}

/**
 * API 요청을 보내고 응답을 안전하게 처리
 */
export async function fetchAPI(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(url, options)
    const data = await safeParseResponse(response)

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status} ${response.statusText}${data.error ? ` - ${data.error}` : ""}`)
    }

    return data
  } catch (error) {
    console.error("API 요청 오류:", error)
    throw error
  }
}
