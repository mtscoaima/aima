import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { createClient } from '@supabase/supabase-js';
import { createMtsAlimtalkTemplate, requestMtsTemplateInspection } from '@/lib/mtsApi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 카카오 알림톡 템플릿 등록 API
 * POST /api/kakao/templates/create
 *
 * Request Body:
 * - senderKey: 발신 프로필 키 (필수)
 * - templateCode: 템플릿 코드 (필수, 최대 30자)
 * - templateName: 템플릿 이름 (필수, 최대 200자)
 * - templateContent: 템플릿 내용 (필수)
 * - templateMessageType: BA | EX | AD | MI (기본: BA)
 * - templateEmphasizeType: NONE | TEXT | IMAGE | ITEM_LIST (기본: NONE)
 * - categoryCode: 카테고리 코드 (선택)
 * - securityFlag: Y | N (기본: N)
 * - buttons: 버튼 정보 (JSON array)
 * - quickReplies: 바로연결 정보 (JSON array)
 * - templateExtra: 부가 정보 (선택)
 * - templateTitle: 강조 표기 제목 (TEXT 타입 시 필수)
 * - templateSubtitle: 강조 표기 부제목 (TEXT 타입 시 필수)
 * - templateImageName: 이미지 파일명 (IMAGE 타입 시 필수)
 * - templateImageUrl: 이미지 URL (IMAGE 타입 시 필수)
 * - templatePreviewMessage: 미리보기 메시지 (선택)
 * - requestInspection: 검수 요청 여부 (true/false, 기본: false)
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse || NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userId = authResult.userInfo.userId;

    // 요청 본문 파싱
    const body = await request.json();

    // 필수 필드 확인
    const {
      senderKey,
      templateCode,
      templateName,
      templateContent,
      templateMessageType = 'BA',
      templateEmphasizeType = 'NONE',
      categoryCode,
      securityFlag = 'N',
      buttons,
      quickReplies,
      templateExtra,
      templateTitle,
      templateSubtitle,
      templateImageName,
      templateImageUrl,
      templatePreviewMessage,
      templateRepresentLink,
      requestInspection = false,
    } = body;

    // 필수 필드 검증
    if (!senderKey) {
      return NextResponse.json(
        { error: '발신 프로필 키가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!templateCode) {
      return NextResponse.json(
        { error: '템플릿 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!templateName) {
      return NextResponse.json(
        { error: '템플릿 이름이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!templateContent) {
      return NextResponse.json(
        { error: '템플릿 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    // 템플릿 코드 길이 검증
    if (templateCode.length > 30) {
      return NextResponse.json(
        { error: '템플릿 코드는 최대 30자까지 가능합니다.' },
        { status: 400 }
      );
    }

    // 템플릿 이름 길이 검증
    if (templateName.length > 200) {
      return NextResponse.json(
        { error: '템플릿 이름은 최대 200자까지 가능합니다.' },
        { status: 400 }
      );
    }

    // 발신프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('kakao_sender_profiles')
      .select('*')
      .eq('sender_key', senderKey)
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '해당 발신 프로필을 찾을 수 없거나 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // DB에 이미 같은 템플릿 코드가 있는지 확인
    const { data: existingTemplate } = await supabase
      .from('kakao_alimtalk_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('sender_key', senderKey)
      .eq('template_code', templateCode)
      .single();

    if (existingTemplate) {
      return NextResponse.json(
        { error: '이미 존재하는 템플릿 코드입니다.' },
        { status: 409 }
      );
    }

    // MTS API로 템플릿 등록
    const result = await createMtsAlimtalkTemplate({
      senderKey,
      senderKeyType: 'S',
      templateCode,
      templateName,
      templateContent,
      templateMessageType,
      templateEmphasizeType,
      categoryCode,
      securityFlag,
      buttons: buttons ? JSON.stringify(buttons) : undefined,
      quickReplies: quickReplies ? JSON.stringify(quickReplies) : undefined,
      templateExtra,
      templateTitle,
      templateSubtitle,
      templateImageName,
      templateImageUrl,
      templatePreviewMessage,
      templateRepresentLink: templateRepresentLink ? JSON.stringify(templateRepresentLink) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '템플릿 등록 실패',
          errorCode: result.errorCode,
        },
        { status: 400 }
      );
    }

    // MTS API 응답 데이터
    const templateData = result.responseData;

    // DB에 템플릿 저장
    const { data: savedTemplate, error: saveError } = await supabase
      .from('kakao_alimtalk_templates')
      .insert({
        user_id: userId,
        sender_key: senderKey,
        template_code: templateCode,
        template_name: templateName,
        template_content: templateContent,
        template_message_type: templateMessageType,
        template_emphasize_type: templateEmphasizeType,
        inspection_status: 'REG', // 등록 상태
        status: 'R', // 대기 상태
        buttons: buttons || null,
        quick_replies: quickReplies || null,
        category_code: categoryCode || null,
        security_flag: securityFlag,
        template_title: templateTitle || null,
        template_subtitle: templateSubtitle || null,
        template_image_name: templateImageName || null,
        template_image_url: templateImageUrl || null,
        template_extra: templateExtra || null,
        synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('DB 저장 오류:', saveError);
      return NextResponse.json(
        { error: 'DB 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 검수 요청
    let inspectionResult = null;
    if (requestInspection) {
      inspectionResult = await requestMtsTemplateInspection(senderKey, templateCode, 'S');

      if (inspectionResult.success) {
        // DB 업데이트: 검수 요청 상태로 변경
        await supabase
          .from('kakao_alimtalk_templates')
          .update({
            inspection_status: 'REQ', // 검수 요청 상태
            synced_at: new Date().toISOString(),
          })
          .eq('id', savedTemplate.id);
      }
    }

    return NextResponse.json({
      success: true,
      template: savedTemplate,
      mtsResponse: templateData,
      inspectionRequested: requestInspection,
      inspectionSuccess: inspectionResult?.success || false,
      inspectionError: inspectionResult?.error || null,
      inspectionErrorCode: inspectionResult?.errorCode || null,
    });
  } catch (error) {
    console.error('템플릿 등록 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
