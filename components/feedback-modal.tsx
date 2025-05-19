"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { Post } from "@/lib/db"

interface FeedbackModalProps {
  post: Post
  isAdmin: boolean
  isSubmitting?: boolean
  onClose: () => void
  onSave: (feedback: string) => void
}

export default function FeedbackModal({ post, isAdmin, isSubmitting = false, onClose, onSave }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState(post.feedback || "")

  const handleSave = () => {
    onSave(feedback)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">포스팅 피드백</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-medium mb-1">포스팅 제목:</h4>
            <p className="text-gray-700">{post.title}</p>
          </div>

          {isAdmin ? (
            <div className="mb-4">
              <label htmlFor="feedback" className="block font-medium mb-1">
                피드백 작성:
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full border rounded-md p-2 h-32"
                placeholder="포스팅에 대한 피드백을 작성해주세요..."
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <div className="mb-4">
              <h4 className="font-medium mb-1">피드백:</h4>
              <div className="border rounded-md p-3 bg-gray-50 min-h-[100px]">
                {post.feedback ? post.feedback : "아직 피드백이 없습니다."}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
            disabled={isSubmitting}
          >
            취소
          </button>
          {isAdmin && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
