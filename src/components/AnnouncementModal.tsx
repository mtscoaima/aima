import React from "react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isImportant: boolean;
}

interface AnnouncementModalProps {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  announcement,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !announcement) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="announcement-modal-backdrop" onClick={handleBackdropClick}>
      <div className="announcement-modal-content">
        <div className="announcement-modal-header">
          <div className="announcement-modal-title-row">
            <h2 className="announcement-modal-title">
              {announcement.isImportant && (
                <span className="announcement-modal-important-badge">중요</span>
              )}
              {announcement.title}
            </h2>
            <button
              className="announcement-modal-close-button"
              onClick={onClose}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          <p className="announcement-modal-date">{announcement.createdAt}</p>
        </div>
        <div className="announcement-modal-body">
          <div className="announcement-modal-text">
            {announcement.content.split("\n").map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
        <div className="announcement-modal-footer">
          <button
            className="announcement-modal-confirm-button"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
