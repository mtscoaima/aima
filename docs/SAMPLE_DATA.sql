-- MTS Message 샘플 데이터 SQL
-- 작성일: 2025년 1월
-- 용도: 개발/테스트 환경용 샘플 데이터

-- ================================================
-- 1. 사용자 데이터 (users)
-- ================================================

-- 관리자
INSERT INTO users (email, username, password, name, phone_number, role, approval_status, is_active, payment_mode, grade, company_info, tax_invoice_info) VALUES
('admin@mts.com', 'admin', '$2a$10$YourHashedPasswordHere', '시스템관리자', '010-0000-0000', 'ADMIN', 'APPROVED', true, 'prepaid', '관리자', NULL, NULL);

-- 영업사원
INSERT INTO users (email, username, password, name, phone_number, role, approval_status, is_active, payment_mode, grade, total_referrals, active_referrals, company_info) VALUES
('sales01@mts.com', 'sales01', '$2a$10$YourHashedPasswordHere', '김영업', '010-1111-1111', 'SALESPERSON', 'APPROVED', true, 'prepaid', 'VIP', 15, 12, 
  '{"companyName":"MTS영업팀","businessNumber":"111-11-11111"}'),
('sales02@mts.com', 'sales02', '$2a$10$YourHashedPasswordHere', '이영업', '010-2222-2222', 'SALESPERSON', 'APPROVED', true, 'prepaid', 'VIP', 8, 5,
  '{"companyName":"MTS영업팀","businessNumber":"111-11-11111"}');

-- 일반 사용자 (광고주)
INSERT INTO users (email, username, password, name, phone_number, role, approval_status, is_active, payment_mode, grade, monthly_usage_amount, company_info, tax_invoice_info, agree_terms, agree_privacy, agree_sms_marketing, agree_email_marketing) VALUES
('user01@company.com', 'user01', '$2a$10$YourHashedPasswordHere', '홍길동', '010-3333-3333', 'USER', 'APPROVED', true, 'prepaid', '골드', 500000,
  '{"companyName":"(주)테스트컴퍼니","businessNumber":"123-45-67890","ceoName":"홍길동","companyAddress":"서울시 강남구 테헤란로 123","companyPhone":"02-1234-5678"}',
  '{"email":"tax@testcompany.com","manager":"김경리","contact":"010-3333-4444"}',
  true, true, true, false),

('user02@shop.com', 'user02', '$2a$10$YourHashedPasswordHere', '김사장', '010-4444-4444', 'USER', 'APPROVED', true, 'prepaid', '실버', 150000,
  '{"companyName":"김사장네 가게","businessNumber":"234-56-78901","ceoName":"김사장","companyAddress":"서울시 마포구 홍대입구 456","companyPhone":"02-2345-6789"}',
  '{"email":"shop@kimshop.com","manager":"김사장","contact":"010-4444-4444"}',
  true, true, false, false),

('user03@cafe.com', 'user03', '$2a$10$YourHashedPasswordHere', '박카페', '010-5555-5555', 'USER', 'PENDING', true, 'prepaid', '일반', 0,
  '{"companyName":"파크카페","businessNumber":"345-67-89012","ceoName":"박카페","companyAddress":"서울시 성동구 성수동 789","companyPhone":"02-3456-7890"}',
  NULL,
  true, true, true, true),

('user04@restaurant.com', 'user04', '$2a$10$YourHashedPasswordHere', '이식당', '010-6666-6666', 'USER', 'APPROVED', true, 'postpaid', '플래티넘', 1500000,
  '{"companyName":"이씨네 레스토랑","businessNumber":"456-78-90123","ceoName":"이식당","companyAddress":"서울시 용산구 이태원로 321","companyPhone":"02-4567-8901"}',
  '{"email":"restaurant@lee.com","manager":"이매니저","contact":"010-6666-7777"}',
  true, true, true, true);

-- ================================================
-- 2. 사용자 잔액 (user_balances)
-- ================================================

INSERT INTO user_balances (user_id, current_balance, created_at, updated_at) VALUES
(4, 250000, NOW(), NOW()),  -- user01
(5, 50000, NOW(), NOW()),   -- user02
(6, 10000, NOW(), NOW()),   -- user03
(7, 0, NOW(), NOW());       -- user04 (후불제)

-- ================================================
-- 3. 크레딧 패키지 (credit_packages)
-- ================================================

INSERT INTO credit_packages (credits, bonus_credits, price, is_popular, is_active, display_order) VALUES
(1000, 0, 10000, false, true, 1),        -- 스타터
(5000, 500, 45000, false, true, 2),      -- 베이직 (10% 보너스)
(10000, 2000, 80000, true, true, 3),     -- 프로 (20% 보너스) - 인기
(50000, 15000, 350000, false, true, 4),  -- 비즈니스 (30% 보너스)
(100000, 40000, 600000, false, true, 5); -- 엔터프라이즈 (40% 보너스)

-- ================================================
-- 4. 메시지 템플릿 (message_templates)
-- ================================================

-- 공개 템플릿
INSERT INTO message_templates (user_id, name, content, category, is_private, is_active, usage_count, is_ai_generated, image_url) VALUES
(1, '[신규가입] 환영 메시지', '안녕하세요 {고객명}님!\n{회사명}에 가입해주셔서 감사합니다.\n\n신규 가입 혜택:\n• 첫 구매 10% 할인\n• 무료배송 쿠폰\n\n바로가기: {링크}', '고객관리', false, true, 523, false, NULL),

(1, '[봄맞이] 특별 세일', '🌸 봄맞이 대박세일! 🌸\n\n전품목 최대 50% 할인!\n기간: 3/1 ~ 3/31\n\n인기상품:\n• 봄 신상 의류\n• 꽃무늬 액세서리\n\n▶ 쇼핑하기: {링크}', '프로모션', false, true, 892, false, 'https://example.com/spring-sale.jpg'),

(1, '[예약확인] 방문 안내', '📅 예약이 확인되었습니다.\n\n예약정보:\n• 일시: {날짜} {시간}\n• 장소: {지점명}\n• 인원: {인원}명\n\n변경/취소는 방문 하루 전까지 가능합니다.\n문의: {전화번호}', '예약/알림', false, true, 1245, false, NULL),

(1, '[생일축하] 특별 쿠폰', '🎂 {고객명}님, 생일 축하드립니다! 🎉\n\n생일 특별 혜택:\n• 30% 할인 쿠폰\n• 무료 디저트 제공\n쿠폰코드: BIRTH2024\n\n이번달 말까지 사용 가능합니다.\n▶ 사용하기: {링크}', '고객관리', false, true, 456, true, NULL),

(1, '[신메뉴] 출시 안내', '🍔 신메뉴가 출시되었습니다!\n\n{메뉴명}\n특별가: {가격}원\n\n지금 주문하시면:\n• 음료 무료 업그레이드\n• 다음 방문 시 10% 할인\n\n📱 주문하기: {링크}', '음식점/카페', false, true, 678, false, 'https://example.com/new-menu.jpg');

-- 개인 템플릿
INSERT INTO message_templates (user_id, name, content, category, is_private, is_active, usage_count, buttons) VALUES
(4, '우리 회사 월간 프로모션', '{월}월 특별 프로모션 안내\n\n안녕하세요 (주)테스트컴퍼니입니다.\n이달의 특별 혜택을 소개합니다.\n\n자세히보기: {링크}', '프로모션', true, true, 23, 
  '[{"text":"자세히보기","url":"https://testcompany.com"},{"text":"문의하기","url":"tel:021234567"}]'),

(5, '김사장네 단골 감사', '항상 저희 가게를 이용해주셔서 감사합니다.\n\n단골 고객님께 특별 할인 쿠폰을 드립니다.\n쿠폰번호: {쿠폰코드}\n\n방문 시 보여주세요!', '고객관리', true, true, 45, NULL);

-- ================================================
-- 5. 발신번호 (sender_numbers)
-- ================================================

INSERT INTO sender_numbers (user_id, phone_number, display_name, is_default, is_verified, is_user_phone, status) VALUES
(4, '010-3333-3333', '홍길동', true, true, true, 'ACTIVE'),   -- user01 본인 번호
(4, '02-1234-5678', '테스트컴퍼니', false, true, false, 'ACTIVE'),  -- user01 회사 번호
(5, '010-4444-4444', '김사장', true, true, true, 'ACTIVE'),   -- user02 본인 번호
(6, '010-5555-5555', '박카페', true, false, true, 'PENDING'), -- user03 미인증
(7, '02-4567-8901', '이씨네레스토랑', true, true, false, 'ACTIVE'); -- user04 회사 번호

-- ================================================
-- 6. 캠페인 (campaigns)
-- ================================================

INSERT INTO campaigns (user_id, name, description, template_id, status, total_recipients, sent_count, success_count, failed_count, budget, target_criteria, message_template, created_at) VALUES
(4, '3월 봄맞이 프로모션', '봄 시즌 신제품 출시 프로모션', 2, 'COMPLETED', 1500, 1500, 1485, 15, 150000,
  '{"ageRange":"20-40","gender":"all","location":"서울","interests":["패션","쇼핑"]}',
  '🌸 봄맞이 대박세일! 전품목 최대 50% 할인! 3/1~3/31 ▶ https://test.com/spring',
  NOW() - INTERVAL '5 days'),

(4, '신규 회원 환영 캠페인', '3월 신규 가입 회원 대상 환영 메시지', 1, 'APPROVED', 350, 0, 0, 0, 35000,
  '{"customerType":"new","joinDate":"2024-03"}',
  '안녕하세요! 테스트컴퍼니 가입을 환영합니다. 신규 혜택을 확인하세요!',
  NOW() - INTERVAL '2 days'),

(5, '단골 고객 감사 이벤트', '매출 상위 20% 단골 고객 대상', 7, 'SENDING', 80, 45, 45, 0, 8000,
  '{"customerType":"vip","purchaseCount":">=5"}',
  '항상 감사합니다. 단골 고객님께 특별 할인 쿠폰을 드립니다!',
  NOW() - INTERVAL '1 hour'),

(7, '신메뉴 출시 안내', '이달의 신메뉴 소개', 5, 'DRAFT', 0, 0, 0, 0, 200000,
  '{"location":"서울,경기","interests":["맛집","음식"]}',
  '🍔 신메뉴가 출시되었습니다! 스페셜 버거세트 특별가 9,900원',
  NOW()),

(4, '생일 축하 캠페인', '3월 생일자 대상 축하 메시지', 4, 'REJECTED', 230, 0, 0, 0, 23000,
  '{"birthMonth":"03"}',
  '🎂 생일 축하드립니다! 특별 쿠폰을 확인하세요.',
  NOW() - INTERVAL '10 days');

-- ================================================
-- 7. 캠페인 거부 사유 (campaign_rejections)
-- ================================================

INSERT INTO campaign_rejections (campaign_id, admin_user_id, rejection_reason, created_at) VALUES
(5, 1, '개인정보(생일) 수집 동의를 받지 않은 고객 대상 발송 불가. 마케팅 동의 고객만 대상으로 수정 필요.', NOW() - INTERVAL '9 days');

-- ================================================
-- 8. 거래 내역 (transactions)
-- ================================================

-- 충전
INSERT INTO transactions (user_id, type, amount, description, reference_id, metadata, status, created_at) VALUES
(4, 'charge', 100000, '크레딧 충전 - 프로 패키지 (10,000 + 2,000 보너스)', 'PAY-2024-0301-001', 
  '{"package_id":3,"credits":10000,"bonus":2000,"payment_method":"card"}', 'completed', NOW() - INTERVAL '7 days'),

(5, 'charge', 45000, '크레딧 충전 - 베이직 패키지 (5,000 + 500 보너스)', 'PAY-2024-0302-002',
  '{"package_id":2,"credits":5000,"bonus":500,"payment_method":"transfer"}', 'completed', NOW() - INTERVAL '6 days'),

(6, 'charge', 10000, '크레딧 충전 - 스타터 패키지 (1,000)', 'PAY-2024-0303-003',
  '{"package_id":1,"credits":1000,"bonus":0,"payment_method":"card"}', 'completed', NOW() - INTERVAL '5 days');

-- 사용
INSERT INTO transactions (user_id, type, amount, description, reference_id, metadata, status, created_at) VALUES
(4, 'usage', -150000, '캠페인 발송 - 3월 봄맞이 프로모션 (1,500건)', 'CAMP-001',
  '{"campaign_id":1,"message_count":1500,"unit_price":100}', 'completed', NOW() - INTERVAL '5 days'),

(5, 'usage', -4500, '캠페인 발송 - 단골 고객 감사 이벤트 (45건)', 'CAMP-003',
  '{"campaign_id":3,"message_count":45,"unit_price":100}', 'completed', NOW() - INTERVAL '1 hour');

-- 리워드 (영업사원)
INSERT INTO transactions (user_id, type, amount, description, reference_id, metadata, status, created_at) VALUES
(2, 'charge', 10000, '추천 리워드 - 홍길동님 결제 (1단계)', 'REF-001',
  '{"originalUserId":4,"rewardLevel":1,"referralCode":"SALES01","paymentAmount":100000}', 'completed', NOW() - INTERVAL '7 days'),

(2, 'charge', 4500, '추천 리워드 - 김사장님 결제 (1단계)', 'REF-002',
  '{"originalUserId":5,"rewardLevel":1,"referralCode":"SALES01","paymentAmount":45000}', 'completed', NOW() - INTERVAL '6 days');

-- ================================================
-- 9. 추천 관계 (referrals)
-- ================================================

INSERT INTO referrals (referrer_id, referred_user_id, referral_code, status, created_at) VALUES
(2, 4, 'SALES01', 'ACTIVE', NOW() - INTERVAL '30 days'),  -- sales01 -> user01
(2, 5, 'SALES01', 'ACTIVE', NOW() - INTERVAL '25 days'),  -- sales01 -> user02
(2, 6, 'SALES01', 'PENDING', NOW() - INTERVAL '10 days'), -- sales01 -> user03
(3, 7, 'SALES02', 'ACTIVE', NOW() - INTERVAL '20 days');  -- sales02 -> user04

-- ================================================
-- 10. 문의사항 (inquiries)
-- ================================================

INSERT INTO inquiries (user_id, category, title, content, contact_phone, sms_notification, status, created_at) VALUES
(4, 'PAYMENT', '결제 영수증 발급 요청', '어제 결제한 10만원 크레딧 충전 영수증을 이메일로 받고 싶습니다.', '010-3333-3333', true, 'COMPLETED', NOW() - INTERVAL '6 days'),
(5, 'SERVICE', '대량 발송 할인 문의', '월 10만건 이상 발송 시 할인이 가능한가요?', '010-4444-4444', false, 'PENDING', NOW() - INTERVAL '2 days'),
(6, 'OTHER', 'API 연동 문의', 'REST API로 메시지 발송 연동이 가능한지 문의드립니다.', '010-5555-5555', true, 'PENDING', NOW() - INTERVAL '1 day');

-- ================================================
-- 11. 문의 답변 (inquiry_replies)
-- ================================================

INSERT INTO inquiry_replies (inquiry_id, admin_id, reply_content, created_at) VALUES
(1, 1, '안녕하세요. 영수증을 이메일로 발송해드렸습니다. 확인 부탁드립니다. 감사합니다.', NOW() - INTERVAL '5 days');

-- ================================================
-- 12. FAQ (faqs)
-- ================================================

INSERT INTO faqs (question, answer, category, display_order, is_active) VALUES
('메시지 발송 단가는 얼마인가요?', 'SMS는 건당 20원, LMS는 건당 50원, MMS는 건당 100원입니다. 대량 발송 시 별도 협의 가능합니다.', '요금', 1, true),
('발신번호는 어떻게 등록하나요?', '마이페이지 > 발신번호 관리에서 등록 가능합니다. 본인 명의 번호만 등록 가능하며, 인증 절차가 필요합니다.', '발신번호', 2, true),
('예약 발송이 가능한가요?', '네, 캠페인 생성 시 발송 일시를 지정하여 예약 발송이 가능합니다. 최대 30일 후까지 예약 가능합니다.', '발송', 3, true),
('API 연동이 가능한가요?', 'REST API를 제공하고 있습니다. 문의하기를 통해 API 문서를 요청해주세요.', '기술', 4, true),
('세금계산서 발급이 가능한가요?', '충전 후 마이페이지 > 세금계산서에서 직접 발급 가능합니다. 매월 1일 전월 사용분에 대한 세금계산서가 자동 발급됩니다.', '정산', 5, true);

-- ================================================
-- 13. 공지사항 (announcements)
-- ================================================

INSERT INTO announcements (title, content, is_important, created_by, created_at) VALUES
('🎉 MTS 메시징 서비스 정식 오픈!', '안녕하세요. MTS 메시징 서비스가 정식 오픈했습니다.\n\n오픈 기념 이벤트:\n- 신규 가입 시 1,000 크레딧 무료 지급\n- 첫 충전 20% 보너스\n\n많은 이용 부탁드립니다.', true, '00000000-0000-0000-0000-000000000001'::uuid, NOW() - INTERVAL '15 days'),

('시스템 정기 점검 안내 (3/15)', '3월 15일(금) 새벽 2시~4시 시스템 정기 점검이 예정되어 있습니다.\n점검 시간 동안 서비스 이용이 제한될 수 있습니다.\n\n불편을 드려 죄송합니다.', true, '00000000-0000-0000-0000-000000000001'::uuid, NOW() - INTERVAL '3 days'),

('발신번호 등록 정책 변경 안내', '4월 1일부터 발신번호 등록 정책이 변경됩니다.\n\n주요 변경사항:\n- 휴대폰 번호: 본인인증 필수\n- 대표번호: 사업자등록증 제출 필수\n\n자세한 내용은 FAQ를 참고해주세요.', false, '00000000-0000-0000-0000-000000000001'::uuid, NOW() - INTERVAL '7 days');

-- ================================================
-- 14. 알림 (notifications)
-- ================================================

-- 개인 알림
INSERT INTO notifications (recipient_user_id, sender_user_id, title, message, type, action_url, is_read, created_at) VALUES
(4, 1, '캠페인 승인 완료', '신규 회원 환영 캠페인이 승인되었습니다. 발송을 시작할 수 있습니다.', 'CAMPAIGN', '/campaigns/2', false, NOW() - INTERVAL '2 days'),
(4, NULL, '크레딧 충전 완료', '100,000 크레딧이 충전되었습니다. (보너스 20,000 포함)', 'PAYMENT', '/credit', true, NOW() - INTERVAL '7 days'),
(5, 1, '문의 답변 등록', '대량 발송 할인 문의에 대한 답변이 등록되었습니다.', 'INQUIRY', '/support?tab=inquiry', false, NOW() - INTERVAL '1 day');

-- 역할 기반 알림
INSERT INTO notifications (recipient_role, sender_user_id, title, message, type, is_read, created_at) VALUES
('USER', 1, '새로운 기능 출시', 'AI 메시지 작성 기능이 추가되었습니다. 지금 사용해보세요!', 'SYSTEM', false, NOW() - INTERVAL '5 days'),
('SALESPERSON', 1, '이번 달 정산 안내', '2월 추천 리워드 정산이 완료되었습니다. 정산 내역을 확인하세요.', 'SETTLEMENT', false, NOW() - INTERVAL '1 day');

-- ================================================
-- 15. 세금계산서 (tax_invoices)
-- ================================================

INSERT INTO tax_invoices (user_id, invoice_number, issue_date, business_number, company_name, supply_amount, tax_amount, total_amount, period_start, period_end, status, created_at) VALUES
(4, 'TI-2024-02-001', '2024-03-01', '123-45-67890', '(주)테스트컴퍼니', 90909, 9091, 100000, '2024-02-01', '2024-02-29', 'ISSUED', NOW() - INTERVAL '15 days'),
(5, 'TI-2024-02-002', '2024-03-01', '234-56-78901', '김사장네 가게', 40909, 4091, 45000, '2024-02-01', '2024-02-29', 'ISSUED', NOW() - INTERVAL '15 days'),
(7, 'TI-2024-02-003', '2024-03-01', '456-78-90123', '이씨네 레스토랑', 136364, 13636, 150000, '2024-02-01', '2024-02-29', 'ISSUED', NOW() - INTERVAL '15 days');

-- ================================================
-- 16. 시스템 설정 (system_settings)
-- ================================================

INSERT INTO system_settings (id, first_level_commission_rate, nth_level_denominator, menu_settings, site_settings, updated_at) VALUES
(1, 0.1, 2, 
  '{"mainMenu":["campaigns","templates","messages","credit"],"adminMenu":["users","campaigns","settlements","system"]}',
  '{"siteName":"MTS 메시징","companyName":"(주)엠티에스","contactEmail":"support@mts.com","contactPhone":"1588-0000"}',
  NOW());

-- ================================================
-- 17. 등급 설정 (grade_settings)
-- ================================================

INSERT INTO grade_settings (grade_name, min_usage, max_usage, discount_rate, created_at) VALUES
('일반', 0, 99999, 0, NOW()),
('실버', 100000, 299999, 0.05, NOW()),
('골드', 300000, 999999, 0.1, NOW()),
('플래티넘', 1000000, 4999999, 0.15, NOW()),
('VIP', 5000000, NULL, 0.2, NOW());

-- ================================================
-- 18. 등급 변경 이력 (grade_history)
-- ================================================

INSERT INTO grade_history (user_id, changed_by, old_grade, new_grade, change_reason, created_at) VALUES
(4, 1, '실버', '골드', '월 사용량 50만원 달성', NOW() - INTERVAL '10 days'),
(7, 1, '골드', '플래티넘', '월 사용량 150만원 달성', NOW() - INTERVAL '5 days');

-- ================================================
-- 19. 리워드 (rewards) - 실제 테이블 존재
-- ================================================

INSERT INTO rewards (user_id, campaign_id, reward_type, amount, description, is_used, created_at) VALUES
(2, 1, 'REFERRAL', 10000, '홍길동님 추천 리워드 (1단계)', false, NOW() - INTERVAL '7 days'),
(2, NULL, 'REFERRAL', 4500, '김사장님 추천 리워드 (1단계)', false, NOW() - INTERVAL '6 days'),
(4, 1, 'CAMPAIGN', 5000, '캠페인 완료 보너스', true, NOW() - INTERVAL '5 days');

-- ================================================
-- 20. 정산 (settlements) - 실제 테이블 존재
-- ================================================

INSERT INTO settlements (user_id, settlement_month, total_campaigns, total_messages, total_amount, commission_rate, commission_amount, final_amount, status, bank_account, created_at) VALUES
(2, '2024-02', 5, 2500, 250000, 0.1, 25000, 225000, 'COMPLETED', '국민은행 123-456-789012', NOW() - INTERVAL '1 month'),
(3, '2024-02', 3, 1200, 120000, 0.1, 12000, 108000, 'COMPLETED', '우리은행 234-567-890123', NOW() - INTERVAL '1 month'),
(2, '2024-03', 2, 1545, 154500, 0.1, 15450, 139050, 'PENDING', '국민은행 123-456-789012', NOW());

-- ================================================
-- 데이터 무결성 확인 쿼리
-- ================================================

-- 사용자별 잔액 확인
SELECT u.name, u.email, u.role, ub.current_balance 
FROM users u 
LEFT JOIN user_balances ub ON u.id = ub.user_id 
ORDER BY u.id;

-- 캠페인 상태 확인
SELECT c.name, c.status, c.total_recipients, c.sent_count, u.name as creator
FROM campaigns c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- 추천 관계 확인
SELECT 
  r1.name as referrer,
  r2.name as referred,
  ref.status,
  ref.created_at
FROM referrals ref
JOIN users r1 ON ref.referrer_id = r1.id
LEFT JOIN users r2 ON ref.referred_user_id = r2.id
ORDER BY ref.created_at DESC;

-- 월별 거래 요약
SELECT 
  u.name,
  t.type,
  SUM(CASE WHEN t.type = 'charge' THEN t.amount ELSE 0 END) as total_charge,
  SUM(CASE WHEN t.type = 'usage' THEN ABS(t.amount) ELSE 0 END) as total_usage
FROM transactions t
JOIN users u ON t.user_id = u.id
GROUP BY u.id, u.name, t.type
ORDER BY u.name, t.type;