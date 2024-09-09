// services/customersService.js
import sql from '../lib/sql.js';

// 모든 고객 가져오기
const getCustomers = async () => {
    const query = 'SELECT * FROM Customers';
    return await sql.executeQuery(query);
};

// 특정 고객 가져오기
const getCustomerById = async (customerName) => {
 
    if(customerName==undefined){
        customerName=''
    }
    console.log('customerService customerName',customerName)
    const searchPattern = `%${customerName}%`;
    const query = `SELECT * FROM Customers WHERE customerName LIKE ?`;
    console.log(query)
    try {
        const result = await sql.executeQuery(query, [searchPattern]);
        // console.log('Service result', result);
        return result;
    } catch (error) {
        console.error('Error executing query', error);
        throw error; // 에러를 다시 던져 호출자가 처리할 수 있도록 합니다.
    }
};


// 고객 추가
const addCustomer = async (customer) => {
    const query = 'INSERT INTO Customers (customerName, contactPerson, position, phone, email, leadSource, inboundDate, businessNumber, representative, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [
        customer.customerName,
        customer.contactPerson,
        customer.position,
        customer.phone,
        customer.email,
        customer.leadSource,
        customer.inboundDate,
        customer.businessNumber,
        customer.representative,
        customer.location,
        customer.notes
    ];
    const result = await sql.executeQuery(query, params);
    return { id: result.insertId, ...customer };
};

// 고객 수정
const updateCustomer = async (id, customer) => {
    const query = 'UPDATE Customers SET customerName = ?, contactPerson = ?, position = ?, phone = ?, email = ?, leadSource = ?, inboundDate = ?, businessNumber = ?, representative = ?, location = ?, notes = ? WHERE id = ?';
    const params = [
        customer.customerName,
        customer.contactPerson,
        customer.position,
        customer.phone,
        customer.email,
        customer.leadSource,
        customer.inboundDate,
        customer.businessNumber,
        customer.representative,
        customer.location,
        customer.notes,
        id
    ];
    const result = await sql.executeQuery(query, params);
    return result.affectedRows > 0;
};

// 고객 삭제
const deleteCustomer = async (id) => {
    const query = 'DELETE FROM Customers WHERE id = ?';
    const result = await sql.executeQuery(query, [id]);
    return result.affectedRows > 0;
};

export default {
    getCustomers,
    getCustomerById,
    addCustomer,
    updateCustomer,
    deleteCustomer,
};
