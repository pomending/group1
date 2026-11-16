import React from "react";
import { Route, Routes } from "react-router-dom";

import CustomerManagement from "./02_CustomerManagement";
import NotFoundPage from "../components/NotFoundPage";

function CrmPage() {

    return (
        <Routes>
            <Route index element={<CustomerManagement />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default CrmPage;