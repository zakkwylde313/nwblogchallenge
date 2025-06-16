import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

// Firebase Admin SDK 초기화 함수
function initializeFirebaseAdmin() {
  try {
    // Base64 서비스 계정 키 사용 (Vercel용)
    const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON_BASE64
    
    if (serviceAccountKeyBase64) {
      console.log("Base64 서비스 계정 키 사용")
      const serviceAccountKey = JSON.parse(Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8'))
      
      // 이미 초기화되었는지 확인
      if (getApps().length > 0) {
        console.log("Firebase Admin SDK가 이미 초기화되어 있습니다.")
        return
      }

      // Firebase Admin SDK 초기화
      initializeApp({
        credential: cert(serviceAccountKey),
      })

      console.log("Firebase Admin SDK가 성공적으로 초기화되었습니다 (Base64).")
      return
    }

    // 기존 방식 (로컬용)
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY

    console.log("Firebase Admin SDK 환경 변수 확인:", {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      projectId: projectId,
      clientEmail: clientEmail,
      privateKeyStart: privateKey?.substring(0, 50)
    })

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

// 인스턴스 내보내기 (지연 초기화)
export const adminDb = {
  collection: (path: string) => {
    try {
      return getFirestore().collection(path)
    } catch (error) {
      console.error("Firestore 인스턴스 가져오기 오류:", error)
      throw new Error("Firestore가 초기화되지 않았습니다.")
    }
  }
}

export const adminAuth = {
  verifyIdToken: async (token: string) => {
    try {
      return await getAuth().verifyIdToken(token)
    } catch (error) {
      console.error("Auth 인스턴스 가져오기 오류:", error)
      throw new Error("Auth가 초기화되지 않았습니다.")
    }
  }
}

