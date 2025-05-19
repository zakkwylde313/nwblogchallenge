"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Terminal, Database } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import type { Campus } from "@/lib/db"

interface CampusManagementProps {
  campus: Campus
  onUpdateComplete?: (updatedCampus: Campus) => void
}

// 스크립트 상태 타입 정의
interface ScriptStatus {
  lastUpdated: Date | null
  totalProcessed: number
  status: 'ready' | 'running' | 'completed' | 'error'
  message: string
}

export default function CampusManagement({ campus, onUpdateComplete }: CampusManagementProps) {
  const { user, getIdToken, isAdmin } = useAuth()
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [scriptStatus, setScriptStatus] = useState<ScriptStatus>({
    lastUpdated: null,
    totalProcessed: 0,
    status: 'ready',
    message: "상태 정보를 로딩 중입니다..."
  })

  // 스크립트 상태 확인하기
  const checkScriptStatus = async () => {
    if (!user) {
      setError("로그인이 필요합니다")
      return
    }

    // Firebase 사용자 토큰 가져오기
    let idToken
    try {
      idToken = await getIdToken()
      if (!idToken) {
        throw new Error("인증 토큰을 가져올 수 없습니다.")
      }
    } catch (tokenError) {
      console.error("토큰 오류:", tokenError)
      setError("인증 토큰을 가져올 수 없습니다.")
      return
    }

    setIsLoadingStatus(true)
    setError("")

    try {
      const response = await fetch("/api/blog/fetch", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        }
      })

      const data = await response.json()

      if (!response.ok) {
        // 인증 관련 오류인 경우 특별히 처리
        if (response.status === 401 || response.status === 403) {
          throw new Error("인증에 실패했습니다. 다시 로그인해 주세요.")
        }
        throw new Error(data.error || "스크립트 상태를 확인하는 중 오류가 발생했습니다")
      }

      setScriptStatus({
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated.toDate ? data.lastUpdated.toDate() : data.lastUpdated) : null,
        totalProcessed: data.totalProcessed || 0,
        status: data.status || 'ready',
        message: data.message || "상태 정보를 가져왔습니다."
      })
    } catch (error) {
      setError(`스크립트 상태 확인 오류: ${error instanceof Error ? error.message : String(error)}`)
      console.error("스크립트 상태 확인 오류:", error)
    } finally {
      setIsLoadingStatus(false)
    }
  }

  // 블로그 포스트 가져오기 (Firebase에서 데이터만 가져옴)
  const handleFetchPosts = async () => {
    if (!user) {
      setError("로그인이 필요합니다")
      return
    }

    // Firebase 사용자 토큰 가져오기
    let idToken
    try {
      idToken = await getIdToken()
      if (!idToken) {
        throw new Error("인증 토큰을 가져올 수 없습니다.")
      }
    } catch (tokenError) {
      console.error("토큰 오류:", tokenError)
      setError("인증 토큰을 가져올 수 없습니다.")
      return
    }

    setIsLoadingPosts(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/blog/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campusId: campus.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 인증 관련 오류인 경우 특별히 처리
        if (response.status === 401 || response.status === 403) {
          throw new Error("인증에 실패했습니다. 다시 로그인해 주세요.")
        }
        throw new Error(data.error || "블로그 포스트를 가져오는 중 오류가 발생했습니다")
      }

      setMessage(data.message || `${data.posts?.length || 0}개의 포스트를 가져왔습니다`)

      // 업데이트된 캠퍼스 정보로 콜백 호출
      if (onUpdateComplete) {
        // 페이지를 새로고침하여 업데이트된 포스트 목록 표시
        window.location.reload()
      }
    } catch (error) {
      setError(`블로그 포스트 가져오기 오류: ${error instanceof Error ? error.message : String(error)}`)
      console.error("블로그 포스트 가져오기 오류:", error)
    } finally {
      setIsLoadingPosts(false)
    }
  }

  // 컴포넌트 마운트 시 스크립트 상태 확인
  useEffect(() => {
    if (isAdmin) {
      checkScriptStatus()
    }
  }, [isAdmin])

  // 관리자가 아니면 컴포넌트를 렌더링하지 않음
  if (!isAdmin) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">블로그 데이터 관리</h2>

      <div className="mb-6 bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center">
            <Terminal className="h-5 w-5 mr-2" />
            로컬 스크래핑 스크립트 상태
          </h3>
          <button
            onClick={checkScriptStatus}
            disabled={isLoadingStatus}
            className="px-2 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-400"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? "animate-spin" : ""}`} />
          </button>
        </div>
        
        <div className="text-sm space-y-1">
          <div><span className="font-medium">실행 상태:</span> {scriptStatus.status === 'completed' ? '완료' : scriptStatus.status === 'running' ? '실행 중' : scriptStatus.status === 'error' ? '오류' : '준비'}</div>
          <div><span className="font-medium">마지막 업데이트:</span> {scriptStatus.lastUpdated ? scriptStatus.lastUpdated.toLocaleString('ko-KR') : '없음'}</div>
          <div><span className="font-medium">처리된 포스트:</span> {scriptStatus.totalProcessed}</div>
          <div><span className="font-medium">상태 메시지:</span> {scriptStatus.message}</div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p className="flex items-center">
            <Terminal className="h-4 w-4 mr-1" />
            <code className="bg-gray-100 px-2 py-1 rounded">runDailyUpdateLocally.js</code> 스크립트를 로컬에서 실행하여 블로그 데이터를 업데이트하세요.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleFetchPosts}
          disabled={isLoadingPosts}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Database className={`h-5 w-5 mr-2 ${isLoadingPosts ? "animate-pulse" : ""}`} />
          {isLoadingPosts ? "데이터 가져오는 중..." : "블로그 포스트 새로고침"}
        </button>
        <p className="mt-1 text-sm text-gray-500">Firebase 데이터베이스에서 최신 블로그 포스트 데이터를 가져옵니다</p>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md mb-4">{message}</div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md mb-4">{error}</div>}

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-bold mb-2">블로그 데이터 상태</h3>
        <ul className="text-sm text-gray-700">
          <li className="flex justify-between py-1 border-b border-gray-200">
            <span>총 포스트 수</span>
            <span className="font-medium">{campus.totalPosts}</span>
          </li>
          <li className="flex justify-between py-1 border-b border-gray-200">
            <span>인정된 포스트</span>
            <span className="font-medium">{campus.validPosts}</span>
          </li>
          <li className="flex justify-between py-1">
            <span>마지막 포스트 일자</span>
            <span className="font-medium">
              {campus.lastPostDate
                ? typeof campus.lastPostDate === 'string'
                  ? new Date(campus.lastPostDate).toLocaleDateString("ko-KR")
                  : campus.lastPostDate.toDate
                    ? new Date(campus.lastPostDate.toDate()).toLocaleDateString("ko-KR")
                    : "날짜 형식 오류"
                : "없음"}
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
} 