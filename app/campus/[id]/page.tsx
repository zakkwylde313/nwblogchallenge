import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import CampusDetail from "@/components/campus-detail"
import { getCampusById, getPostsByCampusId } from "@/lib/db"
import CampusDetailSkeleton from "@/components/campus-detail-skeleton"
import type { Campus, Post } from "@/lib/db"

// 직렬화 함수 추가
function serialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

type CampusPageProps = {
  params: { id: string }
}

export default async function CampusPage(props: CampusPageProps) {
  // params 안전하게 처리
  const id = props.params?.id;
  
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">캠퍼스 ID가 제공되지 않았습니다</h1>
          <Link href="/" className="text-blue-600 hover:underline flex items-center justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> 메인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    )
  }
  
  // 캠퍼스 정보 가져오기
  const campusPromise = getCampusById(id)
  const postsPromise = getPostsByCampusId(id)

  const [campus, posts] = await Promise.all([campusPromise, postsPromise])

  // 데이터를 완전히 직렬화
  const serializedCampus = campus ? serialize(campus) as Campus : null;
  const serializedPosts = posts ? serialize(posts) as Post[] : [];

  if (!serializedCampus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">캠퍼스를 찾을 수 없습니다</h1>
          <Link href="/" className="text-blue-600 hover:underline flex items-center justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> 메인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-blue-600 hover:underline flex items-center mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> 메인 페이지로 돌아가기
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{serializedCampus.name} 블로그 포스팅 현황</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-grow">
        <Suspense fallback={<CampusDetailSkeleton />}>
          <CampusDetail campus={serializedCampus} posts={serializedPosts} />
        </Suspense>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 EiE 경기 서북부 협의회. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
