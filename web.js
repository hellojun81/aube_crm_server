import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import columnsRoutes from './routes/columns.js';
import customersRoutes from './routes/customers.js';
import scheduleRoutes from './routes/schedules.js';
import setupRoutes from './routes/setup.js';
const app = express();
const port = process.env.PORT || 8001;



dotenv.config();


app.use(express.json());
// app.set('views', __dirname + '/views');
app.use(cors({   
    origin:true,
    credentials: true, // 크로스 도메인 허용
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE'],
}));

app.get('/', (req, res) => {
    res.header("Access-Control-Allow-Credentials", 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // 모든 HTTP 메서드 허용
    res.header('Content-Type', "application/json")
    res.json('welcome')
})

app.use('/api/columns', columnsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/setup', setupRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
