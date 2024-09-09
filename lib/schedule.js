
import schedule from 'node-schedule';
import dayjs from 'dayjs';
import mail from './mail.js';
import sql from './sql.js';
import fn from './function.js';
import cafe24 from './cafe24.js';

// ┌───────────── second (0 - 59)
// │ ┌───────────── min (0 - 59)
// │ │ ┌────────────── hour (0 - 23)
// │ │ │ ┌─────────────── day of month (1 - 31)
// │ │ │ │ ┌──────────────── month (1 - 12)
// │ │ │ │ │ ┌───────────────── day of week (0 - 6) 0은일요일 1부터월요일
// │ │ │ │ │ │
// │ │ │ │ │ │
//  *  *  *  *  *  *

const start = schedule.scheduleJob('00 0/5 09-18 * * 1-5', async () => {  //invoiceupload
    let checkschedule = await fn.checkschedule()
    if (checkschedule[0].value == 'Y') {
        let arr = new Array()
        let _sql = await sql.executeQuery('select name from provider where dealYN="Y"')
        for (let j = 0; j < _sql.length; j++) {
            await mail.reciveMail(_sql[j].name);
        }
        let a = await fn.readdirAsync()
        if (a.length > 0) {
            for (let i = 0; i < a.length; i++) {
                arr.push(await fn.readxls(a[i]))
            }
        }
        for (let i = 0; i < arr.length; i++) {
            sql.schedule('송장번호업로드', arr)
        }
    }
})

schedule.scheduleJob('00 15 12 * * 1-5', async () => {//sendordermail2
    let checkschedule = await fn.checkschedule()
    if (checkschedule[0].value == 'Y') {
        await sendordermail()
    }
})
schedule.scheduleJob('00 00 12 * * 1-5', async () => {//reflashToken
    await checkorder()
    // sql.schedule('토큰갱신', a)
})
schedule.scheduleJob('00 00 * * * *', async () => {//reflashToken
    await cafe24.getToken()
    // sql.schedule('토큰갱신', a)
})

schedule.scheduleJob('00 42 8 * * 1-5', async () => {//sendordermail2
    let result = await cafe24.getOrder(getToday()._strdate, getToday()._enddate, 'N20', '', '');
    let arr = []
    for (let i = 0; i < result.arr.length; i++) {
        arr.push(result.arr[i].order_item_name)
    }
    var result2 = arr.reduce((r, c) => (r[c] = (r[c] || 0) + 1, r), {})
    console.log(result2)
})

async function checkorder() {
    let providerArr = new Array();
    let result = await cafe24.getOrder(getToday()._strdate, getToday()._enddate, 'N20', '', '');
    for (var i = 0; i < result.arr.length; i++) {
        if (providerArr.indexOf(result.arr[i].proname) == -1) {
            providerArr.push(result.arr[i].proname)
        }
    }

    if (result.arr.length > 0) {
        if (providerArr.indexOf('확인불가') > -1) {  //거래처 확인불가 주문건이 포함일때   
            await mail.sendMail('', '주문건에 거래처 미확인 주문건이 존재합니다', "hellojun81@naver.com", result)
        }
    }
}


async function sendordermail() {
    let providerArr = new Array();
    let result = await cafe24.getOrder(getToday()._strdate, getToday()._enddate, 'N20', '', '');
    for (var i = 0; i < result.arr.length; i++) {
        if (result.arr[i].checkOrder == 'Y') {
            result.arr.splice(i, 1);
            i--;
        } else {
            if (providerArr.indexOf(result.arr[i].proname) == -1) {
                providerArr.push(result.arr[i].proname)
            }
        }
    }

    if (result.arr.length > 0) {
        let OrderData = result.arr
        let excelData, to_email, filename
        let readyEmail
        let path
        let msg, cnt
        let resultMsg = new Array()
        let resultMsg0 = new Array()
        let resultMsg1 = new Array()
        let resultMsg2 = new Array()
        let mailbody
        await sql.schedule('발주서작성', '자동발주서 작성:시작')
        if (providerArr.indexOf('확인불가') == -1) {
            for (let i = 0; i < providerArr.length; i++) {
                excelData = await fn.shippingSetup(providerArr[i], OrderData)
                to_email = await sql.executeQuery('select email from provider where name="' + providerArr[i] + '"')
                to_email = to_email[0].email
                cnt = excelData.length - 1
                filename = getToday()._enddate + '_프레시왕[' + providerArr[i] + ']발주서.xlsx'
                filename = filename.replace('.xlsx', '(' + cnt + '건).xlsx')
                readyEmail = await sql.makeExcel(excelData, filename);
                path = readyEmail.path;
                let b = await fn.SendMail(filename, to_email, path);
                await sql.schedule('발주서작성', '[성공]' + b)
                resultMsg.push('[성공]' + b)
            }

            let a = await fn.setupInsertDb(OrderData)  //insertDb
            if (a.insertArr.length > 0) {
                msg = await fn.InsertDb(a.insertArr)

            } else { msg = 'DB입력:0행 적용'; }
            await sql.schedule('발주서작성', '[성공]' + msg)
            resultMsg1.push(msg)
            filename = getToday()._enddate + '_프레시왕 발주서 합계표.xlsx'
            msg = await fn.OrdertotalMail(filename, getToday()._enddate.replace(/-/g, ''));
            await sql.schedule('발주서작성', '[성공]' + msg)
            resultMsg2.push(msg)

        } else {  //거래처 확인불가 주문건이 포함일때
            excelData = await fn.shippingSetup('지장샘', OrderData)
            to_email = "프레시왕<freshwangs@naver.com>"
            filename = getToday()._enddate + '_프레시왕[거래처 확인불가 포함]발주서.xlsx'
            filename = filename.replace('.xlsx', '(' + cnt + '건).xlsx')
            readyEmail = await sql.makeExcel(excelData, filename);
            path = readyEmail.path;
            let b = await fn.SendMail(filename, to_email, path);
            await sql.schedule('발주서작성', '[실패]' + b)
            resultMsg.push('[실패]' + b)
        }
        for (let i = 0; i < resultMsg.length; i++) {
            resultMsg0.push(resultMsg[i] + '\n')
        }
        mailbody = `발주서 메일보내기 
                        메일발송:${resultMsg0}
                        DB저장 :${resultMsg1}
                        합계표 :${resultMsg2}`
        let t = getToday()._enddate + '_자동발주'
        await mail.sendMail('', t, "hellojun81@naver.com", mailbody)
    }
}

function getToday() {
    let today = new Date();
    const year = today.getFullYear(); // 년
    const month = today.getMonth();   // 월
    const day = today.getDate();
    let _strdate = dayjs(new Date(year, month, day - 7)).format('YYYY-MM-DD')
    let _enddate = dayjs(today).format('YYYY-MM-DD');
    return {
        _strdate: _strdate,
        _enddate: _enddate
    }
}

export default {
    start
};
