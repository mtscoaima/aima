"use client";

import React, { useState } from "react";

const MessageSendForm: React.FC = () => {
  const [senderNumber, setSenderNumber] = useState<string>("");
  const [messageContent, setMessageContent] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [receiverNumbers, setReceiverNumbers] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 메시지 전송 로직
    // TODO: 실제 메시지 전송 API 호출
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-800 mb-3">메시지 발신번호</h2>
        <div className="flex gap-2.5 mb-4 md:flex-row flex-col">
          <input
            type="text"
            placeholder="수신자명"
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="bg-blue-600 text-white border-none rounded-lg px-5 py-2.5 text-sm cursor-pointer transition-colors hover:bg-blue-700 hover:shadow-md md:self-auto self-start">
            찾기
          </button>
        </div>

        <div className="flex justify-between items-center mt-4 pb-2.5 border-b border-gray-300">
          <h3 className="text-base text-gray-600">
            자주 사용하는 수신번호 <span className="text-gray-500 text-sm">(총 0개)</span>
          </h3>
          <button className="bg-transparent border-none text-blue-600 cursor-pointer text-sm hover:text-blue-800">
            비우기
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
          <button className="px-4 py-2.5 border-none bg-blue-600 text-white rounded-lg cursor-pointer whitespace-nowrap transition-colors">
            문자메시지
          </button>
          <button className="px-4 py-2.5 border-none bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed whitespace-nowrap opacity-70" disabled>
            알림톡
          </button>
          <button className="px-4 py-2.5 border-none bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed whitespace-nowrap opacity-70" disabled>
            친구톡
          </button>
          <button className="px-4 py-2.5 border-none bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed whitespace-nowrap opacity-70" disabled>
            네이버톡톡
          </button>
        </div>

        <div className="border border-gray-300 rounded-xl overflow-hidden mb-4">
          <textarea
            placeholder="이곳에 문자 내용을 입력합니다&#10;지원문구 에서 #[이름]# #[회사명]등 변수값을 입력하시면 됩니다."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            className="w-full h-50 p-4 border-none resize-none text-base font-sans focus:outline-none"
          />
          <div className="text-right px-4 py-2 text-gray-500 bg-gray-50 text-sm">
            0 / 2,000 Bytes
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-5">
          <button className="flex items-center gap-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-pointer transition-colors hover:bg-gray-300">
            <span>📎</span>
            첨부파일
          </button>
          <button className="flex items-center gap-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-pointer transition-colors hover:bg-gray-300">
            <span>🖼️</span>
            차단내용
          </button>
          <button className="flex items-center gap-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-pointer transition-colors hover:bg-gray-300">
            <span>📑</span>
            문구 치환
          </button>
          <div className="flex items-center ml-auto text-gray-500 text-sm">
            <span>📄 내용에 변수가 없습니다.</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" className="w-4 h-4" /> 광고메시지 여부
          </label>
          <div className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center ml-2 text-xs cursor-pointer">
            ?
          </div>
        </div>
        <div className="flex items-center">
          <button
            className="bg-blue-600 text-white border-none rounded-lg px-6 py-3 text-base font-bold cursor-pointer transition-colors ml-auto hover:bg-blue-700 hover:shadow-md"
            onClick={handleSubmit}
          >
            전송/예약 준비
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageSendForm;
