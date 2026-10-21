// 달력의 요일 순서와 등록 폼에서 선택할 수 있는 작업 종류입니다.
export const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
export const scheduleTypes = ["기획", "디자인", "제작", "검수", "마감", "출고"];

// 작업 종류에 따라 달력 일정 막대에 사용할 색을 정합니다.
export const typeColors = {
  기획: "#8066e8",
  디자인: "#8066e8",
  제작: "#e99a43",
  검수: "#39a58a",
  마감: "#e36c79",
  출고: "#5491d5",
};

// 월과 일이 한 자리여도 두 자리 문자열로 만들어 날짜 형식을 통일합니다.
const pad = (number) => String(number).padStart(2, "0");

// 날짜를 일정 검색과 저장에 사용하는 YYYY-MM-DD 문자열로 변환합니다.
export const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// 오늘 날짜는 화면이 자정을 넘겨도 다시 계산할 수 있도록 함수로 제공합니다.
export const getTodayKey = () => dateKey(new Date());

// 일정 등록 폼을 새로 열거나 저장한 뒤 초기화할 때 사용합니다.
export const createEmptyForm = () => ({
  date: getTodayKey(),
  time: "09:00",
  title: "",
  project: "",
  person: "",
  type: "기획",
});
