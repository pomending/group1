import React from "react";
import ScheduleModal from "./ScheduleModal";
import { ScheduleActions, ScheduleAttendees } from "./ScheduleItemParts";
import { compareSchedules, getRepeatLabel } from "./scheduleData";

// 날짜 모드는 부모가 이미 펼친 발생 목록을 넘깁니다. 같은 날짜 조건을 다시 검사하지 않습니다.
// 전체 건수는 원본 목록 개수를 따로 받아 날짜별 건수와 구분합니다.
export default function ScheduleListModal({
  items,
  filterDate,
  totalCount,
  onClearDateFilter,
  onDelete,
  onEdit,
  onClose,
  onStatusChange,
}) {
  // sort는 배열 자체를 바꾸므로 복사본만 정렬합니다.
  const sortedItems = [...items].sort(compareSchedules);
  return (
    <ScheduleModal
      id="sm-list-title"
      className="sm-list-modal"
      title={
        filterDate ? `${filterDate.replaceAll("-", ".")} 일정` : "전체 일정"
      }
      description={
        filterDate
          ? `${items.length}건 · 전체 ${totalCount}건`
          : `등록된 일정 ${totalCount}건`
      }
      onClose={onClose}
      headerExtra={
        filterDate && (
          <button
            type="button"
            className="sm-list-all-btn"
            onClick={onClearDateFilter}
          >
            전체 일정 보기
          </button>
        )
      }
    >
      <div className="sm-list-content">
        {sortedItems.length ? (
          sortedItems.map((item) => (
            <article className="sm-list-item" key={item.id}>
              {/* 제목과 수정 버튼 모두 같은 item을 전달해 동일한 수정 창을 엽니다. */}
              <button
                type="button"
                className="sm-list-item-info"
                onClick={() => onEdit(item)}
              >
                <span className="sm-list-date">
                  {item.date.replaceAll("-", ".")} · {item.time}
                </span>
                <strong>{item.title}</strong>
                {item.repeatType !== "none" && (
                  <small>{getRepeatLabel(item)} · 종료일 없음</small>
                )}
                <small>
                  {item.type} · {item.project} · {item.person}
                </small>
                <ScheduleAttendees item={item} />
              </button>
              <ScheduleActions
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
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
    </ScheduleModal>
  );
}
