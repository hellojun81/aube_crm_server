import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import columnsRoutes from './routes/columns.js';
import customersRoutes from './routes/customers.js';
import scheduleRoutes from './routes/schedules.js';
import setupRoutes from './routes/setup.js';
import http from 'http';
//nodemon --exec ./node_modules/.bin/ts-node web.js
dotenv.config();
const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 8001;

app.use(express.json());

app.use(cors({   
    origin:true,
    credentials: true, // 크로스 도메인 허용
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
}));

app.get('/', (req, res) => {
    res.header("Access-Control-Allow-Credentials", 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // 모든 HTTP 메서드 허용
    res.header('Content-Type', "application/json")
    res.json('welcome 123')
})

app.use('/api/columns', columnsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/setup', setupRoutes);

httpServer.listen(8001, function (req, res) {
    console.log('server start')
})