import React, { useState } from "react";
import "./02_ConsultationManagement.css";
import { Consultations } from "./03_Consultations";
function ConsultationManagement() {
    //문의목록을 관리할 usestate
    const [consultation, setConsultation] = useState(Consultations);

    //체크박스로 선택한 문의 Id를 저장할 usestate
    const [checkIds, setCheckedIds] = useState([]);

    //수정할 문의를 저장하는 usestate
    const [editData, setEditData] = useState({});

    //검색창의 글자를 저장하는 usestate
    const [search, setSearch] = useState("");

    //버튼을눌러 확정된 검색어를 저장하는 usestate
    const [searchResult, setSearchResult] = useState("");


    const editConsultation = () => {

        const selectedConsultation = consultation.find(
            (item) => item.id === checkIds[0])
        setEditData(selectedConsultation);
        alert("문의 상세정보를 불러왔습니다.\n상단에서 내용을 확인하거나 수정할 수 있습니다.");


    }

    const saveConsultation = () => {

        if ((editData.companyName || "").trim() === ""
            || (editData.customerManager || "").trim() === ""
            || (editData.phone || "").trim() === "") {
            alert("필수등록정보(고객사명, 고객사 담당자명, 연락처)를 입력해주세요.")
            return;
        }


        if (editData.id) {
            setConsultation(
                consultation.map((item) =>
                    item.id === editData.id ? editData : item
                )
            )
            alert("문의 정보가 수정되었습니다.")
        }
        else {
            const newId = Math.max(
                0,
                ...consultation.map((item) => item.id)) + 1;
            const newConsultation = {
                ...editData, id: newId, status: editData.status || "문의 접수"
            };
            setConsultation([...consultation, newConsultation]);
            alert("새로운 문의가 등록되었습니다.")

        }
        setEditData({});
        setCheckedIds([]);
    }

    const deleteConsultation = () => {

        const result = window.confirm(`선택된 ${checkIds.length}건을 삭제하시겠습니까?`)
        if (result === false) {
            return;
        }

        setConsultation(consultation.filter((item) =>
            !checkIds.includes(item.id))
        )

        setCheckedIds([]);
        if (checkIds.includes(editData.id)) {
            setEditData({})
        }
    }


    const searchConsultation = () => {

        setSearchResult(search)
    }

    // 업체명 검색어에 일치하는 문의 목록을 필터링
    const filteredConsultation = consultation.filter((item) => item.companyName.includes(searchResult))

    return (
        <div className="consultation-page">
            <h2>문의 관리</h2>
            <div className="consultation-box">
                <h6>고객 문의 접수 및 처리 현황 관리</h6>

                <h4>문의 등록/수정
                    <span>
                        {editData.id ? "기존 정보 수정중" : "신규 문의 등록 중"}
                    </span>
                </h4>
                <label>고객사명</label>
                <input type="text"
                    value={editData?.companyName || ""}
                    onChange={(e) => setEditData(
                        { ...editData, companyName: (e.target.value) }
                    )} />
                <label>문의 경로</label>
                <select
                    value={editData?.inquiryChannel || ""}
                    onChange={(e) => setEditData(
                        { ...editData, inquiryChannel: (e.target.value) }
                    )}>
                    <option>전화</option>
                    <option>이메일</option>
                    <option>방문</option>
                    <option>기타</option>
                </select>
                <br />
                <label>고객사 담당자</label>
                <input type="text"
                    value={editData?.customerManager || ""}
                    onChange={(e) => setEditData(
                        { ...editData, customerManager: (e.target.value) }
                    )} />

                <label>연락처</label>
                <input type="text"
                    value={editData?.phone || ""}
                    onChange={(e) => setEditData(
                        { ...editData, phone: (e.target.value) }
                    )} /><br />

                <label>이메일</label>
                <input type="text"
                    value={editData?.email || ""}
                    onChange={(e) => setEditData(
                        { ...editData, email: (e.target.value) }
                    )} />


                <label>담당자</label>
                <select value={editData?.employeeName || ""}
                    onChange={(e) => setEditData(
                        { ...editData, employeeName: e.target.value }
                    )}>
                    <option value="">미배정</option>
                    <option>홍길동</option>
                    <option>고길동</option>
                    <option>김길동</option>
                </select>
                <br />

                <label>진행상태</label>
                <select
                    value={editData?.status || "문의 접수"}
                    onChange={(e) => setEditData(
                        { ...editData, status: (e.target.value) }
                    )}>
                    <option>문의접수</option>
                    <option>처리 중</option>
                    <option>견적 요청</option>
                    <option>문의 종료</option>
                </select>
                <br />
                <label>문의 사항/처리 내용</label>
                <textarea
                    value={editData?.memo || ""}
                    onChange={(e) => setEditData(
                        { ...editData, memo: (e.target.value) }
                    )} />

                <button
                    onClick={saveConsultation}>등록/수정 저장</button>

            </div>
            <hr />

            <div className="consultation-box">
                <h4>문의 목록</h4>
                <input type="text"
                    placeholder="업체명 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)} />
                <button
                    onClick={searchConsultation}>검색</button>
            </div>

            <div>
                <table>
                    <thead>
                        <tr>
                            <th>선택</th>
                            <th>고객사명</th>
                            <th>문의 경로</th>
                            <th>고객사 담당자</th>
                            <th>연락처</th>
                            <th>이메일</th>
                            <th>담당자</th>
                            <th>진행 상태</th>

                        </tr>
                    </thead>
                    <tbody>
                        {filteredConsultation
                            .map((item) => (
                                <tr key={item.id}>
                                    <td><input type="checkbox"
                                        checked={checkIds.includes(item.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setCheckedIds(
                                                    [...checkIds, item.id])
                                            }
                                            else {
                                                setCheckedIds(
                                                    checkIds.filter((id) => id != item.id)
                                                )
                                            }
                                        }}
                                    /></td>
                                    <td>{item.companyName}</td>
                                    <td>{item.inquiryChannel}</td>
                                    <td>{item.customerManager}</td>
                                    <td>{item.phone}</td>
                                    <td>{item.email}</td>
                                    <td>{item.employeeName}</td>
                                    <td>{item.status}</td>

                                </tr>
                            ))}
                        {filteredConsultation.length === 0 && (
                            <tr>
                                <td colSpan={8}>검색 결과가 없습니다</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div>
                    <button
                        disabled={checkIds.length !== 1}
                        onClick={editConsultation}>상세보기</button>
                    <button
                        disabled={checkIds.length === 0}
                        onClick={deleteConsultation}>삭제</button>
                    <button>견적 관리 이관</button>
                </div>
            </div>
        </div>
    )
}

export default ConsultationManagement;

