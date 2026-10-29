/* [파일 안내] 일정 입력·전체 목록·공통 모달
 * 읽는 순서: ScheduleFormModal → ScheduleListModal → ScheduleModal
 * 입력 흐름: input의 name/value → onChange → Manager.updateForm → 새 form 전달
 * 제출 흐름: onSubmit → Manager.addSchedule에서 검증·저장
 * 목록 항목 선택: onEdit(item) → Manager가 수정 폼을 열어 저장값을 표시합니다.
 */

/* [이 파일에는 세 가지 화면 부품이 있습니다]
 * 기본 export인 ScheduleFormModal은 새 일정 등록과 기존 일정 수정을 함께 담당합니다.
 * 이름을 붙여 export한 ScheduleListModal은 전체 일정 또는 특정 날짜의 일정 목록입니다.
 * 아래 ScheduleModal은 두 화면이 공유하는 배경·제목·닫기 버튼을 만드는 틀입니다.
 * 태그 사이에 넣은 폼이나 목록은 children이라는 값으로 공통 틀에 전달됩니다.
 * input의 value는 부모 form의 값이고 onChange는 부모에게 새 입력을 알리는 연결입니다.
 * name="title"처럼 name과 객체 속성을 맞추면 부모의 공통 입력 함수가 어느 값을 바꿀지 알 수 있습니다.
 * 일정 종류를 먼저 고르고, 업무용이면 분류를 선택합니다. 공개 범위와 반복은 추가 설정에서 바꿉니다.
 */
import React from "react";
import { ScheduleFavorite, ScheduleAttendees, ScheduleVisibility } from "./ScheduleItemParts";
import {
  compareSchedules,
  getScheduleTime,
  getNextScheduleDate,
  getTodayKey,
  getRepeatLabel,
  getScheduleCategories,
  scheduleScopes,
  scheduleStatuses,
  normalizeAttendees,
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
  isEditing,
  isOccurrence,
}) {
  // 문구를 먼저 정해 두면 아래 JSX에서는 화면 배치에 집중할 수 있습니다.
  // 조건 ? A : B는 조건이 참이면 A, 아니면 B를 고릅니다. 간단한 문구 선택에만 사용합니다.
  const title = isEditing ? "일정 수정" : "새 일정 등록";
  const description = isEditing ? "일정 정보를 수정하고 저장하세요." : "일정 종류를 선택해 정보를 입력하세요.";
  const submitText = isEditing ? "수정 저장" : "일정 저장";

  // 기존의 사용자 지정 간격은 선택지에 남겨 수정 없이 저장해도 반복 규칙이 바뀌지 않게 합니다.
  const repeatValue = form.repeatType + ":" + form.repeatInterval;
  const commonRepeat = ["none:1", "weekly:1", "weekly:2", "monthly:1"].includes(repeatValue);
  const selectedAttendees = normalizeAttendees(form.attendees);
  const attendeeOptions = [...new Set([...teamMembers, form.person.trim(), ...selectedAttendees].filter(Boolean))];
  function selectScope(scope) {
    if (form.scope === scope) return;
    onChange({ target: { name: "scope", value: scope } });
    onChange({ target: { name: "category", value: "" } });
    onChange({ target: { name: "project", value: "" } });
    onChange({ target: { name: "attendees", value: "" } });
    onChange({ target: { name: "person", value: "" } });
    onChange({ target: { name: "status", value: "pending" } });
  }
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
      onClose={onClose}
    >
      {/* 이름·프로젝트명은 사전에 없는 고유명사가 많으므로 브라우저 맞춤법 검사를 끕니다.
          spellCheck=false는 입력 내용을 바꾸지 않고 맞춤법 표시만 제어하며 자식 입력창에 상속됩니다.
          한글을 조합하는 동안 운영체제가 표시하는 입력기 밑줄과는 별개의 브라우저 설정입니다. */}
      <form className="sm-form" onSubmit={onSubmit} spellCheck={false} autoCorrect="off">
        {/* 제어 입력(controlled input)의 흐름:
              1. value={form.title}이 현재 상태를 입력창에 표시합니다.
              2. 사용자가 입력하면 onChange가 부모의 updateForm을 실행합니다.
              3. updateForm이 name="title"을 보고 form.title을 바꿉니다.
              4. 새 form이 내려와 입력창에 최신 값이 보입니다.
              required/maxLength는 브라우저 입력 제약이며 서버 검증을 대신하지는 않습니다.
              label 안에 input을 넣으면 제목과 입력창이 연결되어 제목 클릭으로도 입력창을 선택합니다. */}
        {/* 각 입력창을 직접 작성해 name과 form의 속성이 어떻게 연결되는지 바로 볼 수 있습니다.
            예: name="person" 입력 → 부모의 onChange → form.person 변경 → value에 다시 표시. */}
        <div className="sm-category-picker sm-form-wide">
          <span className="sm-category-label">일정 종류</span>
          <div className="sm-category-tabs" role="group" aria-label="일정 종류">
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
        <label className="sm-form-wide">
          일정 이름
          <input name="title" value={form.title} onChange={onChange} autoFocus required maxLength={80} />
        </label>
        {form.scope === "업무용" && <div className="sm-category-picker sm-form-wide">
          <span className="sm-category-label">업무 분류</span>
          <div className="sm-category-tabs" role="group" aria-label="일정 분류">
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
        {form.scope === "업무용" && form.category === "프로젝트" && (
          <div className="sm-project-fields sm-form-wide">
            <label>프로젝트
              <input list="sm-project-suggestions" name="project" value={form.project} onChange={onChange}
                placeholder="프로젝트명 입력" maxLength={60} required />
            </label>
            <datalist id="sm-project-suggestions">
              {projectSuggestions.map(name => <option key={name} value={name} />)}
            </datalist>
          </div>
        )}
        {form.scope === "업무용" && <div className="sm-assignee-field sm-form-wide">
          <label htmlFor="sm-assignee">담당자</label>
          {/* 기존 이름은 자동완성으로 선택하고, 새 이름은 일정 저장 시 함께 등록합니다. */}
          <input id="sm-assignee" name="person" list="sm-team-suggestions" value={form.person}
            onChange={onChange} placeholder="담당자 이름 입력" maxLength={30} required />
          <datalist id="sm-team-suggestions">
            {[...new Set(teamMembers)].map((name) => <option key={name} value={name} />)}
          </datalist>
        </div>}
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
        {/* 날짜 입력의 value는 YYYY-MM-DD, 시간은 HH:mm 형식입니다.
              반복 일정에서는 이 날짜가 기준일이고 시간은 각 발생 항목에 그대로 복사됩니다. */}
        {/* 날짜는 한 줄 전체에 두고, 시간은 두 칸으로 묶어 기본 입력 행을 맞춥니다. */}
        <div className="sm-date-time-fields sm-form-wide">
          <label>
            날짜
            <input type="date" name="date" value={form.date} onChange={onChange} required />
          </label>
          {/* 종일 일정은 시간 입력을 숨기며, 저장된 기본 시간은 폼 값에 계속 보관합니다. */}
          {!form.isAllDay && <>
            <label>시작 시간
              <input type="time" name="time" value={form.time} onChange={onChange} required />
            </label>
            <label>종료 시간
              <input type="time" name="endTime" value={form.endTime} onChange={onChange} min={form.time} required />
            </label>
          </>}
        </div>
        {form.scope === "업무용" && <label className="sm-form-wide">일정 상태
          <select name="status" value={form.status} onChange={onChange}>
            {scheduleStatuses.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>}
        {/* 자주 바꾸지 않는 설정은 접어 두되, 신규와 수정 모두에서 변경할 수 있습니다. */}
        {/* 반복·휴일·알림처럼 매번 바꾸지 않는 항목은 접어서 기본 입력을 간결하게 둡니다. */}
        <details className="sm-extra-settings sm-form-wide">
          <summary>추가 설정 · 공개 범위·반복·알림</summary>
          <div className="sm-extra-fields">
            {/* 종일 선택 시 위의 시작·종료 시간 입력란은 숨기지만 기존 값은 저장용으로 유지합니다. */}
            <label className="sm-form-check">종일 일정
              <span className="sm-form-check-control"><input type="checkbox" name="isAllDay" checked={Boolean(form.isAllDay)} onChange={onChange} /></span>
            </label>
            {/* 종료 날짜는 반복 없는 일정에서만 열어 여러 날 범위를 지정할 수 있습니다. */}
            {form.repeatType === "none" && <label>종료 날짜 (여러 날 일정)
              <input type="date" name="endDate" value={form.endDate || ""} min={form.date} onChange={onChange} />
            </label>}
            {/* 선택한 분 단위는 일정 시작 전에 화면 알림을 표시하는 데 사용합니다. */}
            <label>알림
              <select name="reminderMinutes" value={form.reminderMinutes || 0} onChange={onChange}>
                <option value={0}>알림 없음</option><option value={10}>10분 전</option><option value={30}>30분 전</option><option value={1440}>하루 전</option>
              </select>
            </label>
            <label>일정 공개 범위
              <select name="visibility" value={form.visibility} onChange={onChange}>
                <option value="shared">회사 공유 일정</option><option value="private">개인 일정</option>
              </select>
            </label>
            {!isOccurrence && <label className={form.repeatType === "none" ? "sm-extra-field-wide" : ""}>반복 설정
              <select name="repeatPreset" value={repeatValue} onChange={onChange}>
                <option value="none:1">반복 없음</option><option value="weekly:1">매주</option>
                <option value="weekly:2">격주</option><option value="monthly:1">매월</option>
                {!commonRepeat && <option value={repeatValue}>기존 설정 · {getRepeatLabel(form)}</option>}
              </select>
            </label>}
            {/* 휴일 처리 규칙은 반복 일정에서만 선택할 수 있습니다. */}
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
          <p className="sm-form-note">개인 일정 구분은 열람 권한을 제한하지 않습니다.</p>
          {form.repeatType !== "none" && <p className="sm-form-note">{getRepeatLabel(form)} · 휴일 규칙도 반복 전체에 적용됩니다.</p>}
          {form.repeatType === "monthly" && form.monthlyRule === "weekday" && (
            <p className="sm-form-note">주말·공휴일 일정은 위의 휴일 규칙에 따라 건너뛰거나 다음 근무일로 옮길 수 있습니다.</p>
          )}
        </details>
        {isOccurrence && <p className="sm-form-note sm-form-wide">선택한 날짜의 일정만 수정합니다. 다른 반복 일정은 유지됩니다.</p>}
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
          {isEditing && <button type="button" className="sm-delete-btn" onClick={onDelete}>일정 삭제</button>}
          <button type="button" className="sm-cancel" onClick={onClose}>
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

// 같은 팝업을 사용하는 목록과 공통 테두리를 이 파일에서 함께 관리합니다.
/* 전체 목록과 하루 목록은 같은 모달을 사용하지만 들어오는 데이터의 의미가 다릅니다.
 * filterDate가 null이면 반복 규칙도 원본 한 건으로 표시하며 그 규칙의 수정·삭제는 전체 반복 대상입니다.
 * 특정 날짜라면 부모가 그날 발생하는 일정으로 펼쳐서 전달합니다. 이때 occurrenceDate가 있어
 * 목록의 제목을 눌러 수정 창을 열어도 Manager가 '반복 중 한 번'으로 구분할 수 있습니다.
 *
 * [...items]는 배열을 복사하는 펼침 문법입니다. sort는 호출한 배열 자체를 바꾸므로
 * 부모에게 받은 items를 직접 정렬하지 않고 복사본 sortedItems만 정렬합니다.
 * 각 item 객체까지 깊게 복사하는 것은 아니지만, 여기서는 객체 속성을 수정하지 않아 충분합니다.
 */
// 날짜 모드는 부모가 이미 펼친 발생 목록을 넘깁니다. 같은 날짜 조건을 다시 검사하지 않습니다.
// 전체 건수는 원본 목록 개수를 따로 받아 날짜별 건수와 구분합니다.
export function ScheduleListModal({
  items,
  filterDate,
  totalCount,
  onClearDateFilter,
  onEdit,
  onClose,
  onToggleFavorite,
}) {
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
  const sortedItems = items
    .map(createListEntry)
    .sort((left, right) =>
      left.displayDate.localeCompare(right.displayDate)
        || compareSchedules(left.item, right.item)
    );
  let title = "전체 일정";
  let description = `등록된 일정 ${totalCount}건`;
  let emptyMessage = "등록된 일정이 없습니다.";
  if (filterDate) {
    title = `${filterDate.replaceAll("-", ".")} 일정`;
    description = `${items.length}건 · 전체 ${totalCount}건`;
    emptyMessage = "선택한 날짜에 등록된 일정이 없습니다.";
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
      <div className="sm-list-content">
        {sortedItems.length ? (
          sortedItems.map(
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
                  {item.repeatType !== "none" && (
                    <small>{getRepeatLabel(item)} · 종료일 없음</small>
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
            {emptyMessage}
          </div>
        )}
      </div>
    </ScheduleModal>
  );
}

/* 모달은 제목·닫기 동작을 제공하고, 폼이나 목록을 children으로 표시합니다. */
function ScheduleModal({
  id,
  title,
  description,
  onClose,
  children,
  headerExtra,
  className = "",
}) {
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
