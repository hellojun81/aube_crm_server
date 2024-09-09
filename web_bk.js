// 환경 변수 설정
import dotenv from 'dotenv';
dotenv.config();
const port = process.env.PORT || 3001;
import express from 'express';
import sql from './lib/sql.js';
import cors from 'cors';
import url from 'url';
import fn from './lib/fn.js';
import TableSync from './lib/tableSync.js';
// import romanize from 'romanize-korean';

const app = express();





app.use(express.json());
app.use(cors({
    // origin: true,
    credentials: true, // 크로스 도메인 허용
    origin: 'http://localhost:3000',  // 허용할 도메인 설정
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
}));
app.get('/', (req, res) => {
    res.header("Access-Control-Allow-Credentials", 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // 모든 HTTP 메서드 허용
    res.header('Content-Type', "application/json")
    res.json('welcome')
})

//컬럼 목록 가져오기
app.get('/api/columns/', async function (req, res) {
    const { tableName } = req.query;
    const query = `select id as id , display_name as displayName ,field_type as Type FROM meta_fields where table_name='${tableName}'`
    let result = await sql.executeQuery(query);
    res.json(result);
});

// 컬럼 추가
app.post('/api/columns/', async (req, res) => {
    let { type } = req.body;
    let { options } = req.body;
    const { tableName, displayName } = req.body;
    const id = await sql.getmetaFieldLastKey()
    const fieldName = fn.generateFieldName(displayName) + '_' + id

    if (type === 'enum') { type = `enum(${options})` }
    if (type === 'set') { type = `set(${options})` }

    const query = `INSERT INTO meta_fields (table_Name,field_name,field_type,display_name)values('${tableName}','${fieldName}','${type}','${displayName}') `
    let result = await sql.executeQuery(query)

    if (type.includes('enum')) { type = `enum(${wrapWithQuotes(options)})` }
    if (type.includes('set')) { type = `set(${wrapWithQuotes(options)})` }

    // 연결된 테이블에 컬럼 추가 (TableSync 사용)
    await TableSync.addColumnToTable(tableName, fieldName, type)
    res.status(200).json({ message: 'Column add successfully', result });
});


// 컬럼 수정
app.put('/api/columns/', async (req, res) => {
    let { type } = req.body;
    let { options } = req.body;
    const { tableName, newName, id } = req.body;
    const currentFieldQuery = `SELECT field_name FROM meta_fields WHERE id='${id}'`;
    const currentFieldResult = await sql.executeQuery(currentFieldQuery);
    const currentFieldName = currentFieldResult[0].field_name;
    const newFieldName = fn.generateFieldName(newName) + '_' + id;
    try {

        if (type === 'enum') { type = `enum(${options})` }
        if (type === 'set') { type = `set(${options})` }
        const query = `update meta_fields set field_name='${newFieldName}' , display_name='${newName}' ,field_type='${type}' where table_name='${tableName}' and id='${id}'`
        const result = await sql.executeQuery(query);

        // 연결된 테이블의 컬럼 이름 변경 (TableSync 사용)
        // 
        if (type.includes('enum')) { type = `enum(${wrapWithQuotes(options)})` }
        if (type.includes('set')) { type = `set(${wrapWithQuotes(options)})` }
        const newFieldType = type;
        await TableSync.renameColumnInTable(tableName, currentFieldName, newFieldName, newFieldType);


        res.status(200).json({ message: 'Column renamed successfully', result });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Failed to rename column', details: error.message });
    }
});


// 컬럼 삭제
app.delete('/api/columns/:id', async function (req, res) {
    try {
        const { tableName } = req.params
        let _url = req.url;
        let queryData = url.parse(_url, true).query;
        let id = queryData.id
        let displayName = queryData.displayName
        const fieldQuery = `SELECT table_name, field_name FROM meta_fields WHERE id='${id}'`;
        const fieldResult = await sql.executeQuery(fieldQuery);
        const { table_name, field_name } = fieldResult[0];


        const query = `DELETE FROM meta_fields WHERE id='${id}'`
        let result = await sql.executeQuery(query);
        // 연결된 테이블의 컬럼 삭제 (TableSync 사용)

        // console.log({table_name:table_name,field_name:field_name})
        await TableSync.deleteColumnFromTable(table_name, field_name);

        res.status(200).json({ message: 'Column deleted successfully', result: result });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Failed to delete column', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('AubeStudio CRM!');
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



function wrapWithQuotes(input) {
    // 입력된 문자열을 쉼표로 분리하여 배열로 만든 후,
    // 각 요소를 작은따옴표로 감쌉니다.
    const items = input.split(',').map(item => `'${item.trim()}'`);

    // 작은따옴표로 감싼 요소들을 다시 쉼표로 연결하여 반환합니다.
    return items.join(',');
}



// GET 요청: 모든 스케줄 데이터 가져오기
app.get('/api/schedules', async function (req, res) {

    const query = 'SELECT id,calendar_id,title,start,end,category, raw FROM schedules';
    let result = await sql.executeQuery(query);
    console.log(result)
    res.json(result);

});

// POST 요청: 새로운 스케줄 추가
app.post('/api/schedules', async function (req, res) {

    const { calendarId, title, body, start, end, category, isAllDay, location, state } = req.body;

    if (!calendarId || !title || !start || !end) {
        return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }
    const query = `INSERT INTO schedules (calendarId, title, body, start, end, category, isAllDay, location, state)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    console.log(query, [calendarId, title, body, start, end, category, isAllDay, location, state]);
    sql.executeQuery2(query, [calendarId, title, body, start, end, category, isAllDay, location, state], (err, results) => {
        if (err) {
            console.error('Database error:', err); // 에러 로그 기록
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: results.insertId, ...req.body });
    });
});

// DELETE 요청: 스케줄 삭제
app.delete('/api/schedules/:id', async function (req, res) {
    const { id } = req.params;
    const query = 'DELETE FROM schedules WHERE id = ?';
    sql.executeQuery(query, [id], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Schedule deleted successfully' });
    });
});


// 1. **고객 추가**
app.post('/customers', (req, res) => {
    const customer = req.body;
    const sql = 'INSERT INTO Customers SET ?';
    db.query(sql, customer, (err, result) => {
        if (err) throw err;
        res.send('Customer added...');
    });
});

// 2. **고객 목록 검색**
app.get('/customers', (req, res) => {
    const sql = 'SELECT * FROM Customers';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// 3. **고객 상세 검색**
app.get('/customers/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM Customers WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.json(result[0]);
    });
});

// 4. **고객 수정**
app.put('/customers/:id', (req, res) => {
    const { id } = req.params;
    const customer = req.body;
    const sql = 'UPDATE Customers SET ? WHERE id = ?';
    db.query(sql, [customer, id], (err, result) => {
        if (err) throw err;
        res.send('Customer updated...');
    });
});

// 5. **고객 삭제**
app.delete('/customers/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Customers WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.send('Customer deleted...');
    });
});