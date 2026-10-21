import React from "react";
import { scheduleTypes } from "./scheduleData";

// 일정 등록과 수정을 위한 공통 폼입니다. 값과 저장 처리는 부모 컴포넌트가 관리합니다.
export default function ScheduleFormModal({
  form,
  onChange,
  onSubmit,
  onClose,
  isEditing,
}) {
  return (
    <div
      className="sm-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="sm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sm-form-title"
      >
        <div className="sm-modal-head">
          <div>
            <h2 id="sm-form-title">
              {isEditing ? "일정 수정" : "새 일정 등록"}
            </h2>
            <p>
              {isEditing
                ? "일정 정보를 수정하고 저장하세요."
                : "프로젝트 작업 일정을 추가하세요."}
            </p>
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

        <form className="sm-form" onSubmit={onSubmit}>
          {/* value는 현재 입력값, onChange는 입력 후 부모 state를 갱신합니다. */}
          {/* required는 필수 항목을 비운 채 저장하는 것을 브라우저가 막게 합니다. */}
          <label className="sm-form-wide">
            일정 이름
            <input
              autoFocus
              name="title"
              value={form.title}
              onChange={onChange}
              required
              maxLength={80}
            />
          </label>
          <label>
            프로젝트
            <input
              name="project"
              value={form.project}
              onChange={onChange}
              placeholder="프로젝트명"
              required
              maxLength={60}
            />
          </label>
          <label>
            담당자
            <input
              name="person"
              value={form.person}
              onChange={onChange}
              placeholder="담당자 이름"
              required
              maxLength={30}
            />
          </label>
          <label>
            날짜
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={onChange}
              required
            />
          </label>
          <label>
            시간
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={onChange}
              required
            />
          </label>
          <label className="sm-form-wide">
            작업 구분
            <select name="type" value={form.type} onChange={onChange}>
              {scheduleTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <div className="sm-form-actions">
            <button type="button" className="sm-cancel" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="sm-btn">
              {isEditing ? "수정 저장" : "일정 저장"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
