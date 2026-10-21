import React from "react";

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
  // 원본 state 배열을 직접 바꾸지 않도록 복사본을 정렬합니다.
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
          {sortedItems.length ? (
            sortedItems.map((item) => (
              <article className="sm-list-item" key={item.id}>
                {/* 일정 내용을 누르면 창을 닫고 달력에서 해당 날짜를 선택합니다. */}
                <button
                  type="button"
                  className="sm-list-item-info"
                  onClick={() => onSelectDate(item.date)}
                >
                  <span className="sm-list-date">
                    {item.date.replaceAll("-", ".")} · {item.time}
                  </span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.type} · {item.project} · {item.person}
                  </small>
                </button>
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
