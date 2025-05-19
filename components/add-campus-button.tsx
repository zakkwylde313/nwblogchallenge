"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PlusCircle, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export default function AddCampusButton() {
  const { isAdmin, user } = useAuth()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [feedUrl, setFeedUrl] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 클라이언트 사이드에서만 렌더링하기 위한 useEffect
  useEffect(() => {
    setMounted(true)
    console.log("AddCampusButton 마운트됨, 관리자 여부:", isAdmin)
  }, [isAdmin])

  // 마운트되지 않았거나 관리자가 아니면 렌더링하지 않음
  if (!mounted || !isAdmin) {
    console.log("AddCampusButton 렌더링 건너뜀:", { mounted, isAdmin })
    return null
  }

  console.log("AddCampusButton 렌더링됨:", { isAdmin, userEmail: user?.email })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      console.log("캠퍼스 추가 시작:", { name, url, feedUrl })
      
      // 서버 액션 대신 API 라우트 사용
      const response = await fetch('/api/campus/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          url,
          feedUrl: feedUrl || null,
        }),
      });
      
      console.log("API 응답 상태:", response.status);
      
      if (!response.ok) {
        let errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.error || errorText;
        } catch (e) {
          // 텍스트가 JSON이 아닌 경우 원래 텍스트 사용
        }
        throw new Error(`서버 오류: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("캠퍼스 추가 결과:", result);

      if (result.error) {
        setError(result.error);
      } else {
        setName("");
        setUrl("");
        setFeedUrl("");
        setIsModalOpen(false);

        // 페이지 새로고침하여 데이터 갱신
        router.refresh();
      }
    } catch (error) {
      console.error("캠퍼스 추가 오류:", error);
      setError(`캠퍼스 추가 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        캠퍼스 추가
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">새 캠퍼스 추가</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4">
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    캠퍼스 이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                    블로그 URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="feedUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    RSS 피드 URL (선택사항)
                  </label>
                  <input
                    type="url"
                    id="feedUrl"
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://blog.example.com/feed.xml"
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    RSS 피드 URL을 입력하면 블로그 포스트를 자동으로 가져올 수 있습니다.
                  </p>
                </div>

                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              </div>

              <div className="flex justify-end p-4 border-t gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "추가 중..." : "추가"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
