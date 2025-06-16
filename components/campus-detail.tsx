"use client"

import { useState } from "react"
import { MessageSquare, Check, X, ImageIcon, FileText, PlusCircle, RefreshCw, AlertCircle } from "lucide-react"
import FeedbackModal from "@/components/feedback-modal"
import { useAuth } from "@/context/auth-context"
import { updateFeedback } from "@/app/actions"
import AddPostModal from "@/components/add-post-modal"
import type { Campus, Post } from "@/lib/db"
import ErrorBoundary from "@/components/error-boundary"
import { useRouter } from "next/navigation"

interface CampusDetailProps {
  campus: Campus
  posts: Post[]
}

export default function CampusDetail({ campus, posts }: CampusDetailProps) {
  const router = useRouter()
  const { isAdmin, user } = useAuth()
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [addPostModalOpen, setAddPostModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 최신 등록일 순으로 정렬
  const sortedPosts = [...posts].sort((a, b) => {
    const getDate = (d: any) => {
      if (!d) return 0;
      if (typeof d === 'string') return new Date(d).getTime();
      if (d.toDate) return d.toDate().getTime();
      return new Date(d).getTime();
    };
    return getDate(b.date) - getDate(a.date);
  });

  const handleFeedbackView = (post: Post) => {
    setSelectedPost(post)
    setFeedbackModalOpen(true)
  }

  const handleFeedbackEdit = (post: Post) => {
    if (!isAdmin) return
    setSelectedPost(post)
    setFeedbackModalOpen(true)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // 현재 페이지 새로고침 (Next.js router 사용)
    router.refresh()
    // 실제 Next.js router.refresh()는 비동기지만 완료 이벤트를 받을 수 없으므로
    // 잠시 후 새로고침 상태 해제
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const handleFeedbackSave = async (feedback: string) => {
    if (!selectedPost) return

    setFeedbackSubmitting(true)

    const formData = new FormData()
    formData.append("id", selectedPost.id)
    formData.append("feedback", feedback)
    formData.append("campusId", campus.id)

    try {
      console.log("피드백 저장 시도:", { 
        postId: selectedPost.id, 
        campusId: campus.id,
        feedbackLength: feedback.length 
      });

      const result = await updateFeedback(formData)

      if (result.error) {
        console.error("피드백 저장 실패:", result.error);
        // 오류 메시지를 더 명확하게 표시
        alert(result.error);
      } else {
        console.log("피드백 저장 성공");
        setFeedbackModalOpen(false);
        // 성공 메시지 표시
        alert("피드백이 성공적으로 저장되었습니다.");
      }
    } catch (error) {
      // 예상치 못한 오류 처리
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("피드백 저장 중 예상치 못한 오류:", {
        error,
        message: errorMessage
      });
      alert(`피드백 저장 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  // 날짜 포맷팅 함수
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "날짜 없음"

    try {
      // 문자열이거나 Timestamp 객체일 수 있음
      const date = typeof timestamp === 'string' 
        ? new Date(timestamp) 
        : timestamp.toDate 
          ? timestamp.toDate() 
          : new Date(timestamp);
          
      return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch (err) {
      console.error("날짜 변환 오류:", err, timestamp);
      return "날짜 오류";
    }
  }

  return (
    <ErrorBoundary>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{campus.name} 포스팅 목록</h2>
              <p className="text-gray-600">
                인정 포스팅: {campus.validPosts} / 총 포스팅: {campus.totalPosts}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div>
                <span className="mr-2">챌린지 상태:</span>
                {campus.isCompleted ? (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">성공</span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    도전 중
                  </span>
                )}
              </div>

              {isAdmin && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? '새로고침 중...' : '새로고침'}
                  </button>
                  <button
                    onClick={() => setAddPostModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    포스트 추가
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 모바일에서는 카드 형태로, 데스크톱에서는 테이블 형태로 표시 */}
        <div className="block md:hidden">
          {sortedPosts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {sortedPosts.map((post, idx) => (
                <div key={post.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">#{idx + 1}</span>
                    <span className="text-sm text-gray-500">{formatDate(post.date)}</span>
                  </div>
                  <div className="mb-2">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline line-clamp-1 font-medium"
                      title={post.title}
                    >
                      {post.title}
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1 text-gray-400" />
                      {post.wordCount.toLocaleString()}자
                    </div>
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {post.imageCount}장
                    </div>
                    <div>
                      {post.isValid ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <Check className="h-4 w-4 mr-1" /> 인정
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <X className="h-4 w-4 mr-1" /> 불인정
                        </span>
                      )}
                    </div>
                    <div>
                      {post.feedback ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          <MessageSquare className="h-4 w-4 mr-1" /> 피드백 있음
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          <AlertCircle className="h-4 w-4 mr-1" /> 피드백 없음
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleFeedbackView(post)}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" /> 피드백 보기
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleFeedbackEdit(post)}
                        className="text-green-600 hover:text-green-800 flex items-center"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" /> 피드백 작성
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">아직 등록된 포스트가 없습니다.</div>
          )}
        </div>

        {/* 데스크톱 테이블 뷰 */}
        <div className="hidden md:block overflow-x-auto">
          {sortedPosts.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[60px]">
                    번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    글자 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    이미지 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    인정 여부
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    피드백 상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    피드백
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPosts.map((post, idx) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px]">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block truncate"
                        title={post.title}
                      >
                        {post.title}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-gray-400" />
                        {post.wordCount.toLocaleString()}자
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <ImageIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {post.imageCount}장
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.isValid ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <Check className="h-4 w-4 mr-1" /> 인정
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <X className="h-4 w-4 mr-1" /> 불인정
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.feedback ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          <MessageSquare className="h-4 w-4 mr-1" /> 있음
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          <AlertCircle className="h-4 w-4 mr-1" /> 없음
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(post.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFeedbackView(post)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" /> 보기
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleFeedbackEdit(post)}
                            className="text-green-600 hover:text-green-800 flex items-center"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" /> 작성
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">아직 등록된 포스트가 없습니다.</div>
          )}
        </div>
      </div>

      {/* 피드백 모달 */}
      {feedbackModalOpen && selectedPost && (
        <FeedbackModal
          post={selectedPost}
          isAdmin={isAdmin}
          isSubmitting={feedbackSubmitting}
          onClose={() => setFeedbackModalOpen(false)}
          onSave={handleFeedbackSave}
        />
      )}

      {/* 포스트 추가 모달 */}
      {addPostModalOpen && <AddPostModal campusId={campus.id} onClose={() => setAddPostModalOpen(false)} />}
    </ErrorBoundary>
  )
}
