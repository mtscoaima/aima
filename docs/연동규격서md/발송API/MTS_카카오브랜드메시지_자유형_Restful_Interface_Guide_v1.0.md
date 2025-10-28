# 카카오 브랜드 메시지(자유형)
RESTful Interface Guide

작성일자 : 2025.09.20
문서버전 : 1.0

MTS COMPANY
MOBILE TOTAL SERVICE

# 문 서 개 정 이 력

| 버전 | 일자 | 내용 | 작성자 |
| --- | --- | --- | --- |
| 1.0 | 2025.09.20 | 최초작성 | 김승현 |


카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

# 목 차

1. 개요. ··················································· 2
2. HOST ................................................... 2
3. 선결 조건 ----------------------------------------.................................................................·························································· 2
4. 브랜드 메시지 특징 .............................................................................................................................. 2
5. 용어의 정의 2
6. 브랜드 메시지 자유형 전송요청(단건) ----------------------------··················································· 3
7. 샘플(Sample) 데이터 ··················································· 5
8. 브랜드 메시지 기본형 전송요청(여러 건) ............................................................................ 10
9. 샘플(Sample) 데이터 .............................................................................. 13
10. 브랜드 메시지 응답요청 ................................................................................................................ 23
11. 샘플(Sample) 데이터 .............................................................................................. 25
12. CALLBACK_URL 사용 시 전송결과 응답 ................................................................................ 26
13. 필드 상세정보 .............................................................................................. 26
[붙임] 브랜드 메시지 결과코드 ·····························.................................................································ 38
[붙임] SMS 결과코드표 ........ ························································........................................................···· 47
[붙임] LMS, MMS 결과코드표 47

····

1

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

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

# 1) 발신프로필키

고객이 브랜드 메시지를 전송할 수 있도록 카카오 공식딜러사를 통하여 발급받은 고유키
값입니다.

# 2) 전환전송

카카오 브랜드 메시지는 실시간으로 메시지 전송에 대한 결과를 확인할 수 있으며, 브랜

2

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

드 메시지 전송 실패 건에 대하여 타 메시지 채널(SMS/LMS)로 전환하여 전송함으로써
고객에게 메시지 전달율을 높일 수 있습니다.

전환전송을 하도록 요청을 주실 시, 발신 전화번호는 반드시 사전등록 된 발신번호를 넣
어 주셔야 합니다.

# 6. 브랜드 메시지 자유형 전송요청(단건)

# [Request]

- · path : /btalk/send/message/freestyle
- · method : POST
- · header


○ Content-type: application/json

- · parameter (json)


| 키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| auth_code | text(40) | Y | MTS 발급 인증코드 | "auth_code":"asWd sgsk46seE" |
| sender_ key | text(40) | Y | 발신 프로필 키 | "sender_key":"266 2e99eb7a1f2" |
| send_date | text(14) | Y | 발송 예정일 (기본값: MTS 서버에 등록일시) | "send_date":"2020 0101120101" |
| message_type | text(20) | Y | 브랜드 메시지 타입 | "message_type":"T EXT" |
| send_mode | text(1) | Y | 브랜드 메시지 발송 유형 타입 | "send_mode": "1" |
| targeting | text(1) | Y | 타겟팅 타입(M/N/I) | "targeting": "M" |
| callback_number | text(15) | Y | 발신 전화번호 | "callback_number": "1522-1825" |
| country_code | text(16) | N | 국가번호 (기본 82) | "country_code":"82 " |
| phone_number | text(16) | N | 사용자 전화번호 | "phone_number":" 01012345678" |


3

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| app_user_ id | text(20) | N | 앱 유저 ID | "app_user_id":"123 45" |
| --- | --- | --- | --- | --- |
| push_alarm | text(1) | N | 푸시 알람 여부(기본 Y) | "push_alarm":"Y" |
| adult | text(1) | N | 성인용 메시지 확인 여부 (확인 여부 Y/N, 기본값 N) | "adult":"N" |
| reseller_code | text(9) | N | 메시지 신고시 KISA 에 전달될 재판매사 구분 코드 |  |
| message | text | Y | 사용자에게 전달될 메시지 | - |
| additional_content | text(34) | N | 부가 정보 | - |
| attachment | Attachment | N | 메시지에 첨부할 내용 링크 버튼과 이미지를 첨부 | - |
| header | text(20) | N | header 필드 | "header":"message header" |
| carousel | Carousel | N | carousel 필드 필수 | - |
| tran_type | text(1) | Y | 전환전송 여부(N/S/L/M) | "tran_type":"S" |
| tran_message | text(1000) | N | 전환전송 메시지 | "tran_message":"고 객님의 택배가 금일 (18~20)시에 배달 예정입니다." |
| subject | text(20) | N | LMS 전송 시 필요한 제목 | "subject":"제목" |
| callback_url | text(512) | N | MTS 에서 메시지 전송결과를 보내줄 고객사 서버의 Full URL | "callback_url":"http s://www.mtsco.co. kr/message_callba ck.do?seq=123" |
| add_etc1 | text(160) | N | 고객사에서 보내는 추가 정보 1 | "add_etc1":"add_et c1" |
| add_etc2 | text(160) | N | 고객사에서 보내는 추가 정보 2 | "add_etc2":"add_et c2" |


4

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| add_etc3 | text(160) | N | 고객사에서 보내는 추가 정보 3 | "add_etc3":"add_et c3" |
| --- | --- | --- | --- | --- |
| add_etc4 | text(160) | N | 고객사에서 보내는 추가 정보 4 | "add_etc4":"add_et c4" |


# [Response]

| 키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| code | text(4) | Y | 처리 결과 코드 (0000=성공) | "code ":"0000" |
| received_at | text(19) | N | 수신 시간 (realtime 발송 시) | "received_at":"2015-08- 06 10:51:00" |
| message | text | N | 오류 메시지 | "message":"JSONParsing Exception" |


# 7. 샘플(Sample) 데이터

# TEXT 타입

{"auth_code":"인증코
드 ","senden_ksy/f:f8b597658:2702hboodboddox3ceel9a51f18ca","country_code":"82", "c
allback_number":"025011980","send_mode":"1", "message_type":"TEXT", "phone_number":
"01012345678", "tran_type":"L". "subject":"전환전송제목" "tran_message":"전환전송메시지
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123","add_etc1":"add
etc1", "add_etc2"."add_etc2","add_etc3":"add_etc3", "add_etc4":"add_etc1","targeting":"M
" "message"."브랜드메시지텍스트:자유형-한건발송", "attachment":("button":[("name":"버
,
튼
1","type":"WL" "url_pc":"http://bizmessage.kakao.com/","url_mobile":"http://bizmessage.k
akao.com/"}],"coupon":/"title":"1000원할인쿠폰","description":"소박한할인쿠폰
"

"url_mobile"/https://daum.net","url_pc":"https://kakao.com"}}

# IMAGE 타입

{"auth_code":"인증코
드 ","sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number':"025011980", "send_mode":"1", "message_type":"IMAGE","phone_number
":"01012345678", "tran_type":"L' , "subject":"전환전송제목", "tran_message"."전환전송메시
지
" "callback_url":"https://www.mtsco.co.kr/message_caIback.do?seq=123","add_etc1 ":"add

5

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

etc1 " "add_etc2":"add_etc2TM,"add_etc3":"add_etc3") "add_etc4":"add_etc1 " "targeting":"M
,
" "message":"브랜드메시지이미지:자유형-한건발송
,
" lattachment":"image":(""img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/ing_ljpg"),"button
":[{"name":"버튼
1", "type":"WL , "url_pc":"http://bizmessage.kakao.com/", "url_mobile":"http://bizmessage.k
akao.com/"}],"coupon":"title":"1000원할인쿠폰", "description"."소박한할인쿠폰
" "url_mobile":"https://daum.net", "url_pc":"https://kakao.com"}}}
,

# WIDE 타입

{"auth_code":"인증코
드 "sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca* "country_code":"82", "c
allback_number":"025011980", "send_mode":"1", "message_type":"WIDE") "phone_number":
"01012345678", "tran_type":"L' , "subject":"전환전송제목 = "tran_message","전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seo=123","add_etc1 ":"add
,
_etc1 = "add_etc2":"add_etc2", "add_etc3":"add_etc3", "add_etc4":"add_etc1", "targeting":"M
" "message","브랜드메시지와이|드이미지:자유형-한건발송
,
" attachment":("image":("img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1", "type":"WL' "url_pc":"http://bizmessage.kakao.com/", "url_mobile":"http://bizmessage.k
akao.com/"}],"coupon":('"title":"1000원할인쿠폰", "description","소박한할인쿠폰
" "url_mobile":"https://daum.net","url_pc":"https://kakao.com"}}}}
,

# WIDE_ITEM_LIST 타입

{"auth_code":"인증코
드 "sender_key'":"df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"025011980", "send_mode":"1", "message_type":"WIDE_ITEM_LIST", "phon
e_number":"01012345678", "tran_type":"L", "subject":" 전환전송제목","tran_message":"전환
전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123","add_etc1 ":"add
,
_etc1", "add_etc2":"add_etc2", "add_etc3":"add_etc3", "add_etc4":"add_etc1 : "targeting":"M
" "header":"와이드리스트header", "attachment":("button":[{"name":"버튼
,
1 , "type":"WL" "url_pc":"http://bizmessage.kakao.com/" , "url_mobile":""http://bizmessage.k
,

6

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

akao.com/"},{"name":"버튼
2", "type":"WL' , "url_pc":"http://bizmessage.kakao.com/" "url_mobile":"http://bizmessage.k
akao.com/"}],"item":("list":[("title":"1 번 아이 템 " img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "url_mo
bile":"http://bizmessage.kakao.com/"),("title"."2번아이템 img_url":"https://mud-
kage.kakao.com/dn/c52Xib/btsPOT4Aoa9/fSrlcxsywkUFDTwkkPoimNk/img_ljpg" "url_mo
,
bile":"http://bizmessage.kakao.com/")/"title":"3번아이템 img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg" "url_mo
,
bile":"http://bizmessage.kakao.com/")//"title","4번아이템 img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "url_mo
bile":"http://bizmessage.kakao.com/"}]}, "coupon":("title":"10000 원할인쿠폰
" "description":"신 년맞이할인쿠폰
,
" "url_mobile":"https://daum.net", "url_pc":"https://daum.net", "scheme_android":"" "schem
,
e_ios":""}}}

# CAROUSEL_FEED 타입

{"auth_code":"인증코
드 "sender_key": df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"025011980", "send_mode":"1 " "message_type":"CAROUSEL_FEED" "phon
,
e_number":"01012345678", "tran_type":"L' "subject":" 전환전송제목", "tran_message":"전환
전송메시지
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1","targeting":"M
,
" "header":"와이드리스트header", "carousel":{"list":[{"header":"1 번캐러셀피드헤더
,
" "message":"1 번캐러셀피드메시지 " "attachment":("image":("img_url":"https://mud-
,
,
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "img_lin
,
k":"http://bizmessage.kakao.com/"),"button".("name"."버튼
1" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os ······ "scheme_android":""),{"name":"버튼
·
2" "type":"WL' , "url_pc"."https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " :"" "scheme_android":"'),"coupon's:"title':"10000원할인쿠폰 " "description":"신년맞이
,
할인쿠폰", "url_mobile":"https://daum.net", "url_pc":"https://daum.net"}}},("header":"2번캐
러셀피드헤더 " "message":"2번캐러셀피드메시지
,
" "attachment":{"image":/"img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg", "img_lin

7

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

k":"http://bizmessage.kakao.com/"),"button":[{"name","버튼
1" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " : ···· "scheme_android":""),("name":"버튼
,
2" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
,
os ······ "scheme_android":"'),"coupon":/"title":"777원할인쿠폰") "description":"신년맞이할인
· ,
쿠폰", "url_mobile":"https://daum.net", "url_pc":"https://daum.net")}}/"header":"3번캐러셀
피드헤더", "message":"3번캐러셀피드메시지
" attachment":("image":("img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1 " "type":"WL" "url_pc"."https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
,
os " : ···· "scheme_android":""),{"name":"버튼
,
2" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " : ···· "scheme_android":""}}}},{"header","4번캐러셀피드헤더 " "message","4번캐러셀피드
,
,
메시지 "attachment":{"image":/"img_url":"https://mud-
kage.kakao.com/dn/052xip/otsP0744Aoa9/Srksyw/lFDTwAkPoimNk/img_l.jpg" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1 " "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " : ···· "scheme_android":""),{"name":"버튼
,
2" "type":"WL", "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " ····· "scheme_android":"/}}}/"header":"5번캐러셀피드헤더 , "message":"5번캐러셀피드
· ,
메시지 "attachment":{"image":{"img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "img_lin
,
k":"http://bizmessage.kakao.com/"},"button":[("name":"버튼
1" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " ····· "scheme_android":""),{"name":"버튼
·
2" "type":"WL", "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os ":"" "scheme_android":"")[1]/"header":"6번캐러셀피드헤더 " "message"."6번캐러셀피드
,
,
메시지 " "attachment":{"image":("img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1 = "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os ":"" "scheme_android":"'}]}},"tail"/"url_pc"//https://m.daum.net", "url_mobile":"https://m
,
.daum.net", "scheme_ios":"" "scheme_android":"")}}

8

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

# PREMIUM_VIDEO 타입

{"auth_code":"인증코
드 : "sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"025011980", "send_mode":"1", "message_type":"PREMIUM_VIDEO". "pho
ne_number":"01012345678", "tran_type":"L". "subject":"전환전송제목", "tran_message":"전
환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1" "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1","targeting":"M
" "header":"프리미|엄동영상헤더", "message"."브랜드메시지프리미엄동영상:자유형-한건발
,
송
" "attachment":("video":("video_url":"https://tv.kakao.com/channel/1 506/cliplink/4547183
,
11" , "thumbnail_ur":"https://t1.daumcdn.net/news/202504/27/sbsi/20250427210013294e
hixjpg"),"button":{"type":"MD", "name":"메시지발송"}]}}

# COMMERCE 타입

{"auth_code":"인증코
드 "sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca* "country_code":"82", "c
allback_number":"025011980","send_mode":"1 " "message_type":"COMMERCE" "phone_nu
,
mber":"01012345678", "tran_type":"L' "subject":"전환전송제목", "tran_message":"전환전송
메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 : "targeting":"M
" lattachment":("image":{"img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkssywkUFDTwkkPoimNk/img_l.jpg"),"video":{
}, "button":[("type":"WL " "name":"상품링크
,
" "url_mobile":"https://m.daum.net")]."commerce":"title":"브랜드메시지커머스타이틀
,
" "regular_price":10000,"discount_price":9000,"discount_rate":10}),"additional_content":" 브
,
랜드메시지부가정보")

# CAROUSEL_COMMERCE 타입

{"auth_code":" 인증코
드 "sender_key":" df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number":"025011980", "send_mode":"1", "message_type":"CAROUSEL_COMMERCE
,

9

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

" "phone_number":"01012345678", "tran_type":"L' "subject":" 전환전송제목
,
" "tran_message":"전환전송메시지
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1" "add_etc2":"add_etc2") "add_etc3":"add_etc3", "add_etc4":"add_etc1 "targeting":"M
" "carousel":{"head":("header":"인트로피드헤더", "content":"인트로피드컨텐츠
,
" "image_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg"),"ist":[["
attachment":("image":("img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg"),"button
":[("name":"버튼1", "type":"WL "url_mobile":"https://daum.net"'},("name":"버튼
2", "type":"AL", "url_mobile":"https://daum.net", "scheme_android"":"https://daum.net")]."co
upon":("title","9999원할인쿠폰","description":"쿠폰설명
" "url_mobile":"https://daum.net"),"commerce":("title":"1 번캐러셀커머스피드타이틀
" "regular_price":10000,"discount_price19000,"discount_rate":10}},"additional_content":"1
,
번캐러셀커머스피드부가정보")/"attachment":/"image":("img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/f5rkxsywkUFDTwkkPoimNk/img_l.jpg"),"button
":({"name":"버튼1","type":"WL") "url_mobile":"https://daum.net"},{"name":"버튼
2","type":"AL", "url_mobile":"https://daum.net"","scheme_android":"https://daum.net"}], "co
upon":("title":"'99999원할인쿠폰", "description":"쿠폰설명
" http://shhttp://commert/com/scifit/2천에 살아가스페라산헤아메메t
,
" "regular_price":20000000}}, "additional_content"."2번캐러셀커머스피드부가정보
"}],"tail":"url_pc":"https://daum.net","url_mobile":"https://daum.net"}}}

8. 브랜드 메시지 기본형 전송요청(여러 건)

# [Request]

- · path : /btalk/send/messages/freestyle
- · method : POST
- · header


○ Content-type: application/json

- · parameter (json)


| 키 | 상세키 | 타입 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| auth_code |  | text(40) | MTS 에서 발급한 Y 인증코드 | "auth_code": "asWdsgsk4 6seE" |


10

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| reseller_code |  | text(9) | N | 메시지 신고시 KISA 에 전달될 재판매사 구분 코드 | "reseller_cod e":"12345678 9" |
| --- | --- | --- | --- | --- | --- |
| send_mode |  | text(1) | Y | 브랜드 메시지 발송 유형 타입 | "send_mode" :"2" |
| data |  | Json Array | Y | 전송요청 파라미터를 포함한 json 배열 |  |
|  | sender key | text(40) | Y | 발신 프로필 키 | "sender_key" :"2662e99eb 7a1f2" |
|  | send_date | text(14) | Y | 발송 예정일 (기본값: MTS 서버에 등록일시) | "send_date":" 2020010112 0101" |
|  | message_type | text(20) | Y | 브랜드 메시지 타입 | "message_ty pe":"TEXT" |
|  | targeting | text(1) | Y | 타겟팅 타입(M/N/I) | "targeting": "M" |
|  | callback_numb er | text(15) | Y | 발신 전화번호 | "callback_nu mber":"1522 -1825" |
|  | push_alarm | text(1) | N | 푸시 알람 여부(기본 Y) | "push_alarm" :"Y" |
|  | adult | text(1) | N | 성인용 메시지 확인 여부 (확인 여부 Y/N, 기본값 N) | "adult":"N" |
|  | country_code | text(16) | N | 국가번호 (기본 82) | "country_cod e":"82" |
|  | phone_numbe r | text(16) | N | 사용자 전화번호 | "phone_num ber":"010123 45678" |


11

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

|  | app_user_id | text(20) | N | 앱 유저 ID | "app_user_id ":"12345" |
| --- | --- | --- | --- | --- | --- |
|  | message | text | Y | 사용자에게 전달될 메시지 | - |
|  | additional_con tent | text(34) | N | 부가 정보 |  |
|  | attachment | Attachment | N | 메시지에 첨부할 내용 링크 버튼과 이미지를 첨부 |  |
|  | header | text(20) | N | header 필드 | "header":"me ssage header" |
|  | carousel | Carousel | N | carousel 필드 필수 | - |
|  | tran_type | text(1) | Y | 전환전송 여부(N/S/L/M) | "tran_type":" S" |
|  | tran_message | text(1000) | N | 전환전송 메시지 | "tran_messa ge":"고객님 의 택배가 금일 (18~20)시에 배달 예정입니다." |
|  | subject | text(20) | N | LMS 전송시 제목 | "subject":"제 목" |
|  | callback url | text(512) | N | MTS 에서 메시지 전송결과를 보내줄 고객사 서버의 Full URL | "callback_url" : "https://ww w.mtsco.co.k r/message_c allback.do?s eq=123" |
|  | add_etc1 | text(160) | N | 고객사에서 보내는 추가 정보 1 | "add_etc1":"a dd_etc1" |
|  | add_etc2 | text(160) | N | 고객사에서 보내는 추가 정보 2 | "add_etc2":"a dd_etc2" |


12

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

|  | add_ etc3 | text(160) | N | 고객사에서 보내는 "add_etc3":"a 추가 정보 3 dd_etc3" |
| --- | --- | --- | --- | --- |
|  | add_ etc4 | text(160) N | 고객사에서 보내는 추가 정보 4 | "add_etc4":"a dd_etc4" |


# [Response]

| 키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| code | text(4) | Y | 처리 결과 코드 (0000=성공) | "code ":"0000" |
| received_at | text(19) | N | 수신 시간 (realtime 발송 시) | "received_at":"2015-08-06 10:51:00" |
| message | text | N | 오류 메시지 | "message":"JSONParsingEx ception" |


# 9. 샘플(Sample) 데이터

# TEXT 타입

{"auth_code":"인증코
드 " "send_mode":"1 " "data":[("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
ca" "country_code":"82", "callback_number":"025011980", "message_type":"TEXT","phone_
number":"01012345678", "tran_type":"L' "subject","전환전송제목", "tran_message":"전환전
송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123","add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2","add_etc3":"add_etc3") "add_etc4":"add_etc1","targeting":"M
" "message":"브랜드메시지텍스트:자유형-한건발송", "attachment":("button":[("name":"버
,
튼
1", "type":"WL' "url_pc":"http://bizmessage.kakao.com/", "url_mobile":"http://bizmessage.k
akao.com/"}],"coupon":{"title":"1000원할인쿠폰", "description"."소박한할인쿠폰
" "url_mobile":"https://daum.net", "url_pc":"https://kakao.com"}}},{"sender_key":"df8b5976
58c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "callback_number":"0250119
,
80" "message_type":"TEXT", "phone_number":"01012345678", "tran_type":"L", "subject":"전
,
환전송제목", "tran_message":"전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123","add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1","targeting":"M
" "message":"브랜드메시지텍스트:자유형-한건발송", "attachment":("button":[("name":"버
,
튼

13

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

1", "type":"WL' " "url_pc":"http://bizmessage.kakao.com/", "url_mobile":"http://bizmessage.k
akao.com/"}],"coupon":{"title":"1000원할인쿠폰", "description":". 소박한할인쿠폰
" "url_mobile":"https://daum.net", "url_pc":"https://kakao.com"}}}}]
,

# IMAGE 타입

| {"auth_code":"인증코 드 " "send_mode":"1 " "data":[("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18 ca " country_code":"82") "callback_number":"025011980", "send_mode":"1 " "message_type , , " : IMAGE" "phone_number":"01012345678", "tran_type":"L' , "subject":"전환전송제목 , " "tran_message":"전환전송메시지 , " "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add , etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "targeting":"M , " "message"."브랜드메시지이미지:자유형-한건발송 , " attachment":("image":("img_url":"https://mud- , kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg"),"button ":[{"name":"버튼 1", "type":"WL , "url_pc":"http://bizmessage.kakao.com/", "url_mobile":"http://bizmessage.k akao.com/"}],"coupon":{"title":"1000원할인쿠폰") "description":"소박한할인쿠폰 " "url_mobile":"https://daum.net", "url_pc":"https://kakao.com"}}}/{"sender_key":"df8b5976 58c2702fbbaddb0d828cee19a51f18ca" "country_code":"82") "callback_number":"0250119 , 80" "send_mode":"1", "message_type":"IMAGE" "phone_number":"01012345678", "tran_typ , e":"L " "subject":"전환전송제목" "tran_message":"전환전송메시지 , " "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add , etc1 " "add_etc2":"add_etc2","add_etc3":"add_etc3") "add_etc4":"add_etc1", "targeting":"M , " "message","브랜드메시지이미지:자유형-한건발송 , " "attachment":("image":{"img_url":"https://mud- , kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg"), "button ":[{"name":"버튼 1", "type":"WL' , "url_pc"/"http://bizmessage.kakao.com/", "url_mobile":"http://bizmessage.k akao.com/")],"coupon":/"title"."1000원할인쿠폰", "description":" 소박한할인쿠폰 " "url_mobile":"https://daum.net", "url_pc":"https://kakao.com"}}}}] , |
| --- |


# WIDE 타입

{"auth_code":"인증코

14

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

드 " "send_mode":"1 " "data":[{"sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
,
,
ca " country_code":"82") "callback_number":"025011980", "send_mode":"1 " "message_type
,
,
,
WIDE_ITEM_LIST") "phone_number"":"01012345678", "tran_type":"L" "subject":" 전환전송
,
,
제목 "tran_message":"전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "targeting":"M
,
,
" "header":"와이드리스트header", "attachment":{"button":[{"name":"버튼
,
1", "type":"WL' "url_pc":"http://bizmessage.kakao.com/") "url_mobile":"http://bizmessage.k
,
akao.com/"},{"name":"버튼
2", "type":"WL" "url_pc":"http://bizmessage.kakao.com/") "url_mobile":"http://bizmessage.k
akao.com/"}],"item":{"list":[("title":"1 번 아이템 " " limg_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "url_mo
bile":"http://bizmessage.kakao.com/")/"title"."2번아이템 img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg", "url_mo
bile":"http://bizmessage.kakao.com/")/"title","3번아이템 " img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsPOT4Aca9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg". "url_mo
,
bile":"http://bizmessage.kakao.com/"]/"tttle":"4번아이템 img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg", "url_mo
bile":"http://bizmessage.kakao.com/"}]}, "coupon":("title":"10000 원할인쿠폰
" "description":"신 년맞이할인쿠폰
,
" "url_mobile":"https://daum.net", "url_pc":"https://daum.net", "scheme_android":"" "schem
,
e_ios": "")}},{"sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code
,
":"82 " "callback_number":"025011980", "send_mode":"1" "message_type":"WIDE_ITEM_LIST
,
,
" "phone_number":"01012345678", "tran_type":"L' "subject":" 전환전송제목
,
" "tran_message":"전환전송메시지
,
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq= 123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "targeting":"M
,
" "header":"와이드리스트header", "attachment":{"button":[{"name":"버튼
,
1", "type":"WL' , "url_pc":"http://bizmessage.kakao.com/") "url_mobile":"http://bizmessage.k
,
akao.com/"),("name":"버튼
2", "type":"WL" "url_pc":"http://bizmessage.kakao.com/" "url_mobile":"http://bizmessage.k
akao.com/"}],"item":("list":[{"title":"1 번 아이템 " img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "url_mo
,
bile":"http://bizmessage.kakao.com/"),("title":"2 번 아이 템 img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg", "url_mo
,

15

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

ble":/"http://oizmessagekakao.com/"l/"title":"3번아이템 " limg_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg" "url_mo
,
bile":"http://bizmessage.kakao.com/"),("title":"4번아이템 img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "url_mo
bile":"http://bizmesage.kakao.com/"}]}, "coupon":("title":"10000원할인쿠폰
" "description":"신년맞이할인쿠폰
,
" "url_mobile":"https://daum.net", "url_pc":"https://daum.net", "scheme_android":"", "schem
,
e_ios":""}}}]}

# WIDE_ITEM_LIST 타입

{"auth_code":"인증코
드 " "send_mode":"1 " "data":[("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
,
ca " country_code":"82", "callback_number":"025011980", "send_mode":"1 " "message_type
,
,
WIDE_ITEM_LIST") "phone_number":"01012345678", "tran_type":"L' , "subject":" 전환전송
,
제목 "tran_message":"전환전송메시지
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "targeting":"M
,
,
" "message"."브랜드메시지와이드이미지:자유형-한건발송
,
" attachment":("image":("img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljog" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button':[("name":"버튼
1", "type":"WL' , "url_pc"/"http://bizmessage.kakao.com/", "url_mobile":"http://bizmessage.k
akao.com/"}],"coupon":("title":"1000원할인쿠폰", "description","소박한할인쿠폰
" "url_mobile":"https://daum.net", "url_pc":"https://kakao.com"}}},("sender_key": df8b5976
58c2702fbbaddb0d828cee19a51f18ca" "country_code":"82") "callback_number":"0250119
,
80" "send_mode":"1", "message_type":"WIDE_ITEM_LIST", "phone_number":"01012345678",
"tran_type":"L' "subject"."전환전송제목", "tran_message":"전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3", "add_etc4":"add_etc1 " "targeting":"M
,
" "message","브랜드메시지와이|드이미지:자유형-한건발송
,
" attachment":("image":{"img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":[{"name":"버튼
1", "type":"WL' , "url_pc":"http://bizmessage.kakao.com/", "url_mobile":"http://bizmessage.k
akao.com/"}],"coupon":("title":"1000원할인쿠폰 " "description":" 소박한할인쿠폰

16

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

" "url_mobile":"https://daum.net", "url_pc":"https://kakao.com"}}}]}
,

# CAROUSEL_ FEED 타입

{"auth_code":"인증코
드 "send_mode":"1 " "data":[{"sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
,
ca " "country_code":"82") "callback_number":"02501 1980" "send_mode":"1 " "message_type
,
,
" : CAROUSEL_FEED", "phone_number":"01012345678", "tran_type":"L", "subject":" 전환전송
제목", "tran_message":"전환전송메시지
" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1","targeting":"M
,
" "header":"와이드리스트header", "carousel":("list")["header":"1 번캐러셀피드헤더
,
" "message":"1 번캐러셀피드메시지 " "attachment":("image":("img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":("name":"버튼
1" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
,
os ······ "scheme_android":""),{"name":"버튼
·
2" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
,
os ":"" "scheme_android":"'),"coupon"//"title":"1000원할인쿠폰" "description":"신년맞이
,
할인쿠폰", "url_mobile":"https://daum.net","url_pc":"https://daum.net"}}},{"header":"2번캐
러셀피드헤더 " "message":"2번캐러셀피드메시지
,
" "attachment":("image":("img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljog" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1 " "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":""https://m.daum.net", "scheme_i
,
,
os " :"" "scheme_android":""),("name":"버튼
,
2" "type":"WL" "url_pc"."https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " : ···· "scheme_android":""),"coupon":("title":"777원할인쿠폰") "description":"신년맞이할인
,
쿠폰", http://shhttps://tom/pr/ot/jp//ints://hact/1le6l//t
피드헤더 " "message":"3번캐러셀피드메시지
" "attachment":("image":{"img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "img_lin
,
k":"http://bizmessage.kakao.com/"),"button".("name"."버튼
1 = "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os ":"" "scheme_android":""),{"name":"버튼
,
2", "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,

17

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

os ":"" "scheme_android":")}}}},{"header"."4번캐러셀피드헤더 , "message"."4번캐러셀피드
,
메시지 " "attachment":{"image":{"img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " :"" "scheme_android":""),{"name":"버튼
,
2" "type":"WL", "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " : ···· 'scheme_android":")}}}/"header":"5번캐러셀피드헤더 , "message":"5번캐러셀피드
,
메시지 , "attachment":("image":(""img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg". "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
,
os ······ "scheme_android":""),{"name":"버튼
· ,
2" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":""https://m.daum.net", "scheme_i
,
os ":"" "scheme_android":""}}),{"header"."6번캐러셀피드헤더 " "message":"6번캐러셀피드
,
,
메시지 " "attachment":("image":("img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button".("name"."버튼
1 " "type":"WL' , "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " :"" "scherne_amoild"""Illitailyjunjpct"mps/indalinde""h "url_mobile":"https://m
,
.daum.net", "scheme_ios":"" "scheme_android":""}}},{"sender_key":"df8b597658c2702fbbad
db0d828cee19a51f18ca" "country_code":"82") "callback_number":"025011980", "send_mod
,
,
e" :"1 " "message_type":"CAROUSEL_FEED") "phone_number":"01012345678", "tran_type":"L"
,
, "subject"."전환전송제목", "tran_message"."전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1", "targeting":"M
" "header","와이드리스트header","carousel":("list":("header")"t"1 번캐러셀피드헤더
,
" "message":"1 번캐러셀피드메시지 " "attachment":("image":(")mg_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1 " "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os : ···· "scheme_android":""),{"name":"버튼
,
2" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os ":"" "scheme_android":""),"coupon"/"title":"10000원할인쿠폰 " "description":"신년맞이
,
할인쿠폰" "url_mobile":"https://daum.net","url_pc":"https://daum.net"}}},("header":"2번캐

18

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

러셀피드헤더 " "message":"2번캐러셀피드메시지
,
" attachment":("image":{"img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsPOT4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1" "type":"WL" "url_pc"."https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " :"" "scheme_android":""),{"name":"버튼
,
2" "type":"WL", "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " : ···· "scheme_android":"")],"coupon"("title":7777원할인쿠폰" "description":"신년맞이할인
,
쿠폰", http://shhttps://tom/phing//ings/ics/11/11/11/16//t
피드헤더 " "message":"3번캐러셀피드메시지
" attachment":("image":("img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljog" "img_lin
,
k":"http://bizmessage.kakao.com/"),"button's[("name":"버튼
1 " "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":""https://m.daum.net", "scheme_i
,
os " :"" "scheme_android"':'"),("name":"버튼
,
2" "type":"WL "url_pc":"https://m.daum.net", "url_mobile":""https://m.daum.net", "scheme_i
,
,
os ":"" "scheme_android":""{)}}{"header:/4번캐러셀피드헤더 , "message":"4번캐러셀피드
,
메시지 , "attachment":"image":("img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_ljpg", "img_lin
,
k":"http://bizmessage.kakao.com/"},"button":("name":"버튼
1 " "type":"WL' , "url_pc":"https://m.daum.net") "url_mobile":"https://m.daum.net", "scheme_i
,
os " : ···· "scheme_android":""),("name":"버튼
,
2" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " : ···· "scheme_android":"[}]%//'header',"5번캐러셀피드헤더 , "message":"5번캐러셀피드
,
메시지 , "attachment":/"image":("img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "img_lin
,
k":"http://bizmessage.kakao.com/")"button"){"name","버튼
1" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
os " : ···· "scheme_android":""),{"name":"버튼
,
2" "type":"WL" "url_pc":"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,
,
os ······· "scheme_android":")}}}},{"header"."6번캐러셀피드헤더 " "message"."6번캐러셀피드
,
· ,
메시지 " "attachment":("image":(""img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg") "img_lin
,
k":"http://bizmessage.kakao.com/"),"button":(("name":"버튼
1" "type":"WL", "url_pc"/"https://m.daum.net", "url_mobile":"https://m.daum.net", "scheme_i
,

19

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

os":"" "stremegandbick")"([itail Jujpsrttps://handaunda"ae "url_mobile":"https://m
,
.daum.net", "scheme_ios":"" "scheme_android":""}}}]}
,

PREMIUM_VIDEO 타입

{"auth_code":"인증코
드 " "send_mode":"1 " "data":[{"sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
ca , "country_code":"82") "callback_number":"025011980", "send_mode":"1 " "message_type
,
" :"PREMIUM_VIDEO", "phone_number":"01012345678", "tran_type":"L' "subject":"전환전송
제목", "tran_message":"전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1", "targeting" :"M
" "header","프리미엄동영상헤더" "message","브랜드메시지프리미엄동영상:자유형-한건발
,
,
송
" attachment"/"video"//video_ur"//https:/tw.kakao.com/channel/1 506/cliplink/4547183
,
11 " "thumbnail_url":"https://t1.daumcdn.net/news/202504/27/sbsi/20250427210013294e
,
hix.jpg"),"button":[{"type":"MD", "name":"메시지발송
"}]}},("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca", "country_code":"82",
,
"callback_number":"025011980", "send_mode":"1" "message_type":"PREMIUM_VIDEO", "ph
,
one_number":"01012345678" "tran_type":"L' , "subject":" 전환전송제목", "tran_message":"전
환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_calIback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1", "targeting":"M
" "header":"프리미엄동영상헤더", "message","브랜드메시지프리미엄동영상:자유형-한건발
,
송
" "attachment":("video":('video_url":"https://tv.kakao.com/channel/1 506/cliplink/4547183
,
11 " "thumbnail_url":"https://t1.daumcdn.net/news/202504/27/sbsi/2025042721001 3294e
hix.jpg"/"button":['type":"MD", "name"."메시지발송")]}}}}

COMMERCE 타입

{"auth_code":"인증코
드 " "send_mode":"1 " "data":[("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
ca , "country_code":"82", "callback_number":"025011980", "send_mode":"1 " "message_type
,
" : COMMERCE", "phone_number":"01012345678", "tran_type":"L' , "subject":"전환전송제목
,
" "tran_message":"전환전송메시지
,

20

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

" callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 " "targeting":"M
,
" lattachment":{"image":/"img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_Ljpg"),Video*/(
}, "button":[{"type":"WL " "name":"상품링크
,
" "url_mobile":"https://m.daum.net"}], "commerce":("title":"브랜드메시]지커머스타이틀
" "regular_price":10000,' "discount_price":9000,"discount_rate":10}},"additional_content":" 브
,
랜드메시지부가정보
"},{"sender_key":" df8b597658c2702fbbaddb0d828cee19a51f18ca" "country_code":"82", "c
allback_number':"025011980", "send_mode":"1", "message_type"":"COMMERCE", "phone_nu
mber":"01012345678", "tran_type":"L' , "subject":"전환전송제목", "tran_message":"전환전송
메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1" "add_etc2":"add_etc2", "add_etc3":"add_etc3") "add_etc4":"add_etc1 : "targeting":"M
" "attachment":("image":{"img_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/otsPOT4Aca9/fSrkxsywkUFDTwkkPoimNk/img_ljpg")"video":/
),"button":[("type":"WL , "name":"상품링크
" "url_mobile":"https://m.daum.net"}]."commerce':(['title"/'브랜드메시지커머스타이틀
" "regular_price":10000,"discount_price":9000,"discount_rate':10}},"additional_content":" 브
,
랜드메시지부가정보"}]}

# CAROUSEL_COMMERCE 타입

{"auth_code":"인증코
드 " "send_mode":"1 " "data":[("sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18
,
ca , "country_code":"82") "callback_number":"025011980", "send_mode":"1 " "message_type
,
": CAROUSEL_COMMERCE" "phone_number":"01012345678", "tran_type":"L' "subject":"전
환전송제목", "tran_message","전환전송메시지
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
_etc1 " "add_etc2":"add_etc2", "add_etc3":"add_etc3", "add_etc4":"add_etc1", "targeting":"M
" carousel":{"head":("header","인트로피드헤더 " "content":" 인트로피드컨텐츠
,
" "image_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkasywldUFDTwkkPoinNk/img_ling_jog_("ist_1]/
attachment":("image":{'"img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aca9/fSrkxxsywkUFDTwkkPoimNk/img_l.jpg"),"button
" ":[("name":"버튼1", "type":"WL", "url_mobile":"https://daum.net"),("name":"버튼

21

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

2", "type":"AL", "url_mobile":"https://daum.net", "scheme_android":""https://daum.net"}], "co
upon":{"title":"'99999원할인쿠폰", "description":"쿠폰설명
" "url_mobile":"https://daum.net"),"commerce":("title":"1 번캐러셀커머스피드타이틀
,
" "regular_price":10000,"discount_price":9000,"discount_rate":10)},"additional_content":"1
,
번캐러셀커머스피드부가정보"),("attachment"("image"://limg_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/img_l.jpg"),"button
":[{"name","버튼1","type":"WL "url_mobile":"https://daum.net"),("name":"버튼
2", "type":"AL" "url_mobile":"https://daum.net", "scheme_android":"https://daum.net"}], "co
upon":("title":"99999원할인쿠폰", "description":"쿠폰설명
" "url_mobile":"https://daum.net"),"commerce":("title","2번캐러셀커머스피드타이틀
" "regular_price":20000000}}, "additional_content"."2번캐러셀커머스피드부가정보
,
"}],"tail"("url_pc":"https://daum.net","url_mobile":"https://daum.net"}}},{"sender_key":" df8
b597658c2702fbbaddb0d828cee19a51f18ca", "country_code":"82", "callback_number":"02
5011980", "send_mode":"1 " "message_type":"CAROUSEL_COMMERCE", "phone_number":"
,
01012345678", "tran_type":"L' , "subject"."전환전송제목", "tran_message","전환전송메시지
,
" "callback_url":"https://www.mtsco.co.kr/message_callback.do?seq=123", "add_etc1 ":"add
,
etc1 " "add_etc2":"add_etc2", "add_etc3 ":"add_etc3", "add_etc4":"add_etc1 "targeting":"M
,
" carousel":{"head":("header":"인트로피드헤더 ", "content":"인트로피드컨텐츠
,
" "image_url":"https://mud-
,
kage.kakao.com/dn/c62Xib/otsPOT44.oa9/PS:osywkUFD7wkkPoimNk/img_l.jpg"},"list":[{"
attachment":/"image":{"img_url":"https://mud-
kage.kakao.com/dn/c62Xib/btsP0T4Aoa9/fSrkxsywkUFDTwkkPoimNk/ing_ljpg")."button
":[("name":"버튼1", "type":"WL "url_mobile":"https://daum.net"},{"name":"버튼
2", "type":"AL "url_mobile":"https://daum.net", "scheme_android":"https://daum.net"}], "co
upon":("title":"99999원할인쿠폰", "description":"쿠폰설명
" "url_mobile":"https://daum.net"),"commerce":("title":"1 번캐러셀커머스피드타이틀
" "regular_price":10000)/discount_price":9000,"discount_rate":10}},"additional_content":"1
,
번캐러셀커머스피드부가사정보"//"attachment":/"image":("img_url":"https://mud-
kage.kakao.com/dn/c52Xib/btsPOT4Aoa9/fSricxsywkUFDTwkkPoimNk/img_ljpg"), "button
":({"name":"버튼1","type":"WL") "url_mobile":"https://daum.net"},("name":"버튼
2", "type":"AL "url_mobile":"https://daum.net", "scheme_android":"https://daum.net"}], "co
upon":("title":"99999원할인쿠폰", "description":"쿠폰설명
" "url_mobile":"https://daum.net"),"commerce"("title","2번캐러셀커머스피드타이틀
,
" "regular_price":20000000},"additional_content","2번캐러셀커머스피드부가정보
"}], "tail":{"url_pc":"https://daum.net", "url_mobile":"https://daum.net"}}}]}

22

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

10. 브랜드 메시지 응답요청

발송 후 결과를 받기까지 최대 5분이 걸릴 수 있습니다.

# [Request]

- · path : /btalk/resp/messages
- · method : POST
- · header


○ Content-type: application/json

- · parameter (json)


| 키 | 타입 | 필수 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| auth_code | text(40) | Y | 인증코드 (MTS 에서 발급한 인증코드) | "auth_code":"asWdsgsk4 6seE" |
| sender key | text(40) | Y | 발신 프로필 키 | "sender_key":"2662e99e b7a1f21abb3955278e99 55f5" |
| send_date | text(14) | Y | 발송예정일 최소:연월일(8 자) * 연월일(8 자), 연월일시(10자), 연월일시분(12자), 연월일시분초(14 자) 모두 가능 | "send_date":"202001011 20101" |
| add_etc1 | text(160) | N | 고객사에서 보내는 추가 정보 1 | "add_etc1":"add_etc1" |
| add_etc2 | text(160) | N | 고객사에서 보내는 추가 정보 2 | "add_etc2":"add_etc2" |
| add_etc3 | text(160) | N | 고객사에서 보내는 추가 정보 3 | "add_etc3":"add_etc3" |
| add_etc4 | text(160) | N | 고객사에서 보내는 추가 정보 4 | "add_etc4":"add_etc4" |
| page | number | N | 페이지(기본값:1) | "page":1 |
| count | number | N | 한 페이지에 조회할 건수(default: 1000) | "count":1000 |


23

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

# [Response]

# · 응답 바디는 JSON 객체로 아래를 참고 하세요.

| 키 | 상세키 | 타입 | 설명 | 예제 |
| --- | --- | --- | --- | --- |
| code |  | text(4) | 결과코드 | "code":"0000" |
| received_at |  | text(19) | 메시지를 수신한 시간 | "received_at":"2 015-08-06 10:51:00" |
| message |  | text | 오류 메시지 (오류시 존재하는 값) | "message":"No MessageFound Exception" |
| data |  | Json[] | 전송요청 파라미터를 포함한 json 배열 |  |
|  | ptn_id | number | 업체 번호 | "ptn_id":52 |
|  | result_code | text(4) | 발송결과코드 | "result_code":"1 030" |
|  | result_date | text(14) | 발송결과 수신일시 | "result_date":"2 0250729084201 " |
|  | real_send_date | text(14) | 실제발송일시 | "real_send_date ":"20250729084 156" |
|  | sender key | text(40) | 발신 프로필 키 | "sender_key":"2 662e99eb7a1f2 1abb3955278e9 955f5a9a99b62 " |
|  | send_date | text(14) | 발송예정일 기본값 MTS 서버에 등록일시 | "send_date":"20 250729084150" |
|  | callback_number | text(15) | 발신전화번호 | "callback_numb er":"15221825" |
|  | country_code | text(3) | 국가번호 기본값은 82 | "country_code": "82" |


24

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

|  | phone_number | text(16) | 사용자 전화번호 | "phone_number ":"01012345678 " |
| --- | --- | --- | --- | --- |
|  | app_user_id | text(20) | 앱유저아이디 | "app_user_id":" abc123" |
|  | message_type | text(20) | 발송한 친구톡 메시지 타입 | "message_type" :"TEXT" |
|  | tran_type | text(1) | 전환전송 유형 브랜드 메시지로 전송이 불가할 경우 SMS/LMS/MMS 로의 전환전송 여부. 기본값은 'N' | "tran_type":"S" |
|  | callback_ url | text(512) | MTS 에서 메시지 전송결과를 보내줄 고객사 서버의 Full URL | "callback_url":"h ttps://www.mts co.co.kr/messag e_callback.do?s eq=123" |
|  | add_etc1 | text(160) | 고객사에서 보내는 추가 정보 1 | "add_etc1":"etc 1" |
|  | add_ etc2 | text(160) | 고객사에서 보내는 추가 정보 2 | "add_etc2":"etc 2" |
|  | add_etc3 | text(160) | 고객사에서 보내는 추가 정보 3 | "add_etc3":"etc 3" |
|  | add_etc4 | text(160) | 고객사에서 보내는 추가 정보 4 | "add_etc4":"etc 4" |


11. 샘플(Sample) 데이터

# 1) 전문 예제(응답요청)

{"auth_code":"인증번
호","sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca',"send_date":"2025091
5","page":1,"count":10}

25

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

# 12. CALLBACK_URL 사용 시 전송결과 응답

- 1. 보내는 데이터는 JSON 으로 각 서비스의 전송결과 요청 data 배열 내의 JSON 과
- 같다.


- 2. 브랜드 메시지/친구톡 발송 후 MMS, SMS 로 전환전송이 일어날 시 받게 되는 응답
- 은 브랜드 메시지 결과/전환전송 결과 총 2건을 응답받게 된다.


- 3. JSON 데이터 내에 아래 파라메터가 추가된다.


| send_type | text(5) | 메시지 서비스 타입 알림톡 : ATK 친구톡 : FTK 친구톡V2 : FTKV2 브랜드 메시지 : BTK SMS : SMS MMS : MMS | "send_type":"BTK" |
| --- | --- | --- | --- |


# 2) 응답 예제

{"result_code":"3015","hesult_date","20250922092123","real_send_date':"20250922092121
" "tran_pr":"200000521","sender_key":"df8b597658c2702fbbaddb0d828cee19a51f18ca","s
end_date':'20250922092107'","template_code":"d619ed0c7ba9c74c0ac35069710121c0ed
cf3bd","country_coce","82","phone_number":"01012345678","callback_number":"025011
980" "message_type","CAROUSEL_COMERCE","tran_type":"N", "add_etc1":"add_etc1","ad
d_etc2":"add_etc2","add_etc3":"add_etc3","add_etc4"/add_etc4","send_type':BTK"/

# 13. 필드 상세정보

# 1. sender_key

- 1. 브랜드 메시지를 발송하기 위한 고객사 고유의 "발송프로필키"
- 2. 발송프로필키는 영업담당자로 부터 발급받음


※ 브랜드 메시지 발송 딜러사 변경시 "발송프로필키" 변경 필요

# 2. message_type

브랜드 메시지 타입 코드

# 1. TEXT: 텍스트

26

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

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


# 5. tran_type

- 1. 브랜드 메시지 실패 시 SMS/LMS로 전환 여부


2. 전환 전송 유형

| 키 | 코드 | 내용 | 비고 |
| --- | --- | --- | --- |
| tran_type | S | SMS | 90Byte 메시지 |
| tran_type | L | LMS | 1,000자 |
| tran_type | N | 전환전송 하지 않음 |  |


# 6. tran_message

- 1. 브랜드 메시지 실패 메시지에 대하여 대체하여 전송하고자 하는 메시지
- 2. 브랜드 메시지 메시지와 같을시 동일 메시지 Insert
- 3. tran_type 이 S 또는 L (전환전송 사용) 이더라도 tran_message 가 공백이거나


27

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

null 값이면 전환전송 하지 않음 상태 (N) 로 받음

- 4. tran_type 이 L 인 경우 subject(제목)이 없으면 전환전송 하지 않음 상태 (N) 로
- 받음


- 5. ※ tran_type 이 "S" 로 tran_message 가 90Byte 초과시 해당 메시지의 90Byte에
- 해당하는 메시지만 전송됩니다.


# 7. add_etc1~4

- 1. 고객사가 임의로 전달하는 추가 정보
- 2. 발송 결과 콜백 시 함께 반환됨


8. message

message 필드 필수

- TEXT - 최대 1,300자 (줄바꿈: 최대 99개, URL 형식 입력 가능)
- IMAGE - 최대 400자 (줄바꿈: 최대 29개, URL 형식 입력 가능)
- WIDE - 최대 76자 (줄바꿈: 최대 1개)


message 필드 선택

PREMIUM_VIDEO - 최대 76자 (줄바꿈: 최대 1개)

message 필드 사용안함

- · WIDE_ITEM_LIST


- CAROUSEL_FEED


- COMMERCE


- CAROUSEL_COMMERCE


예제

"message": "브랜드 메시지 텍스트 : 자유형 - 한 건 발송"

9. additional_content

additional_content 필드 선택

COMMERCE - 최대 34자 (줄바꿈: 최대 1개)

28

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

예제

"additional_content": "브랜드 메시지 부가정보"

# 10. header

# header 필드 필수

· WIDE_ITEM_LIST - 최대 20자 (줄바꿈: 불가)

# header 필드 선택

· PREMIUM_VIDEO - 최대 20자 (줄바꿈: 불가)

예제

# "header": "와이드 리스트 header"

# 11. attachment

# 메시지에 첨부할 내용 (링크 버튼과 이미지)

| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| button | json[] | N | 버튼 목록 |
| image | json | - | 이미지 요소 |
| item | json | - | 와이드 리스트 요소 |
| coupon | json | N | 쿠폰 요소 |
| commerce | json | - | 커머스 요소 |
| video | json | - | 동영상 요소 |


예제

"attachment":{""image":("img_url":"/img_url}"),"button":[{"name":"버튼 1","type":"WL", "url_p
c":"http://bizmessage.kakao.com/","url_mobile":"http://bizmessage.kakao.com/")],"coupo
n":{"title":"1000 원할인쿠폰","description":"소박한할인쿠폰","url_mobile":"https://daum.ne
t", "url_pc":"https://kakao.com")}

29

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

# 12. Button

- TEXT, IMAGE - Coupon을 적용할 경우 최대 4개, 그 외 최대 5개


- WIDE, WIDE_ITEM_LIST - 최대 2개


- PREMIUM_VIDEO - 최대 1개


- COMMERCE - 최소 1개, 최대 2개


| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| name | text | Y | 버튼 목록 |
| type | text(2) | Y | 버튼 타입 |
| scheme_android | text(1000) | - | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
| scheme_ios | text(1000) | - | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |
| url_mobile | text(1000) | - | MOBILE 환경에서 클릭 시 이동할 URL |
| url_pc | text(1000) | N | PC 환경에서 클릭 시 이동할 URL |


# 예제

"button":[{"name":"버튼 1","type":"WL", "url_mobile":"https://daum.net"),("name":"버튼 2","
type":"AL" "url_mobile":"https://daum.net","scheme_android":/https://daum.net"}]
,

# 13. Image

# image 필드 필수

- · IMAGE


- · WIDE


- COMMERCE


| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| img_url | text | Y | 이미지 업로드 API 로 등록한 이미지 URL · 캐러셀 커머스는 전체 이미지 비율이 동일해야 함 |
| img_link | text(1000) | N | 이미지 클릭시 이동할 URL |


30

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

미설정시 카카오톡 내 이미지 뷰어 사용

예제

"image":/"img_url"/"(img_url)", "img_link":"http://bizmesage.kakao.com/"}

# 14. Item

item 필드 필수

- · WIDE_ITEM_LIST


- · 1번째 아이템은 title 필수 아님. 2~4번째 아이템은 title 필수 입력


| 키 |  | 타입 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| list |  | json[] | Y | 와이드 리스트 (최소:3, 최대: 4) |
|  | title | text |  | 아이템 제목 · 1 번째 아이템 - 최대 25 자 (줄바꿈: 최대 1 개) · 2~4 번째 아이템 - 최대 30 자 (줄바꿈: 최대 1 개) |
|  | img_url | text | Y | 아이템 이미지 URL |
|  | scheme_android | text(1000) | N | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
|  | scheme_ios | text(1000) | N | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |
|  | url_mobile | text(1000) | Y | MOBILE 환경에서 클릭 시 이동할 URL |
|  | url_pc | text(1000) | N | PC 환경에서 클릭 시 이동할 URL |


예제

"item":{"list":["title":"1 번아이템" "img_url":"yimg_urly","url_mobile":"http://bizmessage.kak
ao.com/"),("title":"2 번아이템", "img_url":"/img_url)","url_mobile":"http://bizmessage.kakao.
com/"),("title":"3 번아이템" "img_url")"yimg_urly","url_mobile":"http://bizmessage.kakao.co

31

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

m/"},{"title":"4 번아이템", "img_url":"(img_url)", "url_mobile":"http://bizmessage.kakao.com/
")

15. Coupon

# 메세지 최하단 노출

- · 채널 쿠폰 URL(포맷: alimtalk=coupon://) 사용시 scheme_android, scheme_ios
- 중 하나 필수 입력


- · 채널 쿠폰 URL이 아닌 기본 쿠폰 사용시 url_mobile 필수 입력


| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| title | text | Y | 쿠폰 제목 사용 가능한 쿠폰 제목 · $(숫자)원 할인 쿠폰 (숫자: 1 ~ 99,999,999) · ${숫자}% 할인 쿠폰 (숫자: 1 ~ 100) · 배송비 할인 쿠폰 · ${7 자 이내} 무료 쿠폰 · ${7 자 이내} UP 쿠폰 |
| description | text | Y | 쿠폰 설명 · WIDE, WIDE_ITEM_LIST, PREMIUM_VIDEO - 최대 18 자 (줄바꿈: 불가) · 그 외 - 최대 12 자 (줄바꿈: 불가) |
| url_mobile | text(1000) | Y | MOBILE 환경에서 클릭 시 이동할 URL |
| url_pc | text(1000) | N | PC 환경에서 클릭 시 이동할 URL |
| scheme_android | text(1000) | - | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
| scheme_ios | text(1000) | - | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |


예제

"coupon":("title":"10000 원할인쿠폰","description","신년맞이할인쿠폰","url_mobile":"https:
//daum.net","url_pc::"https://daum.net","scheme_android"//","scheme_ios",""")

32

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

# 16. Commerce

# commerce 필드 필수

· COMMERCE

| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| title | text | Y | 상품 제목 최대 30 자 (줄바꿈: 불가) · ${7 자 이내} 무료 쿠폰 · ${7 자 이내} UP 쿠폰 |
| regular_price | number | Y | 정상 가격 (0 ~ 99,999,999) |
| discount_price | number | N | 할인 후 가격 (0 ~ 99,999,999) |
| discount_rate | number | N | 할인율 (0 ~ 100) 할인 가격 존재시 할인율, 정액 할인 가격 중 하나는 필수 |
| discount_fixed | number | N | 정액 할인 가격 (0 ~ 999,999) 할인 가격 존재시 할인율, 정액 할인 가격 중 하나는 필수 |


# 예제

# "commerce":("title":"브랜드메시지커머스타이틀", "regular_price":10000,"discount_price":90
00,"discount_rate":10}

# 17. Video

# video 필드 필수

# · PREMIUM_VIDEO

| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| video_url | text(500) | Y | 카카오 TV 동영상 URL |
| thumbnail_ur I | text(500) |  | 이미지 업로드 API 로 등록한 동영상 썸네일용 이미지 URL (기본값: 동영상 기본 썸네일 이미지) thumbnail_url 필드 필수 · video_url이 비공개 동영상 |


33

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

예제

"video":{"video_url":"(video_url}", "thumbnail_url":"(thumbnail_url}"}

18. Carousel

# carousel 필드 필수

- CAROUSEL_FEED


- CAROUSEL_COMMERCE


| 키 |  | 타입 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| head |  | json | N | 캐러셀 인트로 CAROUSEL_COMMERCE 인 경우 사용 |
|  | header | text(20) | Y | 캐러셀 인트로 헤더 · 최대 20 자 (줄바꿈: 불가) |
|  | content | text(50) | Y | 캐러셀 인트로 내용 · 최대 20자 (줄바꿈: 불가) |
|  | image_url | text | Y | 이미지 업로드 API 로 등록한 캐러셀 인트로 이미지 URL |
|  | url_mobile | text(1000) |  | MOBILE 환경에서 클릭 시 이동할 URL url_mobile 이 필수 · url_mobile, url_pc, scheme_android, scheme_ios 중 하나라도 입력하는 경우 |
|  | url_pc | text(1000) | N | PC 환경에서 클릭 시 이동할 URL |
|  | scheme_android | text(1000) | N | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
|  | scheme_ios | text(1000) | N | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |
| list |  | json[] | Y | 캐러셀 리스트 · 캐러셀 인트로(head) 사용시 - 1~5 개 |


34

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

|  |  |  | · 그 외 - 2~6 개 |
| --- | --- | --- | --- |
|  | header text(20) |  | 캐러셀 리스트 헤더 · 최대 20 자 (줄바꿈: 불가) header 필드 필수 · CAROUSEL_FEED header 필드 사용불가 · CAROUSEL_COMMERCE |
|  | message text(180) |  | 캐러셀 리스트 메시지 · 최대 180 자 (줄바꿈: 최대 2 개) message 필드 필수 · CAROUSEL_FEED message 필드 사용불가 · CAROUSEL_COMMERCE |
|  | additional_content | N | 캐러셀 리스트 부가 정보 · 최대 34 자 (줄바꿈: 최대 1 개) additional_content 필드 사용불가 · CAROUSEL_FEED |
|  | attachment json[] | Y | 캐러셀 아이템 이미지, 버튼 정보 |
| tail | json | N | 더보기 버튼 |
|  | url_mobile text(1000) | Y | MOBILE 환경에서 클릭 시 이동할 URL |
|  | url_pc text(1000) | N | PC 환경에서 클릭 시 이동할 URL |
|  | scheme_android text(1000) | N | MOBILE Android 환경에서 클릭 시 실행할 application custom scheme |
|  | scheme_ios text(1 000) | N | MOBILE iOS 환경에서 클릭 시 실행할 application custom scheme |


예제

"carousel"/"head"//"header","인트로피드헤더',"content","인트로피드컨텐츠","image_url":"(i
mage_urly"),"list":/("attachment":/"image":"limg_url":"(image_uri)"),"button":("name":"버튼 1
, "type":"WL","url_mobile"."https://daum.net"),("name":"버튼 2","type","AL","url_mobile","htt
ps://daum.net","scheme_android":"https://daum.net"/],"coupon"/"title","999999 원할인쿠폰"
, "description"."쿠폰설명","url_mobile":"https://daum.net"),"commerce":("title":"1 번캐러셀

35

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

커머스피드타이틀", "regular_price":10000,"discount_price":9000,"discount_rate":10}},"additi
onal_content":"1 번캐러셀커머스피드부가정보")/"attachment":("image":("img_url":"(image_
urly","button":({"name":"버튼 1","type":"WL", "url_mobile":"https://daum.net"},{"name":"버튼
2","type":"AL","url_mobile":"https://daum.net","scheme_android":"https://daum.net"],"coup
on":{"title":"99999 원할인쿠폰","description":"쿠폰설명","url_mobile":"https://daum.net"),"c
ommerce":("title":"2 번캐러셀커머스피드타이틀", "regular_price":20000000}},"additional_co
ntent":"2 번캐러셜커머스피드부가정보"}],"tail":("url_pc":"https://daum.net","url_mobile":"ht
tps://daum.net"}}

# 19. Attachment:Carousel

| 키 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| button | json[] | - | 캐러셀 리스트 버튼 목록 · 최소 1 개, 최대 2 개 |
| image | json | Y | 캐러셀 이미지 |
| coupon | json | N | 캐러셀 리스트 쿠폰 캐러셀 리스트 최하단 노출 |
| commerce | json |  | 커머스 요소 commerce 필드 필수 · CAROUSEL_COMMERCE commerce 필드 사용불가 · CAROUSEL_FEED |


예제

"attachment":("image":("img_url":"(image_urly"),"button":[{"name":"버튼 1","type":"WL", "url_
mobile":"https://daum.net"),("name":"버튼 2","type","AL","url_mobile":"https://daum.net", "s
cheme_android"/"https://daum_ne:?]"coupon":/"title":"99999 원할인쿠폰","description":"쿠
폰설명","url_mobile":"https://daum.net")"commerce"/"tititle":"1 번캐러셀커머스피드타이틀"
, /regua_phos/100000.daourt_thom/pcn/decomment/00)//g

# 20. 버튼 타입:Button

브랜드 메시지 버튼 타입별 사용 가능한 버튼 파라미터와 필수 파라미터는 아래와 같습
니다.

36

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| type | 설명 | 사용 가능 파라미터 | 필수 파라미터 |
| --- | --- | --- | --- |
| AC | 버튼 클릭 시 카카오톡 채널 추가 강조형 버튼(노란색)으로 표기되며, 버튼이 여러개일 경우 지정된 위치에 사용해야함 · TEXT, IMAGE - 첫번째 버튼 (최상단) · 그 외 - 두번째 버튼 (우측) name 은 채널 추가로 고정 캐러셀형은 전체 캐러셀 통틀어 1 개만 사용가능 타겟팅 M,N 만 사용 가능 | name type | name type |
| WL | 지정한 웹 링크로 이동 | name type url_mobile url_pc | name type url_mobile |
| AL | 지정한 앱 스킴 또는 웹 링크로 이동 | name type scheme_android scheme_ios url_mobile url_pc | name type 다음 중 2 가지 이상 scheme_android scheme_ios url_mobile |
| BK | 해당 버튼 텍스트 발송 | name type | name type |
| MD | 해당 버튼 텍스트 + 메시지 본문 발송 | name type | name type |
| BC | 상담톡을 이용하는 카카오톡 채널만 이용 가능 | name type | name type |
| BT | 카카오 I 오픈빌더의 챗봇을 사용하는 카카오톡 채널만 이용 가능 | name type | name type |
| BF | 카카오 비즈니스폼을 실행 강조형 버튼(노란색)으로 표기되며 AC 버튼이 없으면 첫번째, AC 버튼이 | name type | name type |


37

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

|  | 있으면 두번째 버튼에 위치 name 은 다음 중 사용 가능 · 톡에서 예약하기 · 톡에서 설문하기 · 톡에서 응모하기 |  |
| --- | --- | --- |


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
| 1001 | NoJsonBody | Request Body가 Json형식이 아님 |
| 1002 | InvalidHubPartnerKey | 허브 파트너 키가 유효하지 않음 |
| 1003 | InvalidSenderKey | 발신 프로필 키가 유효하지 않음 |
| 1004 | NoValueJsonElement | Request Body(Json)에서 name을 찾을 수 없음 |
| 1006 | DeletedSender | 삭제된 발신프로필. (메시지 사업 |


38

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
|  |  | 담당자에게 문의) |
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
| 1024 | DeletingProfile | 삭제대기 상태의 |


39

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
|  |  | 카카오톡 채널 (카카오톡 채널 운영툴에서 확인) |
| 1025 | SpammedProfile | 채널 제재 상태로 인한 메시지 전송 실패 (카카오톡 채널 운영툴에서 확인) |
| 1030 | InvalidParameterException | 잘못된 파라메터 요청 |
| 2006 | FailedToMatchSerialNumberPrefixPattern | 시리얼넘버 형식 불일치 |
| 3000 | UnexpectedException | 예기치 않은 오류 발생 |
| 3005 | AckTimeoutException | 메시지를 발송했으나 수신확인 안됨 (성공불확실) - 서버에는 암호화 되어 보관되며 3 일 이내 수신 가능 |
| 3006 | FailedToSendMessageException | 내부 시스템 오류로 메시지 전송 실패 |
| 3008 | InvalidPhoneNumberException | 전화번호 오류 |
| 3010 | JsonParseException | Json 파싱 오류 |
| 3011 | MessageNotFoundException | 메시지가 존재하지 않음 |
| 3012 | SerialNumberDuplicatedException | 메시지 일련번호가 중복됨 - 메시지 일련번호는 CS 처리를 위해 |


40

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
|  |  | 고유한 값이 부여되어야 함. |
| 3013 | MessageEmptyException | 메시지가 비어 있음 |
| 3014 | MessageLengthOverLimitException | 메시지 길이 제한 오류 (템플릿별 제한 길이 또는 1000자 초과) |
| 3015 | TemplateNotFoundException | 템플릿을 찾을 수 없음 |
| 3016 | NoMatchedTemplateException | 메시지 내용이 템플릿과 일치하지 않음 |
| 3018 | NoSendAvailableException | 메시지를 전송할 수 없음 |
| 3019 | MessageNoUserException | 톡 유저가 아님 |
| 3020 | MessageUserBlockedAlimtalkException | 브랜드 메시지 수신 차단 |
| 3021 | MessageNotSupportedKakaotalkException | 카카오톡 최소 버전 미지원 |
| 3022 | NoSendAvailableTimeException | 메시지 발송 가능한 시간이 아님 (친구톡 / 마케팅 메시지는 08시부터 20시까지 발송 가능) |
| 3024 | MessagelnvalidImageException | 메시지에 포함된 이미지를 전송할 수 없음 |
| 3025 | ExceedMaxVariableLengthException | 변수 글자수 제한 초과 |


41

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
| 3026 | Button chat_extra(event) -InvalidExtra(EventName)Exception '([A-Za-z0-9_]{1,50})' | 상담/봇 전환 버튼 extra, event 글자수 제한 초과 |
| 3027 | NoMatchedTemplateButtonException | 메시지 버튼/바로연결이 템플릿과 일치하지 않음 |
| 3028 | NoMatchedTemplateTitleException | 메시지 강조 표기 타이틀이 템플릿과 일치하지 않음 |
| 3029 | ExceedMaxTitleLengthException | 메시지 강조 표기 타이틀 길이 제한 초과 (50자) |
| 3030 | NoMatchedTemplateWithMessageTypeException | 메시지 타입과 템플릿 강조유형이 일치하지 않음 |
| 3031 | NoMatchedTemplateHeaderException | 헤더가 템플릿과 일치하지 않음 |
| 3032 | ExceedMaxHeaderLengthException | 헤더 길이 제한 초과(16자) |
| 3033 | NoMatchedTemplateltemHighlightException | 아이템 하이라이트가 템플릿과 일치하지 않음 |
| 3034 | ExceedMaxItemHighlightTitleLengthException | 아이템 하이라이트 타이틀 길이 제한 초과(이미지 없는 경우 30자, 이미지 있는 경우 21자) |
| 3035 | ExceedMaxItemHighlightDescriptionLengthException | 아이템 하이라이트 디스크립션 길이 제한 초과(이미지 없는 경우 19자, 이미지 있는 경우 |


42

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
|  |  | 13자) |
| 3036 | NoMatchedTemplateltemListException | 아이템 리스트가 템플릿과 일치하지 않음 |
| 3037 | ExceedMaxItemDescriptionLengthException | 아이템 리스트의 아이템의 디스크립션 길이 제한 초과(23자) |
| 3038 | NoMatchedTemplateltemSummaryException | 아이템 요약정보가 템플릿과 일치하지 않음 |
| 3039 | ExceedMaxItemSummaryDescriptionLengthException | 아이템 요약정보의 디스크립션 길이 제한 초과(14자) |
| 3040 | InvalidltemSummaryDescriptionException | 아이템 요약정보의 디스크립션에 허용되지 않은 문자 포함(통화기호/코 드, 숫자, 콤마, 소수점, 공백을 제외한 문자 포함) |
| 3041 | MessagelnvalidWideltemListLengthException | 와이드 아이템 리스트 개수 최대 최소 개수 불일치 |
| 3051 | InvalidateCarouselltemMinException or InvalidateCarouselItemMaxException | 캐러셀 아이템 리스트 개수 최소, 최대 개수 불일치 |
| 3052 | CarouselMessageLengthOverLimitException | 캐러셀 아이템 메시지 길이 OVER |
| 3056 | WideltemListTitleLengthOverLimitException | 와이드 아이템 리스트 타이틀 길이 제한 오류 |


43

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
| 3058 | CarouselHeaderLengthOverLimitException | 캐러셀 헤더 길이 제한 오류 |
| 4000 | ResponseHistoryNotFoundException | 메시지 전송 결과를 찾을 수 없음 |
| 4001 | UnknownMessageStatusError | 알 수 없는 메시지 상태 |
| 9998 | 현재 서비스를 제공하고 있지 않습니다. | 시스템에 문제가 발생하여 담당자가 확인하고 있는 경우 |
| 9999 | 시스템에서 알 수 없는 문제가 발생하였습니다. 담당자가 확인 중입니다. | 시스템에 문제가 발생하여 담당자가 확인하고 있는 경우 |
| ER00 | JSONParsingException | MTS 메시지 : JSON 파싱 중 에러가 발생했습니다. |
| ER01 | InvalidAuthCodeException | MTS 메시지 : 인증코드 내용이 없거나 유효하지 않습니다. |
| ER02 | InvalidSenderKeyException | MTS 메시지 : 발신프로필키 내용이 없습니다. |
| ER03 | InvalidPhoneNumberAndAppUserldException | MTS 메시지 : 수신자번호와 앱유저아이디 내용이 없습니다. |
| ER04 | InvalidTemplateCodeException | MTS 메시지 : 템플릿코드 내용이 없습니다. |
| ER05 | InvalidMessageException | MTS 메시지 : |


44

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
|  |  | 메시지 내용이 없습니다. |
| ER06 | InvalidCallbackUrlException | MTS 메시지 : 콜백URL이 유효하지 않습니다. |
| ER07 | InvalidCallbackNumberException | MTS 메시지 : 발신번호(콜백NU MBER)이 유효하지 않습니다. |
| ER08 | InvalidDataException | MTS 메시지 : DATA 항목이 유효하지 않습니다. |
| ER09 | NotFoundimageException | MTS 메시지 : 첨부 이미지 파일을 찾을 수 없습니다. |
| ER10 | NotAllowedFileException | MTS 메시지 : 허용되지 않는 파일입니다. |
| ER13 | InvalidPriceException | MTS 메시지 : price 값이 유효하지 않습니다. |
| ER14 | InvalidCurrencyTypeException | MTS 메시지 : currency_type 값이 유효하지 않습니다. |
| ER15 | MessageSizeOverException | MTS 메시지 : 메시지 내용이 너무 길거나 너무 큽니다. |
| ER16 | TranMessageSizeOverException | MTS 메시지 : |


45

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | message | 설명 |
| --- | --- | --- |
|  |  | 전환전송 시 사용할 메시지 크기가 너무 큽니다. |
| ER17 | NotAllowedCallbackNumber | MTS 메시지 : 전환전송 사용 시, 사전 승인받은 발신번호가 아닙니다. |
| ER31 | InvalidmessageTypeException | MTS 메시지 : 잘못된 메시지 타입 입니다. |
| ER32 | HeaderSizeOverException | MTS 메시지 : header 내용이 너무 길거나 너무 큽니다. |
| ER33 | AttachmentSizeOverException | MTS 메시지 : attachment 내용이 너무 길거나 너무 큽니다. |
| ER34 | CarouselSizeOverException | MTS 메시지 : carousel 내용이 너무 길거나 너무 큽니다. |
| ER98 | NoMessageFoundException | MTS 메시지 : 조건에 일치하는 메시지가 없습니다. |
| ER99 | MessageRegistException | MTS 메시지 : 전송메시지 등록(DB)에 실패하였습니다. |


46

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

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
| 11 | 수신번호 정합성 오류 |


47

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | 설명 |
| --- | --- |
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
| 6072 | MMS 비가용 단말 |


48

카카오 브랜드 메시지 자유형 Restful Interface Guide v1.0

| 결과코드 | 설명 |
| --- | --- |
| 8011 | SKT 단말기 응답없음 |
| 8012 | SKT 이통사 오류 (이통사 문의 필요) |
| 8200 | MMSC 전송 시 알 수 없는 오류 |
| 8880 | MMS 이미지 발송 시 : 발송할 수 없는 이미지 파일 또는 요청된 이미지 url 이 34. MMS 이미지 업로드 방식을 통해 서버에 업로드 되어있지 않음 |
| 9999 ER00 | 패킷오류 MTS 메시지 : JSON 파싱 중 에러가 발생했습니다. |
| ER01 | MTS 메시지 : 인증코드 내용이 없거나 유효하지 않습니다. |
| ER03 | MTS 메시지 : 수신자번호 내용이 없습니다. |
| ER05 | MTS 메시지 : 메시지 내용이 없습니다. |
| ER07 | MTS 메시지 : 발신번호(콜백NUMBER)이 유효하지 않습니다. |
| ER08 | MTS 메시지 : DATA 항목이 유효하지 않습니다. |
| ER15 | MTS 메시지 : 메시지 내용이 너무 길거나 너무 큽니다. |
| ER17 | MTS 메시지 : 사전 승인받은 발신번호가 아닙니다. |
| ER98 | MTS 메시지 : 조건에 일치하는 메시지가 없습니다. |
| ER99 | MTS 메시지 : 전송메시지 등록(DB)에 실패하였습니다. |


49