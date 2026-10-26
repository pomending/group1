
import React, { useState } from "react";

function TaskPage() {
  // 상품 목록 a
  const [products, setProducts] = useState([]);

  // 입력값 관리
  const [productName, setProductName] = useState("");
  const [worker, setWorker] = useState("");
  const [file, setFile] = useState(null);

  // 상품 등록 함수
  // aaa
  const addProduct = (e) => {
    e.preventDefault();

    if (!productName || !worker) {
      alert("상품명과 담당자를 입력하세요.");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: productName,
      worker: worker,
      image: file ? URL.createObjectURL(file) : null,
      status: "제작 중",
    };

    setProducts([...products, newProduct]);

    // 입력값 초기화
    setProductName("");
    setWorker("");
    setFile(null);
    e.target.reset();
  };

  // 제작 상태 변경 함수
  const changeStatus = (id, status) => {
    setProducts(
      products.map((product) =>
        product.id === id
          ? { ...product, status: status }
          : product
      )
    );
  };

  return (
    <div className="production-page">
      <h1>상품제작관리</h1>

      {/* 상품 등록 */}
      <form onSubmit={addProduct}>
        <h2>상품 등록</h2>

        <label>상품명</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="상품명을 입력하세요"
        />

        <label>담당자</label>
        <input
          type="text"
          value={worker}
          onChange={(e) => setWorker(e.target.value)}
          placeholder="담당자를 입력하세요"
        />

        <label>디자인 파일</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFile(e.target.files[0] || null)
          }
        />

        {file && (
          <div>
            <p>선택한 파일: {file.name}</p>
            <img
              src={URL.createObjectURL(file)}
              alt="디자인 미리보기"
              width="150"
            />
          </div>
        )}

        <button type="submit">상품 등록</button>
      </form>

      {/* 상품 목록 */}
      <h2>제작 목록</h2>

      {products.length === 0 ? (
        <p>등록된 상품이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>상품명</th>
              <th>디자인</th>
              <th>담당자</th>
              <th>제작 상태</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>

                <td>
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      width="70"
                    />
                  )}
                </td>

                <td>{product.worker}</td>

                <td>
                  <select
                    value={product.status}
                    onChange={(e) =>
                      changeStatus(
                        product.id,
                        e.target.value
                      )
                    }
                  >
                    <option value="제작 중">제작 중</option>
                    <option value="제작 완료">제작 완료</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TaskPage;
