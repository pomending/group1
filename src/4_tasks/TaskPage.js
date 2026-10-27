
import React, { useState } from "react";
import "./TaskPage.css";

const initialProducts = [
  {
    id: 1,
    name: "오버핏 후드티",
    status: "제작중",
    manager: "김민지",
    tasks: [
      { id: 1, name: "상품 디자인 제작", status: "완료" },
      { id: 2, name: "디자인 파일 업로드", status: "진행중" },
      { id: 3, name: "디자인 검수", status: "대기" },
      { id: 4, name: "상품 포장", status: "대기" },
      { id: 5, name: "쇼핑몰 상품 등록", status: "대기" },
    ],
  },
  {
    id: 2,
    name: "캔버스 에코백",
    status: "검수대기",
    manager: "이서준",
    tasks: [
      { id: 6, name: "상품 디자인 제작", status: "완료" },
      { id: 7, name: "디자인 파일 업로드", status: "완료" },
      { id: 8, name: "디자인 검수", status: "대기" },
      { id: 9, name: "상품 포장", status: "대기" },
      { id: 10, name: "쇼핑몰 상품 등록", status: "대기" },
    ],
  },
];

function TaskPage() {
  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState(null);

  // 현재 선택한 상품
  const selectedProduct = products.find(
    (product) => product.id === selectedProductId
  );

  // 상태별 상품 개수
  const makingCount = products.filter(
    (product) => product.status === "제작중"
  ).length;

  const makingWaiting = products.filter(
    (product) => product.status === "검수대기"
  ).length;

  const Packaging = products.filter(
    (product) => product.status === "포장중"
  ).length;

  const complete = products.filter(
    (product) => product.status === "등록완료"
  ).length;

  // 탭에 따라 상품 목록 필터링
  const filteredProducts = products.filter((product) => {
    if (activeTab === "all") return true;
    if (activeTab === "making") return product.status === "제작중";
    if (activeTab === "waiting") return product.status === "검수대기";
    if (activeTab === "packing") return product.status === "포장중";
    if (activeTab === "complete") return product.status === "등록완료";

    return true;
  });

  // 상품 추가
  const addProduct = () => {
    const name = window.prompt("상품명을 입력하세요.");

    if (!name || !name.trim()) return;

    const newProduct = {
      id: Date.now(),
      name: name.trim(),
      status: "제작중",
      manager: "미지정",
      tasks: [
        { id: Date.now() + 1, name: "상품 디자인 제작", status: "대기" },
        { id: Date.now() + 2, name: "디자인 파일 업로드", status: "대기" },
        { id: Date.now() + 3, name: "디자인 검수", status: "대기" },
        { id: Date.now() + 4, name: "상품 포장", status: "대기" },
        { id: Date.now() + 5, name: "쇼핑몰 상품 등록", status: "대기" },
      ],
    };

    setProducts((prev) => [...prev, newProduct]);
    setActiveTab("all");
  };

  // 상품 상태 변경
  const changeProductStatus = (productId, newStatus) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, status: newStatus }
          : product
      )
    );
  };

  // 세부 작업 상태 변경
  const changeTaskStatus = (productId, taskId, newStatus) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              tasks: product.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, status: newStatus }
                  : task
              ),
            }
          : product
      )
    );
  };

  // 세부 작업 추가
  const addTask = (productId) => {
    const name = window.prompt("추가할 작업명을 입력하세요.");

    if (!name || !name.trim()) return;

    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              tasks: [
                ...product.tasks,
                {
                  id: Date.now(),
                  name: name.trim(),
                  status: "대기",
                },
              ],
            }
          : product
      )
    );
  };

  // 세부 작업 삭제
  const deleteTask = (productId, taskId) => {
    if (!window.confirm("이 작업을 삭제하시겠습니까?")) return;

    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? {
              ...product,
              tasks: product.tasks.filter((task) => task.id !== taskId),
            }
          : product
      )
    );
  };

  // 작업 완료율 계산
  const getProgress = (tasks) => {
    if (tasks.length === 0) return 0;

    const done = tasks.filter(
      (task) => task.status === "완료"
    ).length;

    return Math.round((done / tasks.length) * 100);
  };

  // 선택한 상품의 세부 작업관리 화면
  if (selectedProduct) {
    const progress = getProgress(selectedProduct.tasks);

    return (
      <div className="production-page">
        <button
          className="back-button"
          onClick={() => setSelectedProductId(null)}
        >
          ← 상품 목록
        </button>

        <div className="detail-header">
          <div>
            <p className="page-label">PRODUCT DETAIL</p>
            <h1>{selectedProduct.name}</h1>
            <p>담당자: {selectedProduct.manager}</p>
          </div>

          <select
            className="product-status-select"
            value={selectedProduct.status}
            onChange={(e) =>
              changeProductStatus(selectedProduct.id, e.target.value)
            }
          >
            <option value="제작중">제작중</option>
            <option value="검수대기">검수대기</option>
            <option value="포장중">포장중</option>
            <option value="등록완료">등록완료</option>
          </select>
        </div>

        <section className="work-summary">
          <div className="work-summary-top">
            <h2>작업 진행률</h2>
            <strong>{progress}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="work-list">
          <div className="work-list-header">
            <div>
              <h2>세부 작업 목록</h2>
              <p>작업별 상태를 변경하고 진행 상황을 관리하세요.</p>
            </div>

            <button className="add-button" onClick={() => addTask(selectedProduct.id)}>
              + 작업 추가
            </button>
          </div>

          {selectedProduct.tasks.map((task, index) => (
            <div className="work-item" key={task.id}>
              <span className="work-number">{index + 1}</span>

              <div className="work-info">
                <strong>{task.name}</strong>
                <span>세부 작업 {index + 1}</span>
              </div>

              <select
                className="task-status-select"
                value={task.status}
                onChange={(e) =>
                  changeTaskStatus(
                    selectedProduct.id,
                    task.id,
                    e.target.value
                  )
                }
              >
                <option value="대기">대기</option>
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
              </select>

              <button
                className="delete-button"
                onClick={() => deleteTask(selectedProduct.id, task.id)}
              >
                삭제
              </button>
            </div>
          ))}

          {selectedProduct.tasks.length === 0 && (
            <p className="empty-message">등록된 작업이 없습니다.</p>
          )}
        </section>
      </div>
    );
  }

  // 상품제작관리 메인 화면
  return (
    <div className="production-page">
      <div className="production-header">
        <div>
          <h1>상품제작관리</h1>
          <p>상품 제작부터 최종 등록까지 관리하세요.</p>
        </div>

        <button className="add-button" onClick={addProduct}>
          + 새 상품 등록
        </button>
      </div>

      <div className="product-count-grid">
        <div className="product-count-card">
          <p className="product-count-title">디자인 제작 중</p>
          <h2 className="product-count-number">{makingCount}</h2>
        </div>

        <div className="product-count-card">
          <p className="product-count-title">검수대기</p>
          <h2 className="product-count-number">{makingWaiting}</h2>
        </div>

        <div className="product-count-card">
          <p className="product-count-title">포장 진행 중</p>
          <h2 className="product-count-number">{Packaging}</h2>
        </div>

        <div className="product-count-card">
          <p className="product-count-title">등록완료</p>
          <h2 className="product-count-number">{complete}</h2>
        </div>
      </div>

      <div className="tab-menu">
        {[
          { id: "all", label: "전체 상품" },
          { id: "making", label: "제작 중" },
          { id: "waiting", label: "검수대기" },
          { id: "packing", label: "포장 진행 중" },
          { id: "complete", label: "등록완료" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="product-list">
        <div className="product-list-header">
          <h2>
            {activeTab === "all"
              ? "전체 상품 목록"
              : `${{
                  making: "제작 중",
                  waiting: "검수대기",
                  packing: "포장 진행 중",
                  complete: "등록완료",
                }[activeTab]} 상품 목록`}
          </h2>

          <span>총 {filteredProducts.length}개</span>
        </div>

        {filteredProducts.length === 0 ? (
          <p className="empty-message">등록된 상품이 없습니다.</p>
        ) : (
          <div className="product-list-items">
            {filteredProducts.map((product) => (
              <div className="product-item" key={product.id}>
                <div className="product-info">
                  <strong>{product.name}</strong>
                  <span>담당자: {product.manager}</span>
                </div>

                <span className="product-status">
                  {product.status}
                </span>

                <span className="product-progress">
                  진행률 {getProgress(product.tasks)}%
                </span>

                <button
                  className="detail-button"
                  onClick={() => setSelectedProductId(product.id)}
                >
                  상세 관리 →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default TaskPage;
