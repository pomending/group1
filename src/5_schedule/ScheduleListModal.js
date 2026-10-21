import React from "react";
import { getRepeatLabel, normalizeAttendees } from "./scheduleData";

// [공부 순서 4] 부모에서 받은 목록을 표시하고 수정/삭제 요청을 다시 부모로 전달합니다.
// 전체 모드에는 원본 반복 규칙이 한 번만, 날짜 모드에는 그날의 발생 항목이 들어옵니다.
// 이 차이로 같은 수정/삭제 버튼도 부모에서 규칙 전체와 특정 한 번을 구별할 수 있습니다.
// 등록된 일정 전체를 날짜·시간 순으로 보여주며, 선택·수정·삭제를 제공합니다.
export default function ScheduleListModal({
  items,
  filterDate,
  onClearDateFilter,
  onSelectDate,
  onDelete,
  onEdit,
  onClose,
}) {
  // filterDate가 있으면 filter로 같은 날짜만 남깁니다. null이면 받은 전체 목록을 사용합니다.
  // sort는 배열 자체를 바꾸므로 [...filteredItems]로 복사한 뒤 정렬해야 부모 state가 보존됩니다.
  // fixed YYYY-MM-DD HH:mm 문자열을 localeCompare로 비교하면 날짜와 시간 순서로 나옵니다.
  const filteredItems = filterDate
    ? items.filter((item) => item.date === filterDate)
    : items;
  const sortedItems = [...filteredItems].sort((first, second) =>
    `${first.date} ${first.time}`.localeCompare(
      `${second.date} ${second.time}`,
    ),
  );

  return (
    <div
      className="sm-modal-backdrop"
      onMouseDown={(event) => {
        // 배경 자체를 누른 경우만 닫습니다. 안쪽 버튼/텍스트 클릭은 배경과 target이 다릅니다.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="sm-modal sm-list-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sm-list-title"
      >
        <div className="sm-modal-head">
          <div>
            <h2 id="sm-list-title">
              {filterDate
                ? `${filterDate.replaceAll("-", ".")} 일정`
                : "전체 일정"}
            </h2>
            <p>
              {filterDate
                ? `${sortedItems.length}건 · 전체 ${items.length}건`
                : `등록된 일정 ${items.length}건`}
            </p>
            {/* 날짜 필터가 있을 때만 버튼을 표시합니다. 누르면 부모가 null로 바꾸고 원본 목록을 다시 넘깁니다. */}
            {filterDate && (
              <button
                type="button"
                className="sm-list-all-btn"
                onClick={onClearDateFilter}
              >
                전체 일정 보기
              </button>
            )}
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

        <div className="sm-list-content">
          {/* length가 0이면 빈 목록 안내를, 1 이상이면 map으로 각 일정의 article을 만듭니다.
              key={item.id}는 React가 수정/삭제 후에도 항목을 올바르게 식별하게 합니다. */}
          {sortedItems.length ? (
            sortedItems.map((item) => (
              <article className="sm-list-item" key={item.id}>
                {/* 화살표 함수로 item을 묶어 전달합니다. 클릭 전에는 onEdit가 실행되지 않습니다.
                    부모는 목록을 닫고 이 항목의 데이터를 채운 수정 창을 엽니다. */}
                <button
                  type="button"
                  className="sm-list-item-info"
                  onClick={() => onEdit(item)}
                >
                  <span className="sm-list-date">
                    {item.date.replaceAll("-", ".")} · {item.time}
                  </span>
                  <strong>{item.title}</strong>
                  {item.repeatType !== "none" && <small>{getRepeatLabel(item)} · 종료일 없음</small>}
                  <small>
                    {item.type} · {item.project} · {item.person}
                  </small>
                  {/* 참석자 값이 없는 과거 일정도 normalizeAttendees가 []로 바꿉니다.
                    length > 0일 때만 안내를 만들고 join(", ")으로 이름 배열을 읽기 쉬운 한 문자열로 표시합니다.
                    여기서는 화면 표시만 하며 원본 배열이나 수정 폼 값은 바꾸지 않습니다. */}
                  {normalizeAttendees(item.attendees).length > 0 && (
                    <small>참석자: {normalizeAttendees(item.attendees).join(", ")}</small>
                  )}
                </button>
                {/* 이 컴포넌트는 실제 배열을 바꾸지 않습니다. 삭제 확인과 state 변경은 부모 onDelete가 맡습니다. */}
                <div className="sm-item-actions">
                  <button
                    type="button"
                    className="sm-edit-btn"
                    onClick={() => onEdit(item)}
                    aria-label={`${item.title} 일정 수정`}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="sm-delete-btn"
                    onClick={() => onDelete(item)}
                    aria-label={`${item.title} 일정 삭제`}
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="sm-empty">
              {filterDate
                ? "선택한 날짜에 등록된 일정이 없습니다."
                : "등록된 일정이 없습니다."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
