import React from "react";

function ConsultationManagement() {

    return (
        <div>
            <div>
                <h2>문의 관리</h2>
                <h6>고객 문의 접수 및 처리 현황 관리</h6>

                <h4>문의 등록/수정</h4>
                <label>고객사명</label>
                <input type="text" />
                <label>문의 경로</label>
                <select>
                    <option>전화</option>
                    <option>이메일</option>
                    <option>방문</option>
                    <option>기타</option>
                </select>
                <br />
                <label>고객 담당자</label>
                <input type="text" />
                <label>연락처</label>
                <input type="text" /><br />
                <label>이메일</label>
                <input type="text" />
                <label>문의 상품</label>
                <input type="text" /><br />
                <label>요청 수량</label>
                <input type="text" />
                <label>문의 담당자</label>
                <input type="text" /><br />

                <label>진행상태</label>
                <select>
                    <option>문의접수</option>
                    <option>처리 중</option>
                    <option>견적 요청</option>
                    <option>문의 종료</option>
                </select>
                <br />
                <label>문의 사항/처리 내용</label>
                <textarea />

                <button>초기화</button>
                <button>등록/수정 저장</button>

            </div>

            <div>
                <h4>문의 목록</h4>
                <input type="text"
                    placeholder="업체명 검색" />
                <button>검색</button>
            </div>

            <div>
                <table>
                    <thead>
                        <tr>
                            <th>선택</th>
                            <th>업체명</th>
                            <th>문의 경로</th>
                            <th>처리 담당자</th>
                            <th>진행 상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><input type="checkbox" /></td>
                            <td>삼성전자</td>
                            <td>이메일</td>
                            <td>미배정</td>
                            <td>문의 접수</td>
                        </tr>
                    </tbody>
                </table>
                <div>
                    <button>수정</button>
                    <button>삭제</button>
                    <button>견적 관리 이관</button>
                </div>
            </div>
        </div>
    )
}

export default ConsultationManagement;

