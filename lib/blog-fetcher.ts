import { db } from "./firebase"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp
} from "firebase/firestore"
import type { Campus, Post } from "./db"

/**
 * Firebase에 저장된 블로그 포스트를 불러옵니다.
 * 실제 블로그 콘텐츠 스크래핑은 runDailyUpdateLocally.js 스크립트를 통해 로컬에서 수행됩니다.
 */
export async function getBlogPostsForCampus(campusId: string): Promise<{
  success: boolean
  message: string
  posts: Post[]
}> {
  try {
    if (!campusId) {
      return {
        success: false,
        message: "캠퍼스 ID가 필요합니다",
        posts: []
      }
    }

    // Firebase에서 해당 캠퍼스의 포스트 가져오기
    const posts = await getPostsFromFirebase(campusId)
    
    return {
      success: true,
      message: `${posts.length}개 포스트를 가져왔습니다`,
      posts
    }
  } catch (error) {
    console.error("블로그 포스트 가져오기 오류:", error)
    return {
      success: false,
      message: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
      posts: []
    }
  }
}

/**
 * Firebase에서 특정 캠퍼스의 포스트를 가져옵니다.
 */
async function getPostsFromFirebase(campusId: string): Promise<Post[]> {
  try {
    const postsRef = collection(db, "posts")
    const q = query(
      postsRef, 
      where("campusId", "==", campusId),
      orderBy("date", "desc") // 최신 포스트 먼저
    )
    
    const querySnapshot = await getDocs(q)
    
    const posts: Post[] = []
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      posts.push({ id: doc.id, ...doc.data() } as Post)
    })
    
    return posts
  } catch (error) {
    console.error("Firebase에서 포스트 가져오기 오류:", error)
    throw error
  }
}

/**
 * 로컬 스크립트 실행 상태를 확인합니다.
 * 이 함수는 단순히 스크립트 실행 상태 정보를 반환합니다.
 * 실제 스크립트 실행은 외부에서 수동으로 진행됩니다.
 */
export async function getScriptStatus(): Promise<{
  lastUpdated: Timestamp | null
  totalProcessed: number
  status: 'ready' | 'running' | 'completed' | 'error'
  message: string
}> {
  try {
    // 스크립트 상태 정보가 저장된 문서 가져오기
    const statusRef = collection(db, "system")
    const statusQuery = query(statusRef, where("id", "==", "scraper_status"))
    const statusSnapshot = await getDocs(statusQuery)
    
    if (statusSnapshot.empty) {
      return {
        lastUpdated: null,
        totalProcessed: 0,
        status: 'ready',
        message: "스크립트 실행 기록이 없습니다. 'runDailyUpdateLocally.js'를 실행하세요."
      }
    }
    
    // 상태 정보 반환
    const statusData = statusSnapshot.docs[0].data()
    return {
      lastUpdated: statusData.lastUpdated || null,
      totalProcessed: statusData.totalProcessed || 0,
      status: statusData.status || 'ready',
      message: statusData.message || "스크립트 상태 정보가 있습니다."
    }
  } catch (error) {
    console.error("스크립트 상태 확인 오류:", error)
    return {
      lastUpdated: null,
      totalProcessed: 0,
      status: 'error',
      message: `상태 확인 중 오류: ${error instanceof Error ? error.message : String(error)}`
    }
  }
} 