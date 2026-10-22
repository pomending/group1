import React from "react";
import ScheduleModal from "./ScheduleModal";
import { ScheduleActions, ScheduleAttendees, ScheduleVisibility } from "./ScheduleItemParts";
import { compareSchedules, getRepeatLabel, getScheduleTime } from "./scheduleData";

/* 전체 목록과 하루 목록은 같은 모달을 사용하지만 들어오는 데이터의 의미가 다릅니다.
 * filterDate가 null이면 반복 규칙도 원본 한 건으로 표시하며 그 규칙의 수정·삭제는 전체 반복 대상입니다.
 * 특정 날짜라면 부모가 그날 발생하는 일정으로 펼쳐서 전달합니다. 이때 occurrenceDate가 있어
 * 같은 수정·삭제 버튼을 눌러도 Manager가 '반복 중 한 번'으로 구분할 수 있습니다.
 *
 * [...items]는 배열을 복사하는 펼침 문법입니다. sort는 호출한 배열 자체를 바꾸므로
 * 부모에게 받은 items를 직접 정렬하지 않고 복사본 sortedItems만 정렬합니다.
 * 각 item 객체까지 깊게 복사하는 것은 아니지만, 여기서는 객체 속성을 수정하지 않아 충분합니다.
 */
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
  onToggleFavorite,
}) {
  // sort는 배열 자체를 바꾸므로 복사본만 정렬합니다.
  const sortedItems = [...items].sort(compareSchedules);
  // 화면 안에서 여러 조건을 계산하기보다 먼저 문구를 정하고 아래 JSX에 넣습니다.
  let title = "전체 일정";
  let description = `등록된 일정 ${totalCount}건`;
  let emptyMessage = "등록된 일정이 없습니다.";
  if (filterDate) {
    title = `${filterDate.replaceAll("-", ".")} 일정`;
    description = `${items.length}건 · 전체 ${totalCount}건`;
    emptyMessage = "선택한 날짜에 등록된 일정이 없습니다.";
  }
  return (
    <ScheduleModal
      id="sm-list-title"
      className="sm-list-modal"
      title={title}
      description={description}
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
                  {item.date.replaceAll("-", ".")} · {getScheduleTime(item)}
                </span>
                <strong>{item.title}</strong>
                <ScheduleVisibility visibility={item.visibility} />
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
                onToggleFavorite={onToggleFavorite}
              />
            </article>
          ))
        ) : (
          <div className="sm-empty">
            {emptyMessage}
          </div>
        )}
      </div>
    </ScheduleModal>
  );
}
