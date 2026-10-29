/* [파일 안내] 담당자별 주간 일정 표
 * 입력: Manager → Calendar를 거친 주간 일정과 팀원 목록
 * 일정을 담당자·참석자 행에 배치하며 저장 목록을 복제하지 않습니다.
 * 출력: 일정 선택·즐겨찾기 요청 → Calendar의 콜백 → Manager
 */

/* [사람별 표가 만들어지는 예]
 * 일정 한 건의 담당자가 민수, 참석자가 지수라면 같은 일정을 두 사람 행에서 확인할 수 있습니다.
 * 화면에 두 번 보여도 저장된 일정 객체가 두 개로 복제되는 것은 아닙니다.
 * people은 표시할 팀원 이름 배열, items는 부모가 이번 주 범위로 이미 펼쳐 준 일정 배열입니다.
 * filter로 한 사람이 관련된 일정만 고르고 날짜별로 묶어 월요일부터 일요일 칸에 배치합니다.
 * expandedPerson은 현재 펼친 이름 하나를 기억합니다. null이면 모두 접혀 있습니다.
 * React의 key는 행을 구분하는 표시이며 실제 화면에 출력하는 글자가 아닙니다.
 */
import React, { useState } from "react";
import {
  getSchedulePeople,
  groupSchedulesByDate,
  weekDays,
} from "./scheduleData";
import { ScheduleEvent } from "./ScheduleItemParts";

/* 사람은 행, 날짜는 열입니다. 담당자와 참석자에게 같은 일정을 표시하되 저장 원본은 복제하지 않습니다. 관련 일정이 없는 팀원도 빈 행을 표시합니다. */
export default function ScheduleStaffWeek({
  people,
  personSearch,
  weekDates,
  items,
  selectedDate,
  holidayDates,
  onSelectDate,
  onSelectSchedule,
  onToggleFavorite,
}) {
  // 이름 하나만 기억해 한 번에 한 사람의 일정만 펼칩니다. 이름 검색이면 첫 결과를 바로 엽니다.
  const [expandedPerson, setExpandedPerson] = useState(() => {
    if (personSearch && people.length > 0) return people[0];
    return null;
  });
  // 담당자 행 옆의 ＋/− 버튼이 이 함수를 호출합니다.
  // 다른 사람을 누르면 기존 행을 접고 새 행만 펼쳐 표가 지나치게 길어지는 것을 줄입니다.
  function togglePerson(person) {
    if (expandedPerson === person) setExpandedPerson(null);
    else setExpandedPerson(person);
  }

  if (!people.length) {
    return (
      <p className="sm-empty">
        {personSearch
          ? "검색한 이름과 일치하는 팀원이 없습니다. 검색어를 변경해 주세요."
          : "등록된 팀원이 없습니다. 팀원 목록에서 먼저 등록해 주세요."}
      </p>
    );
  }

  return (
    <div
      className="sm-staff-scroll"
      role="region"
      aria-label="담당자별 주간 일정표"
      tabIndex={0}
    >
      <table className="sm-staff-table">
        <caption>
          {personSearch && <strong>‘{personSearch}’ 이름 검색 결과 · </strong>}
          담당자·참석자별 주간 일정 · 공유 구분은 회사 공유·개인 표시 배지로 안내합니다.
          <br />이름 옆 ＋로 펼쳐 보세요. 한 번에 한 사람만 펼칩니다.
        </caption>
        <thead>
          <tr>
            <th scope="col">담당자 / 참석자</th>
            {weekDates.map(({ key }, index) => {
              let dayClass = "";
              if (holidayDates[key] || index === 6) dayClass = "sunday";
              else if (index === 5) dayClass = "saturday";
              return (
                <th scope="col" key={key}>
                  <button
                    type="button"
                    className={`sm-week-date ${dayClass}`}
                    onClick={() => onSelectDate(key)}
                    aria-pressed={selectedDate === key}
                  >
                    {key.slice(5).replace("-", "/")} ({weekDays[index]})
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {people.map((person) => {
            // items는 부모에서 이미 이번 주로 제한했습니다. 여기서는 사람만 확인합니다.
            const rowItems = items.filter((item) => getSchedulePeople(item).includes(person));
            // 사람별 목록을 다시 날짜로 묶으면 각 셀에서 dates[key]로 바로 조회할 수 있습니다.
            const dates = groupSchedulesByDate(rowItems);
            const isExpanded = expandedPerson === person;
            return (
              <tr key={person} className={isExpanded ? undefined : "sm-staff-collapsed"}>
                <th scope="row">
                  <button type="button" className="sm-staff-toggle" aria-expanded={isExpanded}
                    aria-label={`${person} 일정 ${isExpanded ? "접기" : "펼치기"}`}
                    onClick={() => togglePerson(person)}>
                    <span>{person}</span><span aria-hidden="true">{isExpanded ? "−" : "＋"}</span>
                  </button>
                  <small>{rowItems.length}건</small>
                </th>
                {weekDates.map(({ key }) => {
                  const dayItems = dates[key] || [];
                  return (
                  <td
                    key={key}
                    className={selectedDate === key ? "selected" : ""}
                  >
                    {/* 접힌 행은 날짜별 건수만 표시하고, 펼친 사람만 실제 일정 버튼을 만듭니다.
                        일정이 많을 때는 셀 안에서 스크롤하므로 표 전체가 끝없이 늘어나지 않습니다. */}
                    {isExpanded && dayItems.length > 0 && (
                      <div className="sm-staff-events">
                      {dayItems.map((item) => (
                        <ScheduleEvent
                          key={item.id}
                          item={item}
                          onSelect={onSelectSchedule}
                          onToggleFavorite={onToggleFavorite}
                          roleLabel={
                            item.person.trim() === person ? "담당" : "참석"
                          }
                        />
                      ))}
                      </div>
                    )}
                    {!isExpanded && dayItems.length > 0 && (
                      <button type="button" className="sm-staff-count"
                        aria-label={`${person} ${key} 일정 ${dayItems.length}건 펼치기`}
                        onClick={() => {
                          setExpandedPerson(person);
                          onSelectDate(key);
                        }}>
                        {dayItems.length}건 ＋
                      </button>
                    )}
                    {dayItems.length === 0 && (
                      <span className="sm-staff-empty" aria-label="일정 없음">
                        —
                      </span>
                    )}
                  </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
