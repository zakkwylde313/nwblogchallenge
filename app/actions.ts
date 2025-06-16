"use server"

import { revalidatePath } from "next/cache"
import { createCampus, updateCampus, deleteCampus, createPost, updatePost, deletePost } from "@/lib/db"
import { Timestamp } from "firebase/firestore"
import { adminAuth } from "@/lib/firebase-admin"

// 캠퍼스 관련 서버 액션
export async function addCampus(formData: FormData) {
  try {
    console.log("캠퍼스 추가 서버 액션 시작")
    const name = formData.get("name") as string
    const url = formData.get("url") as string
    const feedUrl = formData.get("feedUrl") as string | null

    console.log("입력 데이터:", { name, url, feedUrl })

    if (!name || !url) {
      console.log("필수 입력값 누락")
      return { error: "캠퍼스 이름과 URL은 필수 항목입니다." }
    }

    const campusData: any = { name, url }
    if (feedUrl) campusData.feedUrl = feedUrl

    console.log("createCampus 함수 호출 전")
    const campusId = await createCampus(campusData)
    console.log("createCampus 함수 호출 완료, ID:", campusId)
    
    revalidatePath("/")
    return { success: true, campusId }
  } catch (error) {
    // 오류 객체를 상세하게 로깅
    console.error("캠퍼스 추가 오류:", error)
    console.error("오류 세부 정보:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    
    // 더 구체적인 오류 메시지 반환
    return { 
      error: `캠퍼스 추가 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

export async function editCampus(formData: FormData) {
  try {
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const url = formData.get("url") as string
    const feedUrl = formData.get("feedUrl") as string | null

    if (!id || !name || !url) {
      return { error: "필수 항목이 누락되었습니다." }
    }

    const campusData: any = { name, url }
    if (feedUrl !== undefined) campusData.feedUrl = feedUrl || null

    await updateCampus(id, campusData)
    revalidatePath("/")
    revalidatePath(`/campus/${id}`)
    return { success: true }
  } catch (error) {
    console.error("캠퍼스 수정 오류:", error)
    return { error: "캠퍼스 수정 중 오류가 발생했습니다." }
  }
}

export async function removeCampus(formData: FormData) {
  try {
    const id = formData.get("id") as string

    if (!id) {
      return { error: "캠퍼스 ID가 필요합니다." }
    }

    await deleteCampus(id)
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("캠퍼스 삭제 오류:", error)
    return { error: "캠퍼스 삭제 중 오류가 발생했습니다." }
  }
}

// 포스트 관련 서버 액션
export async function addPost(formData: FormData) {
  try {
    const campusId = formData.get("campusId") as string
    const title = formData.get("title") as string
    const url = formData.get("url") as string
    const wordCount = Number.parseInt(formData.get("wordCount") as string, 10)
    const imageCount = Number.parseInt(formData.get("imageCount") as string, 10)
    const dateStr = formData.get("date") as string
    const feedback = (formData.get("feedback") as string) || ""

    if (!campusId || !title || !url || isNaN(wordCount) || isNaN(imageCount) || !dateStr) {
      return { error: "필수 항목이 누락되었습니다." }
    }

    // 포스트 번호 자동 계산 (서버에서 처리)
    const date = new Date(dateStr)

    const postId = await createPost({
      campusId,
      title,
      url,
      wordCount,
      imageCount,
      feedback,
      date: Timestamp.fromDate(date),
      number: 0, // 서버에서 자동 계산
    })

    revalidatePath("/")
    revalidatePath(`/campus/${campusId}`)
    return { success: true, postId }
  } catch (error) {
    console.error("포스트 추가 오류:", error)
    return { error: "포스트 추가 중 오류가 발생했습니다." }
  }
}

export async function editPost(formData: FormData) {
  try {
    const id = formData.get("id") as string
    const title = formData.get("title") as string
    const url = formData.get("url") as string
    const wordCount = Number.parseInt(formData.get("wordCount") as string, 10)
    const imageCount = Number.parseInt(formData.get("imageCount") as string, 10)
    const dateStr = formData.get("date") as string
    const feedback = formData.get("feedback") as string

    if (!id || !title || !url || isNaN(wordCount) || isNaN(imageCount) || !dateStr) {
      return { error: "필수 항목이 누락되었습니다." }
    }

    const date = new Date(dateStr)

    await updatePost(id, {
      title,
      url,
      wordCount,
      imageCount,
      feedback,
      date: Timestamp.fromDate(date),
    })

    // 캠퍼스 ID를 알 수 없으므로 홈 페이지만 리밸리데이트
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("포스트 수정 오류:", error)
    return { error: "포스트 수정 중 오류가 발생했습니다." }
  }
}

export async function updateFeedback(formData: FormData) {
  try {
    const id = formData.get("id") as string
    const feedback = formData.get("feedback") as string
    const campusId = formData.get("campusId") as string
    const authToken = formData.get("authToken") as string

    if (!id) {
      throw new Error("포스트 ID가 필요합니다.")
    }

    if (!campusId) {
      throw new Error("캠퍼스 ID가 필요합니다.")
    }

    if (!authToken) {
      throw new Error("인증 토큰이 필요합니다.")
    }

    // 인증 토큰 검증
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(authToken);
      console.log("인증 토큰 검증 성공:", { uid: decodedToken.uid });
    } catch (authError) {
      console.error("인증 토큰 검증 실패:", authError);
      throw new Error("인증이 유효하지 않습니다. 다시 로그인해주세요.");
    }

    // 관리자 UID 목록
    const adminUids = ['3c9sqD8PNOTrdiCCz0fqnC5EZln1', 'Fy8mL3P0axM6QnqMEPBKgpUvIDk2'];
    
    // 관리자 권한 확인
    if (!adminUids.includes(decodedToken.uid)) {
      console.error("관리자 권한 없음:", { uid: decodedToken.uid });
      throw new Error("관리자 권한이 필요합니다.");
    }

    console.log("피드백 업데이트 시작:", { 
      id, 
      campusId, 
      feedbackLength: feedback?.length,
      uid: decodedToken.uid 
    });

    try {
      await updatePost(id, { feedback })
      console.log("피드백 업데이트 성공");
      revalidatePath(`/campus/${campusId}`)
      return { success: true }
    } catch (error) {
      // Firestore 오류를 더 구체적으로 처리
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any)?.code;
      
      console.error("피드백 업데이트 실패:", {
        error,
        code: errorCode,
        message: errorMessage,
        uid: decodedToken.uid
      });

      // 권한 관련 오류인 경우
      if (errorCode === 'permission-denied') {
        throw new Error("피드백을 저장할 권한이 없습니다. 관리자로 로그인되어 있는지 확인해주세요.");
      }
      
      // 문서를 찾을 수 없는 경우
      if (errorCode === 'not-found') {
        throw new Error("포스트를 찾을 수 없습니다.");
      }

      // 기타 오류
      throw new Error(`피드백 업데이트 중 오류가 발생했습니다: ${errorMessage}`);
    }
  } catch (error) {
    // 최종 오류 처리
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("피드백 업데이트 최종 오류:", {
      error,
      message: errorMessage
    });
    return { error: errorMessage }
  }
}

// 포스트 삭제 서버 액션 (이미 구현되어 있음)
export async function removePost(formData: FormData) {
  try {
    const id = formData.get("id") as string
    const campusId = formData.get("campusId") as string

    if (!id) {
      return { error: "포스트 ID가 필요합니다." }
    }

    await deletePost(id)

    revalidatePath("/")
    revalidatePath(`/campus/${campusId}`)
    return { success: true }
  } catch (error) {
    console.error("포스트 삭제 오류:", error)
    return { error: "포스트 삭제 중 오류가 발생했습니다." }
  }
}
