// controllers/columnsController.js
import columnsService from '../services/columnsService.js';

const getColumns = async (req, res) => {
    try {
        const { tableName } = req.query;
        const columns = await columnsService.getColumns(tableName);
        res.json(columns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addColumn = async (req, res) => {
    try {
        const { tableName, displayName, type, options } = req.body;
        await columnsService.addColumn(tableName, displayName, type, options);
        res.status(200).json({ message: 'Column added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateColumn = async (req, res) => {
    try {
        const { id, tableName, newName, type, options } = req.body;
        await columnsService.updateColumn(id, tableName, newName, type, options);
        res.status(200).json({ message: 'Column updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteColumn = async (req, res) => {
    try {
        const { id } = req.params;
        await columnsService.deleteColumn(id);
        res.status(200).json({ message: 'Column deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export default { getColumns, addColumn, updateColumn, deleteColumn };
