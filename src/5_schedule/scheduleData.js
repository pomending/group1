/*
 * [공부 순서 1] 공통 데이터와 날짜 계산
 * React 화면과 관계없이 입력값을 받아 결과를 돌려주는 함수들을 모은 파일입니다.
 * export한 값은 다른 파일에서 import해서 사용하며, 종류·색상을 한 곳에서 관리합니다.
 */
/* 이 파일은 리액트보다 자바스크립트의 데이터 계산을 먼저 공부하기 좋은 부분입니다.
 *
 * 객체와 배열 예시:
 *   일정 객체 하나 = { id: 'a', title: '주간 회의', date: '2026-10-22', person: '민수' }
 *   일정 배열      = [일정객체1, 일정객체2, ...]
 * item.title은 객체의 제목을 읽고 items[0]은 배열의 첫 번째 일정을 읽습니다.
 *
 * 이 코드에서 자주 쓰는 배열 함수:
 * - filter(조건함수): 조건이 true인 원소만 남긴 새 배열. 예: 담당자가 민수인 일정만 남기기.
 * - map(변환함수): 각 원소를 다른 값으로 바꾼 새 배열. 예: 일정들에서 project 이름만 꺼내기.
 * - for...of: 배열의 값을 앞에서부터 하나씩 꺼내 반복합니다. 결과는 새 배열에 push로 담습니다.
 * - sort(비교함수): 순서 바꾸기. 다른 함수들과 달리 호출한 배열 자체를 수정하므로 복사 여부를 확인합니다.
 * - includes(값): 그 값이 배열에 있는지, 또는 문자열에 해당 글자가 포함되는지 확인해 true/false를 반환합니다.
 *
 * 기본 문법 예시:
 *   const getTitle = (item) => item.title;
 * =>는 함수를 만드는 문법이며 위 함수는 item을 받아 title을 반환합니다.
 * => { ... }처럼 중괄호 본문을 쓰면 값을 돌려줄 때 return을 명시해야 합니다.
 * value ?? 기본값은 value가 null/undefined일 때만 기본값을 사용합니다.
 * value || 기본값은 빈 문자열, 0, false처럼 거짓으로 취급되는 값에도 기본값을 사용합니다.
 *
 * 반복 일정에서 반드시 구분할 두 값:
 * 저장 원본은 '10월 22일부터 매주'라는 규칙 하나이고 화면 목록은 22일·29일 등 실제 발생일입니다.
 * 발생 목록을 만들 때 원본 id를 유지하고 occurrenceDate를 추가해 어느 날짜의 한 번인지 표시합니다.
 * 그래서 규칙 하나에서 여러 화면 항목이 나와도 원본 저장 개수가 그만큼 늘어나지는 않습니다.
 */
// 달력의 요일 순서와 등록 폼에서 선택할 수 있는 작업 종류입니다.
export const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
export const scheduleTypes = [
  "기획",
  "디자인",
  "제작",
  "검수",
  "마감",
  "출고",
  "기타",
];
// value는 저장·비교에 쓰는 내부 값이고, label은 사용자에게 보여 주는 이름입니다.
// 주간/월간은 단위이고 repeatInterval은 그 단위가 몇 번 지날 때 반복할지 나타냅니다.
export const repeatTypes = [
  { value: "none", label: "반복 없음" },
  { value: "weekly", label: "주간" },
  { value: "monthly", label: "월간" },
];

export const MAX_REPEAT_INTERVAL = 120;
// 기존 biweekly=true 데이터도 2주 간격으로 읽습니다. 새 데이터의 숫자 간격을 우선합니다.
export const getRepeatInterval = (item) => {
  if (item.repeatType === "none") return 1;
  let interval = item.repeatInterval;
  if (interval === null || interval === undefined) {
    interval = 1;
    if (item.repeatType === "weekly" && item.biweekly) interval = 2;
  }
  const value = Number(interval);
  if (!Number.isInteger(value) || value < 1 || value > MAX_REPEAT_INTERVAL) return 1;
  return value;
};

// 화면 문구와 저장값을 구분합니다. 작업 종류(디자인/제작 등)와 진행 상태는 별개입니다.
export const scheduleStatuses = [
  { value: "pending", label: "업무 진행 전", shortLabel: "진행 전" },
  { value: "in_progress", label: "업무 중", shortLabel: "업무 중" },
  { value: "completed", label: "업무 완료", shortLabel: "완료" },
];
// 저장값이 기존 코드에 없는 상태이거나 누락됐을 때 기본값을 반환합니다.
export function normalizeStatus(value) {
  for (const status of scheduleStatuses) {
    if (status.value === value) return value;
  }
  return "pending";
}

// 작업 종류에 따라 달력 일정 막대에 사용할 색을 정합니다.
export const typeColors = {
  기획: "#8066e8",
  디자인: "#8066e8",
  제작: "#e99a43",
  검수: "#39a58a",
  마감: "#e36c79",
  출고: "#5491d5",
  기타: "#738096",
};

// 월과 일이 한 자리여도 두 자리 문자열로 만들어 날짜 형식을 통일합니다.
// 예: String(3)은 "3", padStart(2, "0")를 적용하면 "03"이 됩니다.
// 월·일 자릿수가 같아야 날짜 문자열도 시간 순서대로 비교할 수 있습니다.
const pad = (number) => String(number).padStart(2, "0");

// 날짜를 일정 검색과 저장에 사용하는 YYYY-MM-DD 문자열로 변환합니다.
// getMonth()는 0~11을 반환하므로 실제 월을 표시할 때 1을 더합니다.
// toISOString() 대신 현지 날짜의 각 부분을 읽어 UTC 변환으로 날짜가 바뀌는 것을 피합니다.
export const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// 오늘 날짜는 화면이 자정을 넘겨도 다시 계산할 수 있도록 함수로 제공합니다.
export const getTodayKey = () => dateKey(new Date());

// 문자열 모양뿐 아니라 실제 존재하는 날짜인지 확인합니다. 2월 31일처럼 자동 보정된 날짜는 거릅니다.
export function isValidScheduleDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00");
  return !Number.isNaN(date.getTime()) && dateKey(date) === value;
}

export function isValidScheduleTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// 고정 자릿수 날짜·시간은 문자열 순서가 시간 순서와 같습니다. 모든 목록에서 같은 비교 함수를 씁니다.
export const compareSchedules = (a, b) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

// 시작 시간은 기존 time에 유지합니다. 예전 자료는 종료 시간이 없으므로 오후 5시로 표시합니다.
export function getScheduleTime(item) {
  const endTime = item.endTime || "17:00";
  return item.time + "~" + endTime;
}

// 선택 날짜를 복사해 월요일로 되돌린 뒤 7일을 만듭니다. state의 Date를 직접 바꾸지 않습니다.
export const getWeekDates = (date) => {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const days = [];
  for (let index = 0; index < 7; index += 1) {
    const day = new Date(monday);
    day.setDate(day.getDate() + index);
    days.push({ date: day, key: dateKey(day) });
  }
  return days;
};

// 매 칸에서 전체 목록을 filter/sort하는 대신, 한 번 정렬하고 날짜별 배열을 만듭니다.
// 예: { "2026-10-21": [일정1, 일정2] }. 배열을 복사해 정렬하므로 원본 순서는 유지됩니다.
export const groupSchedulesByDate = (items) => {
  const groups = {};
  const sortedItems = [...items].sort(compareSchedules);
  for (const item of sortedItems) {
    // 이 날짜를 처음 만나면 빈 배열을 만들고, 그 배열에 일정을 하나씩 넣습니다.
    if (!groups[item.date]) groups[item.date] = [];
    groups[item.date].push(item);
  }
  return groups;
};

// 제외 날짜는 새 배열에 담습니다. includes로 이미 들어 있는 날짜인지 먼저 확인합니다.
export function excludeOccurrence(item, date) {
  const excludedDates = [];
  for (const savedDate of item.excludedDates || []) {
    if (!excludedDates.includes(savedDate)) excludedDates.push(savedDate);
  }
  if (!excludedDates.includes(date)) excludedDates.push(date);
  return { ...item, excludedDates };
}

// 일정 등록 폼을 새로 열거나 저장한 뒤 초기화할 때 사용합니다.
// 객체 상수 하나를 공유하지 않고 호출할 때마다 새로운 객체와 최신 오늘 날짜를 만듭니다.
// () => ({ ... })의 괄호는 중괄호를 함수 본문이 아닌 반환할 객체로 해석하게 합니다.
export const createEmptyForm = () => ({
  date: getTodayKey(),
  time: "09:00",
  endTime: "17:00",
  title: "",
  description: "",
  project: "",
  person: "",
  // 입력 중에는 문자열로 둡니다. 저장 시 normalizeAttendees가 배열로 바꿉니다.
  // 예: 입력 "민수, 지수" → 저장 ["민수", "지수"] → 수정 입력 "민수, 지수".
  attendees: "",
  type: "기획",
  status: "pending",
  repeatType: "none",
  repeatInterval: 1,
  visibility: "shared",
});

// 기본 폼의 키만 골라 저장용 ID나 occurrenceDate가 입력 객체에 섞이지 않게 합니다.
// 참석자 배열은 입력용 문자열로 바꾸고, 반복 한 번 수정은 일반 일정으로 분리할 준비를 합니다.
export const createScheduleForm = (item) => {
  const form = createEmptyForm();
  if (!item) return form;
  // for...in은 객체의 속성 이름을 하나씩 꺼냅니다. 폼에 원래 있는 항목만 복사합니다.
  for (const name in form) {
    if (item[name] !== null && item[name] !== undefined) form[name] = item[name];
  }
  form.attendees = normalizeAttendees(item.attendees).join(", ");
  form.repeatType = item.repeatType || "none";
  form.repeatInterval = getRepeatInterval(item);
  if (item.occurrenceDate) {
    form.repeatType = "none";
    form.repeatInterval = 1;
  }
  return form;
};

/*
 * 문자열/배열/누락값을 같은 이름 배열로 통일합니다. 빈 입력은 []이므로 선택 입력으로 저장됩니다.
 * " 민수,지수,민수,, " → 공백 제거·빈 이름 제거 → 중복 제거 → ["민수", "지수"].
 * 입력 종류 확인 → 이름을 하나씩 검사 → 공백 제거 → 중복 확인 순서로 읽으면 됩니다.
 */
export const normalizeAttendees = (value) => {
  // 정규식의 대괄호는 포함된 문자 중 하나를 뜻합니다.
  // 여기서는 일반 쉼표, 전각 쉼표, 줄바꿈을 각각 이름 구분자로 취급합니다.
  let names = [];
  if (Array.isArray(value)) names = value;
  else if (typeof value === "string") names = value.split(/[,，\n]/);

  const result = [];
  for (const name of names) {
    // continue는 이번 이름만 건너뛰고 다음 이름으로 이동합니다.
    if (typeof name !== "string") continue;
    const trimmedName = name.trim();
    if (trimmedName === "") continue;
    if (!result.includes(trimmedName)) result.push(trimmedName);
  }
  return result;
};

// 담당자와 참석자를 하나의 이름 배열로 합쳐 사람별 표·검색·팀원 수에서 재사용합니다.
// 담당자="민수", 참석자=["민수", "지수"]이면 중복을 제거한 ["민수", "지수"]를 반환합니다.
// 현재는 이름 문자열로 사람을 구분하므로 같은 이름은 한 사람으로 취급합니다.
export const getSchedulePeople = (item) =>
  normalizeAttendees([
    // ||는 왼쪽이 빈 문자열/undefined 등 거짓으로 평가되면 오른쪽 기본값을 사용합니다.
    item.person || "",
    // ...가 없으면 [담당자, [참석자들]]로 중첩됩니다. 펼쳐야 이름들이 한 배열에 나란히 들어갑니다.
    // normalizeAttendees가 누락값도 배열로 보장하므로 펼치기를 안전하게 사용할 수 있습니다.
    ...normalizeAttendees(item.attendees),
  ]);

// 반복 일정은 규칙 하나만 저장하고, 보고 있는 기간에 해당하는 날짜만 계산합니다.
// 이렇게 하면 종료일 없이 먼 미래의 달로 이동해도 같은 규칙을 적용할 수 있습니다.
/*
 * 저장 데이터와 화면 데이터의 차이
 * - items에는 반복 시작 날짜(date), 시간(time), 반복 종류(repeatType)를 한 번만 저장합니다.
 * - fromKey~toKey는 화면에 필요한 조회 범위이며 양쪽 끝 날짜를 모두 포함합니다.
 * - 반환값은 이 범위 안에서 실제로 나타날 날짜별 일정 목록입니다. 원본 items는 수정하지 않습니다.
 * - id는 원본 일정의 ID를 유지하고 occurrenceDate를 붙여 '반복 중 특정 날짜'임을 표시합니다.
 *   Manager는 이 값을 보고 원본 전체를 바꿀지, 한 날짜만 수정·삭제할지 판단합니다.
 * - time은 날짜 계산에 사용하지 않고 원본에서 복사하므로 매번 같은 시각이 유지됩니다.
 */
export const expandSchedules = (items, fromKey, toKey) => {
  // 시간 없는 YYYY-MM-DD만 파싱하면 UTC로 해석될 수 있어 현지 자정 시간을 명시합니다.
  const from = new Date(fromKey + "T00:00:00");
  const to = new Date(toKey + "T00:00:00");
  // 저장 목록은 그대로 두고 화면에 표시할 발생일만 새 배열에 모읍니다.
  const result = [];
  for (const item of items) {
    if (item.repeatType !== "weekly" && item.repeatType !== "monthly") {
      if (item.date >= fromKey && item.date <= toKey) result.push(item);
      continue;
    }
    const start = new Date(item.date + "T00:00:00");
    // 잘못된 시작일이나 조회 종료일보다 늦게 시작하는 규칙은 펼칠 필요가 없습니다.
    if (Number.isNaN(start.getTime()) || start > to) continue;
    // 주간·월간 계산에서 공통으로 사용하는 추가 함수입니다.
    // 날짜 범위를 다시 확인하고, 사용자가 삭제·수정해 제외한 날짜는 건너뜁니다.
    const addOccurrence = (date) => {
      const key = dateKey(date);
      if (
        date >= start &&
        date >= from &&
        date <= to &&
        !(item.excludedDates || []).includes(key)
      ) {
        // ...item으로 제목·시간·내용 등을 복사한 뒤 화면용 날짜만 덮어씁니다.
        // occurrenceDate는 저장된 원본에는 없고, 계산된 반복 항목에만 붙습니다.
        result.push({ ...item, date: key, occurrenceDate: key });
      }
    };
    if (item.repeatType === "weekly") {
      // 주 수를 일 수로 바꿉니다. 1주는 7일, 2주는 격주, 3주는 21일 간격입니다.
      const interval = getRepeatInterval(item) * 7;
      // 조회 시작일과 반복 시작일 중 늦은 쪽에서 탐색합니다. 과거의 모든 주를 순회하지 않습니다.
      // Date를 복사해 아래 setDate가 from이나 start 객체를 변경하지 않도록 합니다.
      const date = new Date(from > start ? from : start);
      // UTC로 날짜 차이만 계산해 계절별 시간 변경에도 시작일 기준 간격을 유지합니다.
      const dayNumber = (value) =>
        Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) /
        86400000;
      // 하루의 밀리초 수는 24 * 60 * 60 * 1000 = 86400000입니다.
      // 날짜를 UTC 일수로 바꿔 뺄셈하면 시간대의 하루 길이 차이를 피할 수 있습니다.
      const elapsed = dayNumber(date) - dayNumber(start);
      // elapsed % interval은 시작일부터 몇 일이 남는지 나타냅니다.
      // (interval - 나머지) % interval은 다음 반복일까지 이동할 일수입니다.
      // 예: 14일 주기에서 7일 뒤부터 조회하면 7일 더 이동하고, 이미 반복일이면 0일 이동합니다.
      const daysUntilNext = (interval - (elapsed % interval)) % interval;
      date.setDate(date.getDate() + daysUntilNext);
      // 첫 반복일을 찾았으므로 이후에는 같은 일 수만큼 이동하면 됩니다.
      // setDate는 월·연도 경계를 자동으로 넘겨 계산합니다.
      while (date <= to) {
        addOccurrence(date);
        date.setDate(date.getDate() + interval);
      }
    } else {
      // 월간은 해당 월의 1일부터 시작해 월 단위로 이동합니다.
      // 31일에서 바로 setMonth를 호출하면 짧은 달을 건너뛸 수 있어 항상 1일을 기준으로 삼습니다.
      const first = from > start ? from : start;
      const date = new Date(first.getFullYear(), first.getMonth(), 1);
      const interval = getRepeatInterval(item);
      // 조회 월이 아니라 원래 시작 월에 간격을 맞춥니다.
      // 10월 시작·3개월 간격이라면 11월부터 조회해도 다음 발생은 1월입니다.
      const elapsed =
        (date.getFullYear() - start.getFullYear()) * 12 +
        date.getMonth() -
        start.getMonth();
      const monthsUntilNext = (interval - (elapsed % interval)) % interval;
      date.setMonth(date.getMonth() + monthsUntilNext);
      while (date <= to) {
        // new Date(연도, 다음 달, 0)은 다음 달 1일의 하루 전, 즉 현재 월의 말일입니다.
        const lastDay = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
        ).getDate();
        // 시작일이 31일이고 이번 달이 30일까지면 min(31, 30)=30일에 표시합니다.
        // 다음 달에도 start의 원래 일자를 사용하므로 이후 31일이 있는 달은 다시 31일로 돌아옵니다.
        addOccurrence(
          new Date(
            date.getFullYear(),
            date.getMonth(),
            Math.min(start.getDate(), lastDay),
          ),
        );
        date.setMonth(date.getMonth() + interval);
      }
    }
  }
  // YYYY-MM-DD와 HH:mm이 고정 자릿수라 문자열 정렬만으로 날짜·시간 순서가 맞습니다.
  return result.sort(compareSchedules);
};

/* 종료일 없는 반복도 화면에 필요한 횟수까지만 계산하도록 조회 종료일을 정합니다.
 * count는 필요한 발생 횟수입니다. 삭제해 제외한 날짜 수를 더해 그만큼 건너뛸 여유를 둡니다.
 * 예: 매주 반복에서 2회를 삭제했고 5건이 필요하면 최소 7주를 살펴보는 방식입니다.
 * 이 계산은 프로젝트 이동과 다가오는 일정이 함께 사용합니다. */
const getScheduleLookaheadEnd = (item, fromKey, count) => {
  // 시작 전 일정은 시작일부터, 이미 시작한 반복 일정은 조회 기준일부터 다음 발생을 찾습니다.
  const end = new Date(`${item.date > fromKey ? item.date : fromKey}T00:00:00`);
  const steps = getRepeatInterval(item) * ((item.excludedDates || []).length + count);
  // 주간 간격은 일 수로, 월간 간격은 개월 수로 변환합니다. 기존 Date 대신 새 end만 변경합니다.
  if (item.repeatType === "weekly") end.setDate(end.getDate() + steps * 7);
  if (item.repeatType === "monthly") {
    // 31일에서 월을 바로 더하면 짧은 달을 건너뛸 수 있어 먼저 1일로 옮깁니다.
    // 끝에 한 달을 더해 마지막 조회 월의 발생일까지 범위에 들어오게 합니다.
    end.setDate(1);
    end.setMonth(end.getMonth() + steps + 1);
  }
  return dateKey(end);
};

// 프로젝트 선택 시 오늘 이후 첫 발생일로 이동합니다. 모두 과거라면 마지막 저장 날짜를 사용합니다.
// 반복은 시작일만 비교하지 않고 실제 발생일을 구하며, 삭제한 발생일은 건너뜁니다.
export const getNextScheduleDate = (items, fromKey) => {
  const upcoming = [];
  for (const item of items) {
    const endKey = getScheduleLookaheadEnd(item, fromKey, 1);
    const dates = expandSchedules([item], fromKey, endKey);
    if (dates.length > 0) upcoming.push(dates[0]);
  }
  upcoming.sort(compareSchedules);
  if (upcoming.length > 0) return upcoming[0].date;

  // 미래 일정이 없으면 가장 최근 저장 날짜를 사용합니다. 빈 배열이면 이동할 날짜도 없습니다.
  const pastItems = [...items].sort(compareSchedules);
  if (pastItems.length > 0) return pastItems[pastItems.length - 1].date;
  return undefined;
};

/* '다가오는 일정'은 시작 전 작업과 아직 끝나지 않은 작업을 함께 보여줍니다.
 * now는 밀리초 숫자입니다. YYYY-MM-DDTHH:mm을 Date로 바꾸면 브라우저의 현지 시각이 됩니다.
 * 09:00~17:00 작업은 09시 이후에도 남겨 두고 17시가 되면 제외합니다. 완료된 일정도 제외합니다.
 * 반복은 각 규칙에서 가까운 limit개만 후보로 만들고, 전체를 시간순 정렬해 최종 limit개를 남깁니다.
 * 오늘 이미 지난 반복 한 건을 건너뛸 수 있도록 조회 횟수에는 1을 더합니다.
 * 연간 반복처럼 먼 미래의 일정도 찾되, 종료일 없는 반복 전체를 생성하지 않습니다. */
export const getUpcomingSchedules = (items, now, limit = 5) => {
  const fromKey = dateKey(new Date(now));
  const upcoming = [];
  for (const item of items) {
    if (item.status === "completed") continue;
    const endKey = getScheduleLookaheadEnd(item, fromKey, limit + 1);
    const dates = expandSchedules([item], fromKey, endKey);
    let count = 0;
    for (const occurrence of dates) {
      const startTime = new Date(`${occurrence.date}T${occurrence.time}`).getTime();
      const endTime = new Date(`${occurrence.date}T${occurrence.endTime || "17:00"}`).getTime();
      if (Number.isNaN(startTime) || Number.isNaN(endTime)) continue;
      // 시작 전이라면 계속 표시합니다. 이미 시작했다면 종료 시간까지 남겨 둡니다.
      // 기존 자료에 시작보다 이른 기본 종료 시간(17시)이 있어도 미래의 시작 일정은 숨기지 않습니다.
      if (startTime <= now && endTime <= now) continue;
      upcoming.push(occurrence);
      count += 1;
      // break는 이번 반복을 끝냅니다. 규칙 하나에서 필요한 수만큼 찾았으면 다음 규칙으로 갑니다.
      if (count === limit) break;
    }
  }
  upcoming.sort(compareSchedules);
  return upcoming.slice(0, limit);
};

// 프로젝트와 즐겨찾기 이동은 아직 끝나지 않은 일정부터 찾습니다.
// 그런 일정이 없을 때만 과거 기록을 확인할 수 있도록 기존 날짜 선택 방식을 사용합니다.
export function getScheduleFocusDate(items, now) {
  const upcoming = getUpcomingSchedules(items, now, 1);
  if (upcoming.length > 0) return upcoming[0].date;
  return getNextScheduleDate(items, dateKey(new Date(now)));
}

// 반복 규칙을 설명 문장으로 바꾸는 공통 함수입니다. 폼 안내와 전체 목록이 같은 규칙을 사용합니다.
// getDay()의 0~6을 "일월화수목금토"의 인덱스로 사용해 요일 한 글자를 찾습니다.
export const getRepeatLabel = (item) => {
  const interval = getRepeatInterval(item);
  if (item.repeatType === "weekly") {
    const day = new Date(item.date + "T00:00:00").getDay();
    let label = `${interval}주마다 `;
    if (interval === 1) label = "매주 ";
    else if (interval === 2) label = "격주 ";
    return label + "일월화수목금토"[day] + "요일 " + getScheduleTime(item);
  }
  if (item.repeatType === "monthly") {
    const day = Number(item.date.slice(8));
    if (interval % 12 === 0) {
      const years = interval / 12;
      let label = `${years}년마다`;
      if (years === 1) label = "매년";
      const month = Number(item.date.slice(5, 7));
      return `${label} ${month}월 ${day}일 ${getScheduleTime(item)}`;
    }
    return `${interval === 1 ? "매월" : `${interval}개월마다`} ${day}일 ${getScheduleTime(item)}`;
  }
  return "반복 없음";
};
