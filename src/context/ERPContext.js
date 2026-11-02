import React, { createContext, useContext, useState } from "react";
import {
    customers as initialCustomers,
    initialEmployees,
    products as initialProducts,
    quotations as initialQuotations
} from "../data/mockData";
import useProjectData from "./useProjectData";

const ERPContext = createContext(null)

export function ERPProvider({ children }) {

    const projectData = useProjectData()

    const [products, setProducts] = useState(initialProducts)

    const [quotations, setQuotations] = useState(initialQuotations)

    const [customers, setCustomers] = useState(initialCustomers)

    const [employees, setEmployees] = useState(initialEmployees)
   
    
    return (
        <ERPContext.Provider value={{
            ...projectData,

            employees,
            setEmployees,

            customers,
            setCustomers,

            products,
            setProducts,

            quotations,
            setQuotations
            
        }}>
            {children}
        </ERPContext.Provider>
    )
    
    
}



export const useERP = () => useContext(ERPContext)


