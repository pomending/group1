import React from "react";

/* children을 이해하는 예:
 * <ScheduleModal title="새 일정" onClose={닫는함수}>
 *   <form>입력창들</form>
 * </ScheduleModal>
 * 위처럼 여는 태그와 닫는 태그 사이에 적은 <form>이 children이라는 props로 들어옵니다.
 * 아래 {children} 자리에 그대로 배치되므로 모달 테두리·제목·닫기를 한 번만 작성하고
 * 내용만 등록 폼 또는 전체 일정 목록으로 바꿀 수 있습니다.
 *
 * onClose는 함수를 받는 이름이며 특별한 리액트 예약어가 아닙니다.
 * onClick={onClose}는 클릭할 때 그 함수를 실행하라는 연결입니다.
 * onClick={onClose()}로 쓰면 화면을 만드는 도중 즉시 실행하므로 의미가 달라집니다.
 *
 * event.target은 클릭이 시작된 실제 요소이고 currentTarget은 이 이벤트를 연결한 요소입니다.
 * 배경에서 눌렀을 때는 둘 다 배경 div이지만 입력창에서 눌렀을 때 target은 입력창입니다.
 * 두 값이 같은지 비교해 모달 내부를 클릭했을 때 창이 닫히는 일을 막습니다.
 * role/aria 속성은 보조 기기에 화면의 역할·이름을 전달합니다. 자체로 포커스를 가두는 기능은 아닙니다.
 */
// 폼과 전체 목록의 공통 외곽입니다. children 위치에 각 화면의 실제 내용을 넣습니다.
// target은 실제 클릭한 요소, currentTarget은 배경이므로 둘이 같을 때만 창을 닫습니다.
// id와 aria-labelledby를 연결하면 보조 기기가 h2를 대화상자의 이름으로 읽습니다.
// headerExtra는 전체 목록 전환 버튼처럼 특정 모달에만 필요한 내용을 끼워 넣는 자리입니다.
export default function ScheduleModal({
  id,
  title,
  description,
  onClose,
  children,
  headerExtra,
  className = "",
}) {
  function handleBackgroundClick(event) {
    // 입력창 같은 안쪽 요소를 누르면 target과 currentTarget이 달라 닫지 않습니다.
    if (event.target === event.currentTarget) onClose();
  }
  return (
    <div
      className="sm-modal-backdrop"
      onMouseDown={handleBackgroundClick}
    >
      <section
        className={`sm-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="sm-modal-head">
          <div>
            <h2 id={id}>{title}</h2>
            <p>{description}</p>
            {headerExtra}
          </div>
          <button
            type="button"
            className="sm-close"
            aria-label="닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
