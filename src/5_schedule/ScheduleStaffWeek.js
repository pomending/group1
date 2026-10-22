import React, { useState } from "react";
import {
  getSchedulePeople,
  groupSchedulesByDate,
  weekDays,
} from "./scheduleData";
import { ScheduleEvent } from "./ScheduleItemParts";

/* 표를 읽는 기준: 사람 한 명이 한 행, 월요일~일요일의 날짜가 각 열입니다.
 * items 안에 { person: '민수', attendees: ['지수'], date: '2026-10-22', ... }가 한 건 있다면
 * 민수 행과 지수 행의 같은 날짜 칸에 모두 표시합니다. 저장된 일정을 두 건으로 만드는 것은 아닙니다.
 *
 * 각 사람의 행을 만들 때 filter로 그 사람이 담당하거나 참석하는 일정만 찾습니다.
 * 그 결과를 날짜별로 묶고 각 날짜 칸에 표시합니다.
 * people 목록에만 있고 이번 주 일정이 없는 사람도 빈 배열을 사용해 행 자체는 유지합니다.
 *
 * table/thead/tbody/tr/th/td는 리액트 전용이 아니라 HTML의 표 요소입니다.
 * 리액트의 map이 필요한 수만큼 tr과 td를 만들고, CSS가 너비·배경·스크롤을 정합니다.
 * th의 scope='row'/'col'은 이 머리글이 행/열 중 어느 쪽을 설명하는지 알려 줍니다.
 */
/*
 * 사람 목록은 전체 검색 결과, items는 화면 기간에 펼친 발생 목록입니다.
 * 사람마다 일정을 찾은 다음 날짜별로 묶으면 표의 셀에서 바로 찾을 수 있습니다.
 * 하나의 일정을 두 행에 보여도 저장 데이터를 복제하지 않고 같은 원본 ID를 사용합니다.
 */
export default function ScheduleStaffWeek({
  people,
  personSearch,
  weekDates,
  items,
  selectedDate,
  holidayDates,
  onSelectDate,
  onOpenSchedule,
}) {
  // 이름 하나만 기억해 한 번에 한 사람의 일정만 펼칩니다. 이름 검색이면 첫 결과를 바로 엽니다.
  const [expandedPerson, setExpandedPerson] = useState(() => {
    if (personSearch && people.length > 0) return people[0];
    return null;
  });
  function togglePerson(person) {
    if (expandedPerson === person) setExpandedPerson(null);
    else setExpandedPerson(person);
  }
  const weekKeys = weekDates.map((day) => day.key);

  if (!people.length) {
    return (
      <p className="sm-empty">
        등록된 팀원이 없습니다. 팀원 목록에서 먼저 등록해 주세요.
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
          담당자·참석자별 주간 일정 · 회사 공유와 개인 일정은 배지로 구분합니다.
          <br />이름 옆 ＋로 펼쳐 보세요. 한 번에 한 사람만 펼칩니다.
        </caption>
        <thead>
          <tr>
            <th scope="col">담당자 / 참석자</th>
            {weekDates.map(({ date, key }, index) => {
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
            const rowItems = items.filter((item) => {
              const isThisWeek = weekKeys.includes(item.date);
              const isParticipant = getSchedulePeople(item).includes(person);
              return isThisWeek && isParticipant;
            });
            // 사람별 목록을 다시 날짜로 묶으면 각 셀에서 dates[key]로 바로 조회할 수 있습니다.
            const dates = groupSchedulesByDate(rowItems);
            const isExpanded = expandedPerson === person;
            return (
              <tr key={person} className={isExpanded ? "sm-staff-expanded" : "sm-staff-collapsed"}>
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
                          onOpen={onOpenSchedule}
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
