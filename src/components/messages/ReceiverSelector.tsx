'use client'

import React, { useState } from 'react';

const ReceiverSelector: React.FC = () => {
  const [receivers, setReceivers] = useState<string[]>([]);
  const [newReceiver, setNewReceiver] = useState('');

  const addReceiver = () => {
    if (newReceiver.trim() !== '') {
      setReceivers([...receivers, newReceiver.trim()]);
      setNewReceiver('');
    }
  };

  const removeReceiver = (index: number) => {
    const updatedReceivers = [...receivers];
    updatedReceivers.splice(index, 1);
    setReceivers(updatedReceivers);
  };

  const clearAllReceivers = () => {
    setReceivers([]);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm mt-5">
      <h2 className="text-lg font-bold text-gray-800 mb-4">수신자 정보</h2>

      <div className="flex gap-2.5 mb-4 md:flex-row flex-col">
        <input
          type="text"
          value={newReceiver}
          onChange={(e) => setNewReceiver(e.target.value)}
          placeholder="수신자 번호 입력"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          className="bg-blue-600 text-white border-none rounded-lg px-5 py-2.5 text-sm cursor-pointer transition-colors hover:bg-blue-700 hover:shadow-md md:self-auto self-start"
          onClick={addReceiver}
        >
          추가
        </button>
      </div>

      <div className="flex gap-2.5 mb-5 flex-wrap">
        <button className="flex items-center gap-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-pointer transition-colors hover:bg-gray-300">
          <span>📁</span>
          주소록
        </button>
        <button className="flex items-center gap-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-pointer transition-colors hover:bg-gray-300">
          <span>📊</span>
          엑셀
        </button>
        <button className="flex items-center gap-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-pointer transition-colors hover:bg-gray-300">
          <span>📝</span>
          메모장
        </button>
      </div>

      <div className="border border-gray-300 rounded-xl overflow-hidden mb-4">
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-300 font-bold text-gray-800">
          <span>수신자 목록</span>
          <span className="text-blue-600 text-sm">{receivers.length}명</span>
        </div>

        {receivers.length > 0 ? (
          <ul className="list-none m-0 p-0 max-h-64 overflow-y-auto">
            {receivers.map((receiver, index) => (
              <li key={index} className="flex justify-between items-center px-4 py-2.5 border-b border-gray-300 last:border-b-0">
                <span>{receiver}</span>
                <button
                  className="bg-transparent border-none text-gray-500 cursor-pointer text-sm px-2 py-1 rounded transition-colors hover:bg-gray-100 hover:text-red-500"
                  onClick={() => removeReceiver(index)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 px-4 text-center text-gray-500 text-sm">
            수신자가 없습니다. 수신자를 추가하세요.
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          className="bg-transparent border border-gray-300 rounded-lg px-4 py-2 text-red-500 cursor-pointer transition-colors hover:bg-red-50"
          onClick={clearAllReceivers}
        >
          모두 삭제
        </button>
        <button className="bg-transparent border border-gray-300 rounded-lg px-4 py-2 text-blue-600 cursor-pointer transition-colors hover:bg-blue-50">
          중복 확인
        </button>
      </div>
    </div>
  );
};

export default ReceiverSelector; 