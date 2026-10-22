import ScheduleManager from "./ScheduleManager";

/* 리액트를 처음 읽는 경우 이 파일부터 시작하세요.
 *
 * 1. 컴포넌트란?
 *    화면의 한 부분을 만들어 반환하는 함수입니다. SchedulePage도 컴포넌트입니다.
 *    함수 이름을 대문자로 시작하면 <SchedulePage />처럼 화면 안에서 사용할 수 있습니다.
 *
 * 2. return 뒤의 <ScheduleManager />는 무엇인가요?
 *    자바스크립트 안에서 화면 구조를 적는 JSX 문법입니다. HTML처럼 보이지만 JSX 자체가 HTML은 아닙니다.
 *    리액트는 이 표현을 보고 ScheduleManager 컴포넌트가 만드는 화면을 이 자리에 배치합니다.
 *    />는 안에 별도 내용을 넣지 않고 태그를 바로 닫는 표시입니다.
 *
 * 3. import/export는 무엇인가요?
 *    export default는 이 파일의 대표 함수를 밖에서 가져갈 수 있게 합니다.
 *    import ScheduleManager ...는 다른 파일의 대표 함수를 여기서 사용할 이름으로 가져옵니다.
 *    './'는 현재 파일과 같은 폴더라는 뜻입니다. 파일을 나눈 것은 기능을 따로 읽고 관리하기 위해서입니다.
 *
 * 추천 읽기 순서:
 *    SchedulePage → ScheduleManager(데이터와 동작) → ScheduleCalendar(달력)
 *    → ScheduleFormModal(입력) → ScheduleSidebar/Directory(오른쪽 목록).
 *    scheduleData는 공통 계산, ScheduleItemParts는 여러 화면에서 쓰는 작은 부품입니다.
 *    CSS는 화면 배치와 색상을, test 파일은 사용자 동작이 맞는지 확인하는 방법을 설명합니다.
 *
 * 이 코드에서 먼저 익힐 문법:
 *    useState(값 기억), useEffect(저장·시계·서버 요청), map(JSX 목록 만들기),
 *    for(데이터 하나씩 읽기), if(조건 검사), ...객체(state를 직접 바꾸지 않고 복사).
 *    useRef는 프로젝트 선택 후 실제 달력 위치로 이동할 때만 사용합니다.
 *    반복 날짜의 월말·윤년 계산은 scheduleData에 모여 있으므로 처음에는
 *    함수에 어떤 값을 넣고 어떤 일정 배열이 나오는지부터 확인해도 됩니다.
 */
// [시작점] 앱 라우터가 /schedule 경로에서 이 컴포넌트를 렌더링합니다.
// 여기서는 ScheduleManager를 불러와 JSX로 반환하고 실제 상태/처리는 Manager에 맡깁니다.
// 파일 이름과 컴포넌트 이름을 나눠 라우터 연결과 일정 기능의 내부 구현을 구분합니다.
// export default는 이 파일의 대표 값을 내보내고 import하는 쪽에서 이름을 붙여 사용하게 합니다.
export default function SchedulePage() {
  return <ScheduleManager />;
}
