import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import styles from './VariableSelectModal.module.css';

interface VariableSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (variable: string) => void;
}

interface Variable {
  name: string;
  placeholder: string;
  description: string;
}

interface VariableCategory {
  title: string;
  icon: string;
  variables: Variable[];
}

const VARIABLE_CATEGORIES: VariableCategory[] = [
  {
    title: '수신자 정보',
    icon: '📋',
    variables: [
      { name: '이름', placeholder: '#{이름}', description: '수신자 이름' },
      { name: '전화번호', placeholder: '#{전화번호}', description: '수신자 전화번호' },
      { name: '그룹명', placeholder: '#{그룹명}', description: '수신자가 속한 그룹명' },
    ]
  },
  {
    title: '날짜/시간',
    icon: '📅',
    variables: [
      { name: '오늘날짜', placeholder: '#{오늘날짜}', description: 'YYYY-MM-DD 형식' },
      { name: '현재시간', placeholder: '#{현재시간}', description: 'HH:MM 형식' },
      { name: '요일', placeholder: '#{요일}', description: '월/화/수/목/금/토/일' },
    ]
  },
  {
    title: '발신자 정보',
    icon: '🏢',
    variables: [
      { name: '발신번호', placeholder: '#{발신번호}', description: '사용자 전화번호 (회신용)' },
      { name: '회사명', placeholder: '#{회사명}', description: '사용자 회사명' },
      { name: '담당자명', placeholder: '#{담당자명}', description: '사용자 이름' },
    ]
  }
];

export default function VariableSelectModal({ isOpen, onClose, onSelect }: VariableSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleSelect = (placeholder: string) => {
    onSelect(placeholder);
    onClose();
    setSearchQuery('');
  };

  const filteredCategories = VARIABLE_CATEGORIES.map(category => ({
    ...category,
    variables: category.variables.filter(variable =>
      variable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variable.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.variables.length > 0);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3>변수 선택</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="변수 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Variable Categories */}
        <div className={styles.categoriesContainer}>
          {filteredCategories.length === 0 ? (
            <div className={styles.emptyState}>
              검색 결과가 없습니다.
            </div>
          ) : (
            filteredCategories.map((category, idx) => (
              <div key={idx} className={styles.category}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <span className={styles.categoryTitle}>{category.title}</span>
                </div>
                <div className={styles.variableList}>
                  {category.variables.map((variable, vIdx) => (
                    <div key={vIdx} className={styles.variableItem}>
                      <div className={styles.variableInfo}>
                        <div className={styles.variableName}>{variable.placeholder}</div>
                        <div className={styles.variableDescription}>{variable.description}</div>
                      </div>
                      <button
                        onClick={() => handleSelect(variable.placeholder)}
                        className={styles.selectButton}
                      >
                        선택
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
