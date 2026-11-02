import React, { createContext, useContext, useEffect, useState } from "react";
import { initialProjects, initialEmployees } from "../data/mockData";
import { useCustomerData } from "./useCustomerData";


const ERPContext = createContext(null)

const STORAGE_KEY = 'erp_projects'
const NEXT_ID_KEY = 'erp_project_next_id'
const NEXT_PH_ID_KEY = 'erp_project_history_next_id'
const PH_KEY = 'erp_project_history'

export function ERPProvider({ children }) {
    //

    const [employees, setEmployees] = useState(initialEmployees)

    return (
        <ERPContext.Provider value={{
            employees,
            setEmployees,

            ...useCustomerData


        }}>
            {children}
        </ERPContext.Provider>
    )


}



export const useERP = () => useContext(ERPContext)


