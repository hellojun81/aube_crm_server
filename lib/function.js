import dayjs from 'dayjs';
import sql from './sql.js';
import mail from './mail.js';
import cafe24 from './cafe24.js';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import { io } from '../web.js'
var sendMailArr = new Array();
const recivefile = dirname(fileURLToPath(import.meta.url)) + '/attachements/'

async function checkInit() {
    let today = new Date();
    const year = today.getFullYear(); // 년
    const month = today.getMonth();   // 월
    const day = today.getDate();
    let _enddate = dayjs(today).format('YYYY-MM-DD');
    let _strdate = dayjs(new Date(year, month, day - 7)).format('YYYY-MM-DD')
    let result

    result = await cafe24.getOrder(_strdate, _enddate, 'N20', '', '');

    if (result) {
        io.emit('msg', '프레시왕_서버접속 신규 주문[' + result.fOrderCnt + '/' + result.OrderSplitcnt + ']건');
    }
    let _sql = await sql.executeQuery('select name from provider where dealYN="Y"')
    for (let j = 0; j < _sql.length; j++) {
        await mail.reciveMail(_sql[j].name);
    }
    let a = await readdirAsync()

    if (a.length > 0) {
        io.emit('msg', '메일수신 문서:' + a.length + '존재');
    }
    // else{
    //     io.emit('msg', '메일수신함에 거래처 폴더명 존재여부를 확인하세요');
    // }

}
async function recivefileDel() {
    let a = await readdirAsync()
    for (let i = 0; i < a.length; i++) {
        fs.unlink(recivefile + a[i], await function (err) {
            let filename = recivefile + a[i]
            if (err) {
                io.emit('msg', filename + '파일삭제오류');
            } else {
                io.emit('msg', filename + '파일삭제완료');
            }
        })
    }
}

async function readdirAsync() {
    return new Promise(function (resolve, reject) {
        let arr = new Array();
        fs.readdir(recivefile, function (error, result) {
            if (error) {
                reject(error);
            } else {
                for (let i = 0; i < result.length; i++) {
                    if (result[i].indexOf('xls') > 0) {
                        arr.push(result[i]);
                    }
                }
                resolve(arr);
            }
        });
    });
}

async function readxls(filename) {
    const excelFile = xlsx.readFile(recivefile + filename)
    const sheetName = excelFile.SheetNames[0]
    const firstSheet = excelFile.Sheets[sheetName];
    let loop = 0;
    let str = filename.split('_');
    let proname = str[0]
    // proname = '지장샘'
    let a = await sql.executeQuery('select str_row, invoice_col,ordercode_col,shipping_company_code,carrier_id from provider where name ="' + proname + '"');
    let str_row = a[0].str_row;
    const jsonData = xlsx.utils.sheet_to_json(firstSheet, { range: parseInt(str_row) });
    let invoice_col = '' + a[0].invoice_col;
    let ordercode_col = '' + a[0].ordercode_col;
    let shipping_company_code = '' + a[0].shipping_company_code;
    let carrier_id = '' + a[0].carrier_id;
    let tracking_no, msg, order_item_code
    let okcnt = 0;
    let falsecnt = 0;
    let _falsecnt = 0;
    let falseArr = new Array();
    io.emit('msg', '송장번호 전송 시작:' + filename + '[' + (jsonData.length) + ']건');

    for (let i = 0; i < jsonData.length; i++) {
        tracking_no = '';
        for (let j = 0; j < Object.keys(jsonData[i]).length; j++) {

            if (Object.keys(jsonData[i])[j].replace('cj', '').indexOf(invoice_col) > -1) {
                tracking_no = Object.values(jsonData[i])[j]
            }
            if (Object.keys(jsonData[i])[j] == ordercode_col) {
                order_item_code = Object.values(jsonData[i])[j]
            }
        }
        if (tracking_no != '' && order_item_code != '') {
            loop++;
            let r = await cafe24.CreateShipping(tracking_no, shipping_company_code, order_item_code, carrier_id)
            if (Object.keys(r)[0] == 'error') {
                if (r.error.more_info.status == 'shipping') {
                    _falsecnt++
                    await updateInvoice(order_item_code, tracking_no)
                } else {
                    falsecnt++
                    falseArr.push(order_item_code + ' : ' + tracking_no)
                }
            } else {
                okcnt++
                await updateInvoice(order_item_code, tracking_no)
            }
            progress(i, jsonData.length)
        } else {
            io.emit('msg', filename + '송장번호 또는 주문번호 가 없습니다');

        }
    }
    let today = new Date();
    today = dayjs(today).format('YYYYMMDD');
    let _sql = await sql.executeQuery('select cnt from orderDel where invoice="" and deldate="' + today + '"')


    if (falsecnt > 0) {
        for (let k = 0; k < falseArr.length; k++) {
            io.emit('msg', '송장번호 전송 실패내역:' + falseArr[k]);
        }
    }

    fs.unlink(recivefile + filename, await function (err) {
        if (err) {
            io.emit('msg', filename + '파일삭제오류');

        } else {
            io.emit('msg', filename + '파일삭제완료');

        }
    })
    msg = '송장번호 전송 완료 파일명:' + filename + ' 전체' + loop + '건  성공[' + okcnt + '] 기발송건[' + _falsecnt + '] 실패[' + falsecnt + '] 미발송[' + _sql.length + ']'
    io.emit('msg', msg);
    return (msg);

}
async function shippingSetup(proname, OrderData) {
    let arr = new Array();
    let shipping_name = await getShippingName(proname)
    let Headers = await sql.delprovider(shipping_name, 'header');
    arr.push(Headers)
    let excelSetup = await sql.delprovider(shipping_name, 'field')  //업체별엑셀양식가져오기
    let excelData = await sql.makeExportExcel(excelSetup, proname, OrderData)

    for (let i = 0; i < excelData.length; i++) {
        arr.push(excelData[i])
        progress(i, excelData.length)
    }
    return arr
}
async function SendMail(fileName, to_email, path) {
    let mailinfo = to_email + ":" + fileName
    let _sendMail
    let msg
    // if (!sendMailArr.includes(mailinfo)) {
    let textbody = "감사합니다 좋은하루 되세요~"
    // to_email = "hellojun81@daum.net"
    _sendMail = await mail.sendMail(path, fileName, to_email, textbody)
    if (_sendMail.indexOf('250') >= 0) {
        msg = to_email + ":" + fileName + " 메일발송[성공]";
        sendMailArr.push(mailinfo);
    } else {
        msg = to_email + ":" + fileName + " 메일발송[실패]";
    }
    // } else {
    //     msg = to_email + ":" + fileName + " 이전발송내역[존재]";
    // }
    return (msg)
}

async function setupInsertDb(OrderData) {
    let order_id
    let a
    let insertArr = new Array();
    let qty, length
    let _strdate = ''
    let _enddate = ''
    let order_status = 'N20'
    let type = 'inserDb'
    let noexist = true
    let totalqty = 0;
    for (let i = 0; i < Object.keys(OrderData).length; i++) {
        noexist = true
        progress(i, OrderData.length)
        order_id = OrderData[i].order_item_code
        a = await sql.executeQuery('select cnt from orderDel where ordernum= "' + order_id + '" limit 1')
        if (a.length == 0) {
            order_status = 'N20,N30,N40'
            qty = await cafe24.getOrder(_strdate, _enddate, order_status, order_id, type);
            for (let j = 0; j < insertArr.length; j++) {
                if (insertArr[j].order_item_code.indexOf(order_id) > -1) {
                    noexist = false;
                }
            }
            if (noexist == true) {

                totalqty = totalqty + qty.Ordercnt
                if (qty.Ordercnt == 0) {
                    console.log(OrderData[i])
                    qty = await cafe24.getOrder(_strdate, _enddate, order_status, order_id, type);
                }

                insertArr.push(OrderData[i])
                length = insertArr.length
                if (qty.Ordercnt == 0) {
                    qty = await cafe24.getOrder(_strdate, _enddate, order_status, order_id, type);
                    console.log('qty_reload=', qty)
                }
                if (qty.Ordercnt == 0) { qty.Ordercnt = 1 }
                Object.values(insertArr)[length - 1].quantity = qty.Ordercnt
                // if (Object.values(insertArr)[length - 1].quantity == 0) {
                //     console.log(OrderData[i])
                // }
                console.log(i + '/' + totalqty, ' qty.Ordercnt=', qty.Ordercnt)
            }
        }
    }
    return {
        insertArr: insertArr,
        totalqty: totalqty
    };

}
async function InsertDb(OrderData) {
    var _arr = new Array();
    var arr2 = new Array();
    let today = new Date();
    let _today = dayjs(today).format('YYYYMMDD');
    let qty = 0
    for (let i = 0; i < OrderData.length; i++) {
        arr2 = new Array();
        let str = OrderData[i].order_item_code.split('-');
        arr2.push(str[0]);
        arr2.push(OrderData[i].order_item_code);
        arr2.push(OrderData[i].order_item_name.replace(/ /g, ''));
        qty = qty + OrderData[i].quantity;
        arr2.push(OrderData[i].quantity);
        arr2.push(OrderData[i].buyer);
        arr2.push(_today);
        arr2.push('');
        arr2.push('');
        arr2.push('');
        arr2.push(OrderData[i].sellmoney);
        arr2.push(OrderData[i].buymoney);
        arr2.push(OrderData[i].proname);
        arr2.push(OrderData[i].buyercellphone);
        arr2.push(OrderData[i].revadd);
        arr2.push(OrderData[i].order_place_id);
        _arr.push(arr2);
    }
    // return 'DB입력:[' + qty + ']건';
    if (_arr.length > 0) {
        let a = await sql.insertOrderdel(_arr);
        return 'DB입력:[' + a + '/' + qty + ']건';
    } else {
        return 'DB입력:[' + 0 + '/' + qty + ']건';
    }

}

async function OrdertotalMail(fileName, date) {
    let msg
    let arr2 = await sql.MakeOrdertotal(date)
    console.log(arr2)
    if (arr2.length) {
        let _arr = Object.values(arr2)
        arr2 = new Array();
        for (let i = 0; i < _arr.length; i++) {
            arr2.push(Object.values(_arr[i]))
            progress(i, _arr.length)
        }
        let cnt = await sql.executeQuery('SELECT sum(cnt) as cnt FROM `orderDel` where deldate="' + date + '"')
        cnt = cnt[0].cnt
        fileName = fileName.replace('.xlsx', '(' + cnt + '건).xlsx')
        let readyEmail = await sql.makeExcel(arr2, fileName);
        let path = readyEmail.path;
        let textbody = ''

        let _sendMail = await mail.sendMail(path, fileName, "프레시왕 합계표<freshwangs@naver.com>", textbody)
        if (_sendMail.indexOf('250') >= 0) {
            msg = fileName + " 메일발송[성공]";
        } else {
            msg = fileName + " 메일발송[실패]";
        }
        return (msg)
    } else {
        return ('당일 합계표가 없습니다')
    }
}

async function totaltable(_arr) {
    let itemArr = new Array();
    _arr.forEach(function (n) {
        itemArr.push(n.order_item_name.replace(/ /g, '') + '|' + n.sellmoney)
    });
    let itemresult = _CountArr(itemArr);
    // let order_place_id = _CountArr(Order_id.order_place_id);
    let json = new Object();
    let arr = [];
    let OrderProvider = new Array();
    for (let i = 0; i < Object.values(itemresult).length; i++) {
        _arr.some(function (k) {
            if (k.order_item_name.replace(/ /g, '') + '|' + k.sellmoney == Object.keys(itemresult)[i]) {
                if (!OrderProvider.includes(k.proname)) {
                    OrderProvider.push(k.proname);
                }
                json = new Object();
                json.proname = k.proname
                json.itemname = k.order_item_name
                json.cnt = Object.values(itemresult)[i]
                json.buymoney = k.buymoney
                json.sellmoney = k.sellmoney;
                arr.push(json);
                return true;
            }
        });
    }


    let tmoney = 0, tmoney2 = 0;
    let strArr = new Array()
    for (let j = 0; j < OrderProvider.length; j++) {
        // strArr.push(OrderProvider[j]);
        for (let i = 0; i < Object.keys(arr).length; i++) {

            if (OrderProvider[j] == Object.values(arr)[i].proname) {
                tmoney = tmoney + (Object.values(arr)[i].cnt * Object.values(arr)[i].buymoney);
                tmoney2 = tmoney2 + (Object.values(arr)[i].cnt * Object.values(arr)[i].sellmoney);
            }
        }
    }
    // strArr.sort();
    let adv = Math.round((tmoney2 * 0.23))
    strArr.push('매출:' + tmoney2 + '(-)매입:' + tmoney + '(-)비용:'
        + adv + " 합계:" + ((tmoney2 - tmoney) - adv))

    let str = JSON.stringify(strArr)
    str = str.replace(/\"/gi, "");
    str = str.replace(/,/gi, "\n");
    str = str.replace(/[\[\]]+/g, '')
    return str;  //클라이언트로 보내는 메세지
}

function sortJSON(data, key, type) {
    if (type == undefined) {
        type = "asc";
    }
    if (typeof data == 'object') {
        return data.sort(function (a, b) {
            var x = a[key];
            var y = b[key];
            if (type == "desc") {
                return x > y ? -1 : x < y ? 1 : 0;
            } else if (type == "asc") {
                return x < y ? -1 : x > y ? 1 : 0;
            }
        });
    }
}

function progress(row, maxlength) {
    let progress = (100 / maxlength);
    let _progress = row * progress
    io.emit('msg', '진행율:' + parseInt(_progress) + '%');
}
function getCurrent() {
    let today = new Date();
    let current = dayjs(today).format('YYYY-MM-DD') + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds()
    return current
}
async function checkschedule() {
    let a = await sql.executeQuery('select value from schedule where fn="autosystem"')
    return a;
}

async function getShippingName(proname) {
    let shipping_name = await sql.executeQuery("select shipping_name from provider where name='" + proname + "'")
    shipping_name = shipping_name[0].shipping_name
    return shipping_name;
}

function _CountArr(arr) {
    const result = {};
    arr.forEach((x) => {
        result[x] = (result[x] || 0) + 1;
    });
    return result;
}

async function updateInvoice(ordernum, invoice) {
    let update = await sql.UpdateOrderdel(ordernum, invoice)
    return 'DB입력:' + update + ' 행 적용';
}

export default {
    checkInit,
    recivefileDel,
    readdirAsync,
    readxls,
    shippingSetup,
    SendMail,
    setupInsertDb,
    InsertDb,
    OrdertotalMail,
    totaltable,
    sortJSON,
    progress,
    getCurrent,
    checkschedule,
    getShippingName,
    updateInvoice
}