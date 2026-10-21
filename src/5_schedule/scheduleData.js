/*
 * [공부 순서 1] 공통 데이터와 날짜 계산
 * React 화면과 관계없이 입력값을 받아 결과를 돌려주는 함수들을 모은 파일입니다.
 * export한 값은 다른 파일에서 import해서 사용하며, 종류·색상을 한 곳에서 관리합니다.
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
// 격주는 별도 repeatType이 아니라 weekly 규칙의 biweekly 옵션으로 구분합니다.
export const repeatTypes = [
  { value: "none", label: "반복 없음" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
];

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

// 고정 자릿수 날짜·시간은 문자열 순서가 시간 순서와 같습니다. 모든 목록에서 같은 비교 함수를 씁니다.
export const compareSchedules = (a, b) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

// 선택 날짜를 복사해 월요일로 되돌린 뒤 7일을 만듭니다. state의 Date를 직접 바꾸지 않습니다.
export const getWeekDates = (date) => {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + index);
    return { date: day, key: dateKey(day) };
  });
};

// 매 칸에서 전체 목록을 filter/sort하는 대신, 한 번 정렬하고 날짜별 배열을 만듭니다.
// 예: { "2026-10-21": [일정1, 일정2] }. 배열을 복사해 정렬하므로 원본 순서는 유지됩니다.
export const groupSchedulesByDate = (items) => {
  const groups = {};
  [...items].sort(compareSchedules).forEach((item) => {
    (groups[item.date] ??= []).push(item);
  });
  return groups;
};

// 반복 한 번 수정/삭제 시 같은 제외 날짜가 계속 쌓이지 않게 Set으로 중복을 제거합니다.
export const excludeOccurrence = (item, date) => ({
  ...item,
  excludedDates: [...new Set([...(item.excludedDates || []), date])],
});

// 일정 등록 폼을 새로 열거나 저장한 뒤 초기화할 때 사용합니다.
// 객체 상수 하나를 공유하지 않고 호출할 때마다 새로운 객체와 최신 오늘 날짜를 만듭니다.
// () => ({ ... })의 괄호는 중괄호를 함수 본문이 아닌 반환할 객체로 해석하게 합니다.
export const createEmptyForm = () => ({
  date: getTodayKey(),
  time: "09:00",
  title: "",
  description: "",
  project: "",
  person: "",
  // 입력 중에는 문자열로 둡니다. 저장 시 normalizeAttendees가 배열로 바꿉니다.
  // 예: 입력 "민수, 지수" → 저장 ["민수", "지수"] → 수정 입력 "민수, 지수".
  attendees: "",
  type: "기획",
  repeatType: "none",
  biweekly: false,
  visibility: "shared",
});

// 기본 폼의 키만 골라 저장용 ID나 occurrenceDate가 입력 객체에 섞이지 않게 합니다.
// 참석자 배열은 입력용 문자열로 바꾸고, 반복 한 번 수정은 일반 일정으로 분리할 준비를 합니다.
export const createScheduleForm = (item) => {
  const defaults = createEmptyForm();
  if (!item) return defaults;
  return {
    ...Object.fromEntries(
      Object.keys(defaults).map((key) => [key, item[key] ?? defaults[key]]),
    ),
    attendees: normalizeAttendees(item.attendees).join(", "),
    repeatType: item.occurrenceDate ? "none" : item.repeatType || "none",
    biweekly: !item.occurrenceDate && item.biweekly === true,
  };
};

/*
 * 문자열/배열/누락값을 같은 이름 배열로 통일합니다. 빈 입력은 []이므로 선택 입력으로 저장됩니다.
 * " 민수,지수,민수,, " → 공백 제거·빈 이름 제거 → 중복 제거 → ["민수", "지수"].
 * 각 단계의 값 변환은 아래 메서드 체인에 설명합니다.
 */
export const normalizeAttendees = (value) => {
  // 정규식의 대괄호는 포함된 문자 중 하나를 뜻합니다.
  // 여기서는 일반 쉼표, 전각 쉼표, 줄바꿈을 각각 이름 구분자로 취급합니다.
  // [1] 삼항 연산자는 '조건 ? 참일 때 값 : 거짓일 때 값'입니다.
  // 첫 조건이 참이면 문자열 검사를 하지 않고 전달받은 배열을 names로 사용합니다.
  // 배열이 아니면 typeof로 문자열인지 확인하고, 문자열도 아니면 빈 배열을 사용합니다.
  // undefined → [], ["민수"] → ["민수"], "민수,지수" → ["민수", "지수"].
  const names = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,，\n]/)
      : [];
  // filter와 map은 새 배열을 만들기 때문에 전달받은 원본 배열을 직접 수정하지 않습니다.
  // 메서드 체인은 왼쪽 결과가 다음 메서드의 입력으로 전달됩니다.
  return [
    // [5] Set은 중복 없는 집합입니다. 바깥 [...]는 집합을 다시 일반 배열로 펼칩니다.
    ...new Set(
      names
        // [2] [" 민수 ", null, "", "민수"]에서 null 같은 문자열 아닌 항목을 제외합니다.
        // typeof 검사가 앞에 있어야 다음 trim을 문자열 아닌 값에 호출하는 오류를 막습니다.
        .filter((name) => typeof name === "string")
        // [3] 앞뒤 공백만 없애 ["민수", "", "민수"]를 만듭니다. 이름 내부 공백은 남습니다.
        .map((name) => name.trim())
        // [4] Boolean("")은 false이므로 빈 이름을 제거합니다. ["민수", "민수"]가 됩니다.
        // 이 결과가 위쪽 new Set에 전달되어 최종 ["민수"]로 반환됩니다.
        .filter(Boolean),
    ),
  ];
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
  // 각 일정에서 0개·1개·여러 날짜가 나옵니다. flatMap은 이 배열들을 한 배열로 합칩니다.
  return items
    .flatMap((item) => {
      if (item.repeatType !== "weekly" && item.repeatType !== "monthly") {
        // 일반 일정은 범위 안이면 [item], 범위 밖이면 []를 반환해 결과에서 제외합니다.
        return item.date >= fromKey && item.date <= toKey ? [item] : [];
      }
      const start = new Date(item.date + "T00:00:00");
      // 잘못된 시작일이나 조회 종료일보다 늦게 시작하는 규칙은 펼칠 필요가 없습니다.
      if (Number.isNaN(start.getTime()) || start > to) return [];
      const dates = [];
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
          dates.push({ ...item, date: key, occurrenceDate: key });
        }
      };
      if (item.repeatType === "weekly") {
        // 체크하지 않으면 7일, 격주를 체크하면 14일을 한 주기로 사용합니다.
        const interval = item.biweekly ? 14 : 7;
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
        date.setDate(
          date.getDate() + ((interval - (elapsed % interval)) % interval),
        );
        // 첫 반복일을 찾았으므로 이후에는 7일 또는 14일씩 이동하면 됩니다.
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
          date.setMonth(date.getMonth() + 1);
        }
      }
      return dates;
      // YYYY-MM-DD와 HH:mm이 고정 자릿수라 문자열 정렬만으로 날짜·시간 순서가 맞습니다.
    })
    .sort(compareSchedules);
};

// 반복 규칙을 설명 문장으로 바꾸는 공통 함수입니다. 폼 안내와 전체 목록이 같은 규칙을 사용합니다.
// getDay()의 0~6을 "일월화수목금토"의 인덱스로 사용해 요일 한 글자를 찾습니다.
export const getRepeatLabel = (item) => {
  if (item.repeatType === "weekly") {
    const day = new Date(item.date + "T00:00:00").getDay();
    return (
      (item.biweekly ? "격주 " : "매주 ") +
      "일월화수목금토"[day] +
      "요일 " +
      item.time
    );
  }
  if (item.repeatType === "monthly") {
    return "매월 " + Number(item.date.slice(8)) + "일 " + item.time;
  }
  return "반복 없음";
};
