/* [파일 안내] 일정 입력·전체 목록·공통 모달
 * 읽는 순서: ScheduleFormModal → 날짜·시간/추가 설정 부품 → ScheduleListModal → ScheduleModal
 * 입력 흐름: input의 name/value → onChange → Manager.updateForm → 새 form 전달
 * 제출 흐름: onSubmit → Manager.addSchedule에서 검증·저장
 * 목록 항목 선택: onEdit(item) → Manager가 수정 폼을 열어 저장값을 표시합니다.
 */

/* 폼·목록은 공통 ScheduleModal을 사용합니다. 날짜·시간과 추가 설정은 이 파일의 전용 부품으로 분리합니다. */
import React, { useLayoutEffect, useRef, useState } from "react";
import { ScheduleFavorite, ScheduleAttendees, ScheduleVisibility, ScheduleStatus } from "./ScheduleItemParts";
import {
  compareSchedules,
  getScheduleTime,
  getNextScheduleDate,
  getTodayKey,
  getRepeatLabel,
  getRepeatEndLabel,
  getRepeatSummary,
  getScheduleDurationFields,
  getScheduleFormError,
  getScheduleCategories,
  scheduleScopes,
  scheduleStatuses,
  normalizeAttendees,
  normalizeStatus,
} from "./scheduleData";

/* 입력값은 부모의 form state를 표시하며, 변경·저장은 부모 콜백으로 전달합니다. */
// 입력값·저장은 부모가 관리하고, 공통 모달은 배경 클릭·제목·닫기 버튼을 담당합니다.
// isOccurrence이면 반복 중 특정 날짜만 수정하므로 반복 선택창을 숨기고 해당 날짜의 정보만 바꿉니다.
export default function ScheduleFormModal({
  form,
  teamMembers,
  projectSuggestions = [],
  onToggleAttendee,
  error,
  onChange,
  onSubmit,
  onClose,
  onDelete,
  onCopy,
  isEditing,
  isOccurrence,
  isRestoredDraft = false,
}) {
  const initialFormRef = useRef(JSON.stringify(form));
  const formRef = useRef(null);
  const [nativeError, setNativeError] = useState(null);
  const validation = error ? getScheduleFormError(form) : null;
  const fieldError = validation?.message === error ? validation : nativeError;
  useLayoutEffect(() => { setNativeError(null); }, [form]);
  useLayoutEffect(() => {
    const name = fieldError?.field === "repeatInterval" ? "repeatPreset" : fieldError?.field;
    const details = name && formRef.current?.elements.namedItem(name)?.closest("details");
    if (details) details.open = true;
  }, [fieldError]);
  function canDiscardChanges() {
    return (!isRestoredDraft && JSON.stringify(form) === initialFormRef.current) || window.confirm("작성 중인 변경 내용을 저장하지 않고 닫을까요?");
  }
  // 처음 열었을 때와 달라진 입력이 있을 때만 닫기를 확인합니다. 저장·삭제는 부모가 처리합니다.
  function requestClose() {
    if (!canDiscardChanges()) return;
    onClose();
  }
  // 문구를 먼저 정해 두면 아래 JSX에서는 화면 배치에 집중할 수 있습니다.
  // 조건 ? A : B는 조건이 참이면 A, 아니면 B를 고릅니다. 간단한 문구 선택에만 사용합니다.
  const title = isEditing ? "일정 수정" : "새 일정 등록";
  const description = isEditing ? "일정 정보를 수정하고 저장하세요." : "일정 종류를 선택해 정보를 입력하세요.";
  const submitText = isEditing ? "수정 저장" : "일정 저장";

  const selectedAttendees = normalizeAttendees(form.attendees);
  const attendeeOptions = [...new Set([...teamMembers, form.person.trim(), ...selectedAttendees].filter(Boolean))];
  // 사이트의 업무용/개인 일정용 버튼입니다. 종류가 달라지면 숨겨지는 업무 입력값을 비워
  // 개인일정에 과거 프로젝트·담당자·참석자가 함께 저장되는 것을 방지합니다.
  function selectScope(scope) {
    if (form.scope === scope) return;
    onChange({ target: { name: "scope", value: scope } });
    onChange({ target: { name: "category", value: "" } });
    onChange({ target: { name: "project", value: "" } });
    onChange({ target: { name: "attendees", value: "" } });
    onChange({ target: { name: "person", value: "" } });
    onChange({ target: { name: "status", value: "pending" } });
  }
  // 업무 분류 버튼에서 호출됩니다. 회의를 벗어나면 참석자를, 프로젝트를 벗어나면
  // 프로젝트명을 비워 현재 화면에 보이지 않는 입력이 저장 결과에 남지 않게 합니다.
  function selectCategory(category) {
    onChange({ target: { name: "category", value: category } });
    if (form.category === "프로젝트" && category !== "프로젝트") {
      onChange({ target: { name: "project", value: "" } });
    }
    if (form.category === "회의" && category !== "회의") {
      onChange({ target: { name: "attendees", value: "" } });
    }
  }

  return (
    <ScheduleModal
      id="sm-form-title"
      title={title}
      description={description}
      onClose={requestClose}
    >
      {/* 이름·프로젝트명은 사전에 없는 고유명사가 많으므로 브라우저 맞춤법 검사를 끕니다.
          spellCheck=false는 입력 내용을 바꾸지 않고 맞춤법 표시만 제어하며 자식 입력창에 상속됩니다.
          한글을 조합하는 동안 운영체제가 표시하는 입력기 밑줄과는 별개의 브라우저 설정입니다. */}
      <form ref={formRef} className="sm-form" onSubmit={onSubmit} spellCheck={false} autoCorrect="off"
        onInvalid={event => setNativeError(getScheduleFormError(form) || { field: event.target.name, message: event.target.validationMessage })}>
        {/* 입력값은 부모 form에서 받으며 onChange로 갱신합니다. 브라우저 입력 제한과 별개로 저장 시에도 검증합니다. */}
        {/* 각 입력창을 직접 작성해 name과 form의 속성이 어떻게 연결되는지 바로 볼 수 있습니다.
            예: name="person" 입력 → 부모의 onChange → form.person 변경 → value에 다시 표시. */}
        <div className="sm-category-picker sm-form-wide">
          <span className="sm-category-label">일정 종류</span>
          <div className="sm-category-tabs" role="group" aria-label="일정 종류" {...fieldErrorProps(fieldError, "scope")}>
            {scheduleScopes.map(scope => (
              <button type="button" key={scope}
                aria-pressed={form.scope === scope}
                className={form.scope === scope ? "sm-category-tab active" : "sm-category-tab"}
                onClick={() => selectScope(scope)}>
                {scope}
              </button>
            ))}
          </div>
        </div>
        <ScheduleFieldError error={fieldError} fields={["scope"]} />
        <label className="sm-form-wide">
          일정 이름
          <input name="title" value={form.title} onChange={onChange} autoFocus required maxLength={80} {...fieldErrorProps(fieldError, "title")} />
        </label>
        <ScheduleFieldError error={fieldError} fields={["title"]} />
        {/* 날짜 입력의 value는 YYYY-MM-DD, 시간은 HH:mm 형식입니다.
              반복 일정에서는 이 날짜가 기준일이고 시간은 각 발생 항목에 그대로 복사됩니다. */}
        {/* 날짜는 한 줄 전체에 두고, 시간은 두 칸으로 묶어 기본 입력 행을 맞춥니다. */}
        <ScheduleDateTimeFields form={form} onChange={onChange} fieldError={fieldError} />
        {form.scope === "업무용" && <div className="sm-category-picker sm-form-wide">
          <span className="sm-category-label">업무 분류</span>
          <div className="sm-category-tabs" role="group" aria-label="일정 분류" {...fieldErrorProps(fieldError, "category")}>
            {getScheduleCategories(form.scope).map(category => (
              <button type="button" key={category}
                aria-pressed={form.category === category}
                className={form.category === category ? "sm-category-tab active" : "sm-category-tab"}
                onClick={() => selectCategory(category)}>
                {category}
              </button>
            ))}
          </div>
        </div>}
        <ScheduleFieldError error={fieldError} fields={["category"]} />
        {form.scope === "업무용" && form.category === "프로젝트" && (
          <div className="sm-project-fields sm-form-wide">
            <label>프로젝트
              <input list="sm-project-suggestions" name="project" value={form.project} onChange={onChange}
                placeholder="프로젝트명 입력" maxLength={60} required {...fieldErrorProps(fieldError, "project")} />
            </label>
            <datalist id="sm-project-suggestions">
              {projectSuggestions.map(name => <option key={name} value={name} />)}
            </datalist>
          </div>
        )}
        <ScheduleFieldError error={fieldError} fields={["project"]} />
        {form.scope === "업무용" && <div className="sm-assignee-field sm-form-wide">
          <label htmlFor="sm-assignee">담당자</label>
          {/* 기존 이름은 자동완성으로 선택하고, 새 이름은 일정 저장 시 함께 등록합니다. */}
          <input id="sm-assignee" name="person" list="sm-team-suggestions" value={form.person}
            onChange={onChange} placeholder="담당자 이름 입력" maxLength={30} required {...fieldErrorProps(fieldError, "person")} />
          <datalist id="sm-team-suggestions">
            {[...new Set(teamMembers)].map((name) => <option key={name} value={name} />)}
          </datalist>
        </div>}
        <ScheduleFieldError error={fieldError} fields={["person"]} />
        {/* 회의 분류를 선택하면 참석자 선택을 표시합니다. */}
        {form.scope === "업무용" && form.category === "회의" && (
          <fieldset className="sm-team-options sm-form-wide sm-meeting-attendees">
            <legend>참석자 추가</legend>
            <p className="sm-form-note">회의에 참여할 팀원을 선택하세요.</p>
            {attendeeOptions.map(name => (
              <label key={name}>
                <input type="checkbox" checked={selectedAttendees.includes(name)} onChange={() => onToggleAttendee(name)} />
                {name}
              </label>
            ))}
            {attendeeOptions.length === 0 && <p className="sm-form-note">담당자를 입력하거나 팀원 일정이 등록되면 참석자를 선택할 수 있습니다.</p>}
          </fieldset>
        )}
        {form.scope === "업무용" && <label className="sm-form-wide">일정 상태
          <select name="status" className={`sm-status-select ${form.status}`} value={form.status} onChange={onChange}>
            {scheduleStatuses.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>}
        {/* 상세 내용은 최대 3,000자이며 줄바꿈을 저장합니다. 표시 시 CSS로 줄바꿈을 유지합니다. */}
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
        {/* 기본 입력 뒤에 선택 설정을 둡니다. 공유 구분·종일·알림은 신규와 수정에서 변경할 수 있습니다. */}
        <ScheduleExtraSettings form={form} onChange={onChange} isOccurrence={isOccurrence} fieldError={fieldError} />
        {!isOccurrence && form.repeatType !== "none" && <p className="sm-repeat-summary sm-form-wide" aria-label="반복 설정 요약">{getRepeatSummary(form)}</p>}
        {isOccurrence && <p className="sm-form-note sm-form-wide">선택한 날짜의 일정만 수정합니다. 다른 반복 일정은 유지됩니다.</p>}
        {/* 취소는 type=button이라 제출하지 않습니다. 저장은 submit이라 form의 onSubmit을 실행합니다.
              부모가 preventDefault로 기본 페이지 이동을 막고 state에 내용을 반영합니다. */}
        <div className="sm-form-actions">
          {isEditing && onCopy && <button type="button" className="sm-secondary-btn" onClick={() => { if (canDiscardChanges()) onCopy(); }}>일정 복사</button>}
          {isEditing && <button type="button" className="sm-delete-btn" onClick={onDelete}>일정 삭제</button>}
          <button type="button" className="sm-cancel" onClick={requestClose}>
            취소
          </button>
          <button type="submit" className="sm-btn">
            {submitText}
          </button>
        </div>
        {error && <p className="sm-form-error sm-form-wide" role="alert">{error}</p>}
      </form>
    </ScheduleModal>
  );
}

// 날짜·시간 입력 전용 부품입니다. 상태는 부모 form을 사용하고 변경은 그대로 onChange로 전달합니다.
function ScheduleDateTimeFields({ form, onChange, fieldError }) {
  // 다음 날 이후 종료는 오전 시간도 허용합니다. 같은 날짜만 최소 시각을 제한합니다.
  const endsOnLaterDate = form.repeatType === "none" && form.endDate > form.date;
  return (
  <div className="sm-date-time-fields sm-form-wide">
    <label>
      날짜
      <input type="date" name="date" value={form.date} onChange={onChange} required {...fieldErrorProps(fieldError, "date")} />
    </label>
    {/* 종일 일정은 시간 입력을 숨기며, 저장된 기본 시간은 폼 값에 계속 보관합니다. */}
    {!form.isAllDay && <>
      <label>시작 시간
        <input type="time" name="time" value={form.time} onChange={onChange} required {...fieldErrorProps(fieldError, "time")} />
      </label>
      <label>종료 시간
        <input type="time" name="endTime" value={form.endTime} onChange={onChange} min={endsOnLaterDate ? undefined : form.time} required {...fieldErrorProps(fieldError, "endTime")} />
      </label>
      <div className="sm-duration-options" role="group" aria-label="종료 시간 빠른 설정">
        <span>시작부터</span>
        {[[30, "30분"], [60, "1시간"], [120, "2시간"]].map(([minutes, label]) => (
          <button type="button" key={minutes} className="sm-secondary-btn"
            disabled={!getScheduleDurationFields(form, minutes)}
            title="시작 시간 기준으로 종료 날짜와 시간을 변경합니다. 반복 일정은 자정을 넘길 수 없습니다."
            onClick={() => onChange({ target: { name: "durationMinutes", value: minutes } })}>{label}</button>
        ))}
      </div>
    </>}
    <ScheduleFieldError error={fieldError} fields={["date", "time", "endTime"]} />
  </div>
  );
}

// 종일·기간·알림·공개 범위·반복 규칙을 한 구역에서 관리합니다. 별도 상태를 복제하지 않습니다.
function ScheduleExtraSettings({ form, onChange, isOccurrence, fieldError }) {
  const repeatValue = form.repeatType + ":" + form.repeatInterval;
  // 사용자 지정 간격을 수정 없이 저장해도 기존 규칙이 바뀌지 않도록 선택지에 남깁니다.
  const commonRepeat = ["none:1", "weekly:1", "weekly:2", "monthly:1"].includes(repeatValue);
  return (
  <details className="sm-extra-settings sm-form-wide">
    <summary>추가 설정 · 공유 구분·반복·알림</summary>
    <div className="sm-extra-fields">
      {/* 종일 선택 시 위의 시작·종료 시간 입력란은 숨기지만 기존 값은 저장용으로 유지합니다. */}
      <label className="sm-form-check">종일 일정
        <span className="sm-form-check-control"><input type="checkbox" name="isAllDay" checked={Boolean(form.isAllDay)} onChange={onChange} /></span>
      </label>
      {/* 종료 날짜는 반복 없는 일정에서만 열어 여러 날 범위를 지정할 수 있습니다. */}
      {form.repeatType === "none" && <label>종료 날짜 (여러 날 일정)
        <input type="date" name="endDate" value={form.endDate || ""} min={form.date} onChange={onChange} {...fieldErrorProps(fieldError, "endDate")} />
      </label>}
      {/* 선택한 분 단위는 일정 시작 전에 화면 알림을 표시하는 데 사용합니다. */}
      <label>알림
        <select name="reminderMinutes" value={form.reminderMinutes || 0} onChange={onChange}>
          <option value={0}>알림 없음</option><option value={10}>10분 전</option><option value={30}>30분 전</option><option value={1440}>하루 전</option>
        </select>
      </label>
      <label>공유 구분
        <select name="visibility" value={form.visibility} onChange={onChange}>
          <option value="shared">회사 공유</option><option value="private">개인 표시</option>
        </select>
      </label>
      {!isOccurrence && <label className={form.repeatType === "none" ? "sm-extra-field-wide" : ""}>반복 설정
        <select name="repeatPreset" value={repeatValue} onChange={onChange} {...fieldErrorProps(fieldError, "repeatInterval")}>
          <option value="none:1">반복 없음</option><option value="weekly:1">매주</option>
          <option value="weekly:2">격주</option><option value="monthly:1">매월</option>
          {!commonRepeat && <option value={repeatValue}>기존 설정 · {getRepeatLabel(form)}</option>}
        </select>
      </label>}
      {/* 휴일 처리 규칙은 반복 일정에서만 선택할 수 있습니다. */}
      {!isOccurrence && form.repeatType !== "none" && <>
        <label>반복 종료
          <select name="repeatEndType" value={form.repeatEndType || "none"} onChange={onChange}>
            <option value="none">종료일 없음</option>
            <option value="until">날짜 지정</option>
            <option value="count">횟수 지정</option>
          </select>
        </label>
        {form.repeatEndType === "until" && <label>반복 종료 날짜
          <input type="date" name="repeatEndDate" value={form.repeatEndDate || ""} min={form.date} onChange={onChange} required {...fieldErrorProps(fieldError, "repeatEndDate")} />
        </label>}
        {form.repeatEndType === "count" && <label>반복 횟수
          <input type="number" name="repeatCount" min={1} max={1000} step={1} value={form.repeatCount} onChange={onChange} required {...fieldErrorProps(fieldError, "repeatCount")} />
        </label>}
      </>}
      {form.repeatType !== "none" && <label>주말·공휴일 처리
        <select name="holidayRule" value={form.holidayRule || "keep"} onChange={onChange}>
          <option value="keep">기준일에 진행</option><option value="skip">건너뛰기</option><option value="nextWorkday">다음 근무일로 이동</option>
        </select>
      </label>}
      {form.repeatType === "monthly" && (
        <>
          <label>매월 기준
            <select name="monthlyRule" value={form.monthlyRule} onChange={onChange}>
              <option value="date">같은 날짜</option>
              <option value="weekday">몇째 주 요일</option>
            </select>
          </label>
          {form.monthlyRule === "weekday" && (
            <>
              <label>주차
                <select name="monthlyOrdinal" value={form.monthlyOrdinal} onChange={onChange}>
                  <option value={1}>첫째 주</option>
                  <option value={2}>둘째 주</option>
                  <option value={3}>셋째 주</option>
                  <option value={4}>넷째 주</option>
                  <option value={-1}>마지막 주</option>
                </select>
              </label>
              <label>요일
                <select name="monthlyWeekday" value={form.monthlyWeekday} onChange={onChange}>
                  <option value={1}>월요일</option>
                  <option value={2}>화요일</option>
                  <option value={3}>수요일</option>
                  <option value={4}>목요일</option>
                  <option value={5}>금요일</option>
                </select>
              </label>
            </>
          )}
        </>
      )}
    </div>
    <ScheduleFieldError error={fieldError} fields={["endDate", "repeatInterval", "repeatEndDate", "repeatCount"]} />
    <p className="sm-form-note">일정 종류와 공유 구분은 별개입니다. 공유 구분은 표시·필터 용도이며 현재 열람 권한을 제한하지 않습니다.</p>
    {form.repeatType !== "none" && form.repeatEndType === "count" && <p className="sm-form-note">횟수는 규칙상 발생 횟수입니다. 휴일로 건너뛰거나 삭제한 회차도 포함합니다.</p>}
    {form.repeatType !== "none" && form.repeatEndType === "until" && <p className="sm-form-note">이동 전 규칙 날짜가 종료일 이내인 회차까지 포함합니다. 휴일 이동 결과는 종료일을 넘을 수 있습니다.</p>}
    {form.repeatType === "monthly" && form.monthlyRule === "weekday" && (
      <p className="sm-form-note">주말·공휴일 일정은 위의 휴일 규칙에 따라 건너뛰거나 다음 근무일로 옮길 수 있습니다.</p>
    )}
  </details>
  );
}

// 같은 팝업을 사용하는 목록과 공통 테두리를 이 파일에서 함께 관리합니다.
/* 전체 목록은 원본 반복 규칙을, 날짜 목록은 해당 발생일을 전달받습니다. onEdit에 원본 객체를 넘겨 수정 범위를 유지합니다. 정렬은 복사본에 적용합니다. */
// 날짜 모드는 부모가 이미 펼친 발생 목록을 넘깁니다. 같은 날짜 조건을 다시 검사하지 않습니다.
// 전체 건수는 원본 목록 개수를 따로 받아 날짜별 건수와 구분합니다.
function fieldErrorProps(error, field) {
  return error?.field === field ? { "aria-invalid": true, "aria-describedby": `sm-error-${field}` } : {};
}

function ScheduleFieldError({ error, fields }) {
  return error && fields.includes(error.field)
    ? <p className="sm-field-error sm-form-wide" id={`sm-error-${error.field}`}>{error.message}</p> : null;
}

export function ScheduleListModal({
  items,
  filterDate,
  totalCount,
  onClearDateFilter,
  onEdit,
  onClose,
  onToggleFavorite,
}) {
  const [sortOrder, setSortOrder] = useState("date");
  const [statusFilter, setStatusFilter] = useState("all");
  // 개인 일정에는 업무 진행 상태가 없으므로 예정·완료 필터에서 제외합니다.
  const matchingItems = statusFilter === "all" ? items
    : items.filter(item => item.scope !== "개인 일정용" && normalizeStatus(item.status) === statusFilter);
  const [page, setPage] = useState(1);
  const listContentRef = useRef(null);
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(matchingItems.length / pageSize));
  // 삭제로 페이지가 줄어들면 마지막 유효 페이지를 표시합니다. 날짜·정렬 변경은 첫 페이지로 돌아갑니다.
  const currentPage = Math.min(page, pageCount);
  useLayoutEffect(() => { setPage(current => Math.min(current, pageCount)); }, [pageCount]);
  useLayoutEffect(() => { setPage(1); }, [filterDate, statusFilter]);
  useLayoutEffect(() => { if (listContentRef.current) listContentRef.current.scrollTop = 0; }, [currentPage, sortOrder, filterDate, statusFilter]);
  // 한 회차를 수정하면 원본 반복 규칙과 분리된 일반 일정이 생깁니다.
  // 일반 일정의 원본 ID·발생일을 모아, 목록에서 해당 반복 규칙의 다음 발생일을 표시합니다.

  const getReplacementKey = (scheduleId, date) => `${scheduleId}:${date}`;
  const replacementKeys = new Set();
  // ID만 비교하면 다른 날짜의 회차까지 섞이므로 '원본 ID:원래 발생일'을 한 쌍으로 사용합니다.
  for (const candidate of items) {
    if (candidate.repeatType !== "none") continue;
    const { replacesScheduleId, replacesOccurrenceDate } = candidate;
    if (!replacesScheduleId || !replacesOccurrenceDate) continue;
    replacementKeys.add(getReplacementKey(replacesScheduleId, replacesOccurrenceDate));
  }
  const todayKey = getTodayKey();
  const createListEntry = (item) => {
    const isRecurring = ["weekly", "monthly"].includes(item.repeatType);
    const replacesRecurringOccurrence = isRecurring
      && (item.excludedDates || []).some((date) =>
        replacementKeys.has(getReplacementKey(item.id, date))
      );
    const displayDate = replacesRecurringOccurrence
      ? getNextScheduleDate([item], todayKey) || item.date
      : item.date;

    const dateLabel = `${replacesRecurringOccurrence ? "다음 회차 · " : ""}${displayDate.replaceAll("-", ".")} · ${getScheduleTime(item)}`;
    // 표시 문구를 여기서 완성해 JSX에서는 배치만 담당하도록 합니다.
    const category = item.category || (item.project ? "프로젝트" : "업무");
    const detailLabel = item.scope === "개인 일정용"
      ? "개인 일정용"
      : `${category} · ${item.project || item.person}`;

    return { item, displayDate, dateLabel, detailLabel };
  };
  // 날짜 계산 결과를 항목에 함께 담아 정렬과 화면 표시에서 재사용합니다.
  const sortedItems = matchingItems
    .map(createListEntry)
    .sort((left, right) => {
      const byDate = left.displayDate.localeCompare(right.displayDate) || compareSchedules(left.item, right.item);
      if (sortOrder === "title") return left.item.title.localeCompare(right.item.title, "ko") || byDate;
      if (sortOrder === "person") {
        const first = left.item.person || "";
        const second = right.item.person || "";
        return Number(!first) - Number(!second) || first.localeCompare(second, "ko") || byDate;
      }
      return byDate;
    });
  let title = "전체 일정";
  let description = `등록된 일정 ${totalCount}건`;
  let emptyMessage = "등록된 일정이 없습니다. 목록을 닫고 일정 등록 버튼으로 추가해 보세요.";
  if (filterDate) {
    title = `${filterDate.replaceAll("-", ".")} 일정`;
    description = `${items.length}건 · 전체 ${totalCount}건`;
    emptyMessage = "선택한 날짜에 일정이 없습니다. 목록을 닫고 일정 등록 버튼으로 추가해 보세요.";
  }
  return (
    <ScheduleModal
      id="sm-list-title"
      className="sm-list-modal"
      title={title}
      description={description}
      onClose={onClose}
      headerExtra={
        filterDate && (
          <button
            type="button"
            className="sm-list-all-btn"
            onClick={onClearDateFilter}
          >
            전체 일정 보기
          </button>
        )
      }
    >
      <div className="sm-list-content" ref={listContentRef}>
        <label className="sm-list-sort">목록 정렬
          <select value={sortOrder} onChange={event => { setSortOrder(event.target.value); setPage(1); }}>
            <option value="date">날짜순</option><option value="title">이름순</option><option value="person">담당자순</option>
          </select>
        </label>
        <label className="sm-list-sort">목록 진행 상태
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">진행 상태 전체</option><option value="pending">예정 업무</option><option value="completed">완료 업무</option>
          </select>
        </label>
        {statusFilter !== "all" && <p className="sm-form-note">진행 상태 필터는 업무 일정에만 적용됩니다. 결과 {matchingItems.length}건</p>}
        {sortedItems.length ? (
          sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(
            ({ item, dateLabel, detailLabel }) => (
              <article className="sm-list-item" key={item.id}>
                {/* 목록 제목은 item을 그대로 전달해 수정 창을 엽니다. 별 버튼은 즐겨찾기만 바꿉니다. */}
                <button
                  type="button"
                  className="sm-list-item-info"
                  aria-label={`${item.title} 일정 수정`}
                  onClick={() => onEdit(item)}
                >
                  <span className="sm-list-date">
                    {dateLabel}
                  </span>
                  <strong>{item.title}</strong>
                  <ScheduleVisibility visibility={item.visibility} />
                  {!item.isProjectMilestone && item.scope !== "개인 일정용" && <ScheduleStatus status={item.status} />}
                  {item.repeatType !== "none" && (
                    <small>{getRepeatLabel(item)} · {getRepeatEndLabel(item)}</small>
                  )}
                  <small>{detailLabel}</small>
                  <ScheduleAttendees item={item} />
                </button>
                <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />
              </article>
            )
          )
        ) : (
          <div className="sm-empty">
            {statusFilter === "all" ? emptyMessage : "선택한 진행 상태에 해당하는 업무 일정이 없습니다."}
          </div>
        )}
        {matchingItems.length > 0 && <nav className="sm-list-pagination" aria-label="일정 목록 페이지">
          <span role="status">전체 {matchingItems.length}건 · {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, matchingItems.length)}건</span>
          {pageCount > 1 && <>
            <button type="button" className="sm-list-all-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>이전 페이지</button>
            <span>{currentPage} / {pageCount}</span>
            <button type="button" className="sm-list-all-btn" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>다음 페이지</button>
          </>}
        </nav>}
      </div>
    </ScheduleModal>
  );
}

function getModalFocusTargets(dialog) {
  return [...dialog.querySelectorAll(
    'button, input, select, textarea, a[href], summary, [tabindex]'
  )].filter(element => {
    if (element.matches(':disabled, input[type="hidden"]') || element.tabIndex < 0) return false;
    for (let parent = element; parent && parent !== dialog; parent = parent.parentElement) {
      const style = window.getComputedStyle(parent);
      if (parent.hidden || style.display === "none" || style.visibility === "hidden") return false;
      // 접힌 추가 설정에서는 summary만 키보드 이동 대상으로 남깁니다.
      if (parent.tagName === "DETAILS" && !parent.open && !parent.querySelector("summary")?.contains(element)) return false;
    }
    return true;
  });
}

/* 모달은 제목·닫기·키보드 이동을 제공하고, 폼이나 목록을 children으로 표시합니다. */
function ScheduleModal({
  id,
  title,
  description,
  onClose,
  children,
  headerExtra,
  className = "",
}) {
  const dialogRef = useRef(null);
  // 자동 초점이 적용되기 전, 팝업을 연 버튼을 기억합니다.
  const openerRef = useRef(document.activeElement);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const opener = openerRef.current;
    // 등록·수정 폼의 기존 autoFocus는 유지하고, 목록은 첫 조작 요소에 초점을 둡니다.
    if (!dialog.contains(document.activeElement)) (getModalFocusTargets(dialogRef.current)[0] || dialog).focus();
    return () => {
      if (opener?.isConnected) opener.focus();
      else document.querySelector('.schedule-app button')?.focus();
    };
  }, []);

  function handleKeyDown(event) {
    // 목록 위에 수정창이 열려 있으면 가장 위의 팝업만 키보드 입력을 처리합니다.
    const dialogs = document.querySelectorAll('.sm-modal[role="dialog"]');
    if (dialogs[dialogs.length - 1] !== dialogRef.current || event.nativeEvent.isComposing || event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    } else if (event.key === "Tab") {
      const targets = getModalFocusTargets(dialogRef.current);
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (!first) {
        event.preventDefault();
        dialogRef.current.focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  // 팝업 안쪽 입력·버튼 클릭은 유지하고, 팝업 바깥 반투명 배경을 눌렀을 때만 닫습니다.
  // target은 실제 누른 요소, currentTarget은 이 핸들러가 연결된 배경 요소입니다.
  function handleBackgroundClick(event) {
    // 입력창 같은 안쪽 요소를 누르면 target과 currentTarget이 달라 닫지 않습니다.
    if (event.target === event.currentTarget) onClose();
  }
  return (
    <div
      className="sm-modal-backdrop"
      onMouseDown={handleBackgroundClick}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
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
