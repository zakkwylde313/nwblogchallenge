// runDailyUpdateLocally.js

import admin from 'firebase-admin';
import puppeteer from 'puppeteer';
import RssParser from 'rss-parser';
import fs from 'fs'; 
import path from 'path'; 
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 현재 파일의 경로 가져오기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); 

// --- Firebase Admin SDK 초기화 ---
try {
  // 환경 변수에서 서비스 계정 키 찾기
  if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON_BASE64) {
    const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON_BASE64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Firebase Admin SDK initialized from environment variable.');
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
      console.log('Firebase Admin SDK initialized from serviceAccountKey.json file.');
    } catch (fileError) {
      console.error('서비스 계정 키 파일 로드 오류:', fileError);
      throw new Error(`서비스 계정 키 파일 로드 실패: ${fileError.message}`);
    }
  }
} catch (e) { 
  console.error('Firebase Admin SDK initialization error:', e.message);
  process.exit(1);
}
const db = admin.firestore();
const rssParser = new RssParser();

// --- 한국 시간 관련 유틸리티 함수 ---
// UTC 날짜/시간을 한국 시간(KST)으로 변환
function convertToKST(date) {
  // 시간대 차이 (UTC+9)
  const koreaTimeDiff = 9 * 60 * 60 * 1000; 
  return new Date(date.getTime() + koreaTimeDiff);
}

// 한국 시간(KST) 날짜/시간을 UTC로 변환
function convertToUTC(koreaDate) {
  // 시간대 차이 (UTC+9)
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  return new Date(koreaDate.getTime() - koreaTimeDiff);
}

// 현재 한국 시간 가져오기
function getCurrentKoreanTime() {
  return convertToKST(new Date());
}

// 날짜를 한국 형식으로 포맷팅
function formatKoreanDate(date) {
  const kstDate = convertToKST(date);
  return kstDate.toLocaleString('ko-KR', { 
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// 한국 시간 문자열을 Date 객체로 변환
function parseKoreanTime(dateString) {
  // 한국시간 형식 파싱 (예: '2025-05-01 00:00:00')
  const [datePart, timePart] = dateString.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  
  // 한국 시간으로 Date 객체 생성
  const koreaDate = new Date(year, month - 1, day, hours, minutes, seconds);
  
  // UTC로 변환
  return convertToUTC(koreaDate);
}

// --- 설정값 ---
// 한국 시간(KST) 기준으로 설정 (UTC+9)
// 한국시간 2025년 5월 1일 00:00:00는 UTC로 2025-04-30T15:00:00Z
const CHALLENGE_START_DATE = new Date(process.env.CHALLENGE_START_DATE || '2025-06-08T15:00:00Z'); // 한국시간 2025년 5월 10일 0시
const CHALLENGE_END_DATE = new Date(process.env.CHALLENGE_END_DATE || '2025-07-08T14:59:59Z');   // 한국시간 2025년 5월 31일 23시 59분 59초
const POST_RECOGNITION_CRITERIA = {
  minCharCountNoSpaces: parseInt(process.env.MIN_CHAR_COUNT || '1000', 10),
  minImageCount: parseInt(process.env.MIN_IMAGE_COUNT || '3', 10),
};

console.log('--- 설정값 ---');
console.log('챌린지 시작일(UTC):', CHALLENGE_START_DATE.toISOString());
console.log('챌린지 시작일(KST):', new Date(CHALLENGE_START_DATE.getTime() + 9 * 60 * 60 * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
console.log('챌린지 종료일(UTC):', CHALLENGE_END_DATE.toISOString());
console.log('챌린지 종료일(KST):', new Date(CHALLENGE_END_DATE.getTime() + 9 * 60 * 60 * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
console.log('포스팅 인정 기준 (글자수/이미지수):', POST_RECOGNITION_CRITERIA.minCharCountNoSpaces, '/', POST_RECOGNITION_CRITERIA.minImageCount);
console.log('---------------');

// --- scrapeNaverBlogPost 함수 (내용 동일) ---
async function scrapeNaverBlogPost(page, url) {
  try {
    console.log(`[Scraper] 페이지로 이동 중: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log(`[Scraper] 메인 iframe을 찾습니다...`);
    const iframeElementHandle = await page.waitForSelector('iframe#mainFrame', { timeout: 15000 }).catch(() => null);
    if (!iframeElementHandle) {
      console.error('[Scraper] mainFrame iframe을 찾지 못했습니다.');
      return { success: false, error: 'mainFrame iframe을 찾지 못했습니다.' };
    }
    const frame = await iframeElementHandle.contentFrame();
    if (!frame) {
      console.error('[Scraper] 메인 iframe의 contentFrame을 가져올 수 없습니다.');
      return { success: false, error: '메인 iframe의 contentFrame을 가져올 수 없습니다.' };
    }
    console.log('[Scraper] 메인 iframe에 접근했습니다.');
    const postData = await frame.evaluate((criteria) => {
      const contentElement = document.querySelector('div.se-main-container') || document.querySelector('div#postViewArea');
      if (!contentElement) {
        return { success: false, error: '콘텐츠 요소를 찾을 수 없습니다.', text: '', charCountWithSpaces: 0, charCountNoSpaces: 0, imageCount: 0, allImageSources: [], filteredImageSources: [] };
      }
      const selectorsToRemove = [
        'div.se-module.se-module-map-text', 'div.se-module.se-module-map-image', '.map_polyvore',
      ];
      selectorsToRemove.forEach(selector => {
        contentElement.querySelectorAll(selector).forEach(el => el.remove());
      });
      const rawText = contentElement.innerText;
      const text = rawText.trim();
      const charCountWithSpaces = text.length;
      const cleanedTextForCount = text.replace(/[\s\u200B-\u200D\uFEFF]+/g, '');
      const charCountNoSpaces = cleanedTextForCount.length;
      const allImages = contentElement.querySelectorAll('img');
      const allImageSources = [];
      const filteredImageSources = [];
      allImages.forEach(img => {
        const src = img.getAttribute('src');
        if (src) {
          allImageSources.push(src);
          if (
            src.includes('map.pstatic.net/nrb/') || src.includes('common-icon-places-marker') ||
            src.includes('ssl.pstatic.net/static/maps/mantle/') || src.includes('simg.pstatic.net/static.map/v2/map/staticmap.bin') ||
            (src.startsWith('data:image/') && src.length < 200) ||
            (img.width && img.width < 30) || (img.height && img.height < 30)
          ) { /* 필터링 */ } else {
            filteredImageSources.push(src);
          }
        }
      });
      const imageCount = filteredImageSources.length;
      const isRecognized = charCountNoSpaces >= criteria.minCharCountNoSpaces && imageCount >= criteria.minImageCount;
      return {
        success: true, text, charCountWithSpaces, charCountNoSpaces, imageCount,
        allImageSources, filteredImageSources, isRecognized
      };
    }, POST_RECOGNITION_CRITERIA);
    console.log(`[Scraper] 데이터 추출 완료: ${url}`);
    return postData;
  } catch (error) {
    console.error(`[Scraper] ${url} 스크래핑 중 오류:`, error.message, error.stack);
    return { success: false, error: error.message };
  }
}

// --- 메인 실행 함수 ---
async function runDailyUpdate() {
  let browser = null;
  let puppeteerPage = null;

  try {
    console.log('일일 블로그 업데이트 작업을 시작합니다...');
    
    console.log('[Launcher] 로컬 Puppeteer 브라우저를 실행합니다...');
    browser = await puppeteer.launch({
      headless: true, 
      // args: ['--no-sandbox'] 
    });
    console.log('[Launcher] Puppeteer 브라우저 실행 성공.');
    
    puppeteerPage = await browser.newPage();
    await puppeteerPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    console.log('[Launcher] 페이지 준비 및 User-Agent 설정 완료.');

    const campusesSnapshot = await db.collection('campuses').where('isActive', '==', true).get(); 
    if (campusesSnapshot.empty) {
      console.log('처리할 활성 캠퍼스가 없습니다.');
      return;
    }

    console.log(`\n총 ${campusesSnapshot.size}개의 활성 캠퍼스에 대해 업데이트를 시작합니다.`);
    for (const campusDoc of campusesSnapshot.docs) {
      const campusData = campusDoc.data(); 
      const campusId = campusDoc.id;
      console.log(`\n[${campusData.name || campusId}] 캠퍼스 처리 중...`);

      if (!campusData.feedUrl) {
        console.warn(`  - ${campusData.name}: RSS 피드 URL이 없어 건너뜁니다.`);
        continue;
      }

      let feed;
      try {
        feed = await rssParser.parseURL(campusData.feedUrl);
        console.log(`  - RSS 아이템 ${feed.items.length}개 발견.`);
      } catch (rssError) {
        console.error(`  - ${campusData.name}: RSS 피드 파싱 오류 - ${rssError.message}. 건너뜁니다.`);
        continue;
      }
      
      let postsInChallengeForThisCampus = 0; 
      let recognizedPostsForThisCampus = 0;
      let latestPostDateForThisCampus = campusData.lastPostDate ? campusData.lastPostDate.toDate() : null;

      for (const item of feed.items) {
        const postDate = new Date(item.isoDate || item.pubDate);
        // 한국 시간으로 변환하여 비교
        const postDateKST = convertToKST(postDate);
        const challengeStartDateKST = convertToKST(CHALLENGE_START_DATE);
        const challengeEndDateKST = convertToKST(CHALLENGE_END_DATE);
        
        // 로그에 한국 시간으로 출력
        console.log(`  - 포스트 날짜(KST): ${formatKoreanDate(postDate)}`);
        
        // 한국 시간 기준으로 챌린지 기간 내에 있는지 확인
        if (postDateKST < challengeStartDateKST || postDateKST > challengeEndDateKST) {
          console.log(`    - 챌린지 기간(${formatKoreanDate(CHALLENGE_START_DATE)} ~ ${formatKoreanDate(CHALLENGE_END_DATE)}) 외의 포스트이므로 건너뜁니다.`);
          continue; 
        }
        
        postsInChallengeForThisCampus++; // 해당 캠퍼스의 챌린지 기간 내 포스트 수
        const postLink = item.link;
        const cleanLink = postLink.split('?')[0].split('#')[0];
        const postId = `${campusId}_${Buffer.from(cleanLink).toString('base64')}`;
        const postRef = db.collection('posts').doc(postId);
        const postDocSnapshot = await postRef.get();

        if (postDocSnapshot.exists) { 
          // 이미 Firestore에 있는 글이라면, 스크래핑을 다시 하지 않고 저장된 정보로 통계만 업데이트
          console.log(`    - 포스팅 "${item.title || postLink}" (은)는 이전에 처리됨. 저장된 데이터로 통계 집계.`);
          const existingPostData = postDocSnapshot.data();
          if (existingPostData.isRecognized) {
            recognizedPostsForThisCampus++;
          }
          // 최신 포스팅 날짜 업데이트 로직
          const existingPostPublishDate = existingPostData.date.toDate();
          if (!latestPostDateForThisCampus || existingPostPublishDate > latestPostDateForThisCampus) {
            latestPostDateForThisCampus = existingPostPublishDate;
          }

        } else { 
          // Firestore에 없는 새로운 글이라면 스크래핑 진행
          console.log(`    - 신규 포스팅 처리 중: "${item.title || postLink}"`);
          const scrapedData = await scrapeNaverBlogPost(puppeteerPage, postLink);

          if (scrapedData && scrapedData.success) {
            const postNumber = postsInChallengeForThisCampus; // 카운트를 포스트 번호로 사용
            
            const postToSave = {
              campusId, 
              number: postNumber,
              title: item.title || '제목 없음', 
              url: postLink, // url 필드 사용
              link: postLink, // 호환성을 위해 link 필드도 유지
              wordCount: scrapedData.charCountNoSpaces, // 글자 수를 wordCount로
              imageCount: scrapedData.imageCount,
              isValid: scrapedData.isRecognized, // isRecognized 대신 isValid 사용
              isRecognized: scrapedData.isRecognized, // 호환성을 위해 isRecognized 필드도 유지
              feedback: "", // 신규 포스팅이므로 피드백 없음
              date: admin.firestore.Timestamp.fromDate(postDate), // date 필드 사용
              publishDate: admin.firestore.Timestamp.fromDate(postDate), // 호환성을 위해 publishDate 필드도 유지
              scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await postRef.set(postToSave);
            console.log(`      - "${item.title || postLink}" 정보 Firestore에 새로 저장 완료.`);
            if (postToSave.isValid) {
              recognizedPostsForThisCampus++;
            }
            // 최신 포스팅 날짜 업데이트
            if (!latestPostDateForThisCampus || postDate > latestPostDateForThisCampus) {
                latestPostDateForThisCampus = postDate;
            }
          } else {
            console.error(`      - "${item.title || postLink}" 스크래핑 실패: ${scrapedData?.error || '알 수 없는 오류'}`);
            // 실패한 포스팅은 recognized로 카운트하지 않음
          }
        }
      } // 개별 포스팅 루프 끝

      // 캠퍼스 요약 정보 업데이트
      const campusUpdateData = { 
        totalPosts: postsInChallengeForThisCampus, 
        validPosts: recognizedPostsForThisCampus 
      };
      if (latestPostDateForThisCampus) {
        campusUpdateData.lastPostDate = admin.firestore.Timestamp.fromDate(latestPostDateForThisCampus);
      }

      await db.collection('campuses').doc(campusId).update(campusUpdateData)
        .then(() => console.log(`  - [${campusData.name}] 캠퍼스 요약 정보 업데이트 완료. (총 ${postsInChallengeForThisCampus}개 포스트 중 ${recognizedPostsForThisCampus}개 인정)`))
        .catch(err => console.error(`  - [${campusData.name}] 캠퍼스 요약 정보 업데이트 실패:`, err));
    } // 캠퍼스 루프 끝

    console.log('\n모든 캠퍼스 처리 완료.');

  } catch (error) {
    console.error('\n### 전체 작업 중 심각한 오류 발생: ###');
    console.error(error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      console.log('\n브라우저를 닫습니다...');
      await browser.close();
    }
    console.log('스크립트 실행 종료.');
  }
}

// --- 스크립트 실행 ---
runDailyUpdate().then(() => {
  console.log("runDailyUpdate 함수 실행 완료.");
});