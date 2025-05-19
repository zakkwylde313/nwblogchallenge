"use client"

import { useState, useEffect } from "react"
import { Database } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export default function InitDataButton() {
  const { isAdmin, user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  // 클라이언트 사이드에서만 렌더링하기 위한 useEffect
  useEffect(() => {
    setMounted(true)
    console.log("InitDataButton 마운트됨, 관리자 여부:", isAdmin)
  }, [isAdmin])

  // 마운트되지 않았거나 관리자가 아니면 렌더링하지 않음
  if (!mounted || !isAdmin) {
    console.log("InitDataButton 렌더링 건너뜀:", { mounted, isAdmin })
    return null
  }

  console.log("InitDataButton 렌더링됨:", { isAdmin, userEmail: user?.email })

  const handleInitData = async () => {
    if (!confirm("샘플 데이터를 생성하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      // 사용자 토큰 가져오기
      const token = await user?.getIdToken()

      if (!token) {
        setResult({
          success: false,
          message: "인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.",
        })
        setIsLoading(false)
        return
      }

      // API 호출
      const response = await fetch("/api/init-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          message: data.error || "샘플 데이터 생성 중 오류가 발생했습니다.",
        })
      } else {
        setResult({
          success: true,
          message: data.message || "샘플 데이터가 성공적으로 생성되었습니다.",
        })

        // 페이지 새로고침
        setTimeout(() => {
          router.refresh()
        }, 1500)
      }
    } catch (error) {
      console.error("샘플 데이터 생성 오류:", error)
      setResult({
        success: false,
        message: "샘플 데이터 생성 중 오류가 발생했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end">
        {result && (
          <div
            className={`mb-2 p-2 rounded-md text-sm ${
              result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {result.message}
          </div>
        )}
        <button
          onClick={handleInitData}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 shadow-lg"
          disabled={isLoading}
        >
          <Database className="h-4 w-4 mr-2" />
          {isLoading ? "데이터 생성 중..." : "샘플 데이터 생성"}
        </button>
      </div>
    </div>
  )
}
