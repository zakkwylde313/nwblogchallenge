"use client"

// 주의: 이 컴포넌트는 클라이언트 측에서만 실행됩니다.
// RSS 파싱은 서버 측 API를 통해 수행됩니다.

import { useState } from "react"
import { X, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react"
import type { Campus } from "@/lib/db"
import type { User } from "firebase/auth"
import { validateRssUrl, getRssFeedExamples } from "@/lib/client-rss-utils"

interface RssSyncModalProps {
  campus: Campus
  onClose: () => void
  user: User | null
}

export default function RssSyncModal({ campus, onClose, user }: RssSyncModalProps) {
  const [feedUrl, setFeedUrl] = useState(campus.feedUrl || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null)

  const validateFeedUrl = () => {
    const result = validateRssUrl(feedUrl)
    setValidationResult(result)
    return result.valid
  }

  const handleSync = async () => {
    // URL 유효성 검사
    if (!validateFeedUrl()) {
      return
    }

    setError("")
    setIsSubmitting(true)
    setResult(null)

    try {
      console.log("RSS 동기화 시작: 토큰 가져오기 시도")
      // 사용자 토큰 가져오기
      const token = await user?.getIdToken()

      if (!token) {
        setError("인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.")
        setIsSubmitting(false)
        return
      }

      console.log("RSS 동기화: API 호출 시작")
      // API 호출
      const response = await fetch("/api/rss/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campusId: campus.id,
          feedUrl,
        }),
      })
      console.log("RSS 동기화: API 응답 수신됨", response.status)

      // 응답 처리 - 본문을 한 번만 읽음
      let responseData: any = null
      let responseText = ""

      // 응답이 JSON인지 확인
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          // JSON으로 파싱 시도
          responseData = await response.json()
        } catch (jsonError) {
          console.error("JSON 파싱 오류:", jsonError)
          // JSON 파싱 실패 시 텍스트로 처리하지 않음 (이미 스트림을 읽었기 때문)
          setError(
            `서버 응답을 JSON으로 파싱할 수 없습니다: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
          )
          setIsSubmitting(false)
          return
        }
      } else {
        // JSON이 아닌 경우 텍스트로 읽음
        try {
          responseText = await response.text()
        } catch (textError) {
          console.error("텍스트 읽기 오류:", textError)
          setError(
            `서버 응답을 읽을 수 없습니다: ${textError instanceof Error ? textError.message : String(textError)}`,
          )
          setIsSubmitting(false)
          return
        }
      }

      // 응답 상태 코드에 따른 처리
      if (!response.ok) {
        if (responseData) {
          // JSON 응답이 있는 경우
          setError(responseData.error || `서버 오류: ${response.status} ${response.statusText}`)

          // 부분적으로 성공한 경우 결과 표시
          if (responseData.added !== undefined && responseData.skipped !== undefined) {
            setResult({
              added: responseData.added,
              skipped: responseData.skipped,
            })
          }
        } else {
          // 텍스트 응답이 있는 경우
          setError(
            `서버 오류: ${response.status} ${response.statusText}. 상세: ${
              responseText.substring(0, 100) + (responseText.length > 100 ? "..." : "")
            }`,
          )
        }
      } else {
        // 성공적인 응답 처리
        if (responseData) {
          setResult({
            added: responseData.added,
            skipped: responseData.skipped,
          })
          setError("") // 오류 메시지 초기화
        } else {
          setError("서버에서 유효한 응답을 받지 못했습니다.")
        }
      }
    } catch (error) {
      console.error("RSS 동기화 오류:", error)
      setError(`RSS 피드 동기화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">RSS 피드 동기화</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="feedUrl" className="block text-sm font-medium text-gray-700 mb-1">
              RSS 피드 URL
            </label>
            <div className="flex">
              <input
                type="url"
                id="feedUrl"
                value={feedUrl}
                onChange={(e) => {
                  setFeedUrl(e.target.value)
                  setValidationResult(null) // 입력 변경 시 검증 결과 초기화
                }}
                onBlur={validateFeedUrl} // 포커스를 잃을 때 검증
                className={`w-full px-3 py-2 border rounded-md ${
                  validationResult ? (validationResult.valid ? "border-green-500" : "border-red-500") : ""
                }`}
                placeholder="https://blog.example.com/feed.xml"
                disabled={isSubmitting}
                required
              />
              {feedUrl && (
                <a
                  href={feedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                  title="RSS 피드 열기"
                >
                  <ExternalLink className="h-5 w-5 text-gray-600" />
                </a>
              )}
            </div>
            {validationResult && (
              <p className={`mt-1 text-sm ${validationResult.valid ? "text-green-600" : "text-red-600"}`}>
                {validationResult.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">블로그의 RSS 피드 URL을 입력하면 포스트를 자동으로 가져옵니다.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">오류 발생</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">동기화 완료!</p>
              <p className="text-sm text-green-700">
                {result.added}개의 새 포스트가 추가되었습니다.
                {result.skipped > 0 && ` ${result.skipped}개의 포스트는 이미 존재합니다.`}
              </p>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium mb-1">RSS 피드 URL 찾는 방법:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              {getRssFeedExamples().map((example, index) => (
                <li key={index}>
                  {example.platform}: {example.format}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
            disabled={isSubmitting}
          >
            {result ? "닫기" : "취소"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleSync}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  동기화 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  동기화
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
