import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from './lib/sql.js';
import customersRoutes from './routes/customers.js';
import scheduleRoutes from './routes/schedules.js';
import setupRoutes from './routes/setup.js';
import http from 'http';


dotenv.config();
const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 8001;

app.use(express.json());

app.use(cors({
    origin: true,
    credentials: true, // 크로스 도메인 허용
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
}));

app.get('/', (req, res) => {
    res.header("Access-Control-Allow-Credentials", 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // 모든 HTTP 메서드 허용
    res.header('Content-Type', "application/json")
    res.json('welcome aubeCrm ^^')
})

app.get('/login', async (req, res) => {
    try {
        // 쿼리 파라미터에서 id와 pw를 가져옴
        const { id, pw } = req.query;
        // id 또는 pw가 존재하지 않을 경우 처리
        if (!id || !pw) {
            return res.status(400).json({ message: 'ID와 비밀번호를 모두 입력해주세요.' });
        }
        // SQL 쿼리 실행
        const query = `SELECT id, pw FROM login WHERE id = ? AND pw = ?`;
        const result = await sql.executeQuery(query, [id, pw]);
        console.log(result);
        // 로그인 성공 여부 확인
        if (result.length > 0) {
            res.json(true); // 로그인 성공 시 'true' 반환
        } else {
            res.status(401).json(false); // 로그인 실패 시 'false' 반환
        }
    } catch (error) {
        // 오류 처리
        console.error(error);
        res.status(500).json({ message:error+ '서버 오류가 발생했습니다.' });
    }
});



app.use('/api/customers', customersRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/setup', setupRoutes);

httpServer.listen(8001, function (req, res) {
    console.log('server start')
})