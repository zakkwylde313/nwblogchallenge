// createTestCampus.js
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 현재 파일의 경로 가져오기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin SDK 초기화
try {
  // 파일에서 서비스 계정 키 로드 시도
  if (!admin.apps.length) {
    try {
      // serviceAccountKey.json 파일 읽기 시도
      const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
      console.log(`서비스 계정 키 파일 경로: ${serviceAccountPath}`);
      
      if (!fs.existsSync(serviceAccountPath)) {
        console.error(`서비스 계정 키 파일을 찾을 수 없습니다: ${serviceAccountPath}`);
        throw new Error('서비스 계정 키 파일이 존재하지 않습니다.');
      }
      
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('Firebase Admin SDK 초기화 성공.');
    } catch (fileError) {
      console.error('서비스 계정 키 파일 로드 오류:', fileError);
      throw new Error(`서비스 계정 키 파일 로드 실패: ${fileError.message}`);
    }
  }
} catch (e) { 
  console.error('Firebase Admin SDK 초기화 오류:', e.message);
  process.exit(1);
}

const db = admin.firestore();

// 테스트 캠퍼스 생성 함수
async function createTestCampus() {
  try {
    // 테스트 캠퍼스 데이터
    const testCampus = {
      name: '테스트 캠퍼스',
      url: 'https://example.com',
      feedUrl: 'https://rss.blog.naver.com/eunharanara.xml', // 네이버 블로그 RSS 예시
      validPosts: 0,
      totalPosts: 0,
      isCompleted: false,
      isActive: true, // 중요: 활성 상태로 설정
      lastPostDate: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Firestore에 캠퍼스 추가
    const docRef = await db.collection('campuses').add(testCampus);
    console.log(`테스트 캠퍼스가 생성되었습니다. ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('테스트 캠퍼스 생성 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
console.log('테스트 캠퍼스 생성 스크립트 시작...');
createTestCampus()
  .then(() => {
    console.log('테스트 캠퍼스 생성 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('스크립트 실행 중 오류 발생:', error);
    process.exit(1);
  }); 