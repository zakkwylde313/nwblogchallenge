import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function GET() {
  try {
    // 환경 변수 확인
    const envVars = {
      projectId: !!process.env.FIREBASE_PROJECT_ID,
      clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    }

    // Firebase Admin SDK 상태 확인
    const adminStatus = {
      authInitialized: !!adminAuth && typeof adminAuth.verifyIdToken === "function",
      dbInitialized: !!adminDb && typeof adminDb.collection === "function",
    }

    // Firestore 접근 테스트
    let firestoreAccessible = false
    let collections = []

    if (adminStatus.dbInitialized) {
      try {
        const snapshot = await adminDb.listCollections()
        firestoreAccessible = true
        collections = snapshot.map((col) => col.id)
      } catch (error) {
        console.error("Firestore 컬렉션 목록 가져오기 오류:", error)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envVars,
      adminStatus,
      firestoreAccessible,
      collections,
    })
  } catch (error) {
    console.error("Firebase 테스트 API 오류:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })
  }
}
