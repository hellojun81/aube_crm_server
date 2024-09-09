// services/columnsService.js
import sql from '../lib/sql.js';
import fn from '../lib/fn.js';
import TableSync from '../lib/tableSync.js';

const getColumns = async (tableName) => {
    const query = `SELECT id, display_name as displayName, field_type as Type FROM meta_fields WHERE table_name='${tableName}'`;
    return await sql.executeQuery(query);
};

const addColumn = async (tableName, displayName, type, options) => {
    const id = await sql.getmetaFieldLastKey();
    const fieldName = fn.generateFieldName(displayName) + '_' + id;

    if (type === 'enum' || type === 'set') {
        type = `${type}(${wrapWithQuotes(options)})`;
    }

    const query = `INSERT INTO meta_fields (table_Name, field_name, field_type, display_name) VALUES (?, ?, ?, ?)`;
    await sql.executeQuery(query, [tableName, fieldName, type, displayName]);
    await TableSync.addColumnToTable(tableName, fieldName, type);
};

const updateColumn = async (id, tableName, newName, type, options) => {
    const currentFieldQuery = `SELECT field_name FROM meta_fields WHERE id=?`;
    const currentFieldResult = await sql.executeQuery(currentFieldQuery, [id]);
    const currentFieldName = currentFieldResult[0].field_name;
    const newFieldName = fn.generateFieldName(newName) + '_' + id;

    if (type === 'enum' || type === 'set') {
        type = `${type}(${wrapWithQuotes(options)})`;
    }

    const query = `UPDATE meta_fields SET field_name=?, display_name=?, field_type=? WHERE table_name=? AND id=?`;
    await sql.executeQuery(query, [newFieldName, newName, type, tableName, id]);
    await TableSync.renameColumnInTable(tableName, currentFieldName, newFieldName, type);
};

const deleteColumn = async (id) => {
    const fieldQuery = `SELECT table_name, field_name FROM meta_fields WHERE id=?`;
    const fieldResult = await sql.executeQuery(fieldQuery, [id]);
    const { table_name, field_name } = fieldResult[0];

    const query = `DELETE FROM meta_fields WHERE id=?`;
    await sql.executeQuery(query, [id]);
    await TableSync.deleteColumnFromTable(table_name, field_name);
};

const wrapWithQuotes = (input) => {
    return input.split(',').map(item => `'${item.trim()}'`).join(',');
};

export default { getColumns, addColumn, updateColumn, deleteColumn };
