# 일정관리 공통 영역 조정 현황

확인일: 2026-11-17. 현재 코드의 동작과 향후 협의 사항을 구분한다. 이 문서는 공통 파일 변경을 실행하는 지침이 아니다.

## 현재 구현

- 프로젝트 시작·마감일, 작업 마감, 선택한 견적 유효기간을 읽기 전용으로 표시한다. 원본 변경은 각 관리 화면에서 한다.
- 업무 일정의 프로젝트 연결은 ID를 우선한다. 이름만 있는 동명 프로젝트는 임의 연결하지 않으며, 저장된 연결 기준이 달라진 프로젝트도 자동 재연결하지 않는다.
- 일정관리는 프로젝트의 schedules 요약을 자동 갱신하지 않는다. 과거의 ‘프로젝트 연동 다시 시도’와 요약 갱신 실패 안내는 현재 기능이 아니다.
- ERPContext.deleteProject는 삭제 가능 조건을 확인한 뒤 deleteSchedulesByProject로 연결 일정을 삭제한다. 일정 처리 실패 시 프로젝트 삭제를 진행하지 않는다.
- ERPContext.deleteEmployee에도 연결 일정 정리 경로가 있다. DB 전환에서 과거 이력 보존이 필요하면 삭제 정책을 별도 협의해야 한다.
- resetAllData는 resetStoredSchedules의 성공을 확인한 뒤 다른 모듈을 초기화하고 로그아웃한다.
- 일정 초기화는 일정·팀원·제외 팀원과 현재 탭의 계정별 초안을 정리한다. 초기화 번호(resetId)와 이벤트로 열린 화면과 다른 탭의 오래된 쓰기·초안 복구를 막는다. 실패 시 이전 저장값 복원을 시도한다.
- 개인 일정·개인 표시 업무는 작성 계정 ID와 연결 직원 ID로 화면 접근을 구분한다. 서버 권한 검사는 미구현이다.

## 공통 담당자와 남은 협의

| 항목 | 관련 파일 | 확인할 내용 |
| --- | --- | --- |
| 전체 초기화의 실패 처리 | src/context/ERPContext.js, 각 Context 훅 | 일정 이후 다른 모듈의 초기화 실패 결과·부분 초기화 안내와 복구 정책 |
| 손상 자료 백업 보관 | src/5_schedule/scheduleStorage.js, src/components/Sidebar.js | made-mate-schedules-backup-*는 초기화에서 제거하지 않음. 보관 기간·삭제 범위·안내 협의 |
| 프로젝트·직원 삭제 이력 | src/context/ERPContext.js, 프로젝트·인사 영역 | 현재 연결 일정 삭제와 DB 전환 후 과거 이력 보존 요구 조정 |
| 서버 계정별 접근 제어 | 계정·직원·일정 API 및 DB | ownerAccountId와 ownerEmployeeId를 서버에서도 검증하고 소유자 미상 자료 이관 방식 결정 |

## 저장 키

- localStorage: made-mate-schedules, made-mate-schedule-team, made-mate-excluded-team.
- sessionStorage: made-mate-schedule-draft:<계정ID>:<직원ID>, 비로그인은 made-mate-schedule-draft:guest.
- 이전 공통 초안 키 made-mate-schedule-draft도 초기화에서 정리한다.
- 다른 탭의 sessionStorage는 직접 지우는 대신 초기화 이벤트·번호를 감지한 해당 탭에서 정리한다.

현재 동작은 소스 기준이다. 자동 테스트와 실제 브라우저 확인 결과는 구분해서 보고한다. 이 문서 수정만으로 공통 영역의 미구현 사항이 해결된 것은 아니다.
