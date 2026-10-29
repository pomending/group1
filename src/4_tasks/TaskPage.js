
import React, { useMemo, useState } from "react";
import "./TaskPage.css";

// 실제 더미 데이터 파일 경로에 맞게 수정하세요.
import {
  quotations,
  customers,
  employees,
  initialProjects,
} from "../data/mockData";

const WORK_STATUSES = [
  "제작중",
  "검수대기",
  "포장중",
  "등록완료",
  "배송",
  "취소",
  "교환",
  "반품",
];


function TaskPage() {
  const [tasks, setTasks] = useState(() =>
    initialProjects.map((project) => {
      //프로젝트 데이터를 작업 데이터로 변환
      const quotation = quotations.find(
        (item) => item.id === project.quotationId
      );

      const customer = customers.find(
        (item) => item.id === project.customerId
      );

      const employee = employees.find(
        (item) => item.id === project.managerId
      );

      const product = quotation?.items?.[0];

      return {
        ...project,
        companyName: customer?.companyName ?? "거래처 미등록",
        customerManager: customer?.customerManager ?? "-",
        employeeName: employee?.name ?? "-",
        productName: product?.productName ?? project.name,
        quantity: product?.quantity ?? 0,
        unitPrice: product?.unitPrice ?? 0,
        workStatus:
          project.status === "대기" ? "검수대기" : "제작중",
      };
    })
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedTask, setSelectedTask] = useState(null);

  // 상태별 작업 개수
  const statusCounts = useMemo(() => {
    return WORK_STATUSES.reduce(
      (counts, status) => {
        counts[status] = tasks.filter(
          (task) => task.workStatus === status
        ).length;
        return counts;
      },
      {}
    );
  }, [tasks]);

  // 검색 및 상태 필터
  const filteredTasks = tasks.filter((task) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      task.productName.toLowerCase().includes(keyword) ||
      task.companyName.toLowerCase().includes(keyword) ||
      task.name.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "전체" ||
      task.workStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 작업 상태 변경
  const changeStatus = (taskId, nextStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, workStatus: nextStatus }
          : task
      )
    );

    setSelectedTask((prev) =>
      prev?.id === taskId
        ? { ...prev, workStatus: nextStatus }
        : prev
    );
  };

  return (
    <div className="task-page">
      <div className="task-header">
        <div>
          <p className="task-eyebrow">PRODUCT WORKSPACE</p>
          <h1>제품 세부상황관리</h1>
          <p className="task-subtitle">
            제품별 제작부터 검수, 포장, 등록까지 관리합니다.
          </p>
        </div>

        <div className="task-total">
          전체 작업
          <strong>{tasks.length}건</strong>
        </div>
      </div>

      {/* 상태별 요약 카드 */}
      <div className="task-summary">
        {WORK_STATUSES.map((status) => (
          <button
            type="button"
            key={status}
            className={`summary-card ${
              statusFilter === status ? "active" : ""
            }`}
            onClick={() =>
              setStatusFilter(
                statusFilter === status ? "전체" : status
              )
            }
          >
            <span>{status}</span>
            <strong>{statusCounts[status]}</strong>
          </button>
        ))}
      </div>

      {/* 검색 및 필터 */}
      <div className="task-toolbar">
        <div className="task-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="제품명 또는 거래처 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="작업 상태 필터"
        >
          <option value="전체">전체 상태</option>
          {WORK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* 제품 작업 목록 */}
      <div className="task-list-panel">
        <div className="task-list-heading">
          <h2>제품 작업 목록</h2>
          <span>{filteredTasks.length}건 조회</span>
        </div>

        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>제품 / 프로젝트</th>
                <th>거래처</th>
                <th>담당자</th>
                <th>수량</th>
                <th>납기일</th>
                <th>진행 상태</th>
                <th>상세</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <div className="product-cell">
                      <strong>{task.productName}</strong>
                      <small>{task.name}</small>
                    </div>
                  </td>

                  <td>{task.companyName}</td>
                  <td>{task.employeeName}</td>
                  <td>{task.quantity.toLocaleString()}개</td>
                  <td>{task.dueDate}</td>

                  <td>
                    <select
                      className={`status-select status-${WORK_STATUSES.indexOf(
                        task.workStatus
                      )}`}
                      value={task.workStatus}
                      onChange={(e) =>
                        changeStatus(task.id, e.target.value)
                      }
                      aria-label={`${task.productName} 진행 상태`}
                    >
                      {WORK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="detail-button"
                      onClick={() => setSelectedTask(task)}
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 제품 상세정보 */}
      {selectedTask && (
        <div
          className="task-modal-backdrop"
          onClick={() => setSelectedTask(null)}
        >
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p>PRODUCT DETAIL</p>
                <h2 id="task-modal-title">제품 상세정보</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedTask(null)}
                aria-label="상세정보 닫기"
              >
                ×
              </button>
            </div>

            <h3>{selectedTask.productName}</h3>
            <p className="modal-project-name">
              {selectedTask.name}
            </p>

            <div className="detail-grid">
              <div>
                <span>거래처</span>
                <strong>{selectedTask.companyName}</strong>
              </div>

              <div>
                <span>거래처 담당자</span>
                <strong>{selectedTask.customerManager}</strong>
              </div>

              <div>
                <span>사내 작업 담당자</span>
                <strong>{selectedTask.employeeName}</strong>
              </div>

              <div>
                <span>제작 수량</span>
                <strong>
                  {selectedTask.quantity.toLocaleString()}개
                </strong>
              </div>

              <div>
                <span>단가</span>
                <strong>
                  {selectedTask.unitPrice.toLocaleString()}원
                </strong>
              </div>

              <div>
                <span>예상 금액</span>
                <strong>
                  {(
                    selectedTask.quantity *
                    selectedTask.unitPrice
                  ).toLocaleString()}
                  원
                </strong>
              </div>

              <div>
                <span>제작 시작일</span>
                <strong>{selectedTask.startDate}</strong>
              </div>

              <div>
                <span>납기일</span>
                <strong>{selectedTask.dueDate}</strong>
              </div>
            </div>

            <div className="modal-description">
              <span>작업 내용</span>
              <p>{selectedTask.description}</p>
            </div>

            <div className="modal-status">
              <label htmlFor="detail-status">
                작업 진행 상태
              </label>

              <select
                id="detail-status"
                value={selectedTask.workStatus}
                onChange={(e) =>
                  changeStatus(selectedTask.id, e.target.value)
                }
              >
                {WORK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="modal-confirm"
              onClick={() => setSelectedTask(null)}
            >
              확인
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default TaskPage;
