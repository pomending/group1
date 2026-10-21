import React from "react";
import { getSchedulePeople, weekDays } from "./scheduleData";

/*
 * [담당자별 주간 표의 데이터 흐름]
 * ScheduleManager: 저장 목록에서 사람 목록(people)과 날짜별 반복 발생 목록을 계산합니다.
 * ScheduleCalendar: staff 탭이 선택되면 이 컴포넌트에 같은 주간 날짜와 필터된 발생 목록을 넘깁니다.
 * 이 파일: 이번 주 필터 → 사람별 필터 → 날짜별 필터 → 시간순 정렬 순서로 표의 셀을 채웁니다.
 * 같은 회의가 두 사람의 행에 보이는 것은 데이터 복제가 아니라 하나의 일정에 대한 두 표시입니다.
 * 수정은 같은 원본 ID를 부모에 전달하므로 두 행을 따로 수정하는 구조가 아닙니다.
 */
// 부모가 계산한 주간 날짜와 반복 발생 항목을 담당자/참석자별로 나눠 보여줍니다.
// 이름 목록은 검색·공개 필터를 통과한 전체 저장 일정에서 가져옵니다.
// 따라서 이번 주에 일정이 없는 사람도, 다른 날짜에 등록되어 있다면 빈 행으로 확인할 수 있습니다.
/*
 * 입력 예시(학습용 설명이며 실제 저장 데이터에 추가되는 값이 아닙니다)
 * people = ["민수", "지수"]
 * weekDates = [{ date: Date객체, key: "2026-10-19" }, ...7개]
 * items = [{ id: "a", date: "2026-10-21", time: "15:00", person: "민수", attendees: ["지수"], ... }]
 * 결과: 수요일 열의 민수/지수 행에 같은 일정이 보이고 각각 담당/참석으로 표시됩니다.
 */
export default function ScheduleStaffWeek({
  // props 객체에서 같은 이름의 속성을 꺼내는 구조 분해 문법입니다.
  people,         // string[]: 검색·공개 필터를 통과한 중복 없는 이름 목록입니다.
  weekDates,      // { date: Date, key: string }[]: 월요일부터 계산한 7일입니다.
  items,          // 일정 객체[]: 일반 일정과 반복 계산으로 펼친 날짜별 일정입니다.
  selectedDate,   // string: 선택 강조에 사용하는 YYYY-MM-DD입니다.
  holidayDates,   // 날짜 문자열을 넣으면 공휴일 이름을 찾을 수 있는 객체입니다.
  onSelectDate,   // 함수: 날짜 문자열을 부모로 전달해 선택 상태 변경을 요청합니다.
  onOpenSchedule // 함수: 일정 객체를 부모에 넘겨 기존 수정 창을 엽니다.
}) {
  // weekDates의 { date, key } 중 key만 꺼내 7개 날짜 문자열의 Set을 만듭니다.
  // Set.has(일정 날짜)로 이번 주에 속하는지 확인해 월 단위로 넘어온 여유 날짜를 걸러냅니다.
  // ({ key }) => key는 각 객체의 key 속성만 반환합니다. 결과는 ["2026-10-19", ...]입니다.
  // 문자열로 비교하므로 서로 다른 Date객체의 참조를 직접 비교할 때 생기는 문제를 피합니다.
  const weekKeys = new Set(weekDates.map(({ key }) => key));
  // filter 콜백이 true를 반환하는 원본 항목만 새 배열에 남습니다.
  // 이번 주가 10/19~10/25이면 10/21은 통과하고 10/26은 제외됩니다. 원본은 지우지 않습니다.
  const weekItems = items.filter((item) => weekKeys.has(item.date));

  // 등록된 이름이 없으면 여기서 안내 JSX를 반환합니다. 아래 표 생성 코드는 실행하지 않습니다.
  // 사람이 있지만 이번 주 일정이 없는 경우는 다릅니다. 그때는 0건과 빈 날짜 칸을 표시합니다.
  // 0명일 때 !0은 true, 한 명 이상일 때 !양수는 false입니다.
  // 먼저 return하는 조기 반환으로 정상 표 전체를 else로 감싸지 않게 합니다.
  if (!people.length) {
    return <p className="sm-empty">담당자가 등록된 일정이 없습니다. 일정을 등록하면 주간 표에 표시됩니다.</p>;
  }

  return (
    // 내용이 넓으면 이 영역 안에서 가로 스크롤됩니다.
    // tabIndex=0은 키보드로도 스크롤 영역에 초점을 둘 수 있게 하며 aria-label은 영역 이름입니다.
    <div className="sm-staff-scroll" role="region" aria-label="담당자별 주간 일정표" tabIndex={0}>
      <table className="sm-staff-table">
        {/* caption은 표의 설명입니다. thead는 날짜 머리글, tbody는 사람별 행을 담습니다.
            th의 scope=col/row는 해당 머리글이 어느 열/행을 설명하는지 보조 기기에 알려줍니다. */}
        <caption>담당자·참석자별 주간 일정 · 같은 일정은 참여하는 사람의 행에 각각 표시됩니다.</caption>
        <thead>
          <tr>
            <th scope="col">담당자 / 참석자</th>
            {/* map의 index는 월요일=0부터 시작합니다. 토요일=5, 일요일=6으로 색상을 구분합니다.
                공휴일 이름이 있으면 토요일이어도 빨강을 우선합니다.
                aria-pressed는 선택 날짜와 비교한 값이며 아래 CSS가 선택 날짜의 밑줄도 표시합니다. */}
            {/* map의 index는 배열 위치입니다. date는 월·일 계산용 객체, key는 비교용 문자열입니다.
                => 뒤 (...)는 JSX를 바로 반환합니다. 뒤에서 {...} 본문을 쓰면 return을 직접 적어야 합니다. */}
            {weekDates.map(({ date, key }, index) => (
              <th scope="col" key={key}>
                <button
                  type="button"
                  className={`sm-week-date ${holidayDates[key] || index === 6 ? "sunday" : index === 5 ? "saturday" : ""}`}
                  // 함수를 전달하므로 클릭할 때 실행됩니다. 직접 onSelectDate(key)를 쓰면 렌더링 중 실행됩니다.
                  // 부모가 key로 상태를 갱신하면 새 selectedDate가 다시 props로 내려옵니다.
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
          {/* 바깥 map은 사람마다 한 행을 만듭니다. React key는 중복 제거된 이름입니다.
              날짜 헤더 클릭은 선택 날짜를 바꾸고, 일정 버튼 클릭은 내용을 편집하도록 다른 콜백을 사용합니다. */}
          {people.map((person) => {
            // 한 사람의 이번 주 일정만 추린 뒤 날짜별 칸에 나눕니다.
            // getSchedulePeople이 중복 이름을 제거하므로 담당자와 참석자가 같아도 한 번만 표시합니다.
            // 예: 담당자 민수/참석자 지수인 일정은 getSchedulePeople 결과에 두 이름이 모두 있습니다.
            // 민수 행과 지수 행의 filter를 각각 통과하지만 저장 원본이 두 개가 되는 것은 아닙니다.
            // includes는 배열에 현재 person과 정확히 같은 문자열이 있으면 true를 반환합니다.
            // 민수 차례이면 민수 일정만, 지수 차례이면 지수 일정만 새 배열에 담습니다.
            const personItems = weekItems.filter((item) => getSchedulePeople(item).includes(person));
            return (
              <tr key={person}>
                <th scope="row">{person}<small>{personItems.length}건</small></th>
                {/* 안쪽 map은 사람 한 명의 행 안에서 월~일의 7개 셀을 만듭니다.
                    personItems.length는 그 사람의 주간 발생 횟수이며 반복 규칙의 개수가 아닙니다. */}
                {weekDates.map(({ key }) => {
                  // filter가 새 배열을 만들기 때문에 sort해도 부모 items나 personItems 순서를 바꾸지 않습니다.
                  // 날짜를 먼저 고른 뒤 HH:mm 문자열로 비교하면 해당 칸 안에서 시간순으로 표시됩니다.
                  const dayItems = personItems
                    // ===는 자료형까지 같은지 비교합니다. 두 날짜 모두 YYYY-MM-DD 문자열입니다.
                    .filter((item) => item.date === key)
                    // 결과 음수면 a를 앞, 양수면 b를 앞, 0이면 동등한 순서로 취급합니다.
                    // "09:00"은 "15:00"보다 앞입니다. 고정 두 자리 HH:mm이라 문자열 비교가 가능합니다.
                    .sort((a, b) => a.time.localeCompare(b.time));
                  return (
                    // 한 td는 사람 한 명 × 날짜 하루의 교차점이며 선택 날짜의 열만 배경을 강조합니다.
                    <td key={key} className={selectedDate === key ? "selected" : ""}>
                      {/* 일정이 있으면 버튼 목록, 없으면 —를 표시합니다. —는 임시 일정 데이터가 아닙니다.
                          item.id는 셀 안에서 원본을 식별합니다. 다른 사람 행의 같은 ID와는 형제 목록이 달라 충돌하지 않습니다.
                          onOpenSchedule(item)은 부모의 수정 폼을 열며 저장/삭제는 이 파일에서 하지 않습니다. */}
                      {dayItems.length ? dayItems.map((item) => (
                        <button
                          type="button"
                          className="sm-event"
                          key={item.id}
                          // 바깥 {}는 JSX의 JS 표현식, 안쪽 {}는 style 객체입니다. background 속성에 색상을 전달합니다.
                          style={{ background: item.color }}
                          // 현재 콜백이 참조하는 item을 부모에 넘겨 클릭한 일정의 수정 창을 엽니다.
                          // 두 행에 표시되어도 같은 원본 ID를 전달하므로 서로 다른 저장 데이터가 아닙니다.
                          onClick={() => onOpenSchedule(item)}
                          aria-label={`${person} ${key} ${item.time} ${item.title} 상세 내용 확인 및 수정`}
                        >
                          <time>{item.time}</time>
                          <span>{item.title}</span>
                          {/* 담당자와 행 이름이 같으면 담당, 참석자 이름으로 포함된 행이면 참석입니다.
                              담당자와 참석자에 같은 이름이 있으면 담당 표시가 우선합니다. */}
                          <small>{item.person.trim() === person ? "담당" : "참석"}</small>
                        </button>
                      )) : <span className="sm-staff-empty" aria-label="일정 없음">—</span>}
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
