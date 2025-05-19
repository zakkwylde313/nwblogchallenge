"use client"

import { useEffect, useState } from "react"
import { PenToolIcon as Tool } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import type { Campus } from "@/lib/db"

interface AdminToolsButtonProps {
  campuses: Campus[]
}

export default function AdminToolsButton({ campuses }: AdminToolsButtonProps) {
  const { isAdmin } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isAdmin) {
    return null
  }

  // 더 이상 특정 기능이 없으므로 버튼을 숨김
  // 나중에 관리자 기능을 추가할 때 이 컴포넌트를 다시 활성화할 수 있음
  return null
}
