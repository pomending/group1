// CrmPage.js - CRM 내부 라우터 관리
//CustomerList.js - 고객 목록·검색·페이지네이션
// CustomerRegister.js - 고객 등록 화면
// CustomerService.js - 고객정보조회 및 localstorage 저장
import React from "react";
import CustomerRegister from "./CustomerRegister";
import CustomerList from "./CustomerList";
import CustomerEdit from "./CustomerEdit";
//외부 컴포넌트를 사용하기 위해 사용
import { Route, Routes } from "react-router-dom";

function CrmPage() {

    return (
        <Routes>
            <Route index element={<CustomerList />} />
            {/* 부모 주소(/crm)로 접속했을 때 기본으로 고객 목록 표시 */}
           
            <Route path="register" element={<CustomerRegister />} />
            {/* /crm/register 주소로 접속하면 고객 등록 화면 표시 */}

            <Route path="edit" element={<CustomerEdit/>}/>
        </Routes>
    )
}

export default CrmPage