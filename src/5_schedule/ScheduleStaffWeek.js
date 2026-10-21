import React from "react";
import {
  getSchedulePeople,
  groupSchedulesByDate,
  weekDays,
} from "./scheduleData";
import { ScheduleEvent } from "./ScheduleItemParts";

/*
 * 사람 목록은 전체 검색 결과, items는 화면 기간에 펼친 발생 목록입니다.
 * 먼저 사람별 배열을 준비하고 일정을 한 번 순회해 담당자/참석자의 배열에 넣습니다.
 * 이후 각 사람의 배열을 날짜별로 묶으면 표의 셀에서 바로 찾을 수 있습니다.
 * 하나의 일정을 두 행에 보여도 저장 데이터를 복제하지 않고 같은 원본 ID를 사용합니다.
 */
export default function ScheduleStaffWeek({
  people,
  weekDates,
  items,
  selectedDate,
  holidayDates,
  onSelectDate,
  onOpenSchedule,
}) {
  const weekKeys = new Set(weekDates.map(({ key }) => key));
  // Map은 이름을 키로 사용하는 배열 사전입니다. 처음부터 빈 배열을 넣어 0건인 사람도 행을 유지합니다.
  const personItems = new Map(people.map((name) => [name, []]));
  items.forEach((item) => {
    if (!weekKeys.has(item.date)) return;
    getSchedulePeople(item).forEach((name) =>
      personItems.get(name)?.push(item),
    );
  });

  if (!people.length) {
    return (
      <p className="sm-empty">
        담당자가 등록된 일정이 없습니다. 일정을 등록하면 주간 표에 표시됩니다.
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
          담당자·참석자별 주간 일정 · 같은 일정은 참여하는 사람의 행에 각각
          표시됩니다.
        </caption>
        <thead>
          <tr>
            <th scope="col">담당자 / 참석자</th>
            {weekDates.map(({ date, key }, index) => (
              <th scope="col" key={key}>
                <button
                  type="button"
                  className={`sm-week-date ${holidayDates[key] || index === 6 ? "sunday" : index === 5 ? "saturday" : ""}`}
                  onClick={() => onSelectDate(key)}
                  aria-pressed={selectedDate === key}
                >
                  {date.getMonth() + 1}/{date.getDate()} ({weekDays[index]})
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((person) => {
            const rowItems = personItems.get(person);
            const dates = groupSchedulesByDate(rowItems);
            return (
              <tr key={person}>
                <th scope="row">
                  {person}
                  <small>{rowItems.length}건</small>
                </th>
                {weekDates.map(({ key }) => (
                  <td
                    key={key}
                    className={selectedDate === key ? "selected" : ""}
                  >
                    {/* 날짜 사전에 없으면 빈 셀입니다. 공통 버튼은 클릭한 item을 부모 수정 함수에 전달합니다. */}
                    {dates[key]?.length ? (
                      dates[key].map((item) => (
                        <ScheduleEvent
                          key={item.id}
                          item={item}
                          onOpen={onOpenSchedule}
                          roleLabel={
                            item.person.trim() === person ? "담당" : "참석"
                          }
                        />
                      ))
                    ) : (
                      <span className="sm-staff-empty" aria-label="일정 없음">
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
