# 카카오 브랜드 메시지(기본형: 전문
방식) RESTful Interface Guide

작성일자 : 2025.09.20

문서버전 : 1.0

MTS COMPANY
MOBILE TOTAL SERVICE

# 문 서 개 정 이 력

| 버전 | 일자 | 내용 | 작성자 |
| --- | --- | --- | --- |
| 1.0 | 2025.09.20 | 최초작성 | 김승현 |


카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

# 목 차

- 2
- 1. 개요 ...................................................
- 2. HOST ··················································· 2
- 3. 선결 조건 ··· 2
- 4. 브랜드 메시지 특징 ············ 2
- 5. 용어의 정의 ··················································· 2
- 6. 브랜드 메시지 기본형(전문 방식) 전송요청(단건) ··················································· 3
- 7. 샘플(Sample) 데이터 ··················································· 5
- 8. 브랜드 메시지 기본형(전문 방식) 전송요청(여러 건) ...................................................... 9
- 9. 샘플(Sample) 데이터 ..........................--------------------------- 12
- 10. 브랜드 메시지 응답요청 ............................................................................................................... 18
- 11. 샘플(Sample) 데이터 ......................................................························· 21
- 12. CALLBACK_URL 사용 시 전송결과 응답 ................................................................................ 21
- 13. 필드 상세정보 ---------------------.............................................................. 22
- [붙임] 브랜드 메시지 결과코드 .............................................................................................................. 33
- [붙임] SMS 결과코드표 39


- ....... ---------------------------............................................................................
- [붙임] LMS, MMS 결과코드표 .......................························ 39


1

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

# 1. 개요

본 가이드는 카카오 브랜드 메시지 발송 DB 테이블 구조 및 고객의 카카오 브랜드 메시
지 발송을 위한 DB 테이블 입력데이터를 정의하는데 목적이 있습니다.

본 매뉴얼은 오라클(Oracle) DB 기반으로 작성되었습니다.

# 2. HOST

# - [운영서버] https://api.mtsco.co.kr/

# 3. 선결 조건

- - MTS에 고객사로 등록되어야 합니다.


- - MTS는 고객사에게 auth_code를 발급하고 고객사에 전달합니다.


- 고객사의 전송할 서버의 아이피에서 auth_code를 포함하여 아래의 파라미터로 필수항
목을 전송하여야 합니다.

# 4. 브랜드 메시지 특징

- - 브랜드 메시지 전송에는 반드시, 승인된 템플릿이 준비되야 합니다.


- - 브랜드 메시지 수신 실패 시, 전환전송(SMS, LMS)이 가능합니다.


- - 전송문구는 띄어쓰기 포함 한글/영문 1,000자까지 발송 가능 합니다.


- - 브랜드 메시지로는 멀티미디어(이미지 등) 파일을 전송할 수 없습니다.


# 5. 용어의 정의

# 1) 템플릿

카카오 브랜드 메시지 템플릿은 일종의 카카오 메시지 브랜드를 발송하기 위한 사전승인
된 문구의 서식입니다. 영업담당자를 통해 "발신프로필키"를 발급받고, 관리자 사이트를
통해 템플릿 등록할 수 있습니다.

# 2) 템플릿코드

2

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

브랜드 메시지 승인 신청시 작성한 템플릿의 고유 코드입니다.

# 3) 발신프로필키

고객이 브랜드 메시지를 전송할 수 있도록 카카오 공식딜러사를 통하여 발급받은 고유키
값입니다.

# 4) 전환전송

카카오 브랜드 메시지는 실시간으로 메시지 전송에 대한 결과를 확인할 수 있으며, 브랜
드 메시지 전송 실패 건에 대하여 타 메시지 채널(SMS/LMS)로 전환하여 전송함으로써
고객에게 메시지 전달율을 높일 수 있습니다.

전환전송을 하도록 요청을 주실 시, 발신 전화번호는 반드시 사전등록 된 발신번호를 넣
어 주셔야 합니다.

6. 브랜드 메시지 기본형(전문 방식) 전송요청(단건)

# [Request]

- · path : /btalk/send/message/basic
- · method : POST
- · header


○ Content-type: application/json

- · parameter (json)


| 키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| auth_code | text(40) | Y | MTS 발급 인증코드 | "auth_code": "asWdsgsk46seE" |
| sender key | text(40) | Y | 발신 프로필 키 | "sender_key":"266 2e99eb7a1f21abb 3955278e9955f5a 9a99b62" |
| send_date | text(14) | Y | 발송 예정일 (기본값: MTS 서버에 등록일시) | "send_date":"2020 0101120101" |
| message_type | text(20) | Y | 브랜드 메시지 타입 | "message_type": "TEXT" |


3

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| send_mode | text(1) | Y | 브랜드 메시지 발송 유형 타입 | "send_mode": "3" |
| --- | --- | --- | --- | --- |
| targeting | text(1) | Y | 타겟팅 타입(M/N/I) | "targeting": "M" |
| template_code | text(30) | Y | 템플릿코드 | "template_code":" A001_01" |
| callback_number | text(15) | Y | 발신 전화번호 | "callback_number": "1522-1825" |
| country_code | text(16) | N | 국가번호 (기본 82) | "country_code":"82 " |
| phone_number | text(16) | N | 사용자 전화번호 | "phone_number":" 01012345678" |
| app_user_ id | text(20) | N | 앱 유저 ID | "app_user_id":"123 45" |
| push_alarm | text(1) | N | 푸시 알람 여부(기본 Y) | "push_alarm": "Y" |
| reseller_code | text(9) | N | 메시지 신고시 KISA 에 전달될 재판매사 구분 코드 | "reseller_code":"12 3456789" |
| message | text | Y | 사용자에게 전달될 메시지 | - |
| additional_content | text(34) | N | 부가 정보 | - |
| attachment | Attachme nt | N | 메시지에 첨부할 내용 링크 버튼과 이미지를 첨부 |  |
| header | text(20) | N | header 필드 | "header":"message header" |
| carousel | Carousel | N | carousel 필드 필수 | - |
| tran_type | text(1) | Y | 전환전송 여부(N/S/L/M) | "tran_type":"S" |
| tran_message | text(1000) | N | 전환전송 메시지 | "tran_message":". 고 객님의 택배가 금일 (18~20)시에 배달 예정입니다." |
| subject | text(20) | N | LMS 전송 시 필요한 제목 | "subject":"제목" |


4

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| callback_url | text(512) | N | MTS 에서 메시지 전송결과를 보내줄 고객사 서버의 Full URL | "callback_url":"http s://www.mtsco.co. kr/message_callba ck.do?seq=123" |
| --- | --- | --- | --- | --- |
| add_etc1 | text(160) | N | 고객사에서 보내는 추가 정보 1 | "add_etc1":"add_et c1" |
| add_etc2 | text(160) | N | 고객사에서 보내는 추가 정보 2 | "add_etc2":"add_et c2" |
| add_etc3 | text(160) | N | 고객사에서 보내는 추가 정보 3 | "add_etc3":"add_et c3" |
| add_etc4 | text(160) | N | 고객사에서 보내는 추가 정보 4 | "add_etc4":"add_et c4" |


# [Response]

| 키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| code | text(4) | Y | 처리 결과 코드 (0000=성공) | "code ":"0000" |
| received_at | text(19) | N | 수신 시간 (realtime 발송 시) | "received_at":"2015-08- 06 10:51:00" |
| message | text | N | 오류 메시지 | "message ":"JSONParsingExceptio n" |


# 7. 샘플(Sample) 데이터

# TEXT 타입

{"auth_code":"인증코
드","senden_key/fbi8b597858:2702hbaododdoo3ceel9a51f18ca","country_code","82", "c
allback_number":"025011980", "send_mode"."3","message_type":"TEXT","phone_number":
"01012345678","tran_type":"L"L") "subject":"전환전송제목","tran_message","전환전송메시지
" "callback_urt":"https://www.mtsco.co.kr/message_callback.do?seq=123","add_etc1":"add
_etc1","add_etc2":"add_etc2","add_etc3":"add_etc3","add_etc4":"add_etc1","template_cod
e":"7a750c300ad4e853f3cd450ac468d5c6619709cd", "targeting":"M", "message":"testmtsc
o.co.kr"}

# IMAGE 타입

5

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

{"auth_code":" 인증코
드 "sender_key": df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"025011980", "send_mode":"3") "message_type":"IMAGE" "phone_number
,
":"01012345678", "tran_type":"L' , "subject":"전환전송제목", "tran_message":"전환전송메시
지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 "add_etc2":"add_etc2", "add_etc3":"add_etc3", "add_etc4":"add_etc1", "template_cod
,
e": 4c68534ba3dd3170482305e0787559c9cf76d382", "targeting":"M" "message":"test테스
,
,
트메시지입니
다. " "attachment":("button":[("type":"WL l "url_mobile":"https://www.daum.net/link1 "}],"im
,
age":/"img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg"}}}

# WIDE 타입

{"auth_code":"인증코
드 "sender_key":" df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"025011980", "send_mode":"3") "message_type":"WIDE") "phone_number":
,
"01012345678", "tran_type":"L". "subject","전환전송제목 " "tran_message":"'전환전송메시지
,

" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123","add_etc1 ":"add
,
_etc1" "add_etc2":"add_etc2" "add_etc3":"add_etc3") "add_etc4":"add_etc1 : "template_cod
e":"a7e4c69be6576f926ad039ddabc081d62c5e2237" "targeting":"M , "message":"messag
e" , attachment":{"button":[{"type":"WL' "url_mobile":"https://www.mtsco.co.kr"},("type":"A
C"}],"coupon":{"description":"상세내용
" "url_pc":"https://www.mtsco.co.kr", "url_mobile":""https://www.mtsco.co.kr"),"image":"im
g_url":"https://mud-
kage.kakao.com/dn/mlyZ2/btsL90y8aUy/NDSQQD51yowEZzKouBWOv0/img_l.jpg"'}}}

# WIDE_ITEM_LIST 타입

{"auth_code":"인증코
드 "sender_key":" df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"025011980", "send_mode":"3" "message_type":"WIDE_ITEM_LIST", "phon
e_number":"01012345678", "tran_type":"L", "subject":"전환전송제목", "tran_message":"전환
전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,

6

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

etc1 " "add_etc2' ":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 , "template_cod
e":"739d120e850afc19f1917c8d8f40a1be82eaac69", "targeting : M "attachment":{"butto
,
n":[{"type":"WL' , "url_mobile":"https://www.mtsco.co.kr")/"type":"AC")],"item":{"list":[{"img_
url":"https://mud-
kage.kakao.com/dn/ba6UjQ/btsPLkt9yt0/bgiaK52aewjM7kfPUOfaCk/img_ljpg" "url_mobi
le":"https://www.mtsco.co.kr")/"img_url":"https://mud-
kage.kakao.com/dn/cMasS3/btsPKkVRPqR/uRK4UW0TDFkmLZcK9TySCK/img_l.jpg"),("im
g_url":"https://mud-
kage.kakao.com/dn/Yrn1r/btsPLXZwlk9/3yTKJotNNg2RZj7DKyUkT0/img_l.jpg "}]}, "coupo
n":("description"."상세내용", "url_mobile":"https://www.mtsco.co.kr")}}

CAROUSEL_FEED 타입

{"auth_code":"인증코
드 "sender_key": df8b597658c2702fbbaddb0d828cee19a51f18ca", "country_code":"82", "c
allback_number":"025011980", "send_mode":"3") "message_type":"CAROUSEL_FEED") "phon
,
e_number":"01012345678", "tran_type":"L "subject":"전환전송제목", "tran_message":"전환
전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 : "template_cod
,
e" : 4f004756edbcf23f88d04af71 3b6dcf637338f30" "targeting : "M" "carousel":("list":["mes
,
sage":" 고객명안녕하세요.(주)엠티]에스컴퍼니입니다.₩n₩n상 세내역은버튼링크를참고해주
세요. " "attachment":("coupon":{"description":"상세설명
,
" "url_pc"/"https://www.misco.co.kr/","url_mobile"."https:/www.mtsco.co.kr/"},"button":[("t
,
ype":"WL , "url_pc":"https://www.mtsco.co.kr/", "url_mobile":"https://www.mtsco.co.kr/"},{"t
ype":"AC"),"image":("img_url":"https://mud-
kage.kakao.com/dn/zsDIk/btsOHjRuZr0/SU08nPJBECfFGfl63QQ770/img_ljpg" "img_link":
,
"https://www.mtsco.co.kr/"}}},{"attachment":("image":{"img_url":"https://mud-
kage.kakao.com/dn/elGDiQ/otsOlp4/Zxo/PUsuvくUTCTuZ2gXgZKehkk/img_l.jpg". "img_lin
,
k":"https://www.mtsco.co.kr/"}}}]}}

PREMIUM_VIDEO 타입

{"auth_code":" 인증코
드 " "sender_key":" df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"025011980", "send_mode":"3' " "message_type":"PREMIUM_VIDEO", "pho
,

7

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

ne_number","01012345678", "tran_type":"L "subject":"전환전송제목", "tran_message":"전
환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123","add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3" "add_etc4":"add_etc1", "template_cod
,
e":"37665dcb987c723634b0ee3ccb72504bb1fc9530") "targeting":"M", "header":"헤더헤더
입니다. , "message":"변수프리]미엄동영상테스트
" "attachment":{"button":[("type":"WL' "url_pc":"https://www.mtsco.co.kr", "url_mobile":"htt
,
ps://www.mtsco.co.kr")],"coupon":("description":"상세내용
" http://www.www.com/i_pot/le/ltw.itick/ita/hos/hoeei
o_url:/"https://tv.kakao.com/channel/1506/cliplink/454718311") "thumbnail_url":"https://t
1.daumcdn.net/news/202504/27/sbsi/20250427210013294ehix.jpg"}}}

# COMMERCE 타입

{"auth_code":"인증코
드 "sender_key": df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"025011980","send_mode":"3") "message_type":"COMMERCE", "phone_nu
mber":"01012345678", "tran_type":"L' , "subject":"전환전송제목", "tran_message":"전환전송
메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123","add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 、 "template_cod
e":"eeef8c0d61037be97e39f8b0313d3771b750f7bf", "targeting":"M" "additional_content":
변수테스트
" "attachment":("button":[{"type":"BK"),("type":"WL" "url_pc":"https://www.mtsco.co.kr","url
,
_mobile":"https://www.mtsco.co.kr")],"commerce":("title":"aaa", "regular_price":1000,"disco
unt_price":700,"discount_rate":30,"discount_fixed":300}, "image":("img_urI":"https://mud-
kage.kakao.com/dn/ksplP/btsO8blzneD/Qvd9Hxyrki4A9YwWLb5bf0/img_l.jpg , "img_link
" :"https://www.mtsco.co.kr"}}}

CAROUSEL_COMMERCE 타입

{"auth_code":" 인증코
드 "sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"02501980","send_mode":"3") "message_type":"CAROUSEL_COMMERCE
,
" "phone_number":"01012345678", "tran_type":"L , "subject":"전환전송제목
,
" "tran_message","전환전송메시지
,

8

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

" "callback_url":"https://www.mtsco.co.kr/message_caIlback.do?seq=123","add_etc1 ":"add
,
etc1 " "add_etc2"."add_etc2","add_etc3","add_etc3", "add_etc4":"add_etc1","template_cod
e":"61091346d088f6983f1 1e4aa22e3890a547fe378", "targeting":"M", "carousel":{"head":{"h
eader":"header","content":"내용message", "image_url":"https://mud-
kage.kakao.com/dn/beEeWz/btsPLlaubst/nvC8K8mJqkuj0ZpmG2zhQK/img_I.jpg", "url_m
obile":"https://www.mtsco.co.kr"),"list":("attachment":"commerce':('regular_price":1000,"
discount_price\\700,discount_ratel:30/discount_fixed":300),"coupon":("urI_mobile":"https
://www.mtsco.co.kr"),""button":[("type":"WL' , "url_mobile":"https://www.mtsco.co.kr")],"ima
ge":("img_url":"https://mud-
kage.kakao.com/on/w08Go/btsPKjP6XAo/KuPqyVKsdfGPMuv1 RkHcU1/img_l.jpg", "img_li
,
nk":"https://www.mtsco.co.kr"}}}/"attachment":"commerce':/'regular_price":1000,"discou
nt_price":700,"discount_rate":30,"discount_fixed":300}, "image":{"img_url":"https://mud-
kage.kakao.com/dn/bD5ngK/btsPKSEHzv4/88UN5h40dGgTQMieKijEIK/img_ljpg" "img_li
nk":"https://www.mtsco.co.kr"}}}]}}}

8. 브랜드 메시지 기본형(전문 방식) 전송요청(여러 건)

# [Request]

- · path : /btalk/send/messages/basic
- · method : POST
- · header


○ Content-type: application/json

- · parameter (json)


| 키 | 상세키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- | --- |
| auth_code |  | text(40) | Y | MTS 에서 발급한 인증코드 | "auth_code": "asWdsgsk46s eE" |
| reseller_code |  | text(9) | N | 메시지 신고시 KISA 에 전달될 재판매사 구분 코드 | "reseller_code ":"123456789" |
| send_mode |  | text(1) | Y | 브랜드 메시지 발송 유형 타입 | "send_mode":" 2" |


9

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| data |  | Json Array | Y | 전송요청 파라미터를 포함한 json 배열 |  |
| --- | --- | --- | --- | --- | --- |
|  | sender key | text(40) | Y | 발신 프로필 키 | "sender_key":" 2662e99eb7a1 f21abb395527 8e9955f5a9a9 9b62" |
|  | send_date | text(14) | Y | 발송 예정일 (기본값: MTS 서버에 등록일시) | "send_date":"2 02001011201 01" |
|  | message_type | text(20) | Y | 브랜드 메시지 타입 | "message_typ e": "TEXT" |
|  | targeting | text(1) | Y | 타겟팅 타입(M/N/I) | "targeting": "M" |
|  | template_code | text(30) | Y | 템플릿코드 | "template_cod e":"A001_01" |
|  | callback_numb er | text(15) | Y | 발신 전화번호 | "callback_num ber":"1522- 1825" |
|  | country_code | text(16) | N | 국가번호 (기본 82) | "country_code ":"82" |
|  | phone_numbe r | text(16) | N | 사용자 전화번호 | "phone_numb er":"01012345 678" |
|  | app_user_ id | text(20) | N | 앱 유저 ID | "app_user_id": "12345" |
|  | push_alarm | text(1) | N | 푸시 알람 여부(기본 Y) | "push_alarm": "Y" |
|  | message | text | Y | 사용자에게 전달될 메시지 | - |
|  | additional_con tent | text(34) | N | 부가 정보 |  |


10

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  | attachment | Attachme nt | N | 메시지에 첨부할 내용 링크 버튼과 이미지를 첨부 |  |
| --- | --- | --- | --- | --- | --- |
|  | header | text(20) | N | header 필드 | "header":"mes sage header" |
|  | carousel | Carousel | N | carousel 필드 필수 | - |
|  | tran_type | text(1) | Y | 전환전송 여부(N/S/L/M) | "tran_type":"S" |
|  | tran_message | text(1000) | N | 전환전송 메시지 | "tran_message ":"고객님의 택배가 금일 (18~20)시에 배달 예정입니다." |
|  | subject | text(20) | N | LMS 전송 시 필요한 제목 | "subject":"제목 " |
|  | callback_url | text(512) | N | MTS 에서 메시지 전송결과를 보내줄 고객사 서버의 Full URL | "callback_url":" https://www.m tsco.co.kr/mes sage_callback. do?seq=123" |
|  | add_etc1 | text(160) | N | 고객사에서 보내는 추가 정보 1 | "add_etc1":"ad d_etc1" |
|  | add_etc2 | text(160) | N | 고객사에서 보내는 추가 정보 2 | "add_etc2":"ad d_etc2" |
|  | add_etc3 | text(160) | N | 고객사에서 보내는 추가 정보 3 | "add_etc3":"ad d_etc3" |
|  | add_etc4 | text(160) | N | 고객사에서 보내는 추가 정보 4 | "add_etc4":"ad d_etc4" |


[Response]

| 키 | 타입 | 필수 | 설명 예제 |
| --- | --- | --- | --- |
| code | text(4) | Y 처리 결과 코드 (0000=성공) | "code ":"0000" |


11

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| received_at | text(19) | N | 수신 시간 (realtime 발송 시) | "received_at":"2015-08- 06 10:51:00" |
| --- | --- | --- | --- | --- |
| message | text | N | 오류 메시지 | "message":"JSONParsing Exception" |


# 9. 샘플(Sample) 데이터

# TEXT 타입

{"auth_code":"인증코
드 "send_mode":"3" "data":[("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
,
ca , "country_code":"82") "callback_number":"025011980", "message_type":"TEXT", "phone_
,
,
number":"01012345678", "tran_type":"L' "subject":"전환전송제목", "tran_message":"전환전
송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 、 "template_cod
,
,
e":"7a750c300ad4e853f3cd450ac468d5c6619709cd" "targeting" :"M" "message":"testmtsc
,
o.co.kr")/"sender_key':"df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"
82" " callback_number":"025011980", "message_type":"TEXT" "phone_number":"010123456
,
,
78" "tran_type":"L' "subject":"전환전송제목
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 "、 "template_cod
e":"7a750c300ad4e853f3cd450ac468d5c6619709cd", "targeting":"M", "message":"testmtsc
,
o.co.kr"}]}

# IMAGE 타입

{"auth_code":" 인증코
드 " "send_mode":"3" "data":[{"sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
,
ca " "country_code":"82") "callback_number"":"025011980", "message_type":"IMAGE") "phone
,
,
,
_number":"01012345678", "tran_type":"L "subject":"전환전송제목", "tran_message"."전환전
송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 : "template_cod
,
e":" 4c68534ba3dd3170482305e0787559c9cf76d382", "targeting":"M" "message":"test테스
,
트메시지입니

12

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

다. " "attachment":{"button":[("type":"WL' "url_mobile":"https://www.daum.net/link1 "}],"im
,
age"://"img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg"}}{"send
er_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82") "callback_n
umber":"025011980", "message_type": IMAGE" "phone_number":"01012345678", "tran_typ
e":"L " "subject":"전환전송제목
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1", "template_cod
,
,
e":" 4c68534ba3dd3170482305e0787559c9cf76d382", "targeting":"M" "message":"test테스
,
트메시지입니
다. " "attachment":("button":[("type":"WL "url_mobile":"https://www.daum.net/link1 "), "im
,
age":("img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg"}}}}}

# WIDE 타입

{"auth_code":" 인증코
드 " "send_mode":"3" "data":[("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
,
ca" , "country_code":"82") "callback_number":"025011980", "message_type":"WIDE" "phone_
,
,
number":"01012345678", "tran_type":"L "subject"."전환전송제목", "tran_message"."전환전
송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
e":"a7e4c69be6576f926ad039ddabc081d62c5e2237", "targeting" :"M "message":"messag
e" "attachment":("button":[{"type":"WL , "url_mobile":"https://www.mtsco.co.kr"},{"type":"A
,
C"}], "coupon":("description":"상세내용
" "url_pc":"https://www.mtsco.co.kr","url_mobile":"https://www.mtsco.co.kr"),"image":("im
g_url":"https://mud-
kage.kakao.com/dn/mlyZ2/btsL9Oy8aUy/NDSQQD51yowEZzKouBWOv0/img_ljpg"ll{kil's
ender_key":"df8b597658c2702fbbaddb0d828cee1 9a51f18ca" "country_code":"82", "callba
,
ck_number":"025011980", "message_type":"WIDE", "phone_number":"01012345678", "tran_
type":"L , "subject":"전환전송제목
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 , "template_cod
e":"a7e4c69be6576f926ad039ddabc081 d62c5e2237" "targeting" :"M "message":"messag
e" "attachment":{"button":[{"type":"WL") "url_mobile":"https://www.mtsoo.co.kr"},{"type":"A
,

13

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

C"}], "coupon":{"description":"상세내용
" "url_pc":"https://www.mtsco.co.kr","url_mobile":"https://www.mtsco.co.kr")."image":/"im
g_url":"https://mud-
kage.kakao.com/dn/mlyZ2/btsL9Oy8aUy/NDSQQD51yowEZzKcuBWOVQ/img_(jpg"?}I}

# WIDE_ITEM_LIST 타입

{"auth_code":" 인증코
드 " "send_mode":"3" "data":(('sender_key":"df8b597658c2702fbbaddb0d828cee1 9a51f18
,
ca " country_code":"82") "callback_number":"025011980", "message_type" : 'WIDE_ITEM_LIS
,
,
,
T" "phone_number":"01012345678", "tran_type":"L' "subject":"전환전송제목
,
,
" "tran_message":"전환전송메시지
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 : "template_cod
,
e":"739d120e850afc19f1917c8d8f40a1be82eaac69" "targeting" M" "attachment":{"butto
,
,
n":[{"type":"WL' , "url_mobile":"https://www.mtsco.co.kr"),("type":"AC"),"item":{"list":[{"img_
url":"https://mud-
kage.kakao.com/dn/ba6UjQ/btsPLkt9yt0/bgiaK52aewjM7kfPUOfaCk/img_l.jpg") "url_mobi
,
le":"https://www.mtsco.co.kr"),("img_url":"https://mud-
kage.kakao.com/dn/cMasS3/btsPKkVRPqR/uRK4UWOTDFkmLZcK9TySOK/img_ljpg")/"im
g_url":"https://mud-
kage.kakao.com/dn/Ym1r/btsPLXZwlk9/3yTKJotNNg2RZj7DKyUkT0/img_I.jpg"}]}, "coupo
n":("description":"상세내용
" "url_mobile":"https://www.mtsco.co.kr")}}/"sender_key":"df8b597658c2702fbbaddb0d82
,
8cee19a51f18ca" "country_code":"82") "callback_number":"025011980" "message_type":"
,
,
WIDE_ITEM_LIST", "phone_number":"01012345678", "tran_type":"L", "subject":"전환전송제
,
목
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3" "add_etc4":"add_etc1", "template_cod
,
e":"739d120e850afc19f1917c8d8f40a1be82eaac69" "targeting : M" "attachment":{"butto
,
n":[{"type":"WL' , "url_mobile":"https://www.mtsco.co.kr"},{"type":"AC"}, "item":{"list":[("img_
url":"https://mud-
kage.kakao.com/dn/ba6UjQ/btsPLkt9yt0/bgiaK52aewjM7kfPUOfaCk/img_l.jpg , "url_mobi
le":"https://www.mtsco.co.kr"),("img_url":"https://mud-
kage.kakao.com/dn/cMasS3/btsPKkVRPqR/uRK4UWOTDFkmLZcK9TySOK/img_ljpg")/"im
g_url":"https://mud-

14

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

# kage.kakao.com/dn/Ym1r/btsPLXZwlk9/3yTKJotNNg2RZj7DKyUkT0/img_l.jpg "}]},"coupo
n":{"description":" 상세내용", "url_mobile":"https://www.mtsco.co.kr'}}}}]}

# CAROUSEL_FEED 타입

{"auth_code":"인증코
드 " "send_mode":"3" "data":[{"sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
ca , "country_code":"82", "callback_number"':"025011980", "message_type" : "CAROUSEL_FEE
D" "phone_number":"01012345678", "tran_type":"L' " "subject":"전환전송제목
,
" "tran_message":"전환전송메시지
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
e" : 4f004756edbcf23f88d04af71 3b6dcf637338f30", "targeting : "M" "carousel":("list":{"mes
,
sage":" 고객명안녕하세요.(주)엠티에스컴퍼니입니다.₩n₩n상 세내역은버튼링크를참고해주
세요. " "attachment":("coupon"("description":"상세설명
,
" "uri_pc:/https://www.mtsco.co.kr/"url_mobile*.https://www.mtsco.co.kr/"},"button":[{"t
,
ype":"WL "url_pc":"https://www.mtsco.co.kr/", "url_mobile":"https://www.mtsco.co.kr/"},{"t
ype":"AC"}],"image":("img_url":"https://mud-
kage.kakao.com/dn/zsDIk/btsOHjRuZr0/SU08nPJBECfFGfl63QQ770/img_l.jpg , "img_link":
"https://www.mtsco.co.kr/""}}},("attachment":{"image":("img_url":"https://mud-
kage.kakao.com/dn/elGDiQ/btsOlp4IZxo/PUsuvKUTCTuZ2gXgZKehkk/img_ljpg" "img_lin
,
k":"https://www.mtsco.co.kr/")}]}},/"sender_key':"df8b597658c2702fbbaddb0d828cee1 9a
51f18ca" "country_code":"82" "callback_number":"025011980", "message_type":"CAROUSE
,
,
L_FEED" "phone_number":"01012345678", "tran_type":"L", "subject","전환전송제목
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
e":"4f004756edbcf23f88d04af71 3b6dcf637338f30", "targeting": "M "carousel":("list":["mes
sage":" 고객명안녕하세요.(주)엠티]에스컴퍼니입니다.\n₩n상 세내역은버튼링크를참고해주
세요. " "attachment":("coupon":("description":"상세설명
,
" "un_pc","https://www.ntsco.co.kr)","un|_mobile":"https://www.mtsco.co.kr/"},"button":[{"t
ype":"WL , "url_pc":"https://www.mtsco.co.kr/", "url_mobile":"https://www.mtsco.co.kr/"},{"t
,
ype":"AC"),"image":("img_url":"https://mud-
kage.kakao.com/dn/zsDIk/btsOHjRuZr0/SU08nPJBECfFGfl63QQ770/img_l.jpg , "img_link":
"https://www.mtsco.co.kr/""}}},("attachment":("image":{"img_url":"https://mud-
kage.kakao.com/dn/elGDiQ/otsOlp4IZxo/PUsuvKUTCTuZ2gXgZKehkk/1mg_l.jpg". "img_lin
,
k":"https://www.mtsco.co.kr/"}}}]}}}}

15

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

# PREMIUM_VIDEO 타입

{"auth_code":"인증코
드 " "send_mode":"3" "data":[("sender_key":"df8b597658c2702fbbaddb0d828cee1 9a51f18
,
ca . "country_code":"82") "callback_number":"025011980", "message_type":"PREMIUM_VID
,
EO" "phone_number":"01012345678" "tran_type":"L' " "subject":"전환전송제목
,
,
,
" "tran_message":"전환전송메시지
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2" "add_etc3 ":"add_etc3" "add_etc4":"add_etc1 , "template_cod
,
e":"37665dcb987c723634b0ee3ccb72504bb1fc9530") "targeting":"M", , "header":"헤더헤더
,
입니다. " "message":"변수프리미엄동영상테스트
,
" "attachment":("button":[{"type":"WL' "url_pc":"https://www.mtsco.co.kr", "url_mobile":"htt
,
ps://www.mtsco.co.kr")],"coupon":("description":"상세내용
" "url_pc":"https://www.mtsco.co.kr", "url_mobile'"https://www.mtsco.co.kr"),"video":("vide
,
o_url":"https://tv.kakao.com/channel/1506/cliplink/454718311 " "thumbnail_url":"https://t
1.daumcdn.net/news/202504/27/sbs/20250427210013294ehixjog"Wh('sender_key":"df8
b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "callback_number":"02
,
5011980", "message_type":"PREMIUM_VIDEO", "phone_number":"01012345678", "tran_typ
e":"L " "subject":"전환전송제목
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2" "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
e":"37665dcb987c723634b0ee3ccb72504bb1fc9530" "targeting":"M", "header":"헤더헤더
,
입니다. " "message":"변수프리]미엄동영상테스트
" attachment":{"button":[{"type":"WL "url_pc":"https://www.mtsco.co.kr", "url_mobile":"htt
,
ps://www.mtsco.co.kr")]."coupon"("description":"상세내용
" http://www.www.com/i_pot/le/ltw/hiter/ita/hos/hoeei
o_url":"https://tv.kakao.com/channel/1506/cliplink/454718311 " "thumbnail_url":"https://t
,
1.daumcdn.net/news/202504/27/sbsi/20250427210013294ehix.jpg"}}}}}

# COMMERCE 타입

("auth_code":"인증코
드 " "send_mode":"3" "data":(("sender_key","df8b597658c2702fbbaddb0d828cee1 9a51f18
ca , "country_code":"82", "callback_number"':"025011980", "message_type":"COMMERCE", "
,
phone_number":"01012345678", "tran_type":"L " "subject":" 전환전송제목", "tran_message": "
,
,

16

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
e" : eeef8c0d61037be97e39f8b0313d3771b750f7bf", "targeting":"M", "additional_content":
"변수테스트
" "attachment";{"button":[("type":"BK"),{"type":"WL", "url_pc":"https://www.mtsco.co.kr", "url
,
_mobile":"https://www.mtsco.co.kr")],"commerce":"title":"aaa" "regular_price":1000,"disco
unt_price":700,"discount_rate":30,"discount_fixed":300)"image":"ing_url":"https://mud-
kage.kakao.com/dn/kspIP/btsO8blzneD/Qvd9Hxyrki4A9YwWLb5bf0/img_Ljpg , "img_link
" :"https://www.mtsco.co.kr")}}/"sender_key*"df8b597658c2702fbloaddb0d828cee19a51f1
8ca" "country_code":"82", "callback_number":"025011980", "message_type":"COMMERCE",
,
,
,
phone_number":"'01012345678", "tran_type":"L , "subject":"전환전송제목
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 , "template_cod
,
e":"eeef8c0d61037be97e39f8b0313d3771b750f7bf", "targeting":"M", "header":"헤더헤더입
니다. " "additional_content":" 변수테스트
,
" "attachment":("button":[{"type":"BK"),{"type":"WL") "url_pc":"https://www.mtsco.co.kr", "url
,
_mobile":'"https://www.mtsco.co.kr"}],"commerce":"title":"aaa", "regular_price":1000,"disco
unt_price*:700,"discount_rate*:30,"discount_fixed":300}, "image":{"img_urI":"https://mud-
kage.kakao.com/dn/ksplP/btsO8blzneD/Qvd9Hxyrki4A9YwWLb5bf0/img_l.jpg , "img_link
" :"https://www.mtsco.co.kr"}}}]]}

# CAROUSEL_ COMMERCE 타입

{"auth_code":" 인증코
드 " "send_mode":"3" "data":[("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
,
,
ca" , "country_code":"82") "callback_number":"025011980", "message_type":"CAROUSEL_CO
,
MMERCE" "phone_number":"01012345678", "tran_type":"L , "subject":"전환전송제목
,
" "tran_message":"전환전송메시지
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
e":"61091346d088f6983f1 1e4aa22e3890a547fe378", "targeting":"M" "carousel":{"head":{"h
,
,
eader":"header", "content":"내용message", "image_url":"https://mud-
kage.kakao.com/dn/beEeWz/btsPLlaubst/nvC8K8mJqkuj0ZpmG2zhQK/img_l.jpg") "url_m
obile':"https://www.mtsco.co.kr"),"list"(("attachment"("commerce":("regular_price":1000,"
discount_price":700, "discount_rate":30,"discount_fixed":30Of,"coupon":("url_mobile":"https

17

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

://www.mtsco.co.kr"),"button":[{"type":"WL "url_mobile":"https://www.mtsco.co.kr"}],"ima
ge":("img_url":"https://mud-
kage.kakao.com/dn/w08Go/ctsPKjP6XAo/KuPqyVKsdfGPMuv1 RkHcU1/img_l.jpg", "img_li
,
nk":"https://www.mtsco.co.kr"}}}/"attachment"("commeroe':/'regular_price':1000,"discou
nt_price":700,"discount_rate":30, "discount_fixed":300}, "image":{"img_url":"https://mud-
kage.kakao.com/dn/bD5ngK/btsPKSEHzv4/88UN5h4OdGgTQMieKijEIK/img_ljpg" "img_li
,
nk":"https://www.mtsco.co.kr"}}}]}},{"sender_key": "df8b597658c2702fbbaddb0d828cee19a
51f18ca", "country_code":"82" "callback_number":"025011980", "message_type":"CAROUSE
,
,
,
L_COMMERCE") "phone_number":"01012345678" "tran_type":"L". "subject":"전환전송제목
,
,
" "callback_url":"https://www.mtsco.co.kr/message_calIback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod

,
,
,
e":"61091346d088f6983f1 1e4aa22e3890a547fe378" "targeting" :"M" "carousel":("head":{"h
,
,
eader":"header", "content":"내용message") "image_url":"https://mud-
kage.kakao.com/dn/beEeWz/btsPLiaubst/nvC8K8mulqkuj0ZpmG2zhQK/img_l.jpg") "url_m
obile":"https://www.mtsco.co.kr"),"list":(("attachment"("commerce":("regular_price":1000, "
discount_price":700, discount_rate":30,"discount_fixed":300}, "coupon":/"url_mobile":"https
://www.mtsco.co.kr"),"button":[{"type":"WL "url_mobile":"https://www.mtsco.co.kr")],"ima
ge":("img_url":"https://mud-
kage.kakao.com/dn/w08Go/btsPKjP6XAo/KuPqyVKsdfGPMuv1 RkHcU1/img_l.jpg", "img_li
,
nk":"https://www.mtsco.co.kr")}}//"attachment"{"commerce":/"regular_price":1000,"discou
nt_price":700,"discount_rate":30, " discount_fixed":300}, "image":{"img_url":"https://mud-
kage.kakao.com/dn/bD5ngK/btsPKSEHzv4/88UN5h4OdGgTQMieKijEIK/img_ljpg" "img_li
,
nk":"https://www.mtsco.co.kr"}}}]}}]}

10. 브랜드 메시지 응답요청

발송 후 결과를 받기까지 최대 5분이 걸릴 수 있습니다.

[Request]

- · path : /btalk/resp/messages
- · method : POST
- · header


○ Content-type: application/json

- · parameter (json)


| 키 | 타입 | 필수 설명 | 예제 |
| --- | --- | --- | --- |


18

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| auth_code | text(40) | Y | 인증코드 (MTS 에서 발급한 인증코드) | "auth_code":"asWdsg sk46seE" |
| --- | --- | --- | --- | --- |
| sender_key | text(40) | Y | 발신 프로필 키 | "sender_key":"2662e9 9eb7a1f21abb395527 8e9955f5a9a99b62" |
| send_date | text(14) | Y | 발송예정일 최소:연월일(8 자) * 연월일(8 자), 연월일시(10 자), 연월일시분(12 자), 연월일시분초(14 자) 모두 가능 | "send_date":"2020010 1120101" |
| add_etc1 | text(160) | N | 고객사에서 보내는 추가 정보 1 | "add_etc1":"add_etc1 " |
| add_etc2 | text(160) | N | 고객사에서 보내는 추가 정보 2 | "add_etc2":"add_etc2 " |
| add_etc3 | text(160) | N | 고객사에서 보내는 추가 정보 3 | "add_etc3":"add_etc3 " |
| add_etc4 | text(160) | N | 고객사에서 보내는 추가 정보 4 | "add_etc4":"add_etc4 " |
| page | number | N | 페이지(기본값:1) | "page":1 |
| count | number | N | 한 페이지에 조회할 건수(default: 1000) | "count":1000 |


[Response]

# · 응답 바디는 JSON 객체로 아래를 참고 하세요.

| 키 | 상세키 | 타입 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| code |  | text(4) | 결과코드 | "code":"0000" |
| received_at |  | text(19) | 메시지를 수신한 시간 | "received_at":"2015- 08-06 10:51:00" |
| message |  | text | 오류 메시지 (오류시 존재하는 값) | "message":"NoMess ageFoundException " |
| data |  | Json[] | 전송요청 파라미터를 포함한 json 배열 |  |
|  | ptn_id | number | 업체 번호 | "ptn_id":52 |


19

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  | result_code | text(4) | 발송결과코드 | "result_code":"1030" |
| --- | --- | --- | --- | --- |
|  | result_date | text(14) | 발송결과 수신일시 | "result_date":"20250 729084201" |
|  | real_send_dat e | text(14) | 실제발송일시 | "real_send_date":"20 250729084156" |
|  | sender_key | text(40) | 발신 프로필 키 | "sender_key":"2662e 99eb7a1f21abb395 5278e9955f5a9a99b 62" |
|  | send_date | text(14) | 발송예정일 기본값 MTS 서버에 등록일시 | "send_date":"20250 729084150" |
|  | callback_num ber | text(15) | 발신전화번호 | "callback_number":" 15221825" |
|  | country_code | text(3) | 국가번호 기본값은 82 | "country_code":"82" |
|  | phone_numb er | text(16) | 사용자 전화번호 | "phone_number":"0 1012345678" |
|  | app_user_id | text(20) | 앱유저아이디 | "app_user_id":"abc1 23" |
|  | message_typ e | text(20) | 발송한 친구톡 메시지 타입 | "message_type":"TE XT" |
|  | template_cod e | Text(30) | 템플릿 코드 | "template_code":"A 001_01" |
|  | tran_type | text(1) | 전환전송 유형 브랜드 메시지로 전송이 불가할 경우 SMS/LMS/MMS 로의 전환전송 여부. 기본값은 'N' | "tran_type":"S" |
|  | callback_url | text(512) | MTS 에서 메시지 전송결과를 보내줄 고객사 서버의 Full URL | "callback_url":"https: //www.mtsco.co.kr/ message_callback.d o?seq=123" |


20

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  | add_etc1 | text(160) | 고객사에서 보내는 추가 정보 1 | "add_etc1":"etc1" |
| --- | --- | --- | --- | --- |
|  | add_etc2 | text(160) | 고객사에서 보내는 추가 정보 2 | "add_etc2":"etc2" |
|  | add_etc3 | text(160) | 고객사에서 보내는 추가 정보 3 | "add_etc3":"etc3" |
|  | add_etc4 | text(160) | 고객사에서 보내는 추가 정보 4 | "add_etc4":"etc4" |


# 11. 샘플(Sample) 데이터

# 1) 전문 예제(응답요청)

{"auth_code":"인증번
호","sencer_key""df8b597658c2702fbbaddb0d828cee19a51f18ca","send_date":"2025091
5","page":1,"count":10}

12. CALLBACK_URL 사용 시 전송결과 응답

- 1. 보내는 데이터는 JSON 으로 각 서비스의 전송결과 요청 data 배열 내의 JSON 과
- 같다.


- 2. 브랜드 메시지/친구톡 발송 후 MMS, SMS 로 전환전송이 일어날 시 받게 되는 응답
- 은 브랜드 메시지 결과/전환전송 결과 총 2건을 응답받게 된다.


- 3. JSON 데이터 내에 아래 파라메터가 추가된다.


| send_type | text(5) | 메시지 서비스 타입 알림톡 : ATK 친구톡 : FTK 친구톡V2 : FTKV2 브랜드 메시지 : BTK SMS : SMS MMS : MMS | "send_type":"BTK" |
| --- | --- | --- | --- |


# 2) 응답 예제

{"result_code":"3015","result_date:\"20250922092123","real_send_date":"20250922092121
"tran_pr","20000521","sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca","s

21

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

end_date"."20250922092107","template_code":"d619ed0c7ba9c74c0ac35069710121c0ed
of3bd","country_code","82","phone_number:"01012345678",,"callback_number":"025011
980" "message_type"."CAROUSEL_COMMERCE","tran_type":"N", "add_etc1":"add_etc1","ad
,
d_etc2":"add_etc2","add_etc3":"add_etc3","add_etc4":"add_etc4","send_type","BTK")

# 13. 필드 상세정보

# 1. sender_key

- 1. 브랜드 메시지를 발송하기 위한 고객사 고유의 "발송프로필키"
- 2. 발송프로필키는 영업담당자로 부터 발급받음
- ※ 브랜드 메시지 발송 딜러사 변경시 "발송프로필키" 변경 필요


# 2. message_type

브랜드 메시지 타입 코드

- 1. TEXT: 텍스트
- 2. IMAGE: 이미지
- 3. WIDE: 와이드 이미지
- 4. WIDE_ITEM_LIST: 와이드 리스트
- 5. CAROUSEL_FEED: 캐러셀 피드
- 6. PREMIUM_VIDEO: 프리미엄 동영상
- 7. COMMERCE: 커머스
- 8. CAROUSEL_COMMERCE: 캐러셀 커머스


# 3. targeting (타겟팅 타입)

- 1. M : 수신 동의 유저 (카카오톡 수신 동의)
- 2. N : 수신 동의 유저 n 채널 친구
- 3. I : 발송 요청 대상 n 채널 친구


# 4. phone_number, app_user_id

- 1. 두 값 중 하나는 반드시 존재해야 함
- 2. 둘 다 있으면 phone_number 기준으로 발송


22

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

# 5. tran_type

- 1. 브랜드 메시지 실패 시 SMS/LMS로 전환 여부


- 2. 전환 전송 유형


| 키 | 코드 | 내용 | 비고 |
| --- | --- | --- | --- |
| tran_type | S | SMS | 90Byte 메시지 |
| tran_type | L | LMS | 1,000자 |
| tran_type | N | 전환전송 하지 않음 |  |


# 6. tran_message

- 1. 브랜드 메시지 실패 메시지에 대하여 대체하여 전송하고자 하는 메시지


- 2. 브랜드 메시지 메시지와 같을시 동일 메시지 Insert


- 3. tran_type 이 S 또는 L (전환전송 사용) 이더라도 tran_message 가 공백이거나
- null 값이면 전환전송 하지 않음 상태 (N) 로 받음


- 4. tran_type 이 L 인 경우 subject(제목)이 없으면 전환전송 하지 않음 상태 (N) 로
- 받음


- 5. ※ tran_type 이 "S" 로 tran_message 가 90Byte 초과시 해당 메시지의 90Byte에
- 해당하는 메시지만 전송됩니다.


# 7. add_etc1~4

- 1. 고객사가 임의로 전달하는 추가 정보
- 2. 발송 결과 콜백 시 함께 반환됨


# 8. message

# message 필드 필수

- TEXT - 최대 1,300자 (줄바꿈: 최대 99개, URL 형식 입력 가능)
- · IMAGE - 최대 400자 (줄바꿈: 최대 29개, URL 형식 입력 가능)
- WIDE - 최대 76자 (줄바꿈: 최대 1개)


# message 필드 선택

PREMIUM_VIDEO - 최대 76자 (줄바꿈: 최대 1개)

23

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

# message 필드 사용안함

- WIDE_ITEM_LIST


- CAROUSEL_FEED


- COMMERCE


- CAROUSEL_COMMERCE


예제

"message": "브랜드 메시지 텍스트 : 자유형 - 한 건 발송"

# 9. additional_content

# additional_content 필드 선택

COMMERCE - 최대 34자 (줄바꿈: 최대 1개)

예제

"additional_content": "브랜드 메시지 부가정보"

# 10. header

# header 필드 필수

· WIDE_ITEM_LIST - 최대 20자 (줄바꿈: 불가)

# header 필드 선택

PREMIUM_VIDEO - 최대 20자 (줄바꿈: 불가)

# 예제

| "header": "와이드 리스트 header", |
| --- |


# 11. attachment

메시지에 첨부할 내용 (링크 버튼과 이미지)

| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |


24

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| button | json[] | N | 버튼 목록 |
| --- | --- | --- | --- |
| image | json | - | 이미지 요소 |
| item | json | - | 와이드 리스트 요소 |
| coupon | json | N | 쿠폰 요소 |
| commerce | json | - | 커머스 요소 |
| video | json | - | 동영상 요소 |


예제

{"button":[{"type":"AL", "scheme_android":"kakao://buttons-
linkAnd","scheme_ios":"kakao://buttons-
linklos"),("type":"AC"}],"coupon":("title":"1000 원할인쿠폰","description"."최대 12 자" "url_
mobile":"https://www.daum.net"),"commerce":(""title":"commerce-
title" "regular_price":3000,"discount_price":1000,"discount_rate":60,"discount_fixed":2000]}

# 12. Button

- TEXT, IMAGE - Coupon을 적용할 경우 최대 4개, 그 외 최대 5개


- WIDE, WIDE_ITEM_LIST - 최대 2개


- PREMIUM_VIDEO - 최대 1개


- · COMMERCE - 최소 1개, 최대 2개


| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| name | text | Y | 버튼 목록 |
| type | text(2) | Y | 버튼 타입 |
| scheme_android | text(1000) | - | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
| scheme_ios | text(1000) | - | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |
| url_mobile | text(1000) | - | MOBILE 환경에서 클릭 시 이동할 URL |
| url_pc | text(1000) | N | PC 환경에서 클릭 시 이동할 URL |


예제

25

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

[{"type":"AL","url_mobile":"https://www.daum.net",'scheme_android":"kakao://buttons-
linkAnd", "scheme_ios":"kakao://buttons-
linklos"),"type","AL","url_mobile":"https://www.daum.net", "scheme_android":"kakao://but
tons-linkAnd","scheme_jos":"kakao://buttons-linklos")]

# 13. Image

# image 필드 필수

- · IMAGE


- ● WIDE


- · COMMERCE


| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| img_url | text | Y | 이미지 업로드 API 로 등록한 이미지 URL · 캐러셀 커머스는 전체 이미지 비율이 동일해야 함 |
| img_link | text(1000) | N | 이미지 클릭시 이동할 URL 미설정시 카카오톡 내 이미지 뷰어 사용 |


예제

# {"img_url": "(img_url1)","img_link": "https://business.kakao.com/"}

# 14. Item

# item 필드 필수

- · WIDE_ITEM_LIST


- · 1번째 아이템은 title 필수 아님. 2~4번째 아이템은 title 필수 입력


| 키 |  | 타입 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| list |  | json[] | Y | 와이드 리스트 (최소:3, 최대: 4) |
|  | title | text | - | 아이템 제목 · 1 번째 아이템 - 최대 25 자 (줄바꿈: 최대 1 개) |


26

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  |  |  |  | · 2~4 번째 아이템 - 최대 30 자 (줄바꿈: 최대 1 개) |
| --- | --- | --- | --- | --- |
|  | img_url | text | Y | 아이템 이미지 URL |
|  | scheme_android | text(1000) | N | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
|  | scheme_ios | text(1000) | N | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |
|  | url_mobile | text(1000) | Y | MOBILE 환경에서 클릭 시 이동할 URL |
|  | url_pc | text(1000) | N | PC 환경에서 클릭 시 이동할 URL |


예제

{"list":["title":"최대 25 자(줄바꿈:최대 1 개)","img_url":"{img_url1}","url_mobile":"https://w
ww.daum.net",'scheme_android":"kakao://mainWideltem-
linkAnd", "scheme_ios":"kakao://mainWideltem-
linklos"),("title":"최대 30 자(줄바꿈:최대 1 개)","img_url":"(img_url2)"),("title":"최대 30 자(줄
바꿈:최대 1 개)","img_url":"(img_url3}", "url_mobile":"https://www.daum.net","scheme_ios":
"kakao://subWideltem-
linklos"),("title":"최대 30 자(줄바꿈:최대 1 개)", "img_url":"{img_url4}", "url_mobile":"https://
www.daum.net"}]}

# 15. Coupon

# 메세지 최하단 노출

- · 채널 쿠폰 URL(포맷: alimtalk=coupon://) 사용시 scheme_android, scheme_ios
- 중 하나 필수 입력


- · 채널 쿠폰 URL이 아닌 기본 쿠폰 사용시 url_mobile 필수 입력


| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| title | text | Y | 쿠폰 제목 사용 가능한 쿠폰 제목 · $(숫자)원 할인 쿠폰 (숫자: 1 ~ 99,999,999) · $(숫자}% 할인 쿠폰 (숫자: 1 ~ 100) |


27

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  |  |  | · 배송비 할인 쿠폰 · ${7 자 이내} 무료 쿠폰 · ${7 자 이내} UP 쿠폰 |
| --- | --- | --- | --- |
| description | text | Y | 쿠폰 설명 · WIDE, WIDE_ITEM_LIST, PREMIUM_VIDEO - 최대 18 자 (줄바꿈: 불가) · 그 외 - 최대 12 자 (줄바꿈: 불가) |
| url_mobile | text(1000) | Y | MOBILE 환경에서 클릭 시 이동할 URL |
| url_pc | text(1000) | N | PC 환경에서 클릭 시 이동할 URL |
| scheme_android | text(1000) | - | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
| scheme_ios | text(1000) | - | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |


예제

{"title": "이모티콘 무료 쿠폰", "description": "최대
12 자",url_mobile":"(https://www.daum.net","scheme_ios":"kakao://subWidettem-linklos")

# 16. Commerce

# commerce 필드 필수

· COMMERCE

| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| title | text | Y | 상품 제목 최대 30 자 (줄바꿈: 불가) · ${7 자 이내} 무료 쿠폰 · ${7 자 이내} UP 쿠폰 |
| regular_price | number | Y | 정상 가격 (0 ~ 99,999,999) |
| discount_price | number | N | 할인 후 가격 (0 ~ 99,999,999) |
| discount_rate | number | N | 할인율 (0 ~ 100) 할인 가격 존재시 할인율, 정액 할인 가격 중 하나는 필수 |
| discount_fixed | number | N | 정액 할인 가격 (0 ~ 999,999) |


28

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  |  | 할인 가격 존재시 할인율, 정액 할인 가격 중 하나는 필수 |
| --- | --- | --- |


예제

{"title": "commerce-title",regular_price": 3000,"discount_price": 1000,"discount_rate":
60,"discount_fixed": 2000}

# 17. Video

# video 필드 필수

# · PREMIUM_VIDEO

| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| video_url | text(500) | Y | 카카오 TV 동영상 URL |
| thumbnail_url | text(500) |  | 이미지 업로드 API 로 등록한 동영상 썸네일용 이미지 URL (기본값: 동영상 기본 썸네일 이미지) thumbnail_url 필드 필수 · video_url이 비공개 동영상 |


# 예제

{"video_url": "{video_url)","thumbnail_url": "{thumbnail_url}"}

# 18. Carousel

# carousel 필드 필수

- CAROUSEL_FEED
- CAROUSEL_COMMERCE


| 키 |  | 타입 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| head |  | json | N | 캐러셀 인트로 CAROUSEL_COMMERCE 인 경우 사용 |
|  | header | text(20) | Y | 캐러셀 인트로 헤더 |


29

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  |  |  |  | · 최대 20 자 (줄바꿈: 불가) |
| --- | --- | --- | --- | --- |
|  | content | text(50) | Y | 캐러셀 인트로 내용 · 최대 20자 (줄바꿈: 불가) |
|  | image_url | text | Y | 이미지 업로드 API 로 등록한 캐러셀 인트로 이미지 URL |
|  | url_mobile | text(1000) |  | MOBILE 환경에서 클릭 시 이동할 URL url_mobile 이 필수 · url_mobile, url_pc, scheme_android, scheme_ios 중 하나라도 입력하는 경우 |
|  | url_pc | text(1000) | N | PC 환경에서 클릭 시 이동할 URL |
|  | scheme_android | text(1000) | N | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
|  | scheme_ios | text(1000) | N | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |
| list |  | json[] | Y | 캐러셀 리스트 · 캐러셀 인트로(head) 사용시 - 1~5 개 · 그 외 - 2~6 개 |
|  | header | text(20) |  | 캐러셀 리스트 헤더 · 최대 20 자 (줄바꿈: 불가) header 필드 필수 · CAROUSEL_FEED header 필드 사용불가 · CAROUSEL_COMMERCE |
|  | message | text(180) |  | 캐러셀 리스트 메시지 · 최대 180 자 (줄바꿈: 최대 2 개) message 필드 필수 · CAROUSEL_FEED message 필드 사용불가 · CAROUSEL_COMMERCE |
|  | additional_content |  | N | 캐러셀 리스트 부가 정보 · 최대 34 자 (줄바꿈: 최대 1 개) |


30

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  |  |  |  | additional_content 필드 사용불가 · CAROUSEL_FEED |
| --- | --- | --- | --- | --- |
|  | attachment | json[] | Y | 캐러셀 아이템 이미지, 버튼 정보 |
| tail |  | json | N | 더보기 버튼 |
|  | url_mobile | text(1000) | Y | MOBILE 환경에서 클릭 시 이동할 URL |
|  | url_pc | text(1 000) | N | PC 환경에서 클릭 시 이동할 URL |
|  | scheme_android | text(1 000) | N | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
|  | scheme_ios | text(1 000) | N | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |


예제

{"head":{"header":"최대 20 자(줄바꿈:불가)","content":"최대 50 자(줄바꿈:최대 2 개)"},"list":[{
"attachment":("commerce":/"regular_price":3000,"discount_price":1000,"discount_rate":60,"
discount_fixed":2000),"button":[/"type"/WL","url_mobile":"https://www.daum.net")."image"
:("img_url":"(img_url1}"}}},{"attachment":"image":{"img_url":"(img_url2)", "img_link":"https://
business.kakao.com/info/bizmessage/"}}}/"attachment"":("button":["type":"AL", "url_mobile"
:"https://www.daum.net","scheme_android":"kakao://buttons-
linkAnd","scheme_ios":"kakao://buttons-linklos"]j."image":("img_url":"{img_url3}"}}}}]}

19. Attachment:Carousel

| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| button | json[] | - | 캐러셀 리스트 버튼 목록 · 최소 1 개, 최대 2 개 |
| image | json | Y | 캐러셀 이미지 |
| coupon | json | N | 캐러셀 리스트 쿠폰 캐러셀 리스트 최하단 노출 |
| commerce | json |  | 커머스 요소 commerce 필드 필수 · CAROUSEL_COMMERCE commerce 필드 사용불가 |


31

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  |  | · CAROUSEL_FEED |
| --- | --- | --- |


예제

("button''(["type":"AL","scheme_android":"kakao://buttons-
linkAnd","scheme_ios":"kakao://buttons-
linklos"),("type":"AC"),"coupon":("title":"1000 원할인쿠폰","description"."최대 12 자","url_m
obile":"https://www.daum.net"),"commerce":("title":"commerce-
http/spopit3500/bao.com/teou/teon_a//ioutiontje/30/

# 20. 버튼 타입:Button

브랜드 메시지 버튼 타입별 사용 가능한 버튼 파라미터와 필수 파라미터는 아래와 같습
니다.

| type | 설명 | 사용 가능 파라미터 | 필수 파라미터 |
| --- | --- | --- | --- |
| AC | 버튼 클릭 시 카카오톡 채널 추가 강조형 버튼(노란색)으로 표기되며, 버튼이 여러개일 경우 지정된 위치에 사용해야함 · TEXT, IMAGE - 첫번째 버튼 (최상단) · 그 외 - 두번째 버튼 (우측) name 은 채널 추가로 고정 캐러셀형은 전체 캐러셀 통틀어 1 개만 사용가능 타겟팅 M,N 만 사용 가능 | name type | name type |
| WL | 지정한 웹 링크로 이동 | name type url_mobile url_pc | name type url_mobile |
| AL | 지정한 앱 스킴 또는 웹 링크로 이동 | name type scheme_android scheme_ios | name type 다음 중 2 가지 이상 scheme_android |


32

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

|  |  | url_mobile url_pc | scheme_ios url_mobile |
| --- | --- | --- | --- |
| BK | 해당 버튼 텍스트 발송 | name type | name type |
| MD | 해당 버튼 텍스트 + 메시지 본문 발송 | name type | name type |
| BC | 상담톡을 이용하는 카카오톡 채널만 이용 가능 | name type | name type |
| BT | 카카오 I 오픈빌더의 챗봇을 사용하는 카카오톡 채널만 이용 가능 | name type | name type |
| BF | 카카오 비즈니스폼을 실행 강조형 버튼(노란색)으로 표기되며 AC 버튼이 없으면 첫번째, AC 버튼이 있으면 두번째 버튼에 위치 name 은 다음 중 사용 가능 · 톡에서 예약하기 · 톡에서 설문하기 · 톡에서 응모하기 | name type | name type |


# 21. callback_url

- 1. 카카오로부터 응답받은 결과를 전달받을 URL


- 2. 전송등록후 매 5분마다 카카오로부터 응답받은 결과를 입력한 URL로 보냄


- 3. 응답 값은 아래의 응답요청시 응답 값과 같음


- 4. 응답 완료 후 재전송하지 않음


※ http:// 나 https:// 로 시작하여야 하며, 매건마다 응답을 보내기 때문에 응답 값이 많
을 경우 보안 장비에서 DDOS 공격으로 인식할 수도 있으니 아래의 응답요청 API를
Polling방식으로 호출할 것을 추천드립니다.

[붙임] 브랜드 메시지 결과코드

| 결과코드 | message | 설명 |
| --- | --- | --- |
| 0000 | MessageRegistComplete | 성공 |


33

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
| 1001 | NoJsonBody | Request Body가 Json형식이 아님 |
| 1002 | InvalidHubPartnerKey | 허브 파트너 키가 유효하지 않음 |
| 1003 | InvalidSenderKey | 발신 프로필 키가 유효하지 않음 |
| 1004 | NoValueJsonElement | Request Body(Json)에서 name을 찾을 수 없음 |
| 1006 | DeletedSender | 삭제된 발신프로필. (메시지 사업 담당자에게 문의) |
| 1007 | StoppedSender | 차단 상태의 발신프로필. (메시지 사업 담당자에게 문의) |
| 1011 | ContractNotFound | 계약정보를 찾을 수 없음. (메시지 사업 담당자에게 문의) |
| 1012 | InvalidUserKeyException | 잘못된 형식의 유저키 요청 |
| 1013 | InvaildAppLink | 유효하지 않은 app 연결 |
| 1014 | InvalidBizNum | 유효하지 않은 사업자번호 |
| 1015 | TalkUserldNotFonud | 유효하지 않은 app user id 요청 |
| 1016 | BizNumNotEqual | 사업자등록번호 불일치 |
| 1020 | InvalidUserKeyException | 잘못된 형식의 유저키 요청 |
| 1021 | BlockedProfile | 차단 상태의 카카오톡 채널 (카카오톡 채널 운영툴에서 확인) |
| 1022 | DeactivatedProfile | 닫힘 상태의 카카오톡 채널 (카카오톡 채널 운영툴에서 확인) |
| 1023 | DeletedProfile | 삭제된 카카오톡 채널 (카카오톡 채널 운영툴에서 확인) |
| 1024 | DeletingProfile | 삭제대기 상태의 카카오톡 채널 (카카오톡 채널 운영툴에서 확인) |
| 1025 | SpammedProfile | 채널 제재 상태로 인한 메시지 전송 실패 (카카오톡 채널 운영툴에서 확인) |


34

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
| 1030 | InvalidParameterException | 잘못된 파라메터 요청 |
| 2006 | FailedToMatchSerialNumberPrefixPattern | 시리얼넘버 형식 불일치 |
| 3000 | UnexpectedException | 예기치 않은 오류 발생 |
| 3005 | AckTimeoutException | 메시지를 발송했으나 수신확인 안됨 (성공불확실) - 서버에는 암호화 되어 보관되며 3 일 이내 수신 가능 |
| 3006 | FailedToSendMessageException | 내부 시스템 오류로 메시지 전송 실패 |
| 3008 | InvalidPhoneNumberException | 전화번호 오류 |
| 3010 | JsonParseException | Json 파싱 오류 |
| 3011 | MessageNotFoundException | 메시지가 존재하지 않음 |
| 3012 | SerialNumberDuplicatedException | 메시지 일련번호가 중복됨 - 메시지 일련번호는 CS 처리를 위해 고유한 값이 부여되어야 함. |
| 3013 | MessageEmptyException | 메시지가 비어 있음 |
| 3014 | MessageLengthOverLimitException | 메시지 길이 제한 오류 (템플릿별 제한 길이 또는 1000자 초과) |
| 3015 | TemplateNotFoundException | 템플릿을 찾을 수 없음 |
| 3016 | NoMatchedTemplateException | 메시지 내용이 템플릿과 일치하지 않음 |
| 3018 | NoSendAvailableException | 메시지를 전송할 수 없음 |
| 3019 | MessageNoUserException | 톡 유저가 아님 |
| 3020 | MessageUserBlockedAIimtalkException | 브랜드 메시지 수신 차단 |
| 3021 | MessageNotSupportedKakaotalkExceptio n | 카카오톡 최소 버전 미지원 |
| 3022 | NoSendAvailableTimeException | 메시지 발송 가능한 시간이 아님 (친구톡 / 마케팅 메시지는 08시부터 20시까지 발송 가능) |
| 3024 | MessagelnvalidImageException | 메시지에 포함된 이미지를 전송할 수 없음 |


35

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
| 3025 | ExceedMaxVariableLengthException | 변수 글자수 제한 초과 |
| 3026 | Button chat_extra(event)- InvalidExtra(EventName)Exception '([A-Za- z0-9_]{1,50})' | 상담/봇 전환 버튼 extra, event 글자수 제한 초과 |
| 3027 | NoMatchedTemplateButtonException | 메시지 버튼/바로연결이 템플릿과 일치하지 않음 |
| 3028 | NoMatchedTemplateTitleException | 메시지 강조 표기 타이틀이 템플릿과 일치하지 않음 |
| 3029 | ExceedMaxTitleLengthException | 메시지 강조 표기 타이틀 길이 제한 초과 (50자) |
| 3030 | NoMatchedTemplateWithMessageTypeExc eption | 메시지 타입과 템플릿 강조유형이 일치하지 않음 |
| 3031 | NoMatchedTemplateHeaderException | 헤더가 템플릿과 일치하지 않음 |
| 3032 | ExceedMaxHeaderLengthException | 헤더 길이 제한 초과(16자) |
| 3033 | NoMatchedTemplateItemHighlightExcepti on | 아이템 하이라이트가 템플릿과 일치하지 않음 |
| 3034 | ExceedMaxItemHighlightTitleLengthExcep tion | 아이템 하이라이트 타이틀 길이 제한 초과(이미지 없는 경우 30자, 이미지 있는 경우 21자) |
| 3035 | ExceedMaxItemHighlightDescriptionLengt hException | 아이템 하이라이트 디스크립션 길이 제한 초과(이미지 없는 경우 19자, 이미지 있는 경우 13자) |
| 3036 | NoMatchedTemplateItemListException | 아이템 리스트가 템플릿과 일치하지 않음 |
| 3037 | ExceedMaxl temDescriptionLengthException | 아이템 리스트의 아이템의 디스크립션 길이 제한 초과(23자) |
| 3038 | NoMatchedTemplateltemSummaryExcepti on | 아이템 요약정보가 템플릿과 일치하지 않음 |
| 3039 | ExceedMaxItemSummaryDescriptionLengt hException | 아이템 요약정보의 디스크립션 길이 제한 초과(14자) |
| 3040 | InvalidItemSummaryDescriptionException | 아이템 요약정보의 디스크립션에 허용되지 않은 |


36

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
|  |  | 문자 포함(통화기호/코드, 숫자, 콤마, 소수점, 공백을 제외한 문자 포함) |
| 3041 | MessagelnvalidWideltemListLengthExcepti on | 와이드 아이템 리스트 개수 최대 최소 개수 불일치 |
| 3051 | InvalidateCarouselItemMinException or InvalidateCarouselItemMaxException | 캐러셀 아이템 리스트 개수 최소, 최대 개수 불일치 |
| 3052 | CarouselMessageLengthOverLimitExcepti on | 캐러셀 아이템 메시지 길이 OVER |
| 3056 | WideltemListTitleLengthOverLimitExceptio n | 와이드 아이템 리스트 타이틀 길이 제한 오류 |
| 3058 | CarouselHeaderLengthOverLimitException | 캐러셀 헤더 길이 제한 오류 |
| 4000 | ResponseHistoryNotFoundException | 메시지 전송 결과를 찾을 수 없음 |
| 4001 | UnknownMessageStatusError | 알 수 없는 메시지 상태 |
| 9998 | 현재 서비스를 제공하고 있지 않습니다. | 시스템에 문제가 발생하여 담당자가 확인하고 있는 경우 |
| 9999 | 시스템에서 알 수 없는 문제가 발생하였습니다. 담당자가 확인 중입니다. | 시스템에 문제가 발생하여 담당자가 확인하고 있는 경우 |
| ER00 | JSONParsingException | MTS 메시지 : JSON 파싱 중 에러가 발생했습니다. |
| ER01 | InvalidAuthCodeException | MTS 메시지 : 인증코드 내용이 없거나 유효하지 않습니다. |
| ER02 | InvalidSenderKeyException | MTS 메시지 : 발신프로필키 내용이 없습니다. |
| ER03 | InvalidPhoneNumberAndAppUserldExcept ion | MTS 메시지 : 수신자번호와 앱유저아이디 내용이 없습니다. |
| ER04 | InvalidTemplateCodeException | MTS 메시지 : 템플릿코드 내용이 없습니다. |
| ER05 | InvalidMessageException | MTS 메시지 : 메시지 내용이 없습니다. |
| ER06 | InvalidCallbackUrlException | MTS 메시지 : 콜백URL이 유효하지 않습니다. |


37

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
| ER07 | InvalidCallbackNumberException | MTS 메시지 : 발신번호(콜백NUMBER)이 유효하지 않습니다. |
| ER08 | InvalidDataException | MTS 메시지 : DATA 항목이 유효하지 않습니다. |
| ER09 | NotFoundImageException | MTS 메시지 : 첨부 이미지 파일을 찾을 수 없습니다. |
| ER10 | NotAllowedFileException | MTS 메시지 : 허용되지 않는 파일입니다. |
| ER13 | InvalidPriceException | MTS 메시지 : price 값이 유효하지 않습니다. |
| ER14 | InvalidCurrencyTypeException | MTS 메시지 : currency_type 값이 유효하지 않습니다. |
| ER15 | MessageSizeOverException | MTS 메시지 : 메시지 내용이 너무 길거나 너무 큽니다. |
| ER16 | TranMessageSizeOverException | MTS 메시지 : 전환전송 시 사용할 메시지 크기가 너무 큽니다. |
| ER17 | NotAllowedCallbackNumber | MTS 메시지 : 전환전송 사용 시, 사전 승인받은 발신번호가 아닙니다. |
| ER31 | InvalidmessageTypeException | MTS 메시지 : 잘못된 메시지 타입 입니다. |
| ER32 | HeaderSizeOverException | MTS 메시지 : header 내용이 너무 길거나 너무 큽니다. |
| ER33 | AttachmentSizeOverException | MTS 메시지 : attachment 내용이 너무 길거나 너무 큽니다. |
| ER34 | CarouselSizeOverException | MTS 메시지 : carousel 내용이 너무 길거나 너무 큽니다. |
| ER98 | NoMessageFoundException | MTS 메시지 : 조건에 일치하는 메시지가 없습니다. |
| ER99 | MessageRegistException | MTS 메시지 : 전송메시지 등록(DB)에 실패하였습니다. |


38

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

# [붙임] SMS 결과코드표

| 결과코드 | 설명 |
| --- | --- |
| 00 | 성공 |
| 03 | 스팸 |
| 10 | 한도초과 발신제한 |
| 11 | 수신번호 정합성 오류 |
| 55 | 레포트 수신시간 만료 |
| 31 | Timeout, 음영지역, 파워오프 |
| 33 | 기타오류(이통사 문의 필요) |
| 34 | 결번 |
| 35 | 단말기 파워오프 |
| 36 | 음영지역 |
| 37 | 기타오류(이통사 문의 필요) |
| 40 | 발신번호 세칙오류 |
| 41 | 발신번호 변작으로 등록된 발신번호 사용 |
| 50 | 사전 미등록 발신번호사용 |
| ER00 | MTS 메시지 : JSON 파싱 중 에러가 발생했습니다. |
| ER01 | MTS 메시지 : 인증코드 내용이 없거나 유효하지 않습니다. |
| ER03 | MTS 메시지 : 수신자번호 내용이 없습니다. |
| ER05 | MTS 메시지 : 메시지 내용이 없습니다. |
| ER07 | MTS 메시지 : 발신번호(콜백NUMBER)이 유효하지 않습니다. |
| ER08 | MTS 메시지 : DATA 항목이 유효하지 않습니다. |
| ER15 | MTS 메시지 : 메시지 내용이 너무 길거나 너무 큽니다. |
| ER17 | MTS 메시지 : 사전 승인받은 발신번호가 아닙니다. |
| ER98 | MTS 메시지 : 조건에 일치하는 메시지가 없습니다. |
| ER99 | MTS 메시지 : 전송메시지 등록(DB)에 실패하였습니다. |


[붙임] LMS, MMS 결과코드표

| 결과코드 | 설명 |
| --- | --- |
| 1000 | 성공 |
| 03 | 스팸 |
| 10 | 한도초과 발신제한 |


39

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| 결과코드 | 설명 |
| --- | --- |
| 11 | 수신번호 정합성 오류 |
| 26 | 평생번호 전송실패 |
| 40 | 발신번호세칙 오류 |
| 50 | 사전 미등록 발신번호사용 |
| 101 | 메시지 내용 스팸 |
| 103 | 착신자 스팸 |
| 104 | 회신번호 스팸 |
| 112 | 레포트 수신시간 만료 |
| 114 | 문자 피싱 미등록으로 인한 차단 |
| 116 | 발신번호 세칙 오류 |
| 117 | 수신번호 세칙 오류 |
| 202 | 착신가입자 없음 |
| 203 | 비가입자, 결번, 서비스정지 |
| 211 | 기간 만료 |
| 213 | NPDB 오류 |
| 1013 | 결번 |
| 1026 | 음영지역 |
| 2003 | 메시지에 있는 주소를 MMS Relay/Server 가 찾을 수 없음 |
| 2007 | 메시지가 규격에 맞지 않거나 부적당함 / 메시지 ELEMENT 포맷 에러 / 번호 이동된 가입자 |
| 2101 | 올바른 컨텐츠가 아님 |
| 2103 | 미지원 단말 |
| 2107 | 착신번호 오류 |
| 4000 | 요구된 서비스가 실행될 수 없음 |
| 4005 | 일반적인 서비스 에러 / MMS G/W 내부 처리 중 처리 실패 |
| 4007 | 서비스를 요청한 클라이언트가 permission이 없는 경우 미지원 단말 / 전송 실패 / 패스워드 인증 실패로 인한 전송제한 - LGT |
| 4008 | 이통사 일시적인 트래픽 초과로 인한 실패 |
| 4301 | 미 가입자 에러 오류 |
| 4305 | 비 가용폰 오류 |
| 4307 | 일시정지 가입자 오류 |
| 5101 | 착신전환 조회 실패 |
| 5102 | 착신전환 횟수 초과 오류코드 |
| 6014 | 수신자가 착신거절 신청자 |


40

카카오 브랜드 메시지 기본형(전문 방식) Restful Interface Guide v1.0

| 결과코드 | 설명 |
| --- | --- |
| 6072 | MMS 비가용 단말 |
| 8011 | SKT 단말기 응답없음 |
| 8012 | SKT 이통사 오류 (이통사 문의 필요) |
| 8200 | MMSC 전송 시 알 수 없는 오류 |
| 8880 | MMS 이미지 발송 시 : 발송할 수 없는 이미지 파일 또는 요청된 이미지 url 이 34. MMS 이미지 업로드 방식을 통해 서버에 업로드 되어있지 않음 |
| 9999 | 패킷오류 |
| ER00 | MTS 메시지 : JSON 파싱 중 에러가 발생했습니다. |
| ER01 | MTS 메시지 : 인증코드 내용이 없거나 유효하지 않습니다. |
| ER03 | MTS 메시지 : 수신자번호 내용이 없습니다. |
| ER05 | MTS 메시지 : 메시지 내용이 없습니다. |
| ER07 | MTS 메시지 : 발신번호(콜백NUMBER)이 유효하지 않습니다. |
| ER08 | MTS 메시지 : DATA 항목이 유효하지 않습니다. |
| ER15 | MTS 메시지 : 메시지 내용이 너무 길거나 너무 큽니다. |
| ER17 | MTS 메시지 : 사전 승인받은 발신번호가 아닙니다. |
| ER98 | MTS 메시지 : 조건에 일치하는 메시지가 없습니다. |
| ER99 | MTS 메시지 : 전송메시지 등록(DB)에 실패하였습니다. |


41