/* [파일 안내] 일정 화면 진입점
 * 연결: App.js의 /schedule 경로 → 이 파일 → ScheduleManager.js
 * 화면 구성을 찾으려면 ScheduleManager.js를 확인합니다.
 */

/* 일정 경로에서 Manager를 여는 진입 컴포넌트입니다. */
import ScheduleManager from "./ScheduleManager";

export default function SchedulePage() {
  return <ScheduleManager />;
}
