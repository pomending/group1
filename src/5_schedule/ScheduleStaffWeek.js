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
 * expandedPerson은 현재 펼친 행의 key를 기억합니다. null이면 모두 접혀 있습니다.
 * React의 key는 행을 구분하는 표시이며 실제 화면에 출력하는 글자가 아닙니다.
 */
import React, { useEffect, useState } from "react";
import {
  getScheduleParticipants,
  groupSchedulesByDate,
  weekDays,
} from "./scheduleData";
import { ScheduleEvent } from "./ScheduleItemParts";

/* 사람은 행, 날짜는 열입니다. 담당자와 참석자에게 같은 일정을 표시하되 저장 원본은 복제하지 않습니다. 관련 일정이 없는 팀원도 빈 행을 표시합니다. */
export default function ScheduleStaffWeek({
  people,
  employees = [],
  personSearch,
  hasActiveFilter = false,
  weekDates,
  items,
  selectedDate,
  holidayDates,
  onSelectDate,
  onSelectSchedule,
  onToggleFavorite,
}) {
  const rows = [];
  const entries = items.map(item => ({ item, participants: getScheduleParticipants(item) }));
  for (const name of people) {
    const matching = [];
    for (const entry of entries) {
      for (const person of entry.participants) {
        const employee = employees.find(employee => person.id != null && String(employee.id) === String(person.id));
        if (person.name === name || employee?.name === name) matching.push(person);
      }
    }
    const ids = [...new Set(matching.map(person => person.id).filter(id => id != null))];
    const hasNameOnly = matching.some(person => person.id === null);
    if (!ids.length || hasNameOnly) rows.push({ key: "name:" + name, name, id: null });
    for (const id of ids) {
      // 저장 당시 이름이 달라도 같은 직원 번호면 이미 만든 행에 모읍니다.
      if (rows.some(row => row.id != null && String(row.id) === String(id))) continue;
      const employee = employees.find(entry => String(entry.id) === String(id));
      rows.push({ key: "employee:" + id, name: employee?.name || name, id });
    }
  }
  for (const row of rows) {
    row.label = row.name;
    if (rows.filter(other => other.name === row.name).length > 1) {
      if (row.id == null) row.label += " (이름 기준)";
      else row.label += " (직원 " + row.id + ")";
    }
  }
  // 행의 key를 기억해 한 번에 한 사람만 펼칩니다. 이름 검색이면 첫 결과를 바로 엽니다.
  const [expandedPerson, setExpandedPerson] = useState(() => {
    if (personSearch && rows.length > 0) return rows[0].key;
    return null;
  });
  const firstRowKey = rows[0]?.key ?? null;
  useEffect(() => {
    if (personSearch) setExpandedPerson(firstRowKey);
    else setExpandedPerson(null);
  }, [personSearch, firstRowKey]);
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
          : hasActiveFilter
            ? "현재 조건에 표시할 팀원이 없습니다. 검색어나 필터를 변경해 주세요."
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
          {rows.map(({ key: rowKey, name: person, label, id }) => {
            // items는 부모에서 이미 이번 주로 제한했습니다. 여기서는 사람만 확인합니다.
            const rowItems = entries.filter(entry =>
              entry.participants.some(participant => {
                if (id != null) return participant.id != null && String(participant.id) === String(id);
                return participant.id == null && participant.name === person;
              })
            ).map(entry => entry.item);
            // 사람별 목록을 다시 날짜로 묶으면 각 셀에서 dates[key]로 바로 조회할 수 있습니다.
            const dates = groupSchedulesByDate(rowItems);
            const isExpanded = expandedPerson === rowKey;
            return (
              <tr key={rowKey} className={isExpanded ? undefined : "sm-staff-collapsed"}>
                <th scope="row">
                  <button type="button" className="sm-staff-toggle" aria-expanded={isExpanded}
                    aria-label={`${label} 일정 ${isExpanded ? "접기" : "펼치기"}`}
                    onClick={() => togglePerson(rowKey)}>
                    <span>{label}</span><span aria-hidden="true">{isExpanded ? "−" : "＋"}</span>
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
                            (id != null
                              ? item.employeeId != null && String(item.employeeId) === String(id)
                              : item.employeeId == null && item.person.trim() === person) ? "담당" : "참석"
                          }
                        />
                      ))}
                      </div>
                    )}
                    {!isExpanded && dayItems.length > 0 && (
                      <button type="button" className="sm-staff-count"
                        aria-label={`${label} ${key} 일정 ${dayItems.length}건 펼치기`}
                        onClick={() => {
                          setExpandedPerson(rowKey);
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
