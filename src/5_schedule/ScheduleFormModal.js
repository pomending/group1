import React from "react";
import ScheduleModal from "./ScheduleModal";
import ScheduleTeamEditor from "./ScheduleTeamEditor";
import {
  getRepeatLabel,
  MAX_REPEAT_INTERVAL,
  repeatTypes,
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
// isOccurrence이면 반복 중 특정 날짜만 수정하므로 반복 종류를 고정합니다.
export default function ScheduleFormModal({
  form,
  teamMembers,
  onAddTeamMember,
  onToggleAttendee,
  error,
  onChange,
  onSubmit,
  onClose,
  isEditing,
  isOccurrence,
}) {
  // 문구를 먼저 정해 두면 아래 JSX에서는 화면 배치에 집중할 수 있습니다.
  let title = "새 일정 등록";
  let description = "프로젝트 작업 일정을 추가하세요.";
  let submitText = "일정 저장";
  if (isEditing) {
    title = "일정 수정";
    description = "일정 정보를 수정하고 저장하세요.";
    submitText = "수정 저장";
  }

  let repeatUnit = "개월";
  let repeatHelp = "시작 날짜부터 입력한 개월마다 반복합니다. 12개월 = 매년, 24개월 = 2년마다";
  if (form.repeatType === "weekly") {
    repeatUnit = "주";
    repeatHelp = "시작 날짜부터 입력한 주마다 반복합니다. 2주 = 격주";
  }
  // 과거 미등록 담당자는 수정 화면에서만 보존합니다. 새 일정은 등록된 팀원만 선택합니다.
  const personOptions = [...teamMembers];
  if (form.person && !personOptions.includes(form.person)) personOptions.push(form.person);
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
          <input name="project" value={form.project} onChange={onChange} placeholder="프로젝트명" required maxLength={60} />
        </label>
        <label>
          담당자
          <select name="person" value={form.person} onChange={onChange} required>
            <option value="">팀원을 선택하세요</option>
            {personOptions.map((name) => (
              <option key={name} value={name}>{name}{!teamMembers.includes(name) && " (미등록 기존 담당자)"}</option>
            ))}
          </select>
        </label>
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
        <div className="sm-form-wide">
          <p className="sm-form-note">목록에 없는 사람은 먼저 팀원으로 등록한 뒤 선택하세요.</p>
          <ScheduleTeamEditor onAdd={onAddTeamMember} />
        </div>
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
        {/* 공개 범위는 현재 화면의 분류 값입니다. 사용자별 접근 권한은 여기서 검사하지 않습니다. */}
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
            반복 간격 ({repeatUnit})
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
              {repeatHelp}
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
            {submitText}
          </button>
        </div>
        {error && <p className="sm-form-error sm-form-wide" role="alert">{error}</p>}
      </form>
    </ScheduleModal>
  );
}
