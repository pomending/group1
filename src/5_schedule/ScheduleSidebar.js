/* [오른쪽 목록의 기준이 서로 다른 이유]
 * 즐겨찾기는 검색과 날짜 이동에 관계없이 고정해 둔 원본 일정을 보여줍니다.
 * 선택한 날짜 일정은 현재 선택 날짜에 실제로 발생하는 일정과 필터 결과를 보여줍니다.
 * 다가오는 일정은 전체 원본에서 완료하지 않은 가까운 발생 일정을 계산해 보여줍니다.
 * 이 세 목록은 목적이 달라 같은 검색 결과 배열 하나로 합치면 필요한 일정이 가려질 수 있습니다.
 * props로 전달한 onEdit, onDelete는 Manager의 함수입니다. 목록은 실행할 대상을 인자로 전달할 뿐입니다.
 * 원본 반복 일정과 날짜별 발생 일정은 수정 범위가 다르므로 부모가 준 객체를 그대로 넘깁니다.
 */
import { ScheduleAgendaItem, ScheduleAttendees, ScheduleFavorite, ScheduleVisibility, ScheduleIcon } from "./ScheduleItemParts";
import React from "react";
import { weekDays, getScheduleTime, getRepeatLabel } from "./scheduleData";
import ScheduleDirectory from "./ScheduleDirectory";

/* 같은 원본 일정에서 여러 화면용 목록이 나오는 이유
 * directoryItems: 전체 원본입니다. 프로젝트·팀원 목록은 현재 월에 일정이 없어도 사람/이름을 보여줍니다.
 * favoriteItems: 전체 저장 자료 중 사용자가 별표를 누른 일정입니다. 검색·표시 월과 무관합니다.
 * selectedItems: 현재 선택한 하루의 일정입니다. 프로젝트 선택 조건도 부모에서 적용되어 내려옵니다.
 * upcomingSchedules: 오늘 포함 7일 이내의 시작 전·진행 중인 미완료 일정 중 가까운 5건입니다.
 *
 * Sidebar는 이 배열들을 별도 state로 다시 복사하지 않습니다. 부모가 준 값을 그대로 표시합니다.
 * 만약 같은 값을 자식 state에도 저장하면 부모는 바뀌었는데 자식은 옛 목록인 문제가 생길 수 있습니다.
 * 부모가 원본을 관리하고 자식은 props로 표시하는 구조를 따라가면 값이 어디서 바뀌는지 찾기 쉽습니다.
 */
// [공부 순서 5] 선택 날짜의 결과를 보여 주는 영역입니다.
// 검색·공개 필터와 반복 계산은 이미 부모에서 처리되므로 여기서는 받은 배열만 표시합니다.
// 부모가 넘겨준 선택 날짜의 일정과 가까운 미완료 일정 목록을 보여줍니다.
// 수정·삭제·완료 여부 변경은 실제 데이터를 관리하는 부모 함수에 맡깁니다.
export default function ScheduleSidebar({
  directoryMode,
  directoryItems,
  teamMembers,
  onAddTeamMember,
  onRemoveTeamMember,
  selectedProject,
  onSelectProject,
  onClearProject,
  onCloseDirectory,
  favoriteItems,
  onToggleFavorite,
  onSelectFavorite,
  selectedDate,
  selectedDateObject,
  selectedHoliday,
  selectedItems,
  upcomingSchedules,
  currentTime,
  onSelectUpcoming,
  onDelete,
  onEdit,
  onStatusChange,
}) {
  return (
    <aside className="sm-sidebar">
      {/* key가 바뀌면 팀원 선택도 초기화됩니다. 목록의 자료는 검색과 무관한 저장 원본입니다. */}
      {/* onSelectProject를 그대로 전달해 자식 Directory의 클릭이 Manager까지 올라가도록 연결합니다.
          Sidebar는 프로젝트 선택을 따로 저장하지 않아 부모와 선택값이 어긋나지 않습니다. */}
      {directoryMode && (
        <ScheduleDirectory key={directoryMode} mode={directoryMode} items={directoryItems} teamMembers={teamMembers} onAddTeamMember={onAddTeamMember} onRemoveTeamMember={onRemoveTeamMember} selectedProject={selectedProject} onSelectProject={onSelectProject} onClose={onCloseDirectory} />
      )}
      {/* 즐겨찾기는 검색 결과를 복사하지 않습니다. 원본 일정의 별표 상태로 매번 목록을 만듭니다.
          반복 일정은 원본 한 건만 표시해 무한히 늘어나지 않으며 수정·상태 변경은 전체 규칙에 적용됩니다. */}
        <section className="sm-card" aria-labelledby="sm-favorites-title">
          <div className="sm-panel-title">
            <h3 id="sm-favorites-title">★ 즐겨찾기</h3>
            <span className="sm-muted" role="status">{favoriteItems.length}건</span>
          </div>
          <p className="sm-search-summary">별표로 모아둔 일정입니다. 반복 일정의 변경은 전체에 적용됩니다.</p>
          <div className="sm-favorite-list">
            {/* 즐겨찾기는 좁은 카드에서 읽으므로 시간과 내용을 고정된 가로 열로 나누지 않습니다.
                map은 favoriteItems의 일정마다 아래 article을 하나씩 만듭니다. 항목의 정보와
                버튼을 위에서 아래로 직접 배치하면 시간을 위한 고정 열에 제목이 눌리지 않습니다. */}
            {favoriteItems.map((item) => (
              <article className="sm-favorite-item" key={item.id} style={{ "--sm-event-color": item.color }}>
                <div className="sm-favorite-heading">
                  {/* 제목을 누르면 수정 창이 열립니다. 별은 별도로 눌러 즐겨찾기를 해제합니다. */}
                  <button type="button" className="sm-favorite-title" onClick={() => onEdit(item)}
                    aria-label={`${item.title} 일정 수정`}>
                    <strong>{item.title}</strong>
                  </button>
                  <ScheduleFavorite item={item} onToggleFavorite={onToggleFavorite} />
                </div>
                <div className="sm-favorite-time-row">
                  <span className="sm-favorite-time">
                    <ScheduleIcon name="clock" />
                    <time>{getScheduleTime(item)}</time>
                  </span>
                  <ScheduleVisibility visibility={item.visibility} />
                </div>
                {/* dl은 이름과 값의 묶음입니다. dt는 '프로젝트' 같은 설명 이름,
                    dd는 실제 값입니다. 두 줄로 나눠 제목·프로젝트·담당자가 섞이지 않게 합니다. */}
                <dl className="sm-favorite-info">
                  <dt>프로젝트</dt><dd>{item.project || "프로젝트 없음"}</dd>
                  <dt>담당자</dt><dd>{item.person}</dd>
                </dl>
                {/* 참석자가 있는 일정은 기존처럼 명단도 표시하고, 없으면 이 부품이 아무것도 만들지 않습니다. */}
                <ScheduleAttendees item={item} paragraph />
                <button type="button" className="sm-favorite-date"
                  aria-label={`${item.title} 즐겨찾기 일정으로 이동`} onClick={() => onSelectFavorite(item)}>
                  <span>
                    <time dateTime={item.date}>{item.date.replaceAll("-", ".")}</time>
                    {item.repeatType !== "none" && <span className="sm-favorite-repeat"> · {getRepeatLabel(item)}</span>}
                  </span>
                  <span className="sm-favorite-calendar-link">달력 보기 <span aria-hidden="true">↗</span></span>
                </button>
              </article>
            ))}
            {favoriteItems.length === 0 && (
              <div className="sm-empty">선택한 날짜 또는 전체 일정에서 ☆ 별을 눌러 추가하세요.</div>
            )}
          </div>
        </section>
      {/* sm-card는 카드의 공통 모양이고 sm-agenda-card는 선택 날짜 카드만 꾸미기 위한 이름입니다.
          className에 공백으로 여러 이름을 쓰면 두 CSS 규칙이 같은 요소에 함께 적용됩니다. */}
      <section className="sm-card sm-agenda-card">
        <div className="sm-panel-title">
          <h3>선택한 날짜 일정</h3>
          <span className="sm-muted">{selectedItems.length}건</span>
        </div>
        {/* 프로젝트 선택이 적용 중임을 표시하고 해제하면 해당 날짜의 전체 검색 결과로 돌아갑니다. */}
        {selectedProject && (
          <div className="sm-selected-project">
            <strong>{selectedProject}</strong>
            {/* 해제는 프로젝트 조건만 없앱니다. 선택한 날짜와 나머지 검색 조건은 유지됩니다. */}
            <button type="button" className="sm-list-all-btn" onClick={onClearProject}>프로젝트 선택 해제</button>
          </div>
        )}
        {/* replaceAll은 저장 형식을 바꾸지 않고 표시용 점 구분 날짜를 만듭니다.
            getDay의 일요일=0을 월요일 시작 배열에 맞추려 (요일+6)%7로 변환합니다. */}
        <div className="sm-agenda-date">
          {/* getDate()는 날짜에서 '일', getMonth()는 '월'을 가져옵니다. JavaScript의 월은
              1월을 0으로 세므로 화면에 표시할 때만 1을 더합니다. 이 큰 숫자는 빠르게 날짜를
              확인하는 장식이며, 정확한 날짜는 아래 글자에 이미 있으므로 중복 낭독을 막습니다. */}
          <div className="sm-agenda-day" aria-hidden="true">
            <strong>{selectedDateObject.getDate()}</strong>
            <span>{selectedDateObject.getMonth() + 1}월</span>
          </div>
          <span className="sm-date-subtitle">
            {selectedDate.replaceAll("-", ".")} (
            {weekDays[(selectedDateObject.getDay() + 6) % 7]})
            {selectedHoliday && (
              <>
                {" "}
                · <strong>{selectedHoliday}</strong>
              </>
            )}
          </span>
        </div>
        {/* 일정이 있으면 항목을 반복하고, 없으면 빈 상태 안내를 표시합니다. */}
        {selectedItems.length ? (
          selectedItems.map((item) => (
            // 같은 반복 일정도 날짜가 다르면 별개의 행입니다. key에 ID와 날짜를 함께 사용합니다.
            <ScheduleAgendaItem key={`${item.id}-${item.date}`} item={item}
              onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} onToggleFavorite={onToggleFavorite} />
          ))
        ) : (
          <div className="sm-empty">등록된 일정이 없습니다.</div>
        )}
      </section>

      <section className="sm-card sm-upcoming-card">
        <div className="sm-panel-title">
          <h3>다가오는 일정</h3>
          <span className="sm-muted">{upcomingSchedules.length}건</span>
        </div>
        {/* 목록의 기준을 화면에도 적어 둡니다. 부모가 계산해 준 결과의 뜻을 설명할 뿐,
            여기서 날짜를 다시 계산하거나 일정을 추가로 걸러 내지는 않습니다. 아이콘은 장식입니다. */}
        <p className="sm-panel-description">
          <span aria-hidden="true"><ScheduleIcon name="clock" /></span>
          오늘부터 7일 이내의 미완료 일정 중 가까운 5건입니다.
        </p>
        {/* 부모가 시작·종료 시각을 비교한 결과를 표시합니다. 같은 반복 원본도 발생 날짜가 다르면
            별개의 일정이므로 key에는 id와 date를 함께 씁니다. 클릭하면 해당 날짜의 일별 화면을 엽니다. */}
        {upcomingSchedules.map((item) => {
          // 업무 상태와 별개로 현재 시각이 시작 전인지 알려 줍니다. 시계가 갱신되면 표시도 바뀝니다.
          const startTime = new Date(`${item.date}T${item.time}`).getTime();
          let phase = "예정";
          if (startTime <= currentTime) phase = "진행 중";
          return (
          <button
            className="sm-deadline"
            key={`${item.id}-${item.date}`}
            onClick={() => onSelectUpcoming(item.date)}
          >
            <div className="sm-deadline-dot" style={{ background: item.color }} />
            <div>
              <strong>{item.title}</strong>
              <span className="sm-upcoming-phase">{phase}</span>
              <small>
                {item.date.slice(5).replace("-", ".")} {getScheduleTime(item)} · {item.project}
              </small>
            </div>
          </button>
          );
        })}
        {!upcomingSchedules.length && (
          <div className="sm-empty">다가오는 일정이 없습니다.</div>
        )}
      </section>
    </aside>
  );
}
