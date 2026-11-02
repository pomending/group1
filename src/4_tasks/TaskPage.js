
import React, { useMemo, useState } from "react";
import "./TaskPage.css";

// 실제 더미 데이터 파일 경로에 맞게 수정하세요.
import {
  quotations,
  customers,
  employees,
} from "../data/mockData";

import { useERP } from "../context/ERPContext";

const WORK_STATUSES = [
  "제작중",
  "검수대기",
  "포장중",
  "등록완료",
  "배송",
 
];


function TaskPage() {

  // ERPContext의 실제 프로젝트 목록 사용
  const { projects = [] } = useERP();

  const [tasks, setTasks] = useState(() =>
    projects.map((project) => {

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

  // 이하 기존 코드 유지

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

   //디자인 관련 데이터
   const [designRecords, setDesignRecords] = useState ({});

   //수정 요청 입력값
   const [designRequest, setDesignRequest] = useState("");
   // 디자인 이미지 업로드
const uploadDesign = (taskId, file) => {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("이미지 파일만 등록할 수 있습니다.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    setDesignRecords((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        image: reader.result,
        status: "검토 대기",
        history: [
          ...(prev[taskId]?.history || []),
          {
            action: "디자인 이미지 등록",
            date: new Date().toLocaleString("ko-KR"),
          },
        ],
      },
    }));
  };

  reader.readAsDataURL(file);
};

// 디자인 승인
const approveDesign = (taskId) => {
  setDesignRecords((prev) => ({
    ...prev,
    [taskId]: {
      ...prev[taskId],
      status: "승인 완료",
      history: [
        ...(prev[taskId]?.history || []),
        {
          action: "디자인 승인 완료",
          date: new Date().toLocaleString("ko-KR"),
        },
      ],
    },
  }));

  alert("디자인이 승인되었습니다.");
};

// 디자인 수정 요청
const requestDesignRevision = (taskId) => {
  if (!designRequest.trim()) {
    alert("수정 요청 내용을 입력해주세요.");
    return;
  }

  setDesignRecords((prev) => ({
    ...prev,
    [taskId]: {
      ...prev[taskId],
      status: "수정 요청",
      history: [
        ...(prev[taskId]?.history || []),
        {
          action: `수정 요청: ${designRequest}`,
          date: new Date().toLocaleString("ko-KR"),
        },
      ],
    },
  }));

  setDesignRequest("");
  alert("디자인 수정 요청이 등록되었습니다.");
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



{/* 디자인 작업 단계 */}
<div className="design-step-box">
  <div className="design-step-title">
    <span>🎨</span>
    <h3>디자인 작업 단계</h3>
  </div>

  <div className="design-steps">
    <div className="step completed">
      <div className="step-circle">✓</div>
      <p>디자인 요청 접수</p>
      <span>11/01</span>
    </div>

    <div className="step-line active"></div>

    <div className="step completed">
      <div className="step-circle">✓</div>
      <p>디자인 기획</p>
      <span>11/03</span>
    </div>

    <div className="step-line active"></div>

    <div className="step current">
      <div className="step-circle">3</div>
      <p>시안 검토</p>
      <span>11/05</span>
    </div>

    <div className="step-line"></div>

    <div className="step">
      <div className="step-circle">4</div>
      <p>디자인 수정</p>
      <span>11/08</span>
    </div>

    <div className="step-line"></div>

    <div className="step">
      <div className="step-circle">5</div>
      <p>최종 파일 준비</p>
      <span>11/12</span>
    </div>
  </div>
</div>




            

           {/* 제품 디자인 관리 */}
<div className="design-management">
  <div className="design-section-title">
    <h3>제품 디자인 관리</h3>

    <span className={`design-badge ${
      designRecords[selectedTask.id]?.status === "승인 완료"
        ? "design-approved"
        : designRecords[selectedTask.id]?.status === "수정 요청"
        ? "design-revision"
        : "design-pending"
    }`}>
      {designRecords[selectedTask.id]?.status || "미등록"}
    </span>
  </div>

  {/* 디자인 이미지 미리보기 */}
  <div className="design-preview-area">
    {designRecords[selectedTask.id]?.image ? (
      <img
        src={designRecords[selectedTask.id].image}
        alt="제품 디자인 미리보기"
        className="design-preview-image"
      />
    ) : (
      <div className="design-empty">
        <span>🖼️</span>
        <p>등록된 디자인 이미지가 없습니다.</p>
      </div>
    )}
  </div>

  {/* 이미지 업로드 */}
  <label className="design-upload-button">
    + 디자인 이미지 등록
    <input
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        uploadDesign(
          selectedTask.id,
          e.target.files[0]
        );
        e.target.value = "";
      }}
    />
  </label>

  {/* 승인 및 수정 요청 */}
  <div className="design-action-area">
    <button
      type="button"
      className="design-approve-button"
      disabled={!designRecords[selectedTask.id]?.image}
      onClick={() => approveDesign(selectedTask.id)}
    >
      ✓ 디자인 승인
    </button>

    <textarea
      value={designRequest}
      onChange={(e) => setDesignRequest(e.target.value)}
      placeholder="디자인 수정 요청 내용을 입력해주세요."
    />

    <button
      type="button"
      className="design-request-button"
      disabled={!designRecords[selectedTask.id]?.image}
      onClick={() => requestDesignRevision(selectedTask.id)}
    >
      수정 요청 등록
    </button>
  </div>

  {/* 디자인 처리 이력 */}
  <div className="design-history">
    <h4>디자인 처리 이력</h4>

    {(designRecords[selectedTask.id]?.history || []).length === 0 ? (
      <p>아직 처리된 이력이 없습니다.</p>
    ) : (
      designRecords[selectedTask.id].history.map((item, index) => (
        <div className="design-history-item" key={index}>
          <strong>{item.action}</strong>
          <small>{item.date}</small>
        </div>
      ))
    )}
  </div>
</div> {/* 취소 / 교환 / 반품 독립 관리 */}
<AfterSalesManagement projects={projects} />





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



const AFTER_SALES_CONFIG = {
  cancel: {
    title: "취소 관리",
    key: "erp_cancellations",
    reasons: ["고객 요청", "주문 오류", "제작 불가", "기타"],
    statuses: ["취소 접수", "취소 확인중", "취소 승인", "취소 완료"],
  },
  exchange: {
    title: "교환 관리",
    key: "erp_exchanges",
    reasons: ["제품 불량", "제품 파손", "오배송", "고객 요청", "기타"],
    statuses: ["교환 접수", "제품 회수중", "제품 검수중", "재발송", "교환 완료"],
  },
  return: {
    title: "반품 관리",
    key: "erp_returns",
    reasons: ["제품 불량", "제품 파손", "고객 변심", "오배송", "기타"],
    statuses: ["반품 접수", "제품 회수중", "반품 검수중", "환불 처리", "반품 완료"],
  },
};

function AfterSalesManagement({ projects }) {
  const [activeType, setActiveType] = useState("cancel");

  const [records, setRecords] = useState(() => {
    const result = {};

    Object.entries(AFTER_SALES_CONFIG).forEach(([type, config]) => {
      try {
        result[type] = JSON.parse(
          localStorage.getItem(config.key) || "[]"
        );
        if (!Array.isArray(result[type])) result[type] = [];
      } catch {
        result[type] = [];
      }
    });

    return result;
  });

  const [form, setForm] = useState({
    projectId: "",
    reason: "",
    description: "",
  });

  const [search, setSearch] = useState("");

  const config = AFTER_SALES_CONFIG[activeType];
  const currentRecords = records[activeType] || [];

  const updateRecords = (type, nextRecords) => {
    setRecords(prev => ({
      ...prev,
      [type]: nextRecords,
    }));

    localStorage.setItem(
      AFTER_SALES_CONFIG[type].key,
      JSON.stringify(nextRecords)
    );
  };

  // 업무 등록
  const addRecord = (e) => {
    e.preventDefault();

    if (!form.projectId) {
      alert("프로젝트를 선택해주세요.");
      return;
    }

    if (!form.reason) {
      alert("처리 사유를 선택해주세요.");
      return;
    }

    const project = projects.find(
      p => String(p.id) === String(form.projectId)
    );

    if (!project) {
      alert("프로젝트를 찾을 수 없습니다.");
      return;
    }

    const newRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId: project.id,
      projectName: project.name,
      reason: form.reason,
      description: form.description,
      status: config.statuses[0],
      createdAt: new Date().toISOString(),
    };

    updateRecords(activeType, [
      ...currentRecords,
      newRecord,
    ]);

    setForm({
      projectId: "",
      reason: "",
      description: "",
    });

    alert(`${config.title} 등록이 완료되었습니다.`);
  };

  // 처리 상태 변경
  const changeRecordStatus = (recordId, status) => {
    const nextRecords = currentRecords.map(record =>
      record.id === recordId
        ? { ...record, status }
        : record
    );

    updateRecords(activeType, nextRecords);
  };

  // 업무 삭제
  const deleteRecord = (recordId) => {
    if (!window.confirm("해당 관리 내역을 삭제하시겠습니까?")) {
      return;
    }

    updateRecords(
      activeType,
      currentRecords.filter(record => record.id !== recordId)
    );
  };

  const filteredRecords = currentRecords.filter(record =>
    `${record.projectName} ${record.reason} ${record.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <section className="after-sales">

      <div className="after-sales-heading">
        <div>
          <p className="task-eyebrow">AFTER SALES MANAGEMENT</p>
          <h2>사후 처리 관리</h2>
          <p>취소, 교환, 반품 업무를 독립적으로 관리합니다.</p>
        </div>
      </div>

      {/* 독립 관리 메뉴 */}
      <div className="after-sales-tabs">

        <button
          type="button"
          className={activeType === "cancel" ? "active cancel-tab" : ""}
          onClick={() => setActiveType("cancel")}
        >
          취소 관리
          <strong>{records.cancel.length}건</strong>
        </button>

        <button
          type="button"
          className={activeType === "exchange" ? "active exchange-tab" : ""}
          onClick={() => setActiveType("exchange")}
        >
          교환 관리
          <strong>{records.exchange.length}건</strong>
        </button>

        <button
          type="button"
          className={activeType === "return" ? "active return-tab" : ""}
          onClick={() => setActiveType("return")}
        >
          반품 관리
          <strong>{records.return.length}건</strong>
        </button>

      </div>

      {/* 업무 등록 */}
      <div className="after-sales-form">

        <h3>{config.title} 등록</h3>

        <form onSubmit={addRecord}>

          <div className="after-sales-fields">

            <label>
              프로젝트 선택

              <select
                value={form.projectId}
                onChange={e => setForm(prev => ({
                  ...prev,
                  projectId: e.target.value,
                }))}
              >
                <option value="">프로젝트를 선택하세요</option>

                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {activeType === "cancel"
                ? "취소 사유"
                : activeType === "exchange"
                ? "교환 사유"
                : "반품 사유"}

              <select
                value={form.reason}
                onChange={e => setForm(prev => ({
                  ...prev,
                  reason: e.target.value,
                }))}
              >
                <option value="">사유 선택</option>

                {config.reasons.map(reason => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>

          </div>

          <label className="after-sales-description">
            상세 내용

            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({
                ...prev,
                description: e.target.value,
              }))}
              placeholder="상세 처리 내용을 입력하세요."
            />
          </label>

          <button type="submit" className="after-sales-submit">
            + {config.title} 등록
          </button>

        </form>
      </div>

      {/* 등록 내역 */}
      <div className="after-sales-list">

        <div className="after-sales-list-heading">
          <h3>{config.title} 목록</h3>

          <span>{filteredRecords.length}건</span>
        </div>

        <input
          type="text"
          className="after-sales-search"
          placeholder="프로젝트명 또는 처리 사유 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="after-sales-table-wrap">

          <table className="after-sales-table">

            <thead>
              <tr>
                <th>프로젝트</th>
                <th>처리 사유</th>
                <th>상세 내용</th>
                <th>등록일</th>
                <th>처리 상태</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>

              {filteredRecords.map(record => (
                <tr key={record.id}>

                  <td>
                    <strong>{record.projectName}</strong>
                  </td>

                  <td>{record.reason}</td>

                  <td>{record.description || "-"}</td>

                  <td>
                    {new Date(record.createdAt).toLocaleDateString("ko-KR")}
                  </td>

                  <td>
                    <select
                      value={record.status}
                      onChange={e =>
                        changeRecordStatus(record.id, e.target.value)
                      }
                    >
                      {config.statuses.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => deleteRecord(record.id)}
                      className="after-sales-delete"
                    >
                      삭제
                    </button>
                  </td>

                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    등록된 관리 내역이 없습니다.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
}


export default TaskPage;
