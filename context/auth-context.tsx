"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

// 인증 컨텍스트 타입 정의
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
  adminStatus: string // 디버깅용 상태 추가
  getIdToken: () => Promise<string | null> // 사용자 토큰 가져오기
}

// 기본값으로 컨텍스트 생성
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
  adminStatus: "초기화되지 않음",
  getIdToken: async () => null,
})

// 인증 컨텍스트 제공자 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminStatus, setAdminStatus] = useState("초기화되지 않음")
  const [isAdmin, setIsAdmin] = useState(false)

  // 관리자 이메일 목록 (실제로는 Firestore에서 관리하거나 환경 변수로 설정)
  const adminEmails = ["admin@nwbc.com"]

  // 사용자의 관리자 여부 확인 함수
  const checkIfUserIsAdmin = (currentUser: User | null) => {
    if (!currentUser || !currentUser.email) {
      console.log("관리자 확인: 사용자가 없거나 이메일이 없음")
      setIsAdmin(false)
      return false
    }

    const userEmail = currentUser.email.toLowerCase()
    const isUserAdmin = adminEmails.includes(userEmail)

    console.log("관리자 확인:", {
      email: userEmail,
      isAdmin: isUserAdmin,
      adminEmails,
      emailInList: adminEmails.includes(userEmail),
    })

    setIsAdmin(isUserAdmin)
    return isUserAdmin
  }

  useEffect(() => {
    // Firebase 인증 상태 변경 감지
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      // 관리자 상태 업데이트
      if (currentUser) {
        const email = currentUser.email || "이메일 없음"
        const isUserAdmin = checkIfUserIsAdmin(currentUser)
        
        setAdminStatus(
          isUserAdmin
            ? `관리자 확인됨 (${email})`
            : `일반 사용자 (${email}), 관리자 이메일 목록: ${adminEmails.join(", ")}`,
        )
      } else {
        setAdminStatus("로그인되지 않음")
        setIsAdmin(false)
      }
    })

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe()
  }, [])

  // 로그인 함수
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const currentUser = userCredential.user
      
      // 로그인 후 관리자 상태 즉시 업데이트
      const isUserAdmin = checkIfUserIsAdmin(currentUser)
      
      setAdminStatus(
        isUserAdmin
          ? `관리자 확인됨 (${email})`
          : `일반 사용자 (${email}), 관리자 이메일 목록: ${adminEmails.join(", ")}`,
      )
      
      console.log("로그인 성공:", { email, isAdmin: isUserAdmin })
    } catch (error) {
      console.error("로그인 오류:", error)
      throw error
    }
  }

  // 로그아웃 함수
  const logout = async () => {
    try {
      await signOut(auth)
      setAdminStatus("로그아웃됨")
      setIsAdmin(false)
    } catch (error) {
      console.error("로그아웃 오류:", error)
      throw error
    }
  }

  // 사용자 토큰 가져오기
  const getIdToken = async () => {
    try {
      if (!user) return null
      // forceRefresh를 true로 설정하여 필요시 토큰을 갱신
      return await user.getIdToken(true)
    } catch (error) {
      console.error("토큰 가져오기 오류:", error)
      return null
    }
  }

  // 컨텍스트 값 제공
  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    adminStatus,
    getIdToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 인증 컨텍스트 사용을 위한 커스텀 훅
export const useAuth = () => useContext(AuthContext)
