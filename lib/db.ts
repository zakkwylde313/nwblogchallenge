import { db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore"

// 타입 정의
export interface Campus {
  id: string
  name: string
  url: string
  feedUrl?: string // RSS 피드 URL 추가
  validPosts: number
  totalPosts: number
  isCompleted: boolean
  lastPostDate: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Post {
  id: string
  campusId: string
  number: number
  title: string
  url: string
  link?: string // 스크린샷에서 보이는 필드 추가
  wordCount: number
  imageCount: number
  isValid: boolean
  isRecognized?: boolean // 스크린샷에서 보이는 필드 추가
  feedback: string
  date: Timestamp
  publishDate?: Timestamp // 스크린샷에서 보이는 필드 추가
  scrapedAt?: Timestamp // 스크린샷에서 보이는 필드 추가
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 캠퍼스 관련 함수
export async function getAllCampuses() {
  try {
    console.log("캠퍼스 목록 조회 시작")
    const campusesRef = collection(db, "campuses")

    // 단일 필드로만 정렬하여 인덱스 오류 방지
    const q = query(campusesRef, orderBy("validPosts", "desc"))
    console.log("쿼리 생성 완료:", q)

    const querySnapshot = await getDocs(q)
    console.log("쿼리 실행 완료, 문서 수:", querySnapshot.size)

    const campuses: any[] = []
    let rank = 1
    let prevValidPosts = -1
    let sameRankCount = 0

    querySnapshot.forEach((doc) => {
      console.log("캠퍼스 문서 처리:", doc.id)
      const data = doc.data() as Omit<Campus, "id">

      // 순위 계산 로직
      if (prevValidPosts !== data.validPosts) {
        rank += sameRankCount
        sameRankCount = 1
        prevValidPosts = data.validPosts
      } else {
        sameRankCount++
      }

      campuses.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        lastPostDate: data.lastPostDate ? data.lastPostDate.toDate().toISOString() : null,
        rank,
      } as unknown as Campus & { rank: number })
    })

    console.log("캠퍼스 데이터 처리 완료, 개수:", campuses.length)

    // JavaScript에서 두 번째 정렬 기준(lastPostDate) 적용
    campuses.sort((a, b) => {
      // 먼저 validPosts로 정렬 (이미 Firestore에서 정렬됨)
      if (a.validPosts !== b.validPosts) {
        return b.validPosts - a.validPosts
      }

      // validPosts가 같으면 lastPostDate로 정렬 (ISO 문자열 비교)
      const dateA = a.lastPostDate || ''
      const dateB = b.lastPostDate || ''
      // ISO 문자열은 기본 문자열 비교만으로도 날짜 순서대로 정렬됨
      return dateB.localeCompare(dateA)
    })

    return campuses
  } catch (error) {
    console.error("캠퍼스 목록 조회 오류:", error)
    // 오류 발생 시 빈 배열 반환
    return []
  }
}

export async function getCampusById(id: string) {
  try {
    const docRef = doc(db, "campuses", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data();
    
    // Timestamp 객체를 ISO 문자열로 변환
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      lastPostDate: data.lastPostDate ? data.lastPostDate.toDate().toISOString() : null,
    }
  } catch (error) {
    console.error(`캠퍼스 ID ${id} 조회 오류:`, error)
    throw error
  }
}

export async function createCampus(
  data: Omit<Campus, "id" | "createdAt" | "updatedAt" | "validPosts" | "totalPosts" | "isCompleted" | "lastPostDate">,
) {
  try {
    const campusData = {
      ...data,
      validPosts: 0,
      totalPosts: 0,
      isCompleted: false,
      lastPostDate: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "campuses"), campusData)
    return docRef.id
  } catch (error) {
    console.error("캠퍼스 생성 오류:", error)
    throw error
  }
}

export async function updateCampus(id: string, data: Partial<Omit<Campus, "id" | "createdAt" | "updatedAt">>) {
  try {
    const docRef = doc(db, "campuses", id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error(`캠퍼스 ID ${id} 업데이트 오류:`, error)
    throw error
  }
}

export async function deleteCampus(id: string) {
  try {
    // 캠퍼스 삭제 전 관련 포스트 모두 삭제
    const postsRef = collection(db, "posts")
    const q = query(postsRef, where("campusId", "==", id))
    const querySnapshot = await getDocs(q)

    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    // 캠퍼스 삭제
    const docRef = doc(db, "campuses", id)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error(`캠퍼스 ID ${id} 삭제 오류:`, error)
    throw error
  }
}

// 포스트 관련 함수
export async function getPostsByCampusId(campusId: string) {
  try {
    console.log(`캠퍼스 ID ${campusId}의 포스트 목록 조회 시작`)

    // 캠퍼스 ID 유효성 검사
    if (!campusId || typeof campusId !== "string") {
      console.error("유효하지 않은 캠퍼스 ID:", campusId)
      throw new Error("유효하지 않은 캠퍼스 ID입니다")
    }

    // Firestore 컬렉션 참조 생성
    let postsRef
    try {
      postsRef = collection(db, "posts")
      console.log("Firestore 컬렉션 참조 생성 성공")
    } catch (refError) {
      console.error("Firestore 컬렉션 참조 생성 오류:", refError)
      throw new Error(
        `Firestore 컬렉션 참조 생성 오류: ${refError instanceof Error ? refError.message : String(refError)}`,
      )
    }

    // 쿼리 생성 - campusId 필드가 없는 경우를 위한 디버깅 로그 추가
    let q
    try {
      console.log("쿼리 생성 시도 - campusId:", campusId)
      q = query(postsRef, where("campusId", "==", campusId))
      console.log("쿼리 생성 완료:", q)
    } catch (queryError) {
      console.error("쿼리 생성 오류:", queryError)
      throw new Error(`쿼리 생성 오류: ${queryError instanceof Error ? queryError.message : String(queryError)}`)
    }

    // 쿼리 실행
    let querySnapshot
    try {
      querySnapshot = await getDocs(q)
      console.log(`쿼리 실행 완료, 문서 수: ${querySnapshot.size}`)

      // 문서가 없는 경우 디버깅을 위해 모든 포스트의 campusId 필드 확인
      if (querySnapshot.size === 0) {
        console.log("문서가 없습니다. 모든 포스트 확인 중...")
        const allPostsSnapshot = await getDocs(collection(db, "posts"))
        const campusIds = new Set<string>()
        allPostsSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.campusId) {
            campusIds.add(data.campusId)
          } else {
            console.log(`campusId 필드가 없는 문서 발견: ${doc.id}`)
          }
        })
        console.log("발견된 campusId 목록:", Array.from(campusIds))
      }
    } catch (queryError) {
      console.error(`캠퍼스 ID ${campusId}의 쿼리 실행 오류:`, queryError)
      throw new Error(
        `Firestore 쿼리 실행 오류: ${queryError instanceof Error ? queryError.message : String(queryError)}`,
      )
    }

    // 결과 처리
    const posts: Post[] = []

    // 각 문서 처리
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data()
        console.log(`문서 ID ${doc.id}의 데이터:`, data)

        // 필수 필드 확인
        if (!data) {
          console.warn(`문서 ID ${doc.id}에 데이터가 없습니다`)
          return // 이 문서는 건너뜀
        }

        // 타임스탬프 필드 확인 및 안전하게 처리
        const post: any = {
          id: doc.id,
          ...data,
          // Timestamp 필드를 ISO 문자열로 변환
          date: data.date ? data.date.toDate().toISOString() : null,
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
          updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
          publishDate: data.publishDate ? data.publishDate.toDate().toISOString() : null,
          scrapedAt: data.scrapedAt ? data.scrapedAt.toDate().toISOString() : null,
        }

        // 필수 필드가 없는 경우 기본값 설정
        if (!post.title) post.title = "제목 없음"
        if (!post.url) post.url = ""
        if (!post.wordCount && post.wordCount !== 0) post.wordCount = 0
        if (!post.imageCount && post.imageCount !== 0) post.imageCount = 0
        if (post.isValid === undefined) post.isValid = false
        if (!post.feedback) post.feedback = ""
        if (!post.number) post.number = 0

        // campusId 필드 확인 (디버깅용)
        if (post.campusId !== campusId) {
          console.warn(`문서 ID ${doc.id}의 campusId가 일치하지 않습니다: ${post.campusId} !== ${campusId}`)
        }

        posts.push(post as Post)
      } catch (docError) {
        console.error(`문서 ID ${doc.id} 처리 오류:`, docError)
        // 개별 문서 오류는 건너뛰고 계속 진행
      }
    })

    // JavaScript에서 정렬 (Firestore 대신)
    posts.sort((a, b) => (a.number || 0) - (b.number || 0))

    console.log(`캠퍼스 ID ${campusId}의 포스트 ${posts.length}개 조회 완료`)
    return posts
  } catch (error) {
    console.error(`캠퍼스 ID ${campusId}의 포스트 목록 조회 오류:`, error)
    throw error
  }
}

export async function createPost(data: Omit<Post, "id" | "createdAt" | "updatedAt" | "isValid">) {
  try {
    // 포스트 유효성 검사 (1000자 이상, 이미지 3장 이상)
    const isValid = data.wordCount >= 1000 && data.imageCount >= 3

    const postData = {
      ...data,
      isValid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "posts"), postData)

    // 캠퍼스 정보 업데이트 (포스트 수, 유효 포스트 수, 최근 포스팅 날짜)
    await updateCampusPostStats(data.campusId)

    return docRef.id
  } catch (error) {
    console.error("포스트 생성 오류:", error)
    throw error
  }
}

export async function updatePost(id: string, data: Partial<Omit<Post, "id" | "createdAt" | "updatedAt">>) {
  try {
    const docRef = doc(db, "posts", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error("포스트를 찾을 수 없습니다.")
    }

    const currentData = docSnap.data() as Post

    // 워드 카운트나 이미지 카운트가 변경된 경우 유효성 재계산
    let isValid = currentData.isValid
    if (data.wordCount !== undefined || data.imageCount !== undefined) {
      const wordCount = data.wordCount ?? currentData.wordCount
      const imageCount = data.imageCount ?? currentData.imageCount
      isValid = wordCount >= 1000 && imageCount >= 3
    }

    await updateDoc(docRef, {
      ...data,
      isValid,
      updatedAt: serverTimestamp(),
    })

    // 캠퍼스 정보 업데이트
    await updateCampusPostStats(currentData.campusId)

    return true
  } catch (error) {
    console.error(`포스트 ID ${id} 업데이트 오류:`, error)
    throw error
  }
}

export async function deletePost(id: string) {
  try {
    const docRef = doc(db, "posts", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error("포스트를 찾을 수 없습니다.")
    }

    const campusId = (docSnap.data() as Post).campusId

    await deleteDoc(docRef)

    // 캠퍼스 정보 업데이트
    await updateCampusPostStats(campusId)

    return true
  } catch (error) {
    console.error(`포스트 ID ${id} 삭제 오류:`, error)
    throw error
  }
}

// 캠퍼스 포스트 통계 업데이트 함수
export async function updateCampusPostStats(campusId: string) {
  try {
    console.log(`캠퍼스 ID ${campusId}의 포스트 통계 업데이트 시작`)

    // 캠퍼스의 모든 포스트 가져오기
    const postsRef = collection(db, "posts")
    const q = query(postsRef, where("campusId", "==", campusId))
    const querySnapshot = await getDocs(q)

    let totalPosts = 0
    let validPosts = 0
    let lastPostDate: Timestamp | null = null

    querySnapshot.forEach((doc) => {
      const post = doc.data() as Post
      totalPosts++
      
      if (post.isValid) {
        validPosts++
      }

      // 가장 최근 포스트 날짜 찾기
      if (post.date) {
        if (!lastPostDate || post.date.toMillis() > lastPostDate.toMillis()) {
          lastPostDate = post.date
        }
      }
    })

    // 목표 달성 여부 확인 (15개 이상의 인정 포스팅)
    const isCompleted = validPosts >= 15

    // 캠퍼스 정보 업데이트
    const campusRef = doc(db, "campuses", campusId)
    await updateDoc(campusRef, {
      validPosts,
      totalPosts,
      lastPostDate,
      isCompleted,
      updatedAt: serverTimestamp(),
    })

    console.log(`캠퍼스 ID ${campusId}의 통계 업데이트 완료: ${validPosts}개 유효 포스트, ${totalPosts}개 전체 포스트`)

    return {
      validPosts,
      totalPosts,
      lastPostDate,
      isCompleted,
    }
  } catch (error) {
    console.error(`캠퍼스 ID ${campusId}의 통계 업데이트 오류:`, error)
    throw error
  }
}

// 대시보드 통계 관련 함수
export async function getDashboardStats() {
  try {
    // 총 참가 캠퍼스 수
    const campusesRef = collection(db, "campuses")
    const campusesSnapshot = await getDocs(campusesRef)
    const totalCampuses = campusesSnapshot.size

    // 오늘 포스팅 등록한 캠퍼스 수
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = Timestamp.fromDate(today)

    const postsRef = collection(db, "posts")
    const todayPostsQuery = query(postsRef, where("date", ">=", todayTimestamp))
    const todayPostsSnapshot = await getDocs(todayPostsQuery)

    // 중복 캠퍼스 제거를 위한 Set
    const todayPostedCampuses = new Set<string>()
    todayPostsSnapshot.forEach((doc) => {
      const post = doc.data() as Post
      todayPostedCampuses.add(post.campusId)
    })

    // TOP3 캠퍼스 - 단일 필드로만 정렬
     const snap = await getDocs(
      query(
        campusesRef,
        orderBy("validPosts", "desc"),
        limit(5)      // 5나 10 정도 여유 있게 잡아도 OK
      )
    )

    // posting 수와 lastPostDate(밀리초) 함께 매핑
    const list = snap.docs.map(doc => {
      const c = doc.data() as Campus
      return {
        id: doc.id,
        name: c.name,
        validPosts: c.validPosts,
        // Timestamp → 밀리초로 변환. null이면 0
        lastPostDate: c.lastPostDate?.toMillis() ?? 0
      }
    })

    // validPosts 내림차순, 동률이면 lastPostDate 내림차순
    list.sort((a, b) => {
      if (b.validPosts !== a.validPosts) return b.validPosts - a.validPosts
      return b.lastPostDate - a.lastPostDate
    })

    // 그중 상위 2개만 잘라내기
    const topCampuses = list
      .slice(0, 2)
      .map(({ id, name, validPosts }) => ({ id, name, validPosts }))

    return {
      totalCampuses,
      todayPostedCampuses: todayPostedCampuses.size,
      topCampuses,
    }
  } catch (error) {
    console.error("대시보드 통계 조회 오류:", error)
    // 오류 발생 시 기본값 반환
    return {
      totalCampuses: 0,
      todayPostedCampuses: 0,
      topCampuses: [],
    }
  }
}
