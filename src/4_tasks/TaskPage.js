
import React, { useState } from "react";

 // 상품 목록 관리 css
import './TaskPage.css';

function TaskPage() {

const [products, setProducts] = useState([]);
const [activeTab, setActiveTab] = useState("all")

//제작 중인 상품 개수 계산
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

return(
  <div className="production-page">
  
    <h1>상품제작관리</h1>

    <div className="product-count-card">
      <p className="product-count-title">디자인 제작 중</p>

      <h2 className="product-count-number">
        {makingCount}
      </h2>
    </div>
    <div className="product-count-card">
      <p className="product-count-title">검수대기</p>

      <h2 className="product-count-number">
        {makingWaiting}
      </h2>
    </div>
    <div className="product-count-card">
      <p className="product-count-title">포장 진행 중</p>

      <h2 className="product-count-number">
        {Packaging}
      </h2>
    </div>
    <div className="product-count-card">
      <p className="product-count-title">등록완료</p>

      <h2 className="product-count-number">
        {complete}
      </h2>
    </div>


     {/* 탭 메뉴 */}
     <div className="tab-menu">
        <button
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          전체 상품
        </button>

        <button
          className={activeTab === "making" ? "active" : ""}
          onClick={() => setActiveTab("making")}
        >
          제작 중
        </button>

        <button
          className={activeTab === "inspection" ? "active" : ""}
          onClick={() => setActiveTab("inspection")}
        >
          검수대기
        </button>

        <button
          className={activeTab === "complete" ? "active" : ""}
          onClick={() => setActiveTab("complete")}
        >
          등록완료
        </button>
      </div>

      {/* 탭에 따른 내용 */}
      <div className="tab-content">
        {activeTab === "all" && (
          <h2>전체 상품 목록</h2>
        )}

        {activeTab === "making" && (
          <h2>제작 중인 상품 목록</h2>
        )}

        {activeTab === "inspection" && (
          <h2>검수대기 상품 목록</h2>
        )}

        {activeTab === "complete" && (
          <h2>등록완료 상품 목록</h2>
        )}
      </div>
    </div>
   

   
 
);
 

  }

  

  

export default TaskPage;
