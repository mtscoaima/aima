import React from "react";
import Image from "next/image";
import { Template } from "@/types/targetMarketing";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: () => void;
  isLoading: boolean;
  templateList: Template[];
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  isLoading,
  templateList,
  selectedTemplateId,
  setSelectedTemplateId,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setSelectedTemplateId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">템플릿 불러오기</h2>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <span className="text-gray-600">템플릿 목록을 불러오는 중...</span>
            </div>
          ) : (
            <div>
              <table className="w-full border-collapse">
                <thead className="border-b border-gray-200 bg-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '60px' }}></th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '100px' }}>이미지</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '250px' }}>템플릿 이름</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '150px' }}>템플릿 코드</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '120px' }}>생성일</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '120px' }}>수정일</th>
                  </tr>
                </thead>
              </table>
              <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-gray-200">
                    {templateList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          템플릿이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      templateList.map((template) => (
                        <tr key={template.id}>
                          <td className="py-3 px-4" style={{ width: '60px' }}>
                            <input
                              type="checkbox"
                              name="template"
                              value={template.id}
                              checked={selectedTemplateId === template.id || selectedTemplateId?.toString() === template.id?.toString()}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTemplateId(e.target.value);
                                } else {
                                  setSelectedTemplateId(null);
                                }
                              }}
                            />
                          </td>
                          <td className="py-3 px-4" style={{ width: '100px' }}>
                            {template.image_url ? (
                              <Image 
                                src={template.image_url} 
                                alt="템플릿 이미지" 
                                width={50}
                                height={50}
                                style={{ objectFit: 'cover', borderRadius: '4px' }}
                              />
                            ) : (
                              <div style={{ width: '50px', height: '50px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>
                                이미지 없음
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 truncate" style={{ width: '250px' }}>{template.name || '이름 없음'}</td>
                          <td className="py-3 px-4 truncate" style={{ width: '150px' }}>{template.template_code || '-'}</td>
                          <td className="py-3 px-4 whitespace-nowrap" style={{ width: '120px' }}>
                            {template.created_at ? 
                              new Date(template.created_at).toLocaleDateString('ko-KR') 
                              : '-'
                            }
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap" style={{ width: '120px' }}>
                            {template.updated_at ? 
                              new Date(template.updated_at).toLocaleDateString('ko-KR') 
                              : '-'
                            }
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            className="px-6 py-2 bg-blue-600 text-white border-none rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={onLoadTemplate}
            disabled={!selectedTemplateId || isLoading}
          >
            불러오기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;