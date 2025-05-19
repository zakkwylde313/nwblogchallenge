import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

// Firebase Admin SDK 초기화 함수
function initializeFirebaseAdmin() {
  try {
    // 환경 변수 확인
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY

    // 환경 변수 검증
    if (!projectId || !clientEmail || !privateKey) {
      console.error("Firebase Admin SDK 환경 변수가 누락되었습니다:", {
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
      })
      throw new Error("Firebase Admin SDK 환경 변수가 누락되었습니다")
    }

    // 이미 초기화되었는지 확인
    if (getApps().length > 0) {
      console.log("Firebase Admin SDK가 이미 초기화되어 있습니다.")
      return
    }

    // 개행 문자 처리
    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n")

    // Firebase Admin SDK 초기화
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    })

    console.log("Firebase Admin SDK가 성공적으로 초기화되었습니다.")
  } catch (error) {
    console.error("Firebase Admin SDK 초기화 오류:", error)
    throw new Error(`Firebase Admin SDK 초기화 실패: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 안전하게 Firestore 인스턴스 가져오기
function getFirestoreInstance() {
  try {
    return getFirestore()
  } catch (error) {
    console.error("Firestore 인스턴스 가져오기 오류:", error)
    throw new Error(`Firestore 인스턴스 가져오기 실패: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 안전하게 Auth 인스턴스 가져오기
function getAuthInstance() {
  try {
    return getAuth()
  } catch (error) {
    console.error("Auth 인스턴스 가져오기 오류:", error)
    throw new Error(`Auth 인스턴스 가져오기 실패: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 초기화 시도
try {
  initializeFirebaseAdmin()
} catch (error) {
  console.error("Firebase Admin 초기화 중 치명적 오류:", error)
  // 초기화 실패해도 앱이 계속 실행되도록 함
}

// 인스턴스 내보내기
let adminDb: any
let adminAuth: any

try {
  adminDb = getFirestoreInstance()
  adminAuth = getAuthInstance()
} catch (error) {
  console.error("Firebase Admin 서비스 초기화 오류:", error)
  // 기본 객체 제공
  adminDb = {
    collection: () => {
      throw new Error("Firestore가 초기화되지 않았습니다.")
    },
  }
  adminAuth = {
    verifyIdToken: () => {
      throw new Error("Auth가 초기화되지 않았습니다.")
    },
  }
}

export { adminDb, adminAuth }
