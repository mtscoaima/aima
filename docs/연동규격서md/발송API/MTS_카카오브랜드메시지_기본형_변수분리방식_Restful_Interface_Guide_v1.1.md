# 카카오 브랜드 메시지(기본형: 변수
분리 방식) RESTful Interface Guide

작성일자 : 2025.09.20

문서버전 : 1.1

MTS COMPANY
MOBILE TOTAL SERVICE

# 문 서 개 정 이 력

| 버전 | 일자 | 내용 | 작성자 |
| --- | --- | --- | --- |
| 1.0 | 2025.07.30 | 최초작성 | 김승현 |
| 1.1 | 2025.09.20 | 발송 유형 타입 파라미터 추가 여러건 전송 파라미터 구조 수정 | 김승현 |


카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

# 목 차

- 2
- 1. 개요 ...................................................
- 2. HOST ··················································· 2
- 3. 선결 조건 ··· 2
- 4. 브랜드 메시지 특징 ············ 2
- 5. 용어의 정의 ··················································· 2
- 6. 브랜드 메시지 기본형(변수 분리 방식) 전송요청(단건) ................................................... 3
- 7. 샘플(Sample) 데이터 ·················.................. 5
- 8. 브랜드 메시지 기본형(변수 분리 방식) 전송요청(여러 건) ................................................... 11
- 9. 샘플(Sample) 데이터 ··················································· 13
- 10. 브랜드 메시지 응답요청 ............................................................................................................... 19
- 11. 샘플(Sample) 데이터 ......................................................························· 22
- 12. CALLBACK_URL 사용 시 전송결과 응답 ................................................................................ 22
- 13. 필드 상세정보 ---------------------.............................................................. 23
- [붙임] 브랜드 메시지 결과코드 .............................................................................................................. 27


[붙임] SMS 결과코드표 ....... ......................................··················································· 32
[붙임] LMS, MMS 결과코드표 .......................························ 33

1

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

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

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

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

6. 브랜드 메시지 기본형(변수 분리 방식) 전송요청(단건)

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

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| send_mode | text(1) | Y | 브랜드 메시지 발송 유형 타입 | "send_mode": "2" |
| --- | --- | --- | --- | --- |
| targeting | text(1) | Y | 타겟팅 타입(M/N/I) | "targeting": "M" |
| template_code | text(30) | Y | 템플릿코드 | "template_code":" A001_01" |
| callback_number | text(15) | Y | 발신 전화번호 | "callback_number": "1522-1825" |
| country_code | text(16) | N | 국가번호 (기본 82) | "country_code":"82 " |
| phone_number | text(16) | N | 사용자 전화번호 | "phone_number":" 01012345678" |
| app_user_ id | text(20) | N | 앱 유저 ID | "app_user_id":"123 45" |
| push_alarm | text(1) | N | 푸시 알람 여부(기본 Y) | "push_alarm": "Y" |
| reseller_code | text(9) | N | 메시지 신고시 KISA 에 전달될 재판매사 구분 코드 | "reseller_code":"12 3456789" |
| message_variable | json | Y | 메시지 변수 | - |
| button_ variable | json | N | 버튼 변수 | - |
| coupon_ variable | json | N | 쿠폰 변수 | - |
| image_variable | Json[] | N | 이미지 변수 | - |
| video_variable | json | N | 비디오 변수 |  |
| commerce_variable | json | N | 커머스 변수 | - |
| carousel_variable | Json[] | N | 캐러셀 변수 | - |
| tran_type | text(1) | Y | 전환전송 여부(N/S/L/M) | "tran_type":"S" |
| tran_message | text(1000) | N | 전환전송 메시지 | "tran_message":"고 객님의 택배가 금일 (18~20)시에 배달 예정입니다." |
| subject | text(20) | N | LMS 전송 시 필요한 제목 | "subject":"제목" |
| callback_url | text(512) | N | MTS 에서 메시지 전송결과를 보내줄 고객사 서버의 Full URL | "callback_url":"http s://www.mtsco.co. |


4

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

|  |  |  |  | kr/message_callba ck.do?seq=123" |
| --- | --- | --- | --- | --- |
| add_etc1 | text(160) | N | 고객사에서 보내는 추가 정보 1 | "add_etc1":"add_et c1" |
| add_etc2 | text(160) | N | 고객사에서 보내는 추가 정보 2 | "add_etc2":"add_et c2" |
| add_etc3 | text(160) | N | 고객사에서 보내는 추가 정보 3 | "add_etc3":"add_et c3" |
| add_etc4 | text(160) | N | 고객사에서 보내는 추가 정보 4 | "add_etc4":"add_et c4" |
| adult | text(1) | N | 성인용 메시지 확인 여부 (확인 여부 Y/N, 기본값 N) | "adult":"N" |


# [Response]

| 키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| code | text(4) | Y | 처리 결과 코드 (0000=성공) | "code ":"0000" |
| received_at | text(19) | N | 수신 시간 (realtime 발송 시) | "received_at":"2015-08- 06 10:51:00" |
| message | text | N | 오류 메시지 | "message ":"JSONParsingExceptio n" |


# 7. 샘플(Sample) 데이터

# TEXT 타입

("auth_code":"My1fM7s85jftvM1Y4aN0Q==","send_mode":"2") "data":[("sender_key":"df8
b597658c2702fbbaddb0d828cee19a51f18ca","country_code":"82", "callback_number":"02
5011980", "message_type":"TEXT","phone_number":"01054308779", "tran_type":"L "subjec
t":"전환전송제목","tran_message":"전환전송메시지
"callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123","add_etc1":"add
_etc1","add_etc2":"add_etc2","add_etc3","add_etc3","add_etc4","add_etc1","template_cod
e":"ac1ba7b703110005ec2bf4771ea7d12dc2ddaed3" "targeting":"M", "message_variable":
("aa":"aa"),("sender_key':"df8b597658c2702fobaddb0d828cee19e51f18ca","country_cod
e":"82", "callback_number":"025011980", "message_type":"TEXT", "phone_number":"010543

5

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

08779" "tran_type":"L", "subject"."전환전송제목", "tran_message":"전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 , "template_cod
,
,
e":"ac1ba7b703110005ec2bf4771ea7d12dc2ddaed3") "targeting":"M" "message_variable":
,
,
{"aa " :"aa"}}]}

# IMAGE 타입

{"auth_code":"iWy1fM7s85jftvM1Y4aN0Q== : "send_mode":"2", "data":[{"sender_key":"df8
,
b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82") "callback_number":"02
,
,
5011980", "message_type":"IMAGE" "phone_number":"01054308779", "tran_type":"L , "subj
,
ect":"전환전송제목", "tran_message":"전환전송메시지
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
e" : 4c68534ba3dd3f70482305e0787559c9cf76d382", "targeting": M" "message_variable":(
"test":"test"},"button_variable":("link1 ":"www.mtsco.co.kr"),"image_variable":("img_url":"ht
tps://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg"}]},{"send
er_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82") "callback_n
,
,
umber":"025011980", "message_type":" IMAGE" "phone_number":"01054308779" "tran_typ
,
e" :"L , "subject":"전환전송제목") "tran_message":"전환전송메시지
l
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod

,
,
e":"4c68534ba3dd3f70482305e0787559c9cf76d382", "targeting":"M" "message_variable":(
,
"test":"test"},"button_variable":{"link1 ":"www.mtsco.co.kr"),"image_variable":["img_url":"ht
tps://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg"}}}]}

WIDE 타입

{"auth_code":"iWy1fM7s85jftvM1Y4aN0Q== "send_mode":"2") "data":[{"sender_key": df8
,
b597658c2702fbbaddb0d828cee19a51f18ca", "country_code":"82") "callback_number":"02
,
5011980", "message_type":"WIDE" "phone_number":"01054308779", "tran_type":"L", "subje
,
,
ct":"전환전송제목", "tran_message":"'전환전송메시지
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2" "add_etc3":"add_etc3 " "add_etc4":"add_etc1 , "template_cod
,
,

6

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

e":"a7e4c69be6576f926ad039ddabc081 d62c5e2237" "targeting :"M " "message_variable":(
,
,
"message":" "message"),"button_variable":("url":"www.mtsco.co.kr"),"coupon_variable":("상
세내용 " · 상세내용
"pcLink"/"www.mtsco.co.kr", "mobileLink":"www.mtsco.co.kr"}, "image_variable":[{"img_url
" :"https://mud-
kage.kakao.com/dn/mlyZ2/btsL9Oy8aUy/NDSQQD51yowEZzKouBWOv0/img_ljpg"lll/'s
ender_key": df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82") "callba
,
,
ck_number":"025011980", "message_type":"WIDE" "phone_number":"01054308779", "tran_
,
type":"L , "subject":"전환전송제목" "tran_message":"'전환전송메시지
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,

,
,
e : 4c68534ba3dd3f70482305e0787559c9cf76d382", "targeting" :"M" , "message_variable":{
, message"/"message"),"button_variable"://url//www.mtsco.co.kr"/"coupon_variable":{"상
세내용 "··" 상세내용
" "pcLink":"www.mtsco.co.kr", "mobileLink":"www.mtsco.co.kr"), "image_variable":[{"img_url
,
" :"https://mud-
kage.kakao.com/dn/mlyZ2/btsL9Oy8aUy/NDSQQD51yowEZzKcuBWOv0/img_ljpg"M}II}

# WIDE_ITEM_LIST 타입

("auth_code":"Wy1fM7s85jftvM1 Y4aN0Q== " "send_mode":"2", "data":[{"sender_key": df8
,
b597658c2702fbbaddb0d828cee1 9a51f18ca", "country_code":"82") "callback_number":"02
,
,
5011980", "message_type":"WIDE_ITEM_LIST" "phone_number":"01054308779", "tran_type"
,
,
:"L" "subject":"전환전송제목 " "tran_message":"전환전송메시지
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3" "add_etc4":"add_etc1 " "template_cod
,
,
,
e":"739d120e850afc19f1917c8d8f40a1be82eaac69" "targeting": "M" "message_variable":("
,
url : "www.mtsco.co.kr"),"button_variable":("aaa" :"www.mtsco.co.kr"},"coupon_variable":{"
상세내용 "상세내용", "url1 ":"www.mtsco.co.kr"),"image_variable":[{"img_url":"https://mud-
kage.kakao.com/dn/ba6UjQ/btsPLkt9yt0/bgiaK52aewjM7kfPUOfaCk/img_l.jpg")/"img_url
" : "https://mud-
kage.kakao.com/dn/dMasS3/btsPKkVRPqR/uRK4UW0TDFkmLZcK9TySCK/img_ljpg")/"im
g_url":"https://mud-
kage.kakao.com/dn/Yrn1r/btsPLXZwlk9/3yTKJotNNg2RZj7DKyUkT0/img_(jpg"/l)/"sender
_key":" df8b597658c2702fbbaddb0d828cee 19a51f18ca", "country_code":"82", "callback_nu
,
,
mber":"025011980", "message_type":"WIDE_ITEM_LIST", "phone_number":"01054308779", "
,
,

7

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

tran_type":"L" "subject","전환전송제목", "tran_message':"전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq= 123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3" "add_etc4":"add_etc1 " "template_cod
,
,
,
e" :"739d120e850afc19f1917c8d8f40a1be82eaac69" "targeting "M" , "message_variable":{"
,
url":"www.mtsco.co.kr"),"button_variable":("aaa :"www.mtsco.co.kr"),"coupon_variable":{"
상세내용 : "상세내용", "url1 ":"www.mtsco.co.kr"),"image_variable":("img_url":"https://mud-
kage.kakao.com/dn/ba6UjQ/btsPLkt9yt0/ogiaK52aewjM7kfPUOfaCk/img_l.jpg"),{"img_url
:"https://mud-
kage.kakao.com/dn/cMasS3/btsPKkVRPqR/uRK4UW0TDPkmLZcK9TySCK/img_l.jpg/?/"lm
g_url":"https://mud-
kage.kakao.com/dn/Ym1r/btsPLXZwlk9/3yTKJotNNg2RZj7DKyUkT0/img_Ljpg"?}}}

CAROUSEL_FEED 타입

{"auth_code":"iWy1fM7s85jftvM1Y4aN0Q== " "send_mode":"2", "data":[{"sender_key":" df8
,
b597658c2702fbbaddb0d828cee1 9a51f18ca" "country_code":"82", "callback_number":"02
,
,
501 1980", "message_type":"CAROUSEL_FEED", "phone_number":"01054308779" "tran_type
":"L " "subject":"전환전송제목", "tran_message":"전환전송메시지
,
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3" "add_etc4":"add_etc1 " "template_cod
,
,
e : 4f004756edbcf23f88d04af71 3b6dcf637338f30", "targeting":"M" "carousel_variable":[{"
,
message_variable":("고객명":"고객명
"}, "button_variable":("url4 :"www.mtsco.co.kr", "url3":"www.mtsco.co.kr"),"image_variable":(
"img_url":"https://mud-
kage.kakao.com/dn/zsDIk/btsOHjRuZr0/SU08nPJBECfFGfl63QQ770/img_l.jpg , "img_link":
"https://www.mtsco.co.kr/"),"coupon_variable":("상세설명":"상세설명
" "url2":"www.mtsco.co.kr", "url1 ":"www.mtsco.co.kr")},{"image_variable":("img_url":"https://
,
mud-
kage.kakao.com/dn/elGDiQ/btsOlp4IZxo/PUsuvKUTCTuZ2gXgZKehkk/img_l.jpg" "img_lin
,
k":"https://www.mtsco.co.kr/")}]},("sender_key":" df8b597658c2702fbbaddb0d828cee19a5
1f18ca" "country_code":"82") , callback_number":"025011980", "message_type"."CAROUSEL
,
FEED" "phone_number":"01054308779", "tran_type":"L". "subject":"전환전송제목
,
" "tran_message":"전환전송메시지
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 : "template_cod
,
e" : 4f004756edbcf23f88d04af71 3b6dcf637338f30", "targeting": "M" "carousel_variable":[{"
,
,

8

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

message_variable":("고객명":"고객명
"}, "button_variable":("url4":"www.mtsco.co.kr", "url3":"www.mtsco.co.kr"),"image_variable":(
" img_url":"https://mud-
kage.kakao.com/dn/zsDIk/btsOHjRuZr0/SU08nPJBECfFGfl63QQ770/img_l.jpg , "img_link":
"https://www.mtsco.co.kr/"], "coupon_variable":("상세설명":"상세설명
" "url2":"www.mtsco.co.kr", "url1 ":"www.mtsco.co.kr"}},{"limage_variable":/img_unf*/https://
,
mud-
kage.kakao.com/dn/elGDiQ/btsOlp4IZxo/PUsuvKUTCTuZ2gXgZKehkk/img_l.jpg" "img_lin
,
k":"https://www.mtsco.co.kr/"}}]}]}

PREMIUM_ VIDEO 타입

{"auth_code":"iWy1fM7s85jftvM1Y4aN0Q== " "send_mode":"2") "data":[{"sender_key": "df8
,
b597658c2702fbbaddb0d828cee 1 9a51f18ca", "country_code":"82", "callback_number":"02
,
,
5011980" "message_type":"PREMIUM_VIDEO") "phone_number":"01054308779" "tran_typ
,
e":"L " "subject":"전환전송제목") "tran_message":"전환전송메시지
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
e":" 37665dcb987c723634b0ee3ccb72504bb1fc9530" "targeting":"M " "message_variable":{
,
,
"헤더"."헤더","변수","변수
"}, "button_variable":("url":"www.mtsco.co.kr"),"coupon_variable":("상세내용 ":"상세내용
" "url2","www.mtsco.co.kr"),"video_variable":/"video_url":"https://tv.kakao.com/channel/15
06/cliplink/454718311 " "thumbnail_url":"https://t1.daumcdn.net/news/202504/27/sbsi/2
0250427210013294ehixjpg"}/"sender_key'/'df8b597658c2702fbbaddb0d828cee19a51f
18ca" "country_code":"82") "callback_number"":"025011980", "message_type":"PREMIUM_VI
,
,
DEO" "phone_number":"01054308779" "tran_type":"L " "subject":"전환전송제목
,
" "tran_message":"전환전송메시지
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2" "add_etc3 ":"add_etc3" "add_etc4":"add_etc1 " "template_cod
,
e":"37665dcb987c723634b0ee3ccb72504bb1fc9530" "targeting":"M , "message_variable":{
,
"헤더":"헤더", ,"변수":"변수
"}, "button_variable":("url":"www.mtsco.co.kr"),"coupon_variable":("상세내용 :"상세내용
" "url2 ":"www.mtsco.co.kr"),"video_variable":"video_url":"https://tv.kakao.com/channel/15
06/cliplink/454718311 " "thumbnail_url":"https://t1.daumcdn.net/news/202504/27/sbsi/2
,
0250427210013294ehixjpg"}}]}

9

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

# COMMERCE 타입

{"auth_code":"인증번
호 "sender_key": df8b597658c2702fbbaddb0d828cee19a51f18ca " "country_code":"82", "c
,
,
allback_number":"025011980", "send_mode":"2") "message_type":"COMMERCE" ,"phone_nu
,
mber":"01012345678", "tran_type":"L' "subject":"전환전송제목
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
,
e : eeef8c0d61037be97e39f8b0313d3771b750f7bf', "targeting":"M" "message_variable":("
변수":"변수
"}, "button_variable":{"url1 ":"www.mtsco.co.kr", "url2":"www.mtsco.co.kr"),"commerce_varia
ble":{"aaa":"aaa", "정상가격 ":"1000" "할인가격 ":"700" "할인율 " "30" "정액할인가격
" : 300"),"image_variable":[{"img_url":"https://mud-
kage.kakao.com/dh/ksplP/bts08blzneD/Qvd9Hxyrki4A9YwWLb5bf0/img_l.jpg" "img_link
,
":"https://www.mtsco.co.kr"}]}

# CAROUSEL_COMMERCE 타입

{"auth_code":" 인증번
호 " "sender_key": df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code": "82" "c
,
allback_number":"025011980", "send_mode":"2" "message_type":"CAROUSEL_COMMERCE
,
: phone_number":"01012345678", "tran_type":"L "subject":"전환전송제목
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
e":"61091346d088f6983f11e4aa2e3890a547fe378" "targeting" :"M" "carousel_variable":[{"
,
message_variable":("header":"header", "message":"message", "link1":"www.mtsco.co.kr"}},"
button_variable":("link2 "/ www.mtsco.co.kr"),"image_variable":("img_url":"https://mud-
kage.kakao.com/dn/w08Go/btsPKjP6XAo/KuPqy/VKsdfGPMuv1 RkHcU1/img_l.jpg" "img_li
,
nk":"https://www.mtsco.co.kr"),"coupon_variable":"link3 " :"www.mtsco.co.kr"},"commerce_
variable":("정상가격 ":"1000" "할인가격":"700", "할인율 " : "30" "정액할인가격
" : 300"}},("image_variable":{"img_url":"https://mud-
kage.kakao.com/dn/bD5ngK/btsPKSEHzv4/88UN5h4OdGgTQMieKijEIK/img_l.jpg" "img_li
,
nk":"https://www.mtsco.co.kr"), "commerce_variable'('정상가격 ":"1000" "할인가격 : "700" "
,
할인율 ":"30" "정액할인가격 :"300"}}}

10

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

# 8. 브랜드 메시지 기본형(변수 분리 방식) 전송요청(여러 건)

# [Request]

- · path : /btalk/send/messages/basic
- · method : POST
- · header


。 Content-type: application/json

- · parameter (json)


| 키 | 상세키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- | --- |
| auth_code |  | text(40) | Y | MTS 에서 발급한 인증코드 | "auth_code": "asWdsgsk46s eE" |
| reseller_code |  | text(9) | N | 메시지 신고시 KISA 에 전달될 재판매사 구분 코드 | "reseller_code ":"123456789" |
| send_mode |  | text(1) | Y | 브랜드 메시지 발송 유형 타입 | "send_mode":" 2" |
| data |  | Json Array | Y | 전송요청 파라미터를 포함한 json 배열 |  |
|  | sender key | text(40) | Y | 발신 프로필 키 | "sender_key":" 2662e99eb7a1 f21abb395527 8e9955f5a9a9 9b62" |
|  | send_date | text(14) | Y | 발송 예정일 (기본값: MTS 서버에 등록일시) | "send_date":"2 02001011201 01" |
|  | message_type | text(20) | Y | 브랜드 메시지 타입 | "message_typ e": "TEXT" |
|  | targeting | text(1) | Y | 타겟팅 타입(M/N/I) | "targeting": "M" |


11

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

|  | template_code | text(30) | Y | 템플릿코드 | "template_cod e":"A001_01" |
| --- | --- | --- | --- | --- | --- |
|  | callback_numb er | text(15) | Y | 발신 전화번호 | "callback_num ber":"1522- 1825" |
|  | country_code | text(16) | N | 국가번호 (기본 82) | "country_code ":"82" |
|  | phone_numbe r- | text(16) | N | 사용자 전화번호 | "phone_numb er":"01012345 678" |
|  | app_user_id | text(20) | N | 앱 유저 ID | "app_user_id": "12345" |
|  | push_alarm | text(1) | N | 푸시 알람 여부(기본 Y) | "push_alarm": "Y" |
|  | message_varia ble | json | Y | 메시지 변수 | - |
|  | button_variabl e | json | N | 버튼 변수 | - |
|  | coupon_variabl e | json | N | 쿠폰 변수 |  |
|  | image_variable | Json[] | N | 이미지 변수 | - |
|  | video_variable | json | N | 비디오 변수 | - |
|  | commerce_vari able | json | N | 커머스 변수 | - |
|  | carousel_varia ble | Json[] | N | 캐러셀 변수 | - |
|  | tran_type | text(1) | Y | 전환전송 여부(N/S/L/M) | "tran_type":"S" |
|  | tran_message | text(1000) | N | 전환전송 메시지 | "tran_message "··" 고객님의 택배가 금일 (18~20)시에 배달 예정입니다." |


12

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

|  | subject | text(20) | N | LMS 전송 시 필요한 제목 | "subject":"제목 " |
| --- | --- | --- | --- | --- | --- |
|  | callback_ url | text(512) | N | MTS 에서 메시지 전송결과를 보내줄 고객사 서버의 Full URL | "callback_url":" https://www.m tsco.co.kr/mes sage_callback. do?seq=123" |
|  | add_etc1 | text(160) | N | 고객사에서 보내는 추가 정보 1 | "add_etc1":"ad d_etc1" |
|  | add_etc2 | text(160) | N | 고객사에서 보내는 추가 정보 2 | "add_etc2":"ad d_etc2" |
|  | add_ etc3 | text(160) | N | 고객사에서 보내는 추가 정보 3 | "add_etc3":"ad d_etc3" |
|  | add_etc4 | text(160) | N | 고객사에서 보내는 추가 정보 4 | "add_etc4":"ad d_etc4" |
|  | adult | text(1) | N | 성인용 메시지 확인 여부 (확인 여부 Y/N, 기본값 N) | "adult":"N" |


# [Response]

| 키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| code | text(4) | Y | 처리 결과 코드 (0000=성공) | "code ":"0000" |
| received_at | text(19) | N | 수신 시간 (realtime 발송 시) | "received_at":"2015-08- 06 10:51:00" |
| message | text | N | 오류 메시지 | "message":"JSONParsing Exception" |


# 9. 샘플(Sample) 데이터

# TEXT 타입

{"auth_code":"인증번
호","send_mode":"2","data")[["sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18c
a","country_code":"82", "callback_number"":"025011980", "message_type":"TEXT","phone_n
umber":"01012345678","tran_type":"L' , "subject":"전환전송제목

13

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
e":"ac1ba7b703110005ec2bf4771ea7d12dc2ddaed3" "targeting":"M" "message_variable":
,
,
{"aa : aa"}},{"sender_key":"'df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_cod
,
e" :"82 " "callback_number":"025011980","send_mode":"2", "message_type":"TEXT" "phone_n
,
umber":"01012345678", "tran_type":"L " "subject":"전환전송제목
,
" "callback_uht":"https://www.mtsco.co.kr/message_callback.do?seq=123") "add_etc1 ":"add
,
etc1 , "add_etc2":"add_etc2", "add_etc3":"add_etc3" "add_etc4":"add_etc1 , "template_cod
,
e":"ac1ba7b703110005ec2bf4771ea7d12dc2ddaed3" "targeting":"M" , "message_variable":
,
{"aa ":"aa"}}]}

# IMAGE 타입

{"auth_code":"인증번
호 ","send_mode":"2", "data":[{"sender_key":"'df8b597658c2702fbbaddb0d828cee19a51f18c
a " "country_code":"82") "callback_number":"025011980", "message_type":"IMAGE" ,"phone_
,
,
,
number":"01012345678", "tran_type":"L "subject":"전환전송제목
" callback_url":"https://www.mtsco.co.kr/message_calIback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
,
e": 4c68534ba3dd3f70482305e0787559c9cf76d382") "targeting":"M", "message_variable":(
,
"test":"test"),"button_variable":("link1 ":"www.mtsco.co.kr"),"image_variable")[("img_url":"ht
tps://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSricksywkUFDTwkkPoimNk/img_l.jpg"}]},{"send
er_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca " "country_code":"82", "callback_n
,
umber":"025011980","send_mode":"2", "message_type":"IMAGE","phone_number":"010123
45678", "tran_type":"L" "subject":"전환전송제목
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
e":"4c68534ba3dd3f70482305e0787559c9cf76d382", "targeting" :"M" , "message_variable":{
"test":"test"),"button_variable":("link1 ":"www.mtsco.co.kr"),"image_variable":[("img_url":"ht
tps://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg"}}}}}}

# WIDE 타입

![image](/image/placeholder)
{"auth_code":" 인증번

14

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

호 ","send_mode":"2", "data":[{"sender_key": df8b597658c2702fbbaddb0d828cee19a51f18c
a , "country_code":"82") "callback_number"':"025011980", "message_type":"WIDE" "phone_n
,
,
umber":"01012345678", "tran_type":"L , "subject":" 전환전송제목
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 : "template_cod
,
,
,
e":"a7e4c69be6576f926ad039ddabc081d62c5e2237" "targeting":"M" , "message_variable":{
,
"message":"message"),"button_variable":("url":"www.mtsco.co.kr")"coupon_variable":"("상
세내용 · 상세내용
"pcLink"/"www.mtsco.co.kr", "mobileLink":"www.mtsco.co.kr"), "image_variable":[{"img_url
" :"https://mud-
kage.kakao.com/dn/mlyZ2/btsL9Oy8aUy/NDSQQD51yowEZzKcUBWOvO/img_ljpg"llk("s
ender_key": "df8b597658c2702fbbaddb0d828cee1 9a51f18ca" "country_code":"82") "callba
,
,
ck_number":"02501980","send_mode":"2", "message_type":"WIDE","phone_number":"010
12345678", "tran_type":"L' " "subject":"전환전송제목
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 , "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 , "template_cod
,
,
e":"a7e4c69be6576f926ad039ddabc081d62c5e2237" "targeting :"M" "message_variable":{
,
message":"message"),"button_variable":"url":"www.mtsco.co.kr"),"coupon_variable":("상
세내용 ":" 상세내용
" "pcLink":"www.mtsco.co.kr", "mobileLink":"www.mtsco.co.kr"), "image_variable":[{"img_url
,
" :"https://mud-
kage.kakao.com/dn/mlyZ2/btsL9Oy8aUy/NDSQQD51yowEZzKcuBWOv0/img_Ljpg"III)

# WIDE_ITEM_LIST 타입

{"auth_code":" 인증번
호 ","send_mode":"2", "data":(["sender_key","df8b597658c2702fbbaddb0d828cee 19a51f18c
a , country_code":"82", "callback_number":"025011980", "message_type":"WIDE_ITEM_LIST
,
,
" phone_number":"01012345678", "tran_type":"L' , "subject":"전환전송제목
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3" "add_etc4":"add_etc1 " "template_cod
,
,
,
e":"739d120e850afc19f1917c8d8f40a1be82eaac69" "targeting" : M" "message_variable":("
,
,
url' :"www.mtsco.co.kr"),"button_variable':/"aaa":"www.mtsco.co.kr"},"coupon_variable":{"
상세내용 "상세내용", "url1 ","www.mtsco.co.kr"/"image_variable":[{"img_url":"https://mud-
kage.kakao.com/dn/ba6UjQ/btsPUrt9y0/bgiaK52aew/M7.iPUOfaCk/ing_l)pg"},("img_url
:"https://mud-

15

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

kage.kakao.com/dn/cMasS3/btsPKkVRPqR/uRK4UW0TDFkmLZcK9TySCK/img_ljpg")/"im
g_url":"https://mud-
kage.kakao.com/dn/Ym1r/btsPLXZwlk9/3yTKJotNNg2RZj7DKyUkT0/img_(jpg")])/"sender
_key": df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82") "callback_nu
,
,
mber":"02501980","send_mode":"2", "message_type":"WIDE_ITEM_UST","phone_number*:
"01012345678", "tran_type":"L' "subject":"전환전송제목
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 , "add_etc2":"add_etc2", "add_etc3":"add_etc3 " "add_etc4":"add_etc1", "template_cod
,
e":"739d120e850afc19f1917c8d8f40a1be82eaac69" "targeting "M" , "message_variable":{"
url":"www.mtsco.co.kr"),"button_variable":{"aaa :"www.mtsco.co.kr"},"coupon_variable":{"
상세내용 : "상세내용", "url1 ": www.mtsco.co.kr","image_variable":[{"img_url":"https://mud-
kage.kakao.com/dn/ba6UjQ/btsPLkt9yt0/bgiaK52aewjM7kfPUOfaCk/img_ljpg")/"img_url
" : "https://mud-
kage.kakao.com/dn/cMasS3/btsPKkVRPqR/uRK4UW0TDPkmLZcK9TySCK/img_l.jpg/3/"1m
g_url":"https://mud-
kage.kakao.com/dn/Yrn1r/btsPLXZwlk9/3yTKJotNg2RZj7DKyUkT0/img_l.jpg"}]}

# CAROUSEL_FEED 타입

{"auth_code":"인증번
호 ","send_mode":"2", "data":[{"sender_key": df8b597658c2702fbbaddb0d828cee 19a51f18c
a" , "country_code":"82") "callback_number"':"025011980", "message_type":" CAROUSEL_FEE
,
,
D" ,"phone_number":"01012345678", "tran_type":"L , "subject":"전환전송제목
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
e" : 4f004756edbcf23f88d04af71 3b6dcf637338f30" "targeting ":"M" , "carousel_variable":[{"
,
message_variable":("고객명":"고객명
"}, "button_variable":("url4 :"www.mtsco.co.kr", "url3":"www.mtsco.co.kr"),"image_variable":(
"img_url":"https://mud-
kage.kakao.com/dn/zsDIk/btsOHjRuZr0/SU08nPJBECfFGfl63QQ770/img_l.jpg , "img_link":
"https://www.mtsco.co.kr/"], "coupon_variable":{"상세설명":"상세설명
" "url2":"www.mtsco.co.kr", "url1 "/"www.mtsco.co.kr")}/"image_variable":("img_url":"https://
,
mud-
kage.kakao.com/dn/elGDiQ/btsOIp4IZxo/PUsuwKUTCTuZ2gXgZKehkk/img_ljpg/ "img_lin
,
k":"https://www.mtsco.co.kr/"}}]},{"sender_key": df8b597658c2702fbbaddb0d828cee19a5
1f18ca" "country_code":"82") "callback_number":"025011980","send_mode":"2", "message_t
,

16

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

ype": CAROUSEL_FEED","phone_number":"01012345678", "tran_type":"L' " "subject":" 전환전
송제목
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3" "add_etc4":"add_etc1 、 "template_cod
,
,
e": 4f004756edbcf23f88d04af713b6dcf637338f30" "targeting":"M" "carousel_variable":[{"
message_variable":(""고객명":"고객명
"}, "button_variable":{'"url4":"www.mtsco.co.kr", "url3":"www.mtsco.co.kr"),"image_variable":(
"img_url":"https://mud-
kage.kakao.com/dn/zsDIk/btsOHjRuZr0/SU08nPJBECfFGfl63QQ770/img_l.jpg , "img_link":
"https://www.mtsco.co.kr/"),"coupon_variable":("상세설명":"상세설명
" "url2":"www.mtsco.co.kr", "url1 ":"www.mtsco.co.kr"}},{"image_variable^;("img_url"Whttps://
,
mud-
kage.kakao.com/dn/eIGDiQ/btsOlp4IZxo/PUsuvKUTCTuZ2gXgZKehkk/img_ljpg" "img_lin
,
k":"https://www.mtsco.co.kr/"}}}}]}

# PREMIUM_VIDEO 타입

{"auth_code":"인증번
호 ","send_mode":"2", "data":[{"sender_key": df8b597658c2702fbbaddb0d828cee 19a51f18c
a , "country_code":"82", "callback_number":"025011980", "message_type":" PREMIUM_VIDE
,
,
O" ,"phone_number":"01012345678", "tran_type":"L" "subject":"전환전송제목
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
e":" 37665dcb987c723634b0ee3ccb72504bb1fc9530" "targeting":"M , "message_variable":{
,
"헤더"."헤더","변수","변수
"), "button_variable":"urf","www.mtsco.co.kr"),"coupon_variaole"('상세내용","상세내용
" "url2":"www.mtsco.co.kr"),"'video_variable":/"video_url":"https://txkakao.com/channel/15
06/cliplink/454718311 " "thumbnail_url":"https://t1.daumcdn.net/news/202504/27/sbsi/2
0250427210013294ehix.jpg"}},("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f
18ca" "country_code":"82", "callback_number":"02501980","send_mode":"2",'message_ty
,
,
pe":"PREMIUM_VIDEO://phone_number"/01012345678", "tran_type":"L" "subject":"전환전
,
송제목
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3 ":"add_etc3", "add_etc4":"add_etc1 , "template_cod
,
,
e":"37665dcb987c723634b0ee3ccb72504bb1fc9530") "targeting":"M", "message_variable":{
,
"헤더 ":"헤더","변수":"변수

17

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

"), "button_variable":("url":"www.mtsco.co.kr"),"coupon_variable":("상세내용 ":"상세내용
" "url2"/ www.mtsco.co.kr"),"video_variable":("video_url":"https://tv.kakao.com/channel/15
,
06/cliplink/454718311 " "thumbnail_url":"https://t1.daumcdn.net/news/202504/27/sbsi/2
,
0250427210013294ehixjpg"}}}}

# COMMERCE 타입

{"auth_code":"iWy1fM7s85jftvM1Y4aN0Q== " "send_mode":"2", "data":[{"sender_key": df8
,
b597658c2702fbbaddb0d828cee1 9a51f18ca", "country_code":"82") "callback_number":"02
,
5011980" , "message_type":"COMMERCE" "phone_number"":"01054308779", "tran_type":"L ,
,
"subject","전환전송제목", "tran_message":"전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 , "template_cod
,
el:"eeef8c0d61037be97e39f8b0313d3771b750f7bf", "targeting :"M" , "message_variable":("
변수":"변수
"}, "button_variable":("url1 ":"www.mtsco.co.kr","url2":"www.mtsco.co.kr"),"commerce_varia
ble":{"aaa":"aaa", "정상가격 ":"1000" "할인가격 ":"700" "할인율 ":"30" "정액할인가격
":" 300"),"image_variable":[{"img_url":"https://mud-
kage.kakao.com/dn/kspiP/btsO8blzneD/Qvd9Hxyrki4A9YwWLb5bf0/img_l.jpg " "img_link
,
" :"https://www.mtsco.co.kr"}}}("sender_key'"df8b597658c2702fbbaddb0d828cee19a51f1
8ca" "country_code":"82", "callback_number":"025011980") "message_type"."COMMERCE",
,
,
,
"phone_number":"01054308779", "tran_type":"L , "subject":"전환전송제목
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 : "template_cod
,
e":" eeef8c0d61037be97e39f8b0313d3771b750f7bf", "targeting" :"M" "message_variable":("
변수":"변수
"), "button_variable":("url1 ":"www.mtsco.co.kr", "url2":"www.mtsco.co.kr"),"commerce_varia
ble":{"aaa":"aaa", "정상가격 ":"1000" "할인가격 ":"700" "할인율 :"30", "정액할인가격
,
":"300"),"image_variable":[{"img_url":"https://mud-
kage.kakao.com/dh/ksplP/bts08blzneD/Qvd9Hxyrki4A9YwWLb5bf0/img_l.jpg , "img_link
" :"https://www.mtsco.co.kr"}}}]}

CAROUSEL_ COMMERCE 타입

{"auth_code":"iWy1fM7s85jftvM1Y4aN0Q== = "send_mode":"2", "data":[{"sender_key":" df8
,
b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "callback_number":"02
,
,

18

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

5011980" "message_type":"CAROUSEL_COMMERCE" "phone_number":"01054308779", "tr
,
,
an_type":"L " "subject":"전환전송제목", "tran_message":"전환전송메시지
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2" "add_etc3":"add_etc3" "add_etc4":"add_etc1 , "template_cod
,
,
e":"61091346d088f6983f1 1e4aa22e3890a547fe378", "targeting : "M " "carousel_variable":[("
,
,
message_variable":("header":"header", "message":"message", "link1 ":"www.mtsco.co.kr"}},{"
button_variable":("link2 ":"www.mtsco.co.kr"),"image_variable":("img_url":"https://mud-
kage.kakao.com/dh/w08Go/btsPKjP6XAo/KuPqyVKsdfGPMuv1 RkHcU1/img_l.jpg" , img_li
"
nk":"https://www.mtsco.co.kr"),"coupon_variable":"link3 ":"www.mtsco.co.kr"),"commerce_
variable":("정상가격 ":"1000" "할인가격":"700", "할인율 " : "30" "정액할인가격
,
" : 300"}),("image_variable":("img_url":"https://mud-
kage.kakao.com/dn/bD5ngK/btsPKSEHzv4/88UN5h4OdGgTQMieKijEIK/img_l.jpg , "img_li
nk":"https://www.mtsco.co.kr"}, "commerce_variable":{"정상가격 :"1000" "할인가격 : "700" "
,
할인율 " : 30" "정액할인가격
":"300"}}]},{"sender_key":" df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code"
,
82 " "callback_number":"025011980", "message_type":"CAROUSEL_COMMERCE") "phone_
,
,
,
number":"01054308779" "tran_type":"L' "subject":"전환전송제목
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2") "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "template_cod
,
,
,
e" :"61091346d088f6983f1 1e4aa22e3890a547fe378", "targeting :"M " "carousel_variable":[{"
,
,
message_variable":("header":"header", "message":"message", "link1":"www.mtsco.co.kr"}},{"
button_variable":("link2":"www.mtsco.co.kr"),"image_variable":("img_url":"https://mud-
kage.kakao.com/dn/w08Go/btsPKjP6XAo/KuPqyVKsdfGPMuv1 RkHcU1/img_l.jpg" "img_li
,
nk":"https://www.mtsco.co.kr"),"coupon_variable":"link3 ":"www.mtsco.co.kr"}, "commerce_
variable":("정상가격 ":"1000" "할인가격":"700", "할인율 30" "정액할인가격
" : 300"}},("image_variable":{"img_url":"https://mud-
kage.kakao.com/dn/bD5mgK/btsPKSEHzv4/88UN5h4OdGgTQMieKijEIK/img_ljpg" "img_li
,
nk":"https://www.mtsco.co.kr"/"commerce_variable"("정상가격 ":"1000" "할인가격 :"700" "
할인율 : "30" "정액할인가격 : "300"}}}}}}
,

10. 브랜드 메시지 응답요청

발송 후 결과를 받기까지 최대 5분이 걸릴 수 있습니다.

[Request]

· path : /btalk/resp/messages

19

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

- · method : POST


- · header


○ Content-type: application/json

- · parameter (json)


| 키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| auth_code | text(40) | Y | 인증코드 (MTS 에서 발급한 인증코드) | "auth_code":"asWdsg sk46seE" |
| sender_key | text(40) | Y | 발신 프로필 키 | "sender_key":"2662e9 9eb7a1f21abb395527 8e9955f5a9a99b62" |
| send_date | text(14) | Y | 발송예정일 최소:연월일(8 자) * 연월일(8 자), 연월일시(10 자), 연월일시분(12 자), 연월일시분초(14 자) 모두 가능 | "send_date":"2020010 1120101" |
| add_etc1 | text(160) | N | 고객사에서 보내는 추가 정보 1 | "add_etc1":"add_etc1 " |
| add_etc2 | text(160) | N | 고객사에서 보내는 추가 정보 2 | "add_etc2":"add_etc2 " |
| add_etc3 | text(160) | N | 고객사에서 보내는 추가 정보 3 | "add_etc3":"add_etc3 " |
| add_etc4 | text(160) | N | 고객사에서 보내는 추가 정보 4 | "add_etc4":"add_etc4 " |
| page | number | N | 페이지(기본값:1) | "page":1 |
| count | number | N | 한 페이지에 조회할 건수(default: 1000) | "count":1000 |


[Response]

· 응답 바디는 JSON 객체로 아래를 참고 하세요.

| 키 | 상세키 | 타입 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| code |  | text(4) | 결과코드 | "code":"0000" |
| received_at |  | text(19) | 메시지를 수신한 시간 | "received_at":"2015- 08-06 10:51:00" |


20

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| message |  | text | 오류 메시지 (오류시 존재하는 값) | "message":"NoMess ageFoundException " |
| --- | --- | --- | --- | --- |
| data |  | Json[] | 전송요청 파라미터를 포함한 json 배열 |  |
|  | ptn_id | number | 업체 번호 | "ptn_id":52 |
|  | result code | text(4) | 발송결과코드 | "result_code":"1030" |
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
|  | tran_type | text(1) | 전환전송 유형 브랜드 메시지로 전송이 불가할 경우 SMS/LMS/MMS 로의 전환전송 여부. | "tran_type":"S" |


21

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

|  |  |  | 기본값은 'N' |  |
| --- | --- | --- | --- | --- |
|  | callback_url | text(512) | MTS 에서 메시지 전송결과를 보내줄 고객사 서버의 Full URL | "callback_url":"https: //www.mtsco.co.kr/ message_callback.d o?seq=123" |
|  | add_etc1 | text(160) | 고객사에서 보내는 추가 정보 1 | "add_etc1":"etc1" |
|  | add_etc2 | text(160) | 고객사에서 보내는 추가 정보 2 | "add_etc2":"etc2" |
|  | add_etc3 | text(160) | 고객사에서 보내는 추가 정보 3 | "add_etc3":"etc3" |
|  | add_etc4 | text(160) | 고객사에서 보내는 추가 정보 4 | "add_etc4":"etc4" |


# 11. 샘플(Sample) 데이터

# 1) 전문 예제(응답요청)

{"auth_code":"인증번
호","sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca","send_date"."2025091
5","page":1,"count":10}

12. CALLBACK_URL 사용 시 전송결과 응답

- 1. 보내는 데이터는 JSON 으로 각 서비스의 전송결과 요청 data 배열 내의 JSON 과
- 같다.


- 2. 브랜드 메시지/친구톡 발송 후 MMS, SMS 로 전환전송이 일어날 시 받게 되는 응답
- 은 브랜드 메시지 결과/전환전송 결과 총 2건을 응답받게 된다.


- 3. JSON 데이터 내에 아래 파라메터가 추가된다.


| send_type | text(5) | 메시지 서비스 타입 알림톡 : ATK 친구톡 : FTK 친구톡V2 : FTKV2 브랜드 메시지 : BTK SMS : SMS | "send_type":"BTK" |
| --- | --- | --- | --- |


22

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

|  | MMS : MMS |  |
| --- | --- | --- |


# 2) 응답 예제

{"result_code":"3015","result_date":"20250922092123","real_send_date":"20250922092121
" "tran_pr":"200000521","sender_key"/Idf8b597658d2702fobadbod82828cee19a51f18ca","s
,
end_date":"20250922092107","template_code":"d619ed0c7ba9c74c0ac35069710121c0ed
cf3bd","country_code","82","phone_number":"01012345678","callback_number":"025011
980", "message_type":"CAROUSEL_COMMERCE","tran_type''"N", "add_etc1":"add_etc1","ad
d_etc2":"add_etc2","add_etc3','add_etc3","add_etc4"':"add_etc4",'send_type':"BTK")

# 13. 필드 상세정보

# 1. sender_key

- 1. 브랜드 메시지를 발송하기 위한 고객사 고유의 "발송프로필키"


- 2. 발송프로필키는 영업담당자로 부터 발급받음


※ 브랜드 메시지 발송 딜러사 변경시 "발송프로필키" 변경 필요

# 2. message_type

# 브랜드 메시지 타입 코드

- 1. TEXT: 텍스트
- 2. IMAGE: 이미지
- 3. WIDE: 와이드 이미지
- 4. WIDE_ITEM_LIST: 와이드 리스트
- 5. CAROUSEL_FEED: 캐러셀 피드
- 6. PREMIUM_VIDEO: 프리미엄 동영상
- 7. COMMERCE: 커머스
- 8. CAROUSEL_COMMERCE: 캐러셀 커머스


# 3. targeting (타겟팅 타입)

1. M : 수신 동의 유저 (카카오톡 수신 동의)

23

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

- 2. N : 수신 동의 유저 n 채널 친구
- 3. I : 발송 요청 대상 n 채널 친구


# 4. phone_number, app_user_id

- 1. 두 값 중 하나는 반드시 존재해야 함
- 2. 둘 다 있으면 phone_number 기준으로 발송


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


# 8. message_variable

1. TEXT, IMAGE, WIDE : 일반적인 본문 Text 영역의 변수

24

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

- 2. WIDE_ITEM_LIST : 와이드 리스트의 헤더, 타이틀, 링크의 변수
- 3. PREMIUM_VIDEO : 헤더, Text 영역의 변수
- 4. COMMERCE : 부가 정보 영역의 변수


# 예제

# "message_variable":"내용":"여름맞이할인이벤트!지금바로확인해보세요."),

# 9. button_variable

1. TEXT, IMAGE, WIDE, WIDE_ITEM_LIST,PREMIUM_VIDEO, COMMERCE : 버튼 링크
변수

예제

"button_variable":"mobile 링크":"https://www.mystore.com/event/summer-
sale","android 링크":"kakao://buttons-summer-event-
android", "ios 링크":"kakao://buttons-summer-event-ios"),

# 10. coupon_variable

1. TEXT, IMAGE, WIDE, WIDE_ITEM_LIST,PREMIUM_VIDEO, COMMERCE : 쿠폰 링크
변수

# 예제

"coupon_variable"/"할인금액","5000","쿠폰링크":"https://www.mystore.com/coupon/dow
nload/1234"},

# 11. image_variable

- 1. IMAGE, WIDE: 1개의 값을 가질 수 있음
- 2. WIDE_ITEM_LIST: 리스트 개수만큼을 가질 수 있음
- 3. TEXT: 이미지를 지원하지 않음


입력하지 않으면 템플릿의 이미지가 사용되며 입력할 경우에는 파라미터의 이미지 값
으로 대체되어 발송

예제

25

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

# "image_variable":[{"img_url":"https://cdn.mystore.com/images/event_banner.jpg","img_link
":"https://www.mystore.com/event/summer-sale"}],

12. video_variable

PREMIUM_VIDEO인 경우 사용

입력하지 않으면 템플릿의 비디오가 사용되며 입력할 경우에는 파라미터의 비디오 값으
로 대체되어 발송

예제

"video_variable": "{"video_url": "{video_url)","thumbnail_url": "{thumbnail_url)")"

13. commerce_variable

# COMMERCE인 경우 사용

가격 관련 고정변수 "할인가격", "정상가격", "할인율", "정액할인가격" 존재
메시지 표기 방식에 따른 사용 가능 조합

- 1. "할인가격"
- 2. "할인가격", "정상가격", "할인율"
- 3. "할인가격", "정상가격", "정액할인가격"


예제

"commerce_variable":"타이틀":"여름신상티셔츠","정상가격":"30000", "할인가격":"15000", "
할인율":"50","정액할인가격":"15000"),

14. carousel_variable

CAROUSEL_FEED, CAROUSEL_COMMERCE인 경우 사용

- 1. CAROUSEL_FEED: 2개~템플릿에 등록된 캐러셀 수


- 2. CAROUSEL_COMMERCE: 2개~템플릿에 등록된 캐러셀 인트로 + 캐러셀 수
- 캐러셀 인트로가 존재한다면 캐러셀 인트로의 변수영역을 배열 첫번째에 입력


- 3. 변수가 없는 캐러셀 인트로 또는 캐러셀은 빈 오브젝트(0)로 입력하여 템플릿에 등


26

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

록된 캐러셀과 순서를 맞춰 발송버튼 타입별 속성

예제

"carousel_variable"(("message_variable')"리스트헤더':'시원한린벤셔츠","리스트내용":"통
기성좋은린넨소재로제작된셔츠!\n 지금구매시무료배송혜택!"),"image_variable":("img_url":
"https://cdn.mystore.com/images/linen_shirtjpg", "img_link":"https://www.mystore.com/pr
oduct/linen-
shirt'),"coupon_variable'("상품명","린넨셔츠","쿠폰설명","5 천원할인","쿠폰링크 ":"https://
www.mystore.com/coupon/linen-
shirt"}},{"message_variable":"리스트헤더"."데일리반팔티셔츠", 리스트내용","부드러운촉감
과세련된디자인!₩n 다양한컬러옵션으로선택가능"),"image_variable":("img_url":"https://cdn
.mystore.com/images/daily_tshirt.jpg","img_link":"https://www.mystore.com/product/daily-
tshirt"}}]

15. callback_url

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
| 1001 | NoJsonBody | Request Body가 Json형식이 아님 |
| 1002 | InvalidHubPartnerKey | 허브 파트너 키가 유효하지 않음 |
| 1003 | InvalidSenderKey | 발신 프로필 키가 유효하지 않음 |


27

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| 결과코드 | message | 설명 |
| --- | --- | --- |
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
| 1030 | InvalidParameterException | 잘못된 파라메터 요청 |
| 2006 | FailedToMatchSerialNumberPrefixPattern | 시리얼넘버 형식 불일치 |
| 3000 | UnexpectedException | 예기치 않은 오류 발생 |
| 3005 | AckTimeoutException | 메시지를 발송했으나 수신확인 안됨 (성공불확실) |


28

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| 결과코드 | message | 설명 |
| --- | --- | --- |
|  |  | - 서버에는 암호화 되어 보관되며 3 일 이내 수신 가능 |
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
| 3020 | MessageUserBlockedAlimtalkException | 브랜드 메시지 수신 차단 |
| 3021 | MessageNotSupportedKakaotalkExceptio n | 카카오톡 최소 버전 미지원 |
| 3022 | NoSendAvailableTimeException | 메시지 발송 가능한 시간이 아님 (친구톡 / 마케팅 메시지는 08시부터 20시까지 발송 가능) |
| 3024 | MessagelnvalidImageException | 메시지에 포함된 이미지를 전송할 수 없음 |
| 3025 | ExceedMaxVariableLengthException | 변수 글자수 제한 초과 |
| 3026 | Button chat_extra(event)- InvalidExtra(EventName)Exception '([A-Za- z0-9_]{1,50})' | 상담/봇 전환 버튼 extra, event 글자수 제한 초과 |
| 3027 | NoMatchedTemplateButtonException | 메시지 버튼/바로연결이 |


29

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| 결과코드 | message | 설명 |
| --- | --- | --- |
|  |  | 템플릿과 일치하지 않음 |
| 3028 | NoMatchedTemplateTitleException | 메시지 강조 표기 타이틀이 템플릿과 일치하지 않음 |
| 3029 | ExceedMaxTitleLengthException | 메시지 강조 표기 타이틀 길이 제한 초과 (50자) |
| 3030 | NoMatchedTemplateWithMessageTypeExc eption | 메시지 타입과 템플릿 강조유형이 일치하지 않음 |
| 3031 | NoMatchedTemplateHeaderException | 헤더가 템플릿과 일치하지 않음 |
| 3032 | ExceedMaxHeaderLengthException | 헤더 길이 제한 초과(16자) |
| 3033 | NoMatchedTemplateItemHighlightExcepti on | 아이템 하이라이트가 템플릿과 일치하지 않음 |
| 3034 | ExceedMaxItemHighlightTitleLengthExcep tion | 아이템 하이라이트 타이틀 길이 제한 초과(이미지 없는 경우 30자, 이미지 있는 경우 21자) |
| 3035 | ExceedMaxItemHighlightDescriptionLengt hException | 아이템 하이라이트 디스크립션 길이 제한 초과(이미지 없는 경우 19자, 이미지 있는 경우 13자) |
| 3036 | NoMatchedTemplateltemListException | 아이템 리스트가 템플릿과 일치하지 않음 |
| 3037 | ExceedMaxl temDescriptionLengthException | 아이템 리스트의 아이템의 디스크립션 길이 제한 초과(23자) |
| 3038 | NoMatchedTemplateltemSummaryExcepti on | 아이템 요약정보가 템플릿과 일치하지 않음 |
| 3039 | ExceedMaxItemSummaryDescriptionLengt hException | 아이템 요약정보의 디스크립션 길이 제한 초과(14자) |
| 3040 | InvalidItemSummaryDescriptionException | 아이템 요약정보의 디스크립션에 허용되지 않은 문자 포함(통화기호/코드, 숫자, 콤마, 소수점, 공백을 제외한 문자 포함) |
| 3041 | MessagelnvalidWideltemListLengthExcepti on | 와이드 아이템 리스트 개수 최대 최소 개수 불일치 |


30

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| 결과코드 | message | 설명 |
| --- | --- | --- |
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
| ER07 | InvalidCallbackNumberException | MTS 메시지 : 발신번호(콜백NUMBER)이 유효하지 않습니다. |
| ER08 | InvalidDataException | MTS 메시지 : DATA 항목이 유효하지 않습니다. |


31

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| 결과코드 | message | 설명 |
| --- | --- | --- |
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


# [붙임] SMS 결과코드표

| 결과코드 | 설명 |
| --- | --- |
| 00 | 성공 |


32

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| 결과코드 | 설명 |
| --- | --- |
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


# [붙임] LMS, MMS 결과코드표

| 결과코드 | 설명 |
| --- | --- |
| 1000 | 성공 |
| 03 | 스팸 |
| 10 | 한도초과 발신제한 |
| 11 | 수신번호 정합성 오류 |
| 26 | 평생번호 전송실패 |
| 40 | 발신번호세칙 오류 |
| 50 | 사전 미등록 발신번호사용 |


33

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| 결과코드 | 설명 |
| --- | --- |
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
| 6072 | MMS 비가용 단말 |
| 8011 | SKT 단말기 응답없음 |
| 8012 | SKT 이통사 오류 (이통사 문의 필요) |
| 8200 | MMSC 전송 시 알 수 없는 오류 |


34

카카오 브랜드 메시지 기본형(변수 분리 방식) Restful Interface Guide v1.1

| 결과코드 | 설명 |
| --- | --- |
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


35

![![image](/image/placeholder)
{"auth_code":" 인증번](data:image/png;base64,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)
