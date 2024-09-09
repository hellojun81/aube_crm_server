import express from 'express';
const app = express();
app.use(express.json({ limit: '10mb' }));
import cors from 'cors';
import url from 'url';
import cafe24 from './lib/cafe24.js';
import sql from './lib/sql.js';
import fn from './lib/function.js';
import mail from './lib/mail.js';
import schedule from './lib/schedule.js';
import reqPost from './lib/reqPost.js';
// import crud from './lib/crud.js';
import { Server } from 'socket.io';
import http from 'http';
const httpServer = http.createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: "*",
        credentials: true
    }
});

// bufferChangeText()
// async function bufferChangeText(){
// let c =  await sql.executeQuery('select access_token from jcooly.cafe24_Token')
// console.log(c[0].access_token.toString('utf-8'))
// }

// var arr = [ "foo", "bar", "foo", "bar", "bar", "bar", "zoom" ] 
// var result2 = arr.reduce((r,c) => (r[c] = (r[c] || 0) + 1, r), {})
// console.log(result2)

var OrderData = new Array();
let _soketId = null;
schedule.start
app.use(cors({
    // origin: ['http://localhost:3000', 'http://jcooly.cafe24.com', '39.125.25.33'],
    origin:true,
    credentials: true, // 크로스 도메인 허용
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' })); // 제한을 10메가바이트로 설정
app.post('/gy/:name', async function (req, res) {
    const { name } = req.params
    OrderData = req.body;
    let _url = req.url;
    let queryData = url.parse(_url, true).query;
    var result = new Object();
    if (name == 'sendtable') {
        res.json(result)
    } else if (name == 'makeOrdermail') {
        let proname = await queryData.proname
        let filename = await queryData.filename
        let excelData = await fn.shippingSetup(proname, OrderData)
        let to_email = await sql.executeQuery('select email from provider where name="' + proname + '"')
        to_email = to_email[0].email
        let cnt = excelData.length - 1
        filename = filename.replace('.xlsx', '(' + cnt + '건).xlsx')
        let readyEmail = await sql.makeExcel(excelData, filename);
        let path = readyEmail.path;
        let a = await fn.SendMail(filename, to_email, path);
        io.emit('msg', a);
        res.json(result);

    } else if (name == 'InsertDb') {
        let a = await fn.setupInsertDb(OrderData)
        let msg = await fn.InsertDb(a.insertArr)
        io.emit('msg', msg);
        res.json(result)
    }
});

app.get('/', (req, res) => {
    // res.header("Access-Control-Allow-Orign", '*')
    res.header("Access-Control-Allow-Credentials", 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // 모든 HTTP 메서드 허용
    res.header('Content-Type', "application/json")
    res.json('welcome')
})

app.get('/gy/:name', async function (req, res) {
    const { name } = req.params
    let _url = req.url;
    let queryData = url.parse(_url, true).query;
    let result = new Object();
    if (name == 'GetOrder') {
        let _proname = queryData.proname
        let _strdate = queryData.strDate
        let _enddate = queryData.endDate
        let order_status = queryData.order_status
        if (order_status == "전체") { order_status = 'N20,N30,N40' }
        if (order_status == "배송준비중") { order_status = 'N20' }
        if (order_status == "배송중") { order_status = 'N30' }
        if (order_status == "배송완료") { order_status = 'N40' }
        let order_id = ''
        // let a = await cafe24.getOrder2();
        let a = await cafe24.getOrder(_strdate, _enddate, order_status, order_id, '');
        console.log(a)
        if (Array.isArray(a.arr)) {
            let splitcnt =  a.OrderSplitcnt
            let fOrderCnt=a.fOrderCnt
            a = a.arr
          
            io.emit('msg', '검색 건수:' + fOrderCnt + '/' + splitcnt);
            let _arr = new Array();
            if (_proname == 'ALL') {
                _arr = a;
            } else {
                for (let i = 0; i < a.length; i++) {
                    if (a[i].proname == _proname) {
                        _arr.push(a[i]);
                    }
                }
            }
            if (_arr.length == 0) {
                res.json(result)
            }
            let msg = await fn.totaltable(_arr);
            io.emit('msg', msg);
            res.json(_arr);
        } else {
            io.emit('msg', '토큰값오류');
            res.json('토큰값오류');
        }
    } else if (name == 'excelDownload') {
        let proname =  queryData.proname
        let _a = await fn.shippingSetup(proname, OrderData)
        res.json(_a);

    } else if (name == 'getProvider') {
        var _a = await sql.getProvider();
        res.json(_a)
        io.emit('msg', `거래처 정보 가져오기 완료`);
        fn.checkInit()
    } else if (name == 'Ordertotal') {  //합계표 메일보내기
        let fileName = queryData.fileName
        let date = queryData.date
        io.emit('msg', await fn.OrdertotalMail(fileName, date));
    } else if (name == 'getdropProvider') {
        let arr = new Array();
        let _arr = new Object();
        let result = await sql.executeQuery('SELECT name,keycode FROM  provider '
            + ' where dealYN="Y"')
        for (let i = 0; i < result.length; i++) {
            _arr = new Object
            _arr =  result[i].name;
            arr.push(_arr);
        }

        res.json(arr);

    } else if (name == 'createship2') {
        // let _sql = await sql.executeQuery('select name from provider where dealYN="Y"')
        // for (let j = 0; j < _sql.length; j++) {
        //     await mail.reciveMail(_sql[j].name);
        // }
        // let a = await fn.readdirAsync()
        // if (a.length > 0) {
        //     io.emit('msg', '메일수신 문서:' + a.length + '존재');
        // }


        let b = await fn.readdirAsync()
        let arr = new Array
        for (let i = 0; i < b.length; i++) {
            arr.push(await fn.readxls(b[i]));
        }
        res.json(arr);
    } else if (name == 'recivemail') {
        let _sql = await sql.executeQuery('select name from provider where dealYN="Y"')
        for (let j = 0; j < _sql.length; j++) {
         await mail.reciveMail( _sql[j].name);
        }
        let a = await fn.readdirAsync()
        for (let i = 0; i < a.length; i++) {
            io.emit('msg', '메일수신 문서:' + a[i] + '건 존재');
        }
    } else if (name == 'delfile') {
        fn.recivefileDel();
    } else if (name == 'sql') {
        let query = queryData.query
        let result = await sql.executeQuery(query)
        let arr = new Array()
        let _arr = new Array()
        for (let i = 0; i < result.length; i++) {
            _arr = new Array()
            for (let j = 0; j < Object.keys(result[i]).length; j++) {
                _arr.push( Object.values(result[i])[j])
            }
            arr.push(_arr)
        }
        if (result.length == undefined) {
            arr.push(result.affectedRows)
        }
        res.json(arr);
    }
})

/////////////////////////////////////라비에벨 부킹/////////////////////////////
app.get('/api/:name', async function (req, res) {

    const { name } = req.params
    let socketMsg = null
    let result
    let _url = req.url;
    let queryData = url.parse(_url, true).query;
    let id, pw, _pointdate, _pointname, _pointtime, _hand_tel1, _hand_tel2
        , _hand_tel3, _bookgDateSms, _bookgCourseSms, _certSeq, _certNo
    id = queryData.id
    _soketId = id
    pw = queryData.pw
    let session = queryData.session
    let saveid = 'saveid'
    if (name === 'login') {
        let myinfo, result, name, tel
        let Islogin = false

        // session = reqPost.getSession(req).Session
        // saveid = reqPost.getSession(req).saveid
        if (session != undefined) {
            myinfo = await reqPost.myinfo(session)
            if (myinfo.name) {
                Islogin = true
                name = myinfo.name;
                tel = myinfo.tel
                id = myinfo.id
                _soketId = id
                saveid = id
            }
        }

        if (Islogin == false) {
            let loginResult = await reqPost.login(id, pw, req, res)
            let login = loginResult.result
            if (login.indexOf('환영합니다') > -1) {
                session = loginResult.session
                let myinfo = await reqPost.myinfo(session)
                name = myinfo.name;
                tel = myinfo.tel
                id = myinfo.id
                saveid = id
                _soketId = id
                if (login.indexOf('alert') > -1) {
                    login = login.split('alert(')
                    login = login[1].split(')')
                    login = login[0].replace(/\"/gi, "");
                    login = login + "_" + myinfo.tel + "_ok"
                    Islogin = true
                    res.writeHead(200, {
                        'set-cookie': [
                            'same-site-none (non-secure)=yes;SameSite=None',
                            session + ';path=/; HttpOnly;path=/; secure;SameSite=None',
                            'ck_saveid=;path=/; HttpOnly;path=/; secure;SameSite=None' + id,
                            'chk_savepw=;path=/; HttpOnly;path=/; secure;SameSite=None',
                            `Permanent=cookies; Max-Age=$(60*60*24*30)`,

                        ]
                    })
   

                    result = { result: "ok", name: name, tel: tel, id: saveid, session: session, loginis: false };
                    res.write(JSON.stringify(result));
                    res.end();

                }
            } else {
                login = login.split('(')
                login = login[1].split(')')
                login = login[0].replace(/\"/gi, '')
                result = { result: login };
                res.write(JSON.stringify(result));
                res.end();
            }

        } else {
            result = { result: "ok", name: name, tel: tel, id: saveid, session: session };
            res.write(JSON.stringify(result));
            res.end();
        }

    } else if (name === 'booking') {
        session = queryData.session
        let bkDate = queryData.date
        let getTel = queryData.tel
        let teeoff = queryData.tee
        let _bkDate = bkDate.substr(0, 4) + '년' + bkDate.substr(4, 2) + '월' + bkDate.substr(6, 2) + '일'
         io.emit(_soketId, _bkDate + '[' + teeoff + ']번쨰 티업 부킹을 시도합니다.');
        let getCourse = await reqPost.getCourse(bkDate, session)
        if (getCourse.indexOf('Tee-off 타임이 없습니다') == -1) {
            getCourse.splice(0, 1)
            io.emit(_soketId, bkDate + '일[' + getCourse.length + ']건에 부킹가능 타임이 존재합니다');
            if (Number(teeoff) > getCourse.length) {
                io.emit(_soketId, '현재 가장빠른 부킹가능 순서는 [' + getCourse.length + ']번쨰 입니다');
            }
            for (let i = Number(teeoff); i < getCourse.length; i++) {
                let str = getCourse[i].split(',')
                _pointdate = getDate(str[4])
                _pointname = str[3]
                _pointtime = str[2]
                _hand_tel1 = getTel.substr(0, 3)
                _hand_tel2 = getTel.substr(3, 4)
                _hand_tel3 = getTel.substr(7, 7)
                _bookgDateSms = ''
                _bookgCourseSms = ''
                _certSeq = ''
                _certNo = ''

                let authorization = await reqPost.authorization(_pointdate, _pointname, _pointtime, _hand_tel1, _hand_tel2
                    , _hand_tel3, _bookgDateSms, _bookgCourseSms, _certSeq, _certNo, session)
                _certSeq = authorization.cert_seq
                _certNo = authorization.cert_no
                socketMsg = _pointdate + '[' + _pointtime + ']부킹을 시도합니다'
                io.emit(_soketId, socketMsg);
                let real_resOk = await reqPost.real_resOk(_pointdate, _pointname, _pointtime, _hand_tel1, _hand_tel2
                    , _hand_tel3, _bookgDateSms, _bookgCourseSms, _certSeq, _certNo, session)
                if (real_resOk.result == 'OK') {
                    socketMsg = _pointdate + '[' + _pointtime + ']_부킹성공'
                    io.emit(_soketId, socketMsg);
                    socketMsg = '부킹을 종료합니다'
                    io.emit(_soketId, socketMsg);
                    result = { result: true }
                    res.write(JSON.stringify(result));
                    res.end();
                    break
                } else {
                    socketMsg = real_resOk.result + '문제로 부킹실패_재시도합니다'
                    io.emit(_soketId, socketMsg);
                }
            }
        } else {
            io.emit(_soketId, getCourse);
            // res.json(getCourse)
        }
    } else if (name === 'checklogin') {
        session = queryData.session
        console.log(session)
        let myinfo = await reqPost.myinfo(session)
        io.emit(_soketId, myinfo.tel);
    } else if (name === 'logout') {
        session = queryData.session
        if (session != undefined) {
            session = reqPost.getSession(req).Session
            await reqPost.logout(req, res, session)
            result = { result: 'logout' }
        }
    }

})

function getDate(date) {
    let day = date.split(' ')
    day[2] = day[2].replace('월', '')
    if (day[2].length == 1) {
        day[2] = '0' + day[2]
    }
    day[3] = day[3].replace('일', '')
    if (day[3].length == 1) {
        day[3] = '0' + day[3]
    }
    day = day[1].replace('년', '') + day[2] + day[3]
    return day;
}

httpServer.listen(8001, function (req, res) {
    console.log('server start',req+res)
})
