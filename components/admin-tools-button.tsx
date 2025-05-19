"use client"

import { useState, useEffect } from "react"
import { PenToolIcon as Tool, X } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import UpdatePostsModal from "./update-posts-modal"
import type { Campus } from "@/lib/db"

interface AdminToolsButtonProps {
  campuses: Campus[]
}

export default function AdminToolsButton({ campuses }: AdminToolsButtonProps) {
  const { isAdmin } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showUpdatePostsModal, setShowUpdatePostsModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isAdmin) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
      >
        <Tool className="h-4 w-4 mr-2" />
        관리자 도구
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">관리자 도구</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowUpdatePostsModal(true)
                    setIsModalOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  <span className="font-medium">포스트 campusId 필드 업데이트</span>
                  <span className="text-sm text-gray-500">→</span>
                </button>

                {/* 필요에 따라 다른 관리자 도구 버튼 추가 */}
              </div>
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdatePostsModal && <UpdatePostsModal campuses={campuses} onClose={() => setShowUpdatePostsModal(false)} />}
    </>
  )
}
