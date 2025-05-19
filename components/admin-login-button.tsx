"use client"

import type React from "react"

import { useState } from "react"
import { LogIn, LogOut, ShieldAlert } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function AdminLoginButton() {
  const { user, login, logout, isAdmin, adminStatus } = useAuth()
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  // 로그인 폼 토글
  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm)
    setError("")
  }

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await login(email, password)
      setShowLoginForm(false)
      setEmail("")
      setPassword("")
    } catch (error: any) {
      // Firebase 오류 메시지 처리
      let errorMessage = "로그인에 실패했습니다."
      if (error.code === "auth/invalid-credential") {
        errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다."
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "너무 많은 로그인 시도가 있었습니다. 나중에 다시 시도해주세요."
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("로그아웃 오류:", error)
    }
  }

  // 디버그 정보 토글
  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo)
  }

  return (
    <div className="relative">
      {user ? (
        <div className="flex items-center">
          <span className="mr-2 text-sm">
            {isAdmin ? "관리자" : "사용자"}: {user.email}
          </span>
          <button
            onClick={toggleDebugInfo}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 mr-2"
          >
            <ShieldAlert className="h-4 w-4 mr-1" />
            상태
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </button>
        </div>
      ) : (
        <button
          onClick={toggleLoginForm}
          className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          <LogIn className="h-4 w-4 mr-2" />
          관리자 로그인
        </button>
      )}

      {/* 디버그 정보 */}
      {showDebugInfo && (
        <div className="absolute right-0 top-12 mt-2 w-80 bg-white rounded-md shadow-lg z-10 p-4 border">
          <h3 className="text-lg font-medium mb-2">관리자 상태 디버그</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">이메일:</span> {user?.email || "없음"}
            </p>
            <p>
              <span className="font-semibold">관리자 여부:</span> {isAdmin ? "예" : "아니오"}
            </p>
            <p>
              <span className="font-semibold">상태:</span> {adminStatus}
            </p>
            <p className="text-xs text-gray-500 mt-2">관리자 이메일: admin@eie-gyeonggi.org, admin2@eie-gyeonggi.org</p>
          </div>
        </div>
      )}

      {/* 로그인 폼 모달 */}
      {showLoginForm && (
        <div className="absolute right-0 top-12 mt-2 w-80 bg-white rounded-md shadow-lg z-10 p-4 border">
          <h3 className="text-lg font-medium mb-4">관리자 로그인</h3>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={toggleLoginForm}
                className="px-4 py-2 border rounded-md text-sm font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
