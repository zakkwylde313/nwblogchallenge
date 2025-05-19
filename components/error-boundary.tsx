"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error("ErrorBoundary에서 오류 감지:", error)
      setError(error.error)
      setHasError(true)
    }

    window.addEventListener("error", errorHandler)
    return () => window.removeEventListener("error", errorHandler)
  }, [])

  if (hasError) {
    return (
      fallback || (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-800">오류가 발생했습니다</h3>
          </div>
          <p className="text-red-700 mb-4">
            {error?.message || "알 수 없는 오류가 발생했습니다. 페이지를 새로고침하거나 나중에 다시 시도해주세요."}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              페이지 새로고침
            </button>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
