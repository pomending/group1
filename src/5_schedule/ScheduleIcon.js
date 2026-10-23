import React from "react";

/* 화면에서 반복해서 사용하는 작은 선 아이콘입니다.
 * SVG는 사진 파일 대신 선의 좌표로 그림을 그려서 크기를 바꿔도 선명하게 보입니다.
 * paths 객체에서 name에 맞는 그림만 꺼내므로 버튼마다 같은 SVG 설정을 복사하지 않아도 됩니다.
 * currentColor는 부모 버튼의 글자색을 따라갑니다. 색상과 크기는 scheduleStyles.css에서 정합니다.
 * 아이콘은 장식이고 실제 버튼 이름은 글자나 aria-label로 제공하므로,
 * aria-hidden으로 화면 읽기 프로그램이 그림을 중복해서 읽지 않게 합니다.
 */
const paths = {
  projects: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M8 4v16M8 10h13M13 14h4M13 17h3" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2M8 18h2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flag: <><path d="M5 21V4M5 4c5-4 9 4 14 0v10c-5 4-9-4-14 0" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  star: <path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.5-4.4 6.3-.9Z" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  chevronLeft: <path d="m14 6-6 6 6 6" />,
  chevronRight: <path d="m10 6 6 6-6 6" />,
};

export default function ScheduleIcon({ name }) {
  return (
    <svg className="sm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}
