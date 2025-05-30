export const dynamic = "force-dynamic";

import { Award, BookOpen, Users } from "lucide-react"
import CountdownTimer from "@/components/countdown-timer"
import CampusTable from "@/components/campus-table"
import ChallengeRules from "@/components/challenge-rules"
import AdminLoginButton from "@/components/admin-login-button"
import { getAllCampuses, getDashboardStats } from "@/lib/db"
import AddCampusButton from "@/components/add-campus-button"
import { Suspense } from "react"
import LoadingSpinner from "@/components/loading-spinner"

export default async function Home() {
  // Firestore에서 데이터 가져오기
  const campusesPromise = getAllCampuses()
  const statsPromise = getDashboardStats()
  const [campuses, stats] = await Promise.all([campusesPromise, statsPromise])

  // stats.topCampuses는 postingCount 기준 내림차순 정렬된 배열이라고 가정
  const sorted = stats.topCampuses;

  // 컷오프 기준: 상위 2위의 postingCount 값
  const cutoffCount = sorted.length >= 2 ? sorted[1].validPosts : (sorted[0]?.validPosts || 0);

  const topWithTies = sorted.filter(campus => campus.validPosts >= cutoffCount);



  // 챌린지 마감일 (예: 2025년 6월 30일)
  const challengeEndDate = new Date("2025-05-31T14:59:59Z")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-md">
                <BookOpen className="h-6 w-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">EiE 경기 동·서북부 협의회 블로그 챌린지</h1>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <AdminLoginButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 카운트다운 타이머 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center md:text-left">챌린지 기간 : 2025년 05월 10일 ~ 2025년 05월 31일</h2>
            </div>
            <CountdownTimer targetDate={challengeEndDate} />
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">총 참가 캠퍼스</p>
                <h3 className="text-2xl font-bold">{stats.totalCampuses}개</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">오늘 포스팅 등록 캠퍼스</p>
                <h3 className="text-2xl font-bold">{stats.todayPostedCampuses}개</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">챌린지 순위 TOP2</p>
                <h3 className="text-lg font-bold">
                  {stats.topCampuses.length > 0
                    ? stats.topCampuses.map((campus) => campus.name).join(", ")
                    : "아직 참가자가 없습니다"}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* 챌린지 규칙 */}
        <ChallengeRules />

        {/* 캠퍼스 테이블 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-xl font-bold text-gray-800">참가 캠퍼스 현황</h2>
              <p className="text-gray-600">각 캠퍼스의 블로그 챌린지 진행 상황을 확인하세요</p>
            </div>
            <AddCampusButton />
          </div>
          <Suspense fallback={<LoadingSpinner />}>
            <CampusTable campuses={campuses} />
          </Suspense>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 EiE 경기 동·서북부 협의회. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
