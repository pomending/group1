import React, { createContext, useContext, useState } from "react";
import {
    initialEmployees,
    products as initialProducts,
    quotations as initialQuotations
} from "../data/mockData";
import useProjectData from "./useProjectData";
import useCustomerData from "./useCustomerData"

const ERPContext = createContext(null)

export function ERPProvider({ children }) {

    const projectData = useProjectData()
    const customerData = useCustomerData()

    const [products, setProducts] = useState(initialProducts)

    const [quotations, setQuotations] = useState(initialQuotations)

    const [employees, setEmployees] = useState(initialEmployees)
   
    
    return (
        <ERPContext.Provider value={{
            ...projectData,

            ...customerData,

            employees,
            setEmployees,

            products,
            setProducts,

            quotations,
            setQuotations,
            
        }}>
            {children}
        </ERPContext.Provider>
    )


}



export const useERP = () => useContext(ERPContext)


