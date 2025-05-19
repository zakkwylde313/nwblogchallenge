import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

// 초기 데이터 생성 API 엔드포인트
export async function POST(request: Request) {
  try {
    // 인증 확인
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]

    try {
      const decodedToken = await adminAuth.verifyIdToken(token)

      // 관리자 권한 확인
      const isAdmin =
        decodedToken.admin === true ||
        ["admin@eie-gyeonggi.org", "admin2@eie-gyeonggi.org"].includes(decodedToken.email || "")

      if (!isAdmin) {
        return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: "유효하지 않은 인증 토큰입니다." }, { status: 401 })
    }

    // 샘플 캠퍼스 데이터 생성
    const sampleCampuses = [
      {
        name: "일산캠퍼스",
        url: "https://blog.example.com/ilsan",
        validPosts: 18,
        totalPosts: 20,
        isCompleted: true,
        lastPostDate: new Date("2025-05-17T14:30:00Z"),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        name: "파주캠퍼스",
        url: "https://blog.example.com/paju",
        validPosts: 15,
        totalPosts: 16,
        isCompleted: true,
        lastPostDate: new Date("2025-05-16T09:45:00Z"),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        name: "김포캠퍼스",
        url: "https://blog.example.com/gimpo",
        validPosts: 15,
        totalPosts: 17,
        isCompleted: true,
        lastPostDate: new Date("2025-05-15T18:20:00Z"),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    ]

    const campusPromises = sampleCampuses.map((campus) => addDoc(collection(db, "campuses"), campus))
    await Promise.all(campusPromises)

    return NextResponse.json({
      success: true,
      message: "샘플 데이터가 성공적으로 생성되었습니다.",
      campusCount: sampleCampuses.length,
    })
  } catch (error) {
    console.error("초기 데이터 생성 오류:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
