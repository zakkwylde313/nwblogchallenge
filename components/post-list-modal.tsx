"use client"

import { useState, useEffect } from "react"
import { X, RefreshCw, AlertTriangle, ExternalLink, Plus, Trash2, AlertCircle } from "lucide-react"
import type { Campus, Post } from "@/lib/db"
import type { User } from "firebase/auth"
import AddPostModal from "./add-post-modal"
import { removePost } from "@/app/actions"

interface PostListModalProps {
  campus: Campus
  onClose: () => void
  user: User | null
}

// 타임스탬프를 Date 객체로 변환하는 헬퍼 함수
const convertTimestamps = (post: any): Post => {
  try {
    return {
      ...post,
      date: post.date ? new Date(post.date) : null,
      createdAt: post.createdAt ? new Date(post.createdAt) : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt) : null,
    }
  } catch (error) {
    console.error("타임스탬프 변환 오류:", error, post)
    // 오류 발생 시 원본 데이터 반환
    return post
  }
}

// 응답을 안전하게 처리하는 함수
async function safeParseResponse(response: Response) {
  const contentType = response.headers.get("content-type")

  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch (error) {
      // JSON 파싱 실패 시 텍스트로 처리
      const text = await response.clone().text()
      throw new Error(`JSON 파싱 오류: ${error}. 응답 본문: ${text.substring(0, 200)}...`)
    }
  } else {
    // JSON이 아닌 경우 텍스트로 처리
    const text = await response.text()
    throw new Error(`서버가 JSON이 아닌 응답을 반환했습니다: ${text.substring(0, 200)}...`)
  }
}

export default function PostListModal({ campus, onClose, user }: PostListModalProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [errorDetails, setErrorDetails] = useState("")
  const [showAddPostModal, setShowAddPostModal] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<Post | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 포스트 목록 불러오기
  const fetchPosts = async () => {
    if (!user) {
      setError("로그인이 필요합니다.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError("")
    setErrorDetails("")

    try {
      console.log(`캠퍼스 ID ${campus.id}의 포스트 목록 요청 시작`)

      // 토큰 가져오기
      let token
      try {
        token = await user.getIdToken(true) // 강제로 새 토큰 요청
        console.log("인증 토큰 가져오기 성공")
      } catch (tokenError) {
        console.error("인증 토큰 가져오기 오류:", tokenError)
        setError("인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.")
        setIsLoading(false)
        return
      }

      // API 요청
      let response
      try {
        console.log(`API 요청 시작: /api/posts/${campus.id}`)
        response = await fetch(`/api/posts/${campus.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        console.log("API 응답 상태:", response.status)
      } catch (fetchError) {
        console.error("API 요청 오류:", fetchError)
        throw new Error(`API 요청 오류: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
      }

      // 응답 처리
      let data
      try {
        data = await safeParseResponse(response)
        console.log("API 응답 데이터:", data)
      } catch (parseError) {
        console.error("응답 파싱 오류:", parseError)
        throw parseError
      }

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status} ${response.statusText}${data.error ? ` - ${data.error}` : ""}`)
      }

      // 데이터 처리
      if (data.posts && Array.isArray(data.posts)) {
        try {
          // 타임스탬프 변환
          const convertedPosts = data.posts.map(convertTimestamps)
          console.log("변환된 포스트 데이터:", convertedPosts)
          setPosts(convertedPosts)
          console.log(`${convertedPosts.length}개의 포스트 로드 완료`)
        } catch (convertError) {
          console.error("포스트 데이터 변환 오류:", convertError)
          throw new Error(
            `포스트 데이터 변환 오류: ${convertError instanceof Error ? convertError.message : String(convertError)}`,
          )
        }
      } else {
        console.warn("유효한 포스트 데이터가 없습니다:", data)
        setPosts([])
      }
    } catch (error) {
      console.error("포스트 목록 불러오기 오류:", error)

      const errorMessage = error instanceof Error ? error.message : String(error)
      setError(`포스트 목록을 불러오는 중 오류가 발생했습니다: ${errorMessage}`)

      // 디버깅용 상세 정보
      setErrorDetails(`
        캠퍼스 ID: ${campus.id}
        사용자 이메일: ${user.email}
        오류 시간: ${new Date().toISOString()}
      `)
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 포스트 목록 불러오기
  useEffect(() => {
    fetchPosts()
  }, [campus.id, user])

  // 날짜 포맷팅 함수
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "날짜 없음"

    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
      return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date)
    } catch (e) {
      console.error("날짜 포맷팅 오류:", e, timestamp)
      return "날짜 오류"
    }
  }

  // 포스트 추가 모달 닫기 후 목록 새로고침
  const handleAddPostClose = () => {
    setShowAddPostModal(false)
    // 포스트 목록 새로고침
    fetchPosts()
  }

  // 수동 새로고침 기능
  const handleRefresh = () => {
    fetchPosts()
  }

  // 포스트 삭제 확인 모달 열기
  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post)
    setDeleteConfirmOpen(true)
  }

  // 포스트 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!postToDelete) return

    setIsDeleting(true)
    try {
      const formData = new FormData()
      formData.append("id", postToDelete.id)
      formData.append("campusId", campus.id)

      const result = await removePost(formData)

      if (result.error) {
        console.error("포스트 삭제 오류:", result.error)
        alert(`포스트 삭제 중 오류가 발생했습니다: ${result.error}`)
      } else {
        // 삭제 성공 후 목록 새로고침
        fetchPosts()
      }
    } catch (error) {
      console.error("포스트 삭제 오류:", error)
      alert(`포스트 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
      setPostToDelete(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium">{campus.name} 포스트 목록</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 flex-grow overflow-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">오류 발생</p>
                    <p className="text-sm text-red-700">{error}</p>
                    {errorDetails && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600 cursor-pointer">디버깅 정보</summary>
                        <pre className="mt-1 text-xs bg-red-50 p-2 rounded whitespace-pre-wrap">{errorDetails}</pre>
                      </details>
                    )}
                    <button
                      onClick={handleRefresh}
                      className="mt-2 flex items-center text-sm text-red-700 hover:text-red-800"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> 다시 시도
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-600">포스트 목록을 불러오는 중...</span>
              </div>
            ) : posts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        번호
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        글자 수
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이미지 수
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        인정 여부
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등록일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{post.number}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {post.title}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {post.wordCount?.toLocaleString?.() || 0}자
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{post.imageCount || 0}장</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {post.isValid ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              인정
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              불인정
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(post.date)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleDeleteClick(post)}
                            className="text-red-600 hover:text-red-800 flex items-center"
                            title="포스트 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">아직 등록된 포스트가 없습니다.</p>
                <button
                  onClick={() => setShowAddPostModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  포스트 추가하기
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between p-4 border-t">
            <div>
              <p className="text-sm text-gray-600">
                총 <span className="font-medium">{posts.length}</span>개의 포스트,{" "}
                <span className="font-medium">{posts.filter((p) => p.isValid).length}</span>개 인정됨
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                새로고침
              </button>
              <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50">
                닫기
              </button>
              <button
                onClick={() => setShowAddPostModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                포스트 추가
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 포스트 추가 모달 */}
      {showAddPostModal && <AddPostModal campusId={campus.id} onClose={handleAddPostClose} />}

      {/* 삭제 확인 모달 */}
      {deleteConfirmOpen && postToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center mb-4 text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium">포스트 삭제 확인</h3>
            </div>

            <p className="mb-4">
              정말로 <strong>"{postToDelete.title}"</strong> 포스트를 삭제하시겠습니까?
            </p>
            <p className="text-sm text-gray-500 mb-6">이 작업은 되돌릴 수 없습니다.</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
