import Link from "next/link"
import { ExternalLink, ArrowRight, AlertCircle } from "lucide-react"
import type { Campus } from "@/lib/db"

interface CampusTableProps {
  campuses: (Campus & { rank: number })[]
}

export default function CampusTable({ campuses }: CampusTableProps) {
  // 날짜 포맷팅 함수
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "날짜 없음"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // 데이터 로딩 상태 확인
  console.log("CampusTable 렌더링, 캠퍼스 수:", campuses.length)

  return (
    <div className="overflow-x-auto">
      {campuses.length > 0 ? (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                캠퍼스명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                포스팅 현황
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                챌린지 상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                최근 포스팅
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상세보기
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campuses.map((campus) => (
              <tr key={campus.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campus.rank}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a
                    href={campus.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {campus.name}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="font-medium">{campus.validPosts}</span>
                    <span className="mx-1">/</span>
                    <span>{campus.totalPosts}</span>
                    <div className="ml-2 w-24 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${(campus.validPosts / 15) * 100 > 100 ? 100 : (campus.validPosts / 15) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {campus.isCompleted ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      성공
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      도전 중
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campus.lastPostDate ? formatDate(campus.lastPostDate) : "포스팅 없음"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/campus/${campus.id}`} className="text-blue-600 hover:text-blue-900 flex items-center">
                    상세보기
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">아직 등록된 캠퍼스가 없습니다</h3>
            <p>관리자 로그인 후 '캠퍼스 추가' 버튼을 클릭하여 첫 번째 캠퍼스를 등록해보세요.</p>
          </div>
        </div>
      )}
    </div>
  )
}
