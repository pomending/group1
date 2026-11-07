import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

import QuotationList from "./QuotationList";
import QuotationCreate from "./QuotationCreate";
import QuotationDetail from "./QuotationDetail";

import {useERP} from "../context/ERPContext";

import "./QuotationPage.css"

function QuotationPage() {

    const {quotations, setQuotations} = useERP();

    return (
        
            <Routes>
                <Route index element={<QuotationList quotations={quotations}/>} /> {/* index는 해당 메뉴의 첫화면을 보여준다 */}
                <Route path="create" element={<QuotationCreate quotations={quotations} setQuotations={setQuotations}/>} />
                <Route path="detail/:id" element={<QuotationDetail quotations={quotations} setQuotations={setQuotations}/>} />
            </Routes>
        
    )
}

export default QuotationPage

