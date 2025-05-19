import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

// 디버깅용 API 엔드포인트
export async function GET() {
  try {
    // Firestore 연결 테스트
    const campusesRef = collection(db, "campuses")
    const querySnapshot = await getDocs(campusesRef)

    const campuses: any[] = []
    querySnapshot.forEach((doc) => {
      campuses.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return NextResponse.json({
      success: true,
      message: "Firestore 연결 성공",
      campusCount: campuses.length,
      campuses: campuses.map((c) => ({
        id: c.id,
        name: c.name,
        url: c.url,
      })),
    })
  } catch (error) {
    console.error("디버그 API 오류:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
