import { NextRequest, NextResponse } from 'next/server';
import { createCampus } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('캠퍼스 생성 API 호출됨');
    
    // 요청 본문 파싱
    let data;
    try {
      data = await request.json();
      console.log('요청 데이터:', data);
    } catch (parseError) {
      console.error('요청 본문 파싱 오류:', parseError);
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }
    
    // 필수 필드 확인
    const { name, url, feedUrl } = data;
    
    if (!name || !url) {
      console.error('필수 필드 누락:', { name, url });
      return NextResponse.json({ error: '캠퍼스 이름과 URL은 필수 항목입니다.' }, { status: 400 });
    }
    
    // 캠퍼스 생성
    console.log('캠퍼스 생성 시작');
    const campusData: { name: string; url: string; feedUrl?: string } = { 
      name, 
      url 
    };
    
    if (feedUrl) {
      campusData.feedUrl = feedUrl;
    }
    
    try {
      const campusId = await createCampus(campusData);
      console.log('캠퍼스 생성 성공:', campusId);
      return NextResponse.json({ success: true, campusId });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json({ 
        error: `캠퍼스 생성 중 오류가 발생했습니다: ${dbError instanceof Error ? dbError.message : String(dbError)}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('캠퍼스 생성 API 오류:', error);
    return NextResponse.json({ 
      error: `서버 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 