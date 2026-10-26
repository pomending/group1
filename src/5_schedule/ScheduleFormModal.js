/* [이 파일에는 세 가지 화면 부품이 있습니다]
 * 기본 export인 ScheduleFormModal은 새 일정 등록과 기존 일정 수정을 함께 담당합니다.
 * 이름을 붙여 export한 ScheduleListModal은 전체 일정 또는 특정 날짜의 일정 목록입니다.
 * 아래 ScheduleModal은 두 화면이 공유하는 배경·제목·닫기 버튼을 만드는 틀입니다.
 * 태그 사이에 넣은 폼이나 목록은 children이라는 값으로 공통 틀에 전달됩니다.
 * input의 value는 부모 form의 값이고 onChange는 부모에게 새 입력을 알리는 연결입니다.
 * name="title"처럼 name과 객체 속성을 맞추면 부모의 공통 입력 함수가 어느 값을 바꿀지 알 수 있습니다.
 * 작업 구분·공개 범위·반복은 추가 설정 안에 있고, 펼치지 않아도 기존 값이 그대로 저장됩니다.
 * datalist는 브라우저의 자동완성 후보입니다. 후보를 고르지 않고 새 담당자 이름을 입력할 수도 있습니다.
 */
import React from "react";
import { ScheduleFavorite, ScheduleAttendees, ScheduleVisibility } from "./ScheduleItemParts";
import {
  compareSchedules,
  getScheduleTime,
  getRepeatLabel,
  scheduleTypes,
  scheduleStatuses,
  normalizeAttendees,
} from "./scheduleData";

/* 입력창에 글자를 입력한 뒤 저장되기까지의 전체 과정
 *
 * ① Manager가 form 객체를 만들고 이 컴포넌트에 전달합니다.
 *    예: form = { title: '', project: '', date: '2026-10-22', ... }.
 * ② input의 value={form[name]}가 그 값을 화면에 표시합니다.
 *    name='title'이면 form.title을 읽으므로 처음에는 빈 입력창입니다.
 * ③ 사용자가 '회의'를 입력하면 onChange가 호출됩니다. event.target은 그 입력창입니다.
 *    event.target.name은 'title', event.target.value는 '회의'입니다.
 * ④ 부모의 updateForm이 setForm으로 title만 바꾼 새 객체를 만듭니다.
 * ⑤ 부모가 다시 렌더링되어 새 form을 전달하면 value에도 '회의'가 들어갑니다.
 *    입력창 값의 기준을 리액트 state로 관리하는 방식을 '제어 입력'이라고 합니다.
 * ⑥ 저장 버튼을 누르면 form의 onSubmit이 부모의 addSchedule을 실행합니다.
 *    이때 입력 중인 form을 실제 일정 객체로 바꿔 items에 반영하고, 저장 effect가 브라우저에 기록합니다.
 *
 * 이 파일은 입력 화면을 만들고 동작을 부모에게 알립니다. localStorage 저장은 여기서 하지 않습니다.
 * '취소'는 입력 폼만 닫으므로 아직 저장하지 않은 form 내용이 실제 items에 반영되지 않습니다.
 * disabled는 입력을 잠그는 속성, required는 브라우저가 제출 전에 빈 값인지 검사하는 속성입니다.
 * required만으로 공백뿐인 이름은 거를 수 없어 부모의 저장 함수가 trim으로 한 번 더 확인합니다.
 */
// 입력값·저장은 부모가 관리하고, 공통 모달은 배경 클릭·제목·닫기 버튼을 담당합니다.
// isOccurrence이면 반복 중 특정 날짜만 수정하므로 반복 선택창을 숨기고 해당 날짜의 정보만 바꿉니다.
export default function ScheduleFormModal({
  form,
  teamMembers,
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
  const description = isEditing ? "일정 정보를 수정하고 저장하세요." : "프로젝트 작업 일정을 추가하세요.";
  const submitText = isEditing ? "수정 저장" : "일정 저장";

  // 기존의 사용자 지정 간격은 선택지에 남겨 수정 없이 저장해도 반복 규칙이 바뀌지 않게 합니다.
  const repeatValue = form.repeatType + ":" + form.repeatInterval;
  const commonRepeat = ["none:1", "weekly:1", "weekly:2", "monthly:1"].includes(repeatValue);
  const selectedAttendees = normalizeAttendees(form.attendees);
  const attendeeOptions = [...teamMembers];
  for (const name of selectedAttendees) {
    if (!attendeeOptions.includes(name)) attendeeOptions.push(name);
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
        <label className="sm-form-wide">
          일정 이름
          <input name="title" value={form.title} onChange={onChange} autoFocus required maxLength={80} />
        </label>
        <label>
          프로젝트
          <input name="project" value={form.project} onChange={onChange} placeholder="프로젝트명 (선택)" maxLength={60} />
        </label>
        <div className="sm-assignee-field">
          <label htmlFor="sm-assignee">담당자</label>
          {/* 기존 이름은 자동완성으로 선택하고, 새 이름은 일정 저장 시 함께 등록합니다. */}
          <input id="sm-assignee" name="person" list="sm-team-suggestions" value={form.person}
            onChange={onChange} placeholder="담당자 이름 입력" maxLength={30} required />
          <datalist id="sm-team-suggestions">
            {teamMembers.map((name) => <option key={name} value={name} />)}
          </datalist>
        </div>
        {/* 체크하면 부모의 toggleAttendee가 이름을 추가하고, 다시 체크하면 제거합니다.
            checked는 현재 선택 배열에 이름이 있는지로 정합니다. 직접 타이핑해 새 팀원을 만들지 않습니다.
            과거 미등록 참석자는 기존 선택을 보존하고 해제할 수 있도록 별도로 표시합니다. */}
        <fieldset className="sm-form-wide sm-team-options">
          <legend>참석자 (선택)</legend>
          {attendeeOptions.map((name) => (
            <label key={name}>
              <input type="checkbox" checked={selectedAttendees.includes(name)} onChange={() => onToggleAttendee(name)} />
              {name}{!teamMembers.includes(name) && " (미등록 기존 참석자)"}
            </label>
          ))}
          {attendeeOptions.length === 0 && <p className="sm-form-note">팀원을 등록하면 선택할 수 있습니다.</p>}
        </fieldset>

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
          시작 시간
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={onChange}
            required
          />
        </label>
        {/* 종료 시간도 form의 한 항목입니다. 입력·저장 방식은 시작 시간과 같습니다.
            min은 시작보다 이른 값을 막고, 같은 시각인지 여부는 저장 함수에서 추가로 확인합니다. */}
        <label>
          종료 시간
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={onChange}
            min={form.time}
            required
          />
        </label>
        <label>일정 상태
          <select name="status" value={form.status} onChange={onChange}>
            {scheduleStatuses.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {/* 자주 바꾸지 않는 설정은 접어 두되, 신규와 수정 모두에서 변경할 수 있습니다. */}
        <details className="sm-extra-settings sm-form-wide">
          <summary>추가 설정 · 작업 구분, 공개 범위, 반복</summary>
          <div className="sm-extra-fields">
            <label>작업 구분
              <select name="type" value={form.type} onChange={onChange}>
                {scheduleTypes.map(type => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>일정 공개 범위
              <select name="visibility" value={form.visibility} onChange={onChange}>
                <option value="shared">회사 공유 일정</option><option value="private">개인 일정</option>
              </select>
            </label>
            {!isOccurrence && <label>반복 설정
              <select name="repeatPreset" value={repeatValue} onChange={onChange}>
                <option value="none:1">반복 없음</option><option value="weekly:1">매주</option>
                <option value="weekly:2">격주</option><option value="monthly:1">매월</option>
                {!commonRepeat && <option value={repeatValue}>기존 설정 · {getRepeatLabel(form)}</option>}
              </select>
            </label>}
          </div>
          <p className="sm-form-note">개인 일정 구분은 열람 권한을 제한하지 않습니다.</p>
          {form.repeatType !== "none" && <p className="sm-form-note">{getRepeatLabel(form)} · 저장하면 전체 반복에 적용됩니다.</p>}
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
  // sort는 배열 자체를 바꾸므로 복사본만 정렬합니다.
  const sortedItems = [...items].sort(compareSchedules);
  // 화면 안에서 여러 조건을 계산하기보다 먼저 문구를 정하고 아래 JSX에 넣습니다.
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
          sortedItems.map((item) => (
            <article className="sm-list-item" key={item.id}>
              {/* 목록 제목은 item을 그대로 전달해 수정 창을 엽니다. 별 버튼은 즐겨찾기만 바꿉니다. */}
              <button
                type="button"
                className="sm-list-item-info"
                aria-label={`${item.title} 일정 수정`}
                onClick={() => onEdit(item)}
              >
                <span className="sm-list-date">
                  {item.date.replaceAll("-", ".")} · {getScheduleTime(item)}
                </span>
                <strong>{item.title}</strong>
                <ScheduleVisibility visibility={item.visibility} />
                {item.repeatType !== "none" && (
                  <small>{getRepeatLabel(item)} · 종료일 없음</small>
                )}
                <small>
                  {item.type} · {item.project} · {item.person}
                </small>
                <ScheduleAttendees item={item} />
              </button>
              <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />
            </article>
          ))
        ) : (
          <div className="sm-empty">
            {emptyMessage}
          </div>
        )}
      </div>
    </ScheduleModal>
  );
}

/* children을 이해하는 예:
 * <ScheduleModal title="새 일정" onClose={닫는함수}>
 *   <form>입력창들</form>
 * </ScheduleModal>
 * 위처럼 여는 태그와 닫는 태그 사이에 적은 <form>이 children이라는 props로 들어옵니다.
 * 아래 {children} 자리에 그대로 배치되므로 모달 테두리·제목·닫기를 한 번만 작성하고
 * 내용만 등록 폼 또는 전체 일정 목록으로 바꿀 수 있습니다.
 *
 * onClose는 함수를 받는 이름이며 특별한 리액트 예약어가 아닙니다.
 * onClick={onClose}는 클릭할 때 그 함수를 실행하라는 연결입니다.
 * onClick={onClose()}로 쓰면 화면을 만드는 도중 즉시 실행하므로 의미가 달라집니다.
 *
 * event.target은 클릭이 시작된 실제 요소이고 currentTarget은 이 이벤트를 연결한 요소입니다.
 * 배경에서 눌렀을 때는 둘 다 배경 div이지만 입력창에서 눌렀을 때 target은 입력창입니다.
 * 두 값이 같은지 비교해 모달 내부를 클릭했을 때 창이 닫히는 일을 막습니다.
 * role/aria 속성은 보조 기기에 화면의 역할·이름을 전달합니다. 자체로 포커스를 가두는 기능은 아닙니다.
 */
// 폼과 전체 목록의 공통 외곽입니다. children 위치에 각 화면의 실제 내용을 넣습니다.
// target은 실제 클릭한 요소, currentTarget은 배경이므로 둘이 같을 때만 창을 닫습니다.
// id와 aria-labelledby를 연결하면 보조 기기가 h2를 대화상자의 이름으로 읽습니다.
// headerExtra는 전체 목록 전환 버튼처럼 특정 모달에만 필요한 내용을 끼워 넣는 자리입니다.
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
