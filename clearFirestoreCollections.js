// clearFirestoreCollections.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 현재 파일의 경로 가져오기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // .env 파일에서 환경 변수 로드

// Firebase Admin SDK 초기화
try {
  // 환경 변수에서 서비스 계정 키 찾기
  if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON_BASE64) {
    const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON_BASE64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Firebase Admin SDK 초기화 성공 (환경 변수).');
  } 
  // 파일에서 서비스 계정 키 로드 시도
  else if (!admin.apps.length) {
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
      console.log('Firebase Admin SDK 초기화 성공 (파일).');
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

// 컬렉션 내 모든 문서 삭제 함수
async function deleteCollection(collectionName) {
  try {
    console.log(`'${collectionName}' 컬렉션 문서 삭제 시작...`);
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`'${collectionName}' 컬렉션에 문서가 없습니다.`);
      return;
    }
    
    console.log(`'${collectionName}' 컬렉션에서 ${snapshot.size}개의 문서 삭제 중...`);
    
    const deletePromises = [];
    snapshot.forEach(doc => {
      deletePromises.push(doc.ref.delete());
    });
    
    await Promise.all(deletePromises);
    console.log(`'${collectionName}' 컬렉션의 모든 문서 삭제 완료.`);
  } catch (error) {
    console.error(`'${collectionName}' 컬렉션 삭제 중 오류:`, error);
  }
}

// 메인 함수
async function clearAllCollections() {
  try {
    // 삭제할 컬렉션 이름 목록
    const collections = ['campuses', 'posts', 'blogs'];
    
    for (const collection of collections) {
      await deleteCollection(collection);
    }
    
    console.log('모든 컬렉션 삭제 완료.');
  } catch (error) {
    console.error('컬렉션 삭제 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

// 실행
console.log('Firestore 컬렉션 삭제 스크립트 시작...');
clearAllCollections(); 