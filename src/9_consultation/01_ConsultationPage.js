import React from "react";
import { Route, Routes } from "react-router-dom";
import ConsultationManagement from "./02_ConsultationManagement";

function ConsultationPage(){



    return(
        <Routes>
            <Route index element ={<ConsultationManagement/>}/>

            
        </Routes>




    )
}

export default ConsultationPage;