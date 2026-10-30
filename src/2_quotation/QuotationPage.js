import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

import QuotationList from "./QuotationList";
import ProductPage from "./ProductPage";
import QuotationCreate from "./QuotationCreate";
import QuotationDetail from "./QuotationDetail";
import QuotationDashboard from "./QuotationDashboard";

import {quotations as dummyQuotations} from "./Dummy";

import "./QuotationPage.css"

function QuotationPage() {

    //Dummy.js의 데이터를 초기 데이터로 사용
    const [quotations, setQuotations] = useState(dummyQuotations);

    return (
        
            <Routes>
                <Route index element={<QuotationDashboard quotatuons={quotations}/>} /> {/* index는 해당 메뉴의 첫화면을 보여준다 */}
                <Route path="list" element={<QuotationList quotations={quotations}/>} />
                <Route path="create" element={<QuotationCreate quotations={quotations} setQuotations={setQuotations}/>} />
                <Route path="detail" element={<QuotationDetail quotations={quotations} setQuotations={setQuotations}/>} />
                <Route path="product/*" element={<ProductPage />} />
            </Routes>
        
    )
}

export default QuotationPage

