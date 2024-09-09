// tableSync.js

import sql from './sql.js';
import fn from './fn.js';


class TableSync {
    static async addColumnToTable(tableName, fieldName, type) {
        try {
            const alterTableQuery = `ALTER TABLE ${tableName} ADD COLUMN ${fieldName} ${type}`;
            await sql.executeQuery(alterTableQuery);
            console.log(`Column ${fieldName} added to table ${tableName}`);
        } catch (error) {
            console.error('Error adding column to table:', error);
            throw new Error('Failed to add column to table');
        }
    }

    static async renameColumnInTable(tableName, oldFieldName, newFieldName, newFieldType) {
        try {
            // Rename the column
            const renameColumnQuery = `ALTER TABLE ${tableName} RENAME COLUMN ${oldFieldName} TO ${newFieldName}`;
            await sql.executeQuery(renameColumnQuery);
    
            // Modify the column type/attributes
            if (newFieldType) {
                const modifyColumnQuery = `ALTER TABLE ${tableName} MODIFY COLUMN ${newFieldName} ${newFieldType}`;
                await sql.executeQuery(modifyColumnQuery);
            }
    
            console.log(`Column ${oldFieldName} renamed to ${newFieldName} with type ${newFieldType} in table ${tableName}`);
        } catch (error) {
            console.error('Error renaming and modifying column in table:', error);
            throw new Error('Failed to rename and modify column in table');
        }
    }
    

    static async deleteColumnFromTable(tableName, fieldName) {
        try {
            const alterTableQuery = `ALTER TABLE ${tableName} DROP COLUMN ${fieldName}`;
            await sql.executeQuery(alterTableQuery);
            console.log(`Column ${fieldName} deleted from table ${tableName}`);
        } catch (error) {
            console.error('Error deleting column from table:', error);
            throw new Error('Failed to delete column from table');
        }
    }
}

export default TableSync;
