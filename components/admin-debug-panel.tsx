"use client"

import { useState, useEffect } from "react"
import { Bug, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function AdminDebugPanel() {
  const { user, isAdmin, adminStatus } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-3 py-2 bg-gray-800 text-white rounded-md text-sm font-medium hover:bg-gray-700 shadow-lg"
      >
        <Bug className="h-4 w-4 mr-2" />
        디버그
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">관리자 디버그 패널</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <h4 className="font-medium mb-2">인증 상태</h4>
              <div className="bg-gray-100 p-3 rounded-md mb-4 text-sm">
                <p>
                  <span className="font-semibold">로그인 상태:</span> {user ? "로그인됨" : "로그인되지 않음"}
                </p>
                {user && (
                  <>
                    <p>
                      <span className="font-semibold">이메일:</span> {user.email}
                    </p>
                    <p>
                      <span className="font-semibold">UID:</span> {user.uid}
                    </p>
                  </>
                )}
                <p>
                  <span className="font-semibold">관리자 여부:</span> {isAdmin ? "예" : "아니오"}
                </p>
                <p>
                  <span className="font-semibold">관리자 상태:</span> {adminStatus}
                </p>
              </div>

              <h4 className="font-medium mb-2">컴포넌트 렌더링 정보</h4>
              <div className="bg-gray-100 p-3 rounded-md mb-4 text-sm">
                <p>
                  <span className="font-semibold">AddCampusButton 표시 조건:</span> isAdmin={String(isAdmin)}
                </p>
                <p>
                  <span className="font-semibold">InitDataButton 표시 조건:</span> isAdmin={String(isAdmin)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  관리자 이메일: admin@eie-gyeonggi.org, admin2@eie-gyeonggi.org
                </p>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>문제가 계속되면 브라우저 캐시를 지우고 다시 로그인하거나, 다른 브라우저에서 시도해보세요.</p>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
