"use client"

import type React from "react"

import { useState } from "react"
import { X, RefreshCw, AlertTriangle, Info } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import type { Campus } from "@/lib/db"

interface UpdatePostsModalProps {
  campuses: Campus[]
  onClose: () => void
}

export default function UpdatePostsModal({ campuses, onClose }: UpdatePostsModalProps) {
  const { user } = useAuth()
  const [selectedCampusId, setSelectedCampusId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const [error, setError] = useState("")
  const [errorDetails, setErrorDetails] = useState("")
  const [responseText, setResponseText] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCampusId) {
      setError("캠퍼스를 선택해주세요.")
      return
    }

    setIsSubmitting(true)
    setError("")
    setErrorDetails("")
    setResponseText("")
    setResult(null)

    try {
      console.log("포스트 업데이트 요청 시작:", { campusId: selectedCampusId })

      // 사용자 토큰 가져오기
      let token
      try {
        token = await user?.getIdToken(true) // 강제로 새 토큰 요청
        console.log("인증 토큰 가져오기 성공")
      } catch (tokenError) {
        console.error("인증 토큰 가져오기 오류:", tokenError)
        setError("인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.")
        setErrorDetails(tokenError instanceof Error ? tokenError.message : String(tokenError))
        setIsSubmitting(false)
        return
      }

      if (!token) {
        setError("인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.")
        setIsSubmitting(false)
        return
      }

      // API 호출
      let response
      try {
        console.log("API 요청 시작")
        response = await fetch("/api/admin/update-posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            campusId: selectedCampusId,
          }),
        })
        console.log("API 응답 상태:", response.status)
      } catch (fetchError) {
        console.error("API 요청 오류:", fetchError)
        setError("API 요청 중 오류가 발생했습니다.")
        setErrorDetails(fetchError instanceof Error ? fetchError.message : String(fetchError))
        setIsSubmitting(false)
        return
      }

      // 응답 텍스트 먼저 가져오기 (디버깅용)
      try {
        const text = await response.clone().text()
        setResponseText(text)
        console.log("응답 텍스트:", text)
      } catch (textError) {
        console.error("응답 텍스트 가져오기 오류:", textError)
      }

      // 응답 처리 - 안전하게 JSON 파싱
      let data
      try {
        // 응답이 JSON인지 확인
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          data = await response.json()
          console.log("API 응답 데이터:", data)
        } else {
          // JSON이 아닌 경우 오류 처리
          throw new Error(`서버가 JSON이 아닌 응답을 반환했습니다: ${responseText.substring(0, 100)}...`)
        }
      } catch (parseError) {
        console.error("응답 파싱 오류:", parseError)
        setError("응답 처리 중 오류가 발생했습니다.")
        setErrorDetails(parseError instanceof Error ? parseError.message : String(parseError))
        setIsSubmitting(false)
        return
      }

      if (!response.ok) {
        setError(data.error || "포스트 업데이트 중 오류가 발생했습니다.")
        if (data.details) {
          setErrorDetails(data.details)
        }
      } else {
        setResult({
          success: true,
          message: data.message || "포스트가 성공적으로 업데이트되었습니다.",
          details: data.details,
        })
      }
    } catch (error) {
      console.error("포스트 업데이트 오류:", error)
      setError("포스트 업데이트 중 오류가 발생했습니다.")
      setErrorDetails(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">포스트 campusId 필드 업데이트</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <p className="mb-4 text-sm text-gray-600">
              이 도구는 posts 컬렉션의 모든 문서 중 campusId 필드가 없는 문서에 선택한 캠퍼스의 ID를 추가합니다.
            </p>

            <div className="mb-4">
              <label htmlFor="campusId" className="block text-sm font-medium text-gray-700 mb-1">
                캠퍼스 선택
              </label>
              <select
                id="campusId"
                value={selectedCampusId}
                onChange={(e) => setSelectedCampusId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isSubmitting}
                required
              >
                <option value="">캠퍼스를 선택하세요</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700">{error}</p>
                    {errorDetails && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600 cursor-pointer">상세 오류 정보</summary>
                        <pre className="mt-1 text-xs bg-red-50 p-2 rounded whitespace-pre-wrap">{errorDetails}</pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {responseText && (
              <details className="mb-4">
                <summary className="text-xs text-gray-600 cursor-pointer">서버 응답 원문</summary>
                <pre className="mt-1 text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap overflow-auto max-h-40">
                  {responseText}
                </pre>
              </details>
            )}

            {result && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-700">{result.message}</p>
                    {result.details && (
                      <div className="mt-2 text-xs text-green-600">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(result.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    업데이트 중...
                  </>
                ) : (
                  "업데이트"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
