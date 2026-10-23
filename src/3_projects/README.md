# 굿즈 ERP 프로젝트 관리 부분 교체 안내

이 폴더는 기존 `src/3_projects/`의 JS 파일 세 개와 신규 파일 두 개를 제공합니다.

- `ProjectPage.js`: 기존 목록/등록/상세 useState 화면 전환 유지, 공통 더미 데이터 import 후 props로 전달
- `ProjectList.js`: 기존 검색/상태 필터/80% 임시 진행률/보기 버튼 방식 그대로 유지
- `ProjectForm.js`: 기존 JSX 및 등록 방식 유지, `quotations`를 props로 받도록 변경
- `ProjectDetail.js`: 기존 선택 ID→find 방식 유지, 견적 내역·상품·금액 표시 및 상세 UI 추가
- `ProjectDetail.css`: 기존 ProjectForm 스타일과 비슷한 상세 페이지 전용 스타일
- `../data/mockData.js`: 기존 6건의 quotations를 원본 그대로 이전. 이름 조회용 임시 customers/employees도 포함

기존 `projects.css`와 `ProjectForm.css`는 유지하세요. 이 ZIP에는 포함하지 않았습니다.

## 동작 관련 최소 보정
- ProjectForm의 `projectName` 필드를 `name`으로 저장하여 목록 검색 오류 방지
- ProjectForm의 선택 담당자 이름을 직원 ID로 변환해 `managerId`로 저장
- 신규 프로젝트는 기존 프로젝트와 동일하게 `startDate: ""`, `completedDate: null`, `description: ""` 포함
- 등록·목록·상세는 기존처럼 `ProjectPage`의 `projects` useState와 `page` useState를 사용

## 추후 연동 시
- `src/data/mockData.js`는 현재 프로젝트 페이지에서 사용하는 임시 예시 데이터입니다. 팀 공통 Context 확정 후 이 데이터 참조를 대체하세요.
- 현재 목록/상세의 진행률 80%는 기존 임시값입니다.
- 목록 검색 input의 안내 문구와 달리 현재 검색 로직은 프로젝트명만 검색합니다(원본 동작 유지).
- 견적 선택은 원본처럼 승인 상태만 필터링합니다. 이미 사용 중인 견적 중복 방지는 아직 넣지 않았습니다.
- 신규 등록 폼에는 시작일 입력이 없어 `startDate`가 빈 값으로 등록됩니다. 이후 필요시 폼에 추가하세요.
