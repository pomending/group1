import React from "react";
import ScheduleModal from "./ScheduleModal";
import {
  getRepeatLabel,
  MAX_REPEAT_INTERVAL,
  repeatTypes,
  scheduleTypes,
  scheduleStatuses,
} from "./scheduleData";

// 입력값·저장은 부모가 관리하고, 공통 모달은 배경 클릭·제목·닫기 버튼을 담당합니다.
// isOccurrence이면 반복 중 특정 날짜만 수정하므로 반복 종류를 고정합니다.
export default function ScheduleFormModal({
  form,
  onChange,
  onSubmit,
  onClose,
  isEditing,
  isOccurrence,
}) {
  return (
    <ScheduleModal
      id="sm-form-title"
      title={isEditing ? "일정 수정" : "새 일정 등록"}
      description={
        isEditing
          ? "일정 정보를 수정하고 저장하세요."
          : "프로젝트 작업 일정을 추가하세요."
      }
      onClose={onClose}
    >
      <form className="sm-form" onSubmit={onSubmit}>
        {/* 제어 입력(controlled input)의 흐름:
              1. value={form.title}이 현재 상태를 입력창에 표시합니다.
              2. 사용자가 입력하면 onChange가 부모의 updateForm을 실행합니다.
              3. updateForm이 name="title"을 보고 form.title을 바꿉니다.
              4. 새 form이 내려와 입력창에 최신 값이 보입니다.
              required/maxLength는 브라우저 입력 제약이며 서버 검증을 대신하지는 않습니다.
              label 안에 input을 넣으면 제목과 입력창이 연결되어 제목 클릭으로도 입력창을 선택합니다. */}
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
        {/* 참석자 입력 흐름:
              name=attendees → 공통 onChange → 부모의 form.attendees 문자열 갱신 → value로 새 입력 표시.
              입력 중에는 문자열 그대로 유지해 쉼표를 입력하는 과정에서 내용이 먼저 잘리지 않게 합니다.
              저장할 때 normalizeAttendees가 분리·공백 정리·중복 제거 후 이름 배열로 바꿉니다.
              required가 없으므로 빈 값도 제출할 수 있고, 저장하면 []가 됩니다. 담당자는 기존 필수 항목입니다.
              maxLength는 참석자 수가 아닌 입력 문자열 전체 길이의 제한입니다.
              aria-describedby는 아래 안내 문장의 id를 연결해 보조 기기도 선택 입력임을 읽게 합니다. */}
        <label className="sm-form-wide">
          참석자 (선택)
          <input
            // name은 부모 updateForm의 [event.target.name]으로 전달되어 바꿀 속성을 결정합니다.
            name="attendees"
            // 입력 → onChange → 부모 상태 갱신 → 새 value 전달 순서로 입력창과 상태를 맞춥니다.
            value={form.attendees}
            onChange={onChange}
            placeholder="여러 명은 쉼표로 구분해 입력하세요"
            // 인원 수가 아니라 쉼표·공백까지 포함한 입력 문자열 전체 길이를 제한합니다.
            maxLength={500}
            aria-describedby="sm-attendees-help"
          />
          <span id="sm-attendees-help" className="sm-form-note">
            비워도 저장됩니다. 참석자 일정은 담당자별 주간 표에도 표시됩니다.
          </span>
        </label>
        {/* 날짜 입력의 value는 YYYY-MM-DD, 시간은 HH:mm 형식입니다.
              반복 일정에서는 이 날짜가 기준일이고 시간은 각 발생 항목에 그대로 복사됩니다. */}
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
        {/* 공통 scheduleTypes를 map으로 option에 바꿉니다. 기타를 추가할 때도 공통 배열만 수정합니다. */}
        <label>
          작업 구분
          <select name="type" value={form.type} onChange={onChange}>
            {scheduleTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        {/* name=status도 공통 onChange를 거쳐 form.status에 저장됩니다. 새 일정은 진행 전입니다. */}
        <label>
          업무 진행 상태
          <select name="status" value={form.status} onChange={onChange}>
            {scheduleStatuses.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          일정 공개 범위
          <select name="visibility" value={form.visibility} onChange={onChange}>
            <option value="shared">회사 공유 일정</option>
            <option value="private">개인 일정</option>
          </select>
        </label>
        <label>
          반복 설정
          <select
            name="repeatType"
            value={form.repeatType}
            onChange={onChange}
            disabled={isOccurrence}
          >
            {repeatTypes.map(({ value, label }) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {/* 반복 단위와 간격만 조합합니다. 2주=격주, 12개월=매년, 24개월=2년마다입니다.
            min/max/step/required가 1~120의 정수만 제출되도록 브라우저에서 검사합니다. */}
        {form.repeatType !== "none" && (
          <label className="sm-form-wide">
            반복 간격 ({form.repeatType === "weekly" ? "주" : "개월"})
            <input
              type="number"
              name="repeatInterval"
              value={form.repeatInterval}
              onChange={onChange}
              min={1}
              max={MAX_REPEAT_INTERVAL}
              step={1}
              required
              disabled={isOccurrence}
              aria-describedby="sm-repeat-help"
            />
            <span id="sm-repeat-help" className="sm-form-note">
              {form.repeatType === "weekly"
                ? "시작 날짜부터 입력한 주마다 반복합니다. 2주 = 격주"
                : "시작 날짜부터 입력한 개월마다 반복합니다. 12개월 = 매년, 24개월 = 2년마다"}
            </span>
          </label>
        )}
        {/* 공통 함수가 현재 날짜·시간·반복 간격을 읽으므로 입력을 바꾸면 안내 문장도 즉시 바뀝니다. */}
        {form.repeatType !== "none" && (
          <p className="sm-form-note sm-form-wide">
            {getRepeatLabel(form)}에 종료일 없이 반복됩니다.
            {form.repeatType === "monthly" &&
              " 해당 날짜가 없는 달은 그달 마지막 날에 표시합니다."}
            {isEditing && " 저장하면 전체 반복 일정에 적용됩니다."}
          </p>
        )}
        {isOccurrence && (
          <p className="sm-form-note sm-form-wide">
            선택한 날짜의 일정만 수정합니다. 다른 반복 일정은 유지됩니다.
          </p>
        )}
        {/* textarea도 name/value/onChange가 input과 같은 원리로 동작합니다.
              rows는 초기 높이의 기준, maxLength는 입력 제한, length는 현재 JS 문자열 길이입니다.
              입력한 줄바꿈은 문자열에 남고 Sidebar의 white-space: pre-wrap이 표시할 때 유지합니다. */}
        <label className="sm-form-wide">
          상세 내용
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={5}
            maxLength={3000}
            placeholder="작업 내용, 준비 사항, 전달할 메모 등을 입력하세요."
          />
          <span className="sm-form-note">
            {form.description.length} / 3,000자
          </span>
        </label>
        {/* 취소는 type=button이라 제출하지 않습니다. 저장은 submit이라 form의 onSubmit을 실행합니다.
              부모가 preventDefault로 기본 페이지 이동을 막고 state에 내용을 반영합니다. */}
        <div className="sm-form-actions">
          <button type="button" className="sm-cancel" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="sm-btn">
            {isEditing ? "수정 저장" : "일정 저장"}
          </button>
        </div>
      </form>
    </ScheduleModal>
  );
}
