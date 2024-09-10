// controllers/customersController.js
import customersService from '../services/customersService.js';

const addCustomer = async (req, res) => {
    try {
        const customer = req.body;
        // console.log('customer',customer)
        await customersService.addCustomer(customer);
        res.status(201).json({ message: 'Customer added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCustomers = async (req, res) => {
    try {

        const customers = await customersService.getCustomers();
        // console.log('getCustomers',req)
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const { customerName } = req.query;
        console.log('getCustomerById',req.params)
        const customer = await customersService.getCustomerById(customerName);
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = req.body;
        console.log({id:id,customer:customer})
        await customersService.updateCustomer(id, customer);
        res.status(200).json({ message: 'Customer updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await customersService.deleteCustomer(id);
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export default { addCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer };
