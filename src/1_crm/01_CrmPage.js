import React from "react";
import CustomerRegister from "./03_CustomerRegister";
import CustomerManagement from "./02_CustomerManagement";
import CustomerEdit from "./03_CustomerEdit";

import { Route, Routes } from "react-router-dom";

function CrmPage() {

    return (
        <Routes>
            <Route index element={<CustomerManagement />} />
            {/* 부모 주소(/crm)로 접속했을 때 기본으로 고객 목록 표시 */}
           
            <Route path="register" element={<CustomerRegister />} />
            {/* /crm/register 주소로 접속하면 고객 등록 화면 표시 */}

            <Route path="edit" element={<CustomerEdit/>}/>
            {/* /crm/edit 주소로 접속하면 고객정보를 수정하는 화면 표시 */}
        </Routes>
    )
}

export default CrmPage;