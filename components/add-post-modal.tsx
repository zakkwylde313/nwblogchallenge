"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { addPost } from "@/app/actions"

interface AddPostModalProps {
  campusId: string
  onClose: () => void
}

export default function AddPostModal({ campusId, onClose }: AddPostModalProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [wordCount, setWordCount] = useState("")
  const [imageCount, setImageCount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("campusId", campusId)
      formData.append("title", title)
      formData.append("url", url)
      formData.append("wordCount", wordCount)
      formData.append("imageCount", imageCount)
      formData.append("date", date)
      formData.append("feedback", feedback)

      const result = await addPost(formData)

      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    } catch (error) {
      console.error("포스트 추가 오류:", error)
      setError("포스트 추가 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">새 포스트 추가</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                포스트 제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                포스트 URL
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

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 mb-1">
                  글자 수
                </label>
                <input
                  type="number"
                  id="wordCount"
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="imageCount" className="block text-sm font-medium text-gray-700 mb-1">
                  이미지 수
                </label>
                <input
                  type="number"
                  id="imageCount"
                  value={imageCount}
                  onChange={(e) => setImageCount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                등록일
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                피드백 (선택사항)
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 border rounded-md h-24"
                disabled={isSubmitting}
              />
            </div>

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          </div>

          <div className="flex justify-end p-4 border-t gap-2">
            <button
              type="button"
              onClick={onClose}
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
  )
}
