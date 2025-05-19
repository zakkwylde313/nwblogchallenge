import { auth } from './firebase';
import { getIdTokenResult } from 'firebase/auth';
import { cookies } from 'next/headers';

// 사용자 세션 및 권한 정보를 나타내는 인터페이스
export interface AuthSession {
  uid: string;
  email: string | null;
  isAdmin: boolean;
}

// 서버 컴포넌트에서 인증 정보 가져오기
export async function getAuth(): Promise<AuthSession | null> {
  try {
    // 쿠키에서 세션 토큰 가져오기
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie || !sessionCookie.value) {
      console.log('세션 쿠키가 없음');
      return null;
    }
    
    // 세션 토큰 검증 (실제 구현에서는 Firebase Admin SDK로 서버 측 검증 필요)
    // 이 예제에서는 간단하게 클라이언트 SDK로 처리
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('현재 로그인한 사용자가 없음');
      return null;
    }
    
    // 사용자 권한 확인
    const tokenResult = await getIdTokenResult(currentUser);
    const isAdmin = tokenResult.claims.admin === true || 
                   tokenResult.claims.role === 'admin' || 
                   ['admin@example.com', 'test@example.com'].includes(currentUser.email || '');
    
    return {
      uid: currentUser.uid,
      email: currentUser.email,
      isAdmin: isAdmin,
    };
  } catch (error) {
    console.error('인증 정보 가져오기 오류:', error);
    return null;
  }
} 