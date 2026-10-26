import { customerList } from "./CustomerDummy";


function getCustomers() {

    const savedCustomers = localStorage.getItem("customers");

    if (savedCustomers !== null) {
        const parsedCustomers = JSON.parse(savedCustomers)


        const allCustomers = [...parsedCustomers, ...customerList]
        return allCustomers;
    }
    return customerList;
}


export function saveCustomer(newCustomer) {
    const savedCustomers = localStorage.getItem("customers")



    const customers = savedCustomers === null
        ? [] : JSON.parse(savedCustomers);

    customers.push(newCustomer);

    localStorage.setItem("customers", JSON.stringify(customers))

}





export default getCustomers;