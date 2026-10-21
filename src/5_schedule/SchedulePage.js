import ScheduleManager from "./ScheduleManager";

// [시작점] 앱 라우터가 /schedule 경로에서 이 컴포넌트를 렌더링합니다.
// 여기서는 ScheduleManager를 불러와 JSX로 반환하고 실제 상태/처리는 Manager에 맡깁니다.
// 파일 이름과 컴포넌트 이름을 나눠 라우터 연결과 일정 기능의 내부 구현을 구분합니다.
// export default는 이 파일의 대표 값을 내보내고 import하는 쪽에서 이름을 붙여 사용하게 합니다.
export default function SchedulePage() {
  return <ScheduleManager />;
}
