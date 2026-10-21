import React from "react";

// 폼과 전체 목록의 공통 외곽입니다. children 위치에 각 화면의 실제 내용을 넣습니다.
// target은 실제 클릭한 요소, currentTarget은 배경이므로 둘이 같을 때만 창을 닫습니다.
export default function ScheduleModal({
  id,
  title,
  description,
  onClose,
  children,
  headerExtra,
  className = "",
}) {
  return (
    <div
      className="sm-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`sm-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="sm-modal-head">
          <div>
            <h2 id={id}>{title}</h2>
            <p>{description}</p>
            {headerExtra}
          </div>
          <button
            type="button"
            className="sm-close"
            aria-label="닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
