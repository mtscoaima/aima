"use client";

import React, { useState } from 'react';

export default function RegisterCampaign() {
  const [campaignName, setCampaignName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [gender, setGender] = useState('전체');
  const [ageRange, setAgeRange] = useState('전체');
  const [locationAll, setLocationAll] = useState(true);
  const [locationSpecific, setLocationSpecific] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [storeType, setStoreType] = useState('');
  const [storeLocationAll, setStoreLocationAll] = useState(true);
  const [storeLocationSpecific, setStoreLocationSpecific] = useState(false);
  const [minApprovalAmount, setMinApprovalAmount] = useState('10,000원');
  const [maxApprovalAmount, setMaxApprovalAmount] = useState('50,000원');
  const [approvalTimeStart, setApprovalTimeStart] = useState('19:00');
  const [approvalTimeEnd, setApprovalTimeEnd] = useState('20:00');
  const [minCumulativeAmount, setMinCumulativeAmount] = useState('10,000원');
  const [maxCumulativeAmount, setMaxCumulativeAmount] = useState('50,000원');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timeRange, setTimeRange] = useState('전체');
  const [dailyLimit, setDailyLimit] = useState('90건');
  const [campaignLimit, setCampaignLimit] = useState('100건');
  const [sendingTimeStart, setSendingTimeStart] = useState('08');
  const [sendingTimeStartMinute, setSendingTimeStartMinute] = useState('30');
  const [sendingTimeEnd, setSendingTimeEnd] = useState('20');
  const [sendingTimeEndMinute, setSendingTimeEndMinute] = useState('30');
  const [sendingDays, setSendingDays] = useState(['전체']);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">캠페인 만들기</h1>
      
      {/* 캠페인 정보 */}
      <div className="border-b pb-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">캠페인 정보</h2>
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label htmlFor="campaignName" className="font-medium">캠페인명</label>
          <input 
            type="text" 
            id="campaignName" 
            className="border rounded p-2 w-full max-w-md" 
            placeholder="캠페인 이름을 입력하세요."
            maxLength={50}
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">유효기간</label>
          <div className="flex items-center">
            <input 
              type="text" 
              className="border rounded p-2 w-32" 
              placeholder="DD/MM/YY"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="mx-2">~</span>
            <input 
              type="text" 
              className="border rounded p-2 w-32" 
              placeholder="DD/MM/YY"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center">
          <label className="font-medium">사용여부</label>
          <div className="w-16 h-8 bg-gray-300 rounded-full p-1 cursor-pointer relative" onClick={() => setIsActive(!isActive)}>
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isActive ? 'translate-x-8' : 'translate-x-0'}`}></div>
            <span className={`absolute left-3 top-1.5 text-white text-xs ${isActive ? 'opacity-0' : 'opacity-100'}`}>OFF</span>
            <span className={`absolute right-3 top-1.5 text-white text-xs ${isActive ? 'opacity-100' : 'opacity-0'}`}>ON</span>
          </div>
        </div>
      </div>
      
      {/* 고객 */}
      <div className="border-b pb-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">고객</h2>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">성별</label>
          <div className="flex space-x-2">
            <button 
              className={`px-6 py-2 border rounded ${gender === '전체' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setGender('전체')}
            >
              전체
            </button>
            <button 
              className={`px-6 py-2 border rounded ${gender === '남성' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setGender('남성')}
            >
              남성
            </button>
            <button 
              className={`px-6 py-2 border rounded ${gender === '여성' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setGender('여성')}
            >
              여성
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">나이</label>
          <div className="flex flex-wrap gap-2">
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '전체' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('전체')}
            >
              전체
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '15-19' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('15-19')}
            >
              15-19
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '20-24' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('20-24')}
            >
              20-24
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '25-29' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('25-29')}
            >
              25-29
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '30-39' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('30-39')}
            >
              30-39
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '40-44' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('40-44')}
            >
              40-44
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '45-49' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('45-49')}
            >
              45-49
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '50-54' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('50-54')}
            >
              50-54
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '55-59' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('55-59')}
            >
              55-59
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '60-64' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('60-64')}
            >
              60-64
            </button>
            <button 
              className={`px-4 py-2 border rounded ${ageRange === '65이상' ? 'bg-blue-100 border-blue-300' : 'bg-white'}`}
              onClick={() => setAgeRange('65이상')}
            >
              65이상
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">주소지</label>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="locationAll" 
                checked={locationAll} 
                onChange={() => {
                  setLocationAll(true);
                  setLocationSpecific(false);
                }}
              />
              <label htmlFor="locationAll">전체</label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="locationSpecific" 
                checked={locationSpecific} 
                onChange={() => {
                  setLocationAll(false);
                  setLocationSpecific(true);
                }}
              />
              <label htmlFor="locationSpecific">지역선택</label>
            </div>
            <select className="border rounded p-2 w-32" disabled={!locationSpecific}>
              <option>시/도</option>
            </select>
            <select className="border rounded p-2 w-32" disabled={!locationSpecific}>
              <option>시/군/구</option>
            </select>
          </div>
        </div>
      </div>

      {/* 가맹점 */}
      <div className="border-b pb-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">가맹점</h2>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">가맹점 업종</label>
          <div className="flex items-center gap-2">
            <select className="border rounded p-2 w-64">
              <option>숙박 및 음식점</option>
            </select>
            <select className="border rounded p-2 w-64">
              <option>한식음식점</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">주소지</label>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="storeLocationAll" 
                checked={storeLocationAll} 
                onChange={() => {
                  setStoreLocationAll(true);
                  setStoreLocationSpecific(false);
                }}
              />
              <label htmlFor="storeLocationAll">전체</label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="storeLocationSpecific" 
                checked={storeLocationSpecific} 
                onChange={() => {
                  setStoreLocationAll(false);
                  setStoreLocationSpecific(true);
                }}
              />
              <label htmlFor="storeLocationSpecific">지역선택</label>
            </div>
            <select className="border rounded p-2 w-32" disabled={!storeLocationSpecific}>
              <option>시/도</option>
            </select>
            <select className="border rounded p-2 w-32" disabled={!storeLocationSpecific}>
              <option>시/군/구</option>
            </select>
          </div>
        </div>
      </div>

      {/* 사용형태 */}
      <div className="border-b pb-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">사용형태</h2>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">승인금액</label>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              className="border rounded p-2 w-32" 
              value={minApprovalAmount}
              onChange={(e) => setMinApprovalAmount(e.target.value)}
            />
            <span>~</span>
            <input 
              type="text" 
              className="border rounded p-2 w-32" 
              value={maxApprovalAmount}
              onChange={(e) => setMaxApprovalAmount(e.target.value)}
            />
            <div className="flex ml-6 gap-4">
              <div className="flex items-center gap-2">
                <input type="radio" id="amount1" name="amountRange" />
                <label htmlFor="amount1">1만 미만</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="amount2" name="amountRange" />
                <label htmlFor="amount2">5만 미만</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="amount3" name="amountRange" />
                <label htmlFor="amount3">10만 미만</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="amount4" name="amountRange" />
                <label htmlFor="amount4">전체</label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">승인시간</label>
          <div className="flex items-center gap-2">
            <select 
              className="border rounded p-2 w-32" 
              value={approvalTimeStart}
              onChange={(e) => setApprovalTimeStart(e.target.value)}
            >
              <option value="19:00">19:00</option>
              <option value="20:00">20:00</option>
              <option value="21:00">21:00</option>
            </select>
            <span>~</span>
            <select 
              className="border rounded p-2 w-32" 
              value={approvalTimeEnd}
              onChange={(e) => setApprovalTimeEnd(e.target.value)}
            >
              <option value="20:00">20:00</option>
              <option value="21:00">21:00</option>
              <option value="22:00">22:00</option>
            </select>
            <div className="flex ml-6 gap-4">
              <div className="flex items-center gap-2">
                <input type="radio" id="time1" name="timeRange" />
                <label htmlFor="time1">오전</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="time2" name="timeRange" />
                <label htmlFor="time2">오후</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="time3" name="timeRange" />
                <label htmlFor="time3">저녁</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="time4" name="timeRange" />
                <label htmlFor="time4">전체</label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">누적금액</label>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              className="border rounded p-2 w-32" 
              value={minCumulativeAmount}
              onChange={(e) => setMinCumulativeAmount(e.target.value)}
            />
            <span>~</span>
            <input 
              type="text" 
              className="border rounded p-2 w-32" 
              value={maxCumulativeAmount}
              onChange={(e) => setMaxCumulativeAmount(e.target.value)}
            />
            <div className="flex ml-6 gap-4">
              <div className="flex items-center gap-2">
                <input type="radio" id="cumulative1" name="cumulativeRange" />
                <label htmlFor="cumulative1">10만 미만</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="cumulative2" name="cumulativeRange" />
                <label htmlFor="cumulative2">50만 미만</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="cumulative3" name="cumulativeRange" />
                <label htmlFor="cumulative3">100만 미만</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="cumulative4" name="cumulativeRange" />
                <label htmlFor="cumulative4">전체</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 발송정책 */}
      <div className="border-b pb-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">발송정책</h2>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">일 최대건수</label>
          <input 
            type="text" 
            className="border rounded p-2 w-32" 
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">캠페인 최대건수</label>
          <input 
            type="text" 
            className="border rounded p-2 w-32" 
            value={campaignLimit}
            onChange={(e) => setCampaignLimit(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">발송 가능 시간</label>
          <div className="flex items-center gap-2">
            <select 
              className="border rounded p-2 w-16" 
              value={sendingTimeStart}
              onChange={(e) => setSendingTimeStart(e.target.value)}
            >
              <option value="08">08</option>
              <option value="09">09</option>
              <option value="10">10</option>
            </select>
            <select 
              className="border rounded p-2 w-16" 
              value={sendingTimeStartMinute}
              onChange={(e) => setSendingTimeStartMinute(e.target.value)}
            >
              <option value="00">00</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="45">45</option>
            </select>
            <span>~</span>
            <select 
              className="border rounded p-2 w-16" 
              value={sendingTimeEnd}
              onChange={(e) => setSendingTimeEnd(e.target.value)}
            >
              <option value="18">18</option>
              <option value="19">19</option>
              <option value="20">20</option>
              <option value="21">21</option>
            </select>
            <select 
              className="border rounded p-2 w-16" 
              value={sendingTimeEndMinute}
              onChange={(e) => setSendingTimeEndMinute(e.target.value)}
            >
              <option value="00">00</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="45">45</option>
            </select>
            <div className="flex ml-6 gap-4">
              <div className="flex items-center gap-2">
                <input type="radio" id="sendTime1" name="sendTimeRange" />
                <label htmlFor="sendTime1">오전</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="sendTime2" name="sendTimeRange" />
                <label htmlFor="sendTime2">오후</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="sendTime3" name="sendTimeRange" />
                <label htmlFor="sendTime3">저녁</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="sendTime4" name="sendTimeRange" />
                <label htmlFor="sendTime4">전체</label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
          <label className="font-medium">발송 요일</label>
          <div className="flex gap-2">
            <button 
              className={`w-10 h-10 rounded-full border ${sendingDays.includes('전체') ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => setSendingDays(['전체'])}
            >
              전체
            </button>
            <button 
              className={`w-10 h-10 rounded-full border ${sendingDays.includes('월') ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => {
                if (sendingDays.includes('전체')) {
                  setSendingDays(['월']);
                } else {
                  const newDays = sendingDays.includes('월') 
                    ? sendingDays.filter(d => d !== '월') 
                    : [...sendingDays, '월'];
                  setSendingDays(newDays);
                }
              }}
            >
              월
            </button>
            <button 
              className={`w-10 h-10 rounded-full border ${sendingDays.includes('화') ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => {
                if (sendingDays.includes('전체')) {
                  setSendingDays(['화']);
                } else {
                  const newDays = sendingDays.includes('화') 
                    ? sendingDays.filter(d => d !== '화') 
                    : [...sendingDays, '화'];
                  setSendingDays(newDays);
                }
              }}
            >
              화
            </button>
            <button 
              className={`w-10 h-10 rounded-full border ${sendingDays.includes('수') ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => {
                if (sendingDays.includes('전체')) {
                  setSendingDays(['수']);
                } else {
                  const newDays = sendingDays.includes('수') 
                    ? sendingDays.filter(d => d !== '수') 
                    : [...sendingDays, '수'];
                  setSendingDays(newDays);
                }
              }}
            >
              수
            </button>
            <button 
              className={`w-10 h-10 rounded-full border ${sendingDays.includes('목') ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => {
                if (sendingDays.includes('전체')) {
                  setSendingDays(['목']);
                } else {
                  const newDays = sendingDays.includes('목') 
                    ? sendingDays.filter(d => d !== '목') 
                    : [...sendingDays, '목'];
                  setSendingDays(newDays);
                }
              }}
            >
              목
            </button>
            <button 
              className={`w-10 h-10 rounded-full border ${sendingDays.includes('금') ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => {
                if (sendingDays.includes('전체')) {
                  setSendingDays(['금']);
                } else {
                  const newDays = sendingDays.includes('금') 
                    ? sendingDays.filter(d => d !== '금') 
                    : [...sendingDays, '금'];
                  setSendingDays(newDays);
                }
              }}
            >
              금
            </button>
            <button 
              className={`w-10 h-10 rounded-full border ${sendingDays.includes('토') ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => {
                if (sendingDays.includes('전체')) {
                  setSendingDays(['토']);
                } else {
                  const newDays = sendingDays.includes('토') 
                    ? sendingDays.filter(d => d !== '토') 
                    : [...sendingDays, '토'];
                  setSendingDays(newDays);
                }
              }}
            >
              토
            </button>
            <button 
              className={`w-10 h-10 rounded-full border ${sendingDays.includes('일') ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => {
                if (sendingDays.includes('전체')) {
                  setSendingDays(['일']);
                } else {
                  const newDays = sendingDays.includes('일') 
                    ? sendingDays.filter(d => d !== '일') 
                    : [...sendingDays, '일'];
                  setSendingDays(newDays);
                }
              }}
            >
              일
            </button>
          </div>
        </div>
      </div>

      {/* 템플릿 선택하기 버튼 */}
      <div className="flex justify-center mt-8 mb-8">
        <button 
          className="bg-blue-500 text-white px-8 py-3 rounded font-medium text-lg hover:bg-blue-600 transition"
          onClick={() => {
            // 템플릿 선택 로직
          }}
        >
          템플릿 선택하기
        </button>
      </div>

      {/* 하단 버튼 */}
      <div className="border-t pt-6 mt-4 flex justify-end">
        <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded mr-2">취소</button>
        <button className="bg-blue-500 text-white px-6 py-2 rounded">저장</button>
      </div>
    </div>
  );
} 