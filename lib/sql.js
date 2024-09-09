import mysql from 'mysql2';
import xlsx from 'xlsx';
import dayjs from 'dayjs';
import path from 'path';
import fn from './function.js';
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const conn = mysql.createConnection({
    host: "jcooly.cafe24.com",
    user: "jcooly",
    password: "dkffjqb@81",
    database: "jcooly",
    port: "3306",
    multipleStatements: true,
})
async function getItemMoney(proname, itemname) {
    try {
        let sql = "SELECT buymoney FROM `item` a left join provider b on a.proname=b.keycode  WHERE name='" + proname + "' and replace(itemname,' ','')=replace('" + itemname + "',' ','') and dealYN='Y' ";
        const [rows] = await conn.promise().query(sql)
        var jsonObj = rows[0];
        var arr = new Array();
        arr = Object.values(jsonObj)
        return (arr);
    } catch (err) {
        return ('getItemMoney:' + err);
    }
}
async function delprovider(proname, type) {
    var result = new Array();
    let sql = "SELECT col_1, col_2, col_3, col_4, col_5, col_6, col_7, col_8, col_9, col_10, col_11, col_12, col_13, col_14, col_15, col_16, col_17, col_18, col_19, col_20 "
        + "FROM delprovider  WHERE proname='" + proname + "' and type='" + type + "'";
    const [rows] = await conn.promise().query(sql)
    var jsonObj = rows[0];
    var arr = new Array();
    arr = Object.values(jsonObj)
    for (let i = 0; i < arr.length; i++) {
        result.push('' + arr[i])
    }
    return (result);
}
async function schedule(_fn, value) {
    executeQuery("INSERT INTO schedule(date, fn ,value) VALUES ('" + fn.getCurrent() + "','" + _fn + "','" + value + "')")
}

async function makeExportExcel(setup, proname, OrderData) {  //엑셀만들때 필요한 필드인지 체크
    try {
        let arr = Array();
        var JsonData = Array();
        for (let j = 0; j < OrderData.length; j++) {
            JsonData = Array();
            if (OrderData[j].proname == proname) {
                for (let i = 0; i < setup.length; i++) {
                    var txt = setup[i];

                    let sql2 = "select * from jcooly.exportAddField where field='" + txt + "'";
                    const [rows2] = await conn.promise().query(sql2)
                    if (rows2.length > 0) {
                        JsonData.push(OrderData[j][txt])
                    } else {
                        JsonData.push(txt)
                    }
                }
                arr.push(JsonData);
            }
        }
        if (arr.length > 0) {
            return (arr);
        }
    } catch (err) {
        return ('makeExportExcel' + err);
    }
}

async function makeExcel(arr, filename) {
    let Headers = new Array();
    let to_email;
    const data = arr;
    try {
        const workBook = xlsx.utils.book_new();
        const workSheet = xlsx.utils.json_to_sheet(data, { origin: 'A1', skipHeader: true });
        xlsx.utils.sheet_add_aoa(workSheet, [Headers], { origin: 'A1' });
        xlsx.utils.book_append_sheet(workBook, workSheet, '프레시왕');

        // 데이터의 컬럼 개수에 맞게 컬럼 넓이 설정
        const columnWidths = [
            { wch: 9 }, // 첫 번째 컬럼의 넓이를 150으로 설정
            { wch: 30 }, // 두 번째 컬럼의 넓이를 20으로 설정
            { wch: 5 }, // 두 번째 컬럼의 넓이를 20으로 설정
            { wch: 8 }, // 두 번째 컬럼의 넓이를 20으로 설정
            { wch: 8 }, // 두 번째 컬럼의 넓이를 20으로 설정
            { wch: 10 }, // 두 번째 컬럼의 넓이를 20으로 설정
            { wch: 10 }, // 두 번째 컬럼의 넓이를 20으로 설정
            { wch: 10 }, // 두 번째 컬럼의 넓이를 20으로 설정
        ];
        workSheet['!cols'] = columnWidths;
        let fileArr = filename
        await xlsx.writeFile(workBook, path.join(__dirname, fileArr));
        return {
            path: path.join(__dirname),
            to_email: to_email
        }

    } catch (err) {
        return ('makeExcel' + err);
    }
}

async function getProvider() {
    var result = new Array();
    let JsonData = new Object();
    let sql = 'select name,shipping_name, shipping_company_code,carrier_id,invoice_col,ordercode_col ,name_col ,email ,str_row from jcooly.provider where dealYN="Y"';
    try {
        const [rows] = await conn.promise().query(sql)
        for (let i = 0; i < rows.length; i++) {
            JsonData = new Object();
            JsonData.name = '' + rows[i].name
            JsonData.shipping_name = '' + rows[i].shipping_name
            JsonData.shipping_company_code = '' + rows[i].shipping_company_code
            JsonData.carrier_id = '' + rows[i].carrier_id
            JsonData.invoice_col = '' + rows[i].invoice_col
            JsonData.ordercode_col = '' + rows[i].ordercode_col
            JsonData.name_col = '' + rows[i].name_col
            JsonData.str_row = '' + rows[i].str_row
            JsonData.email = '' + rows[i].email
            result.push(JsonData)
        }
        return result;
    } catch (err) {
        return ('getProvider' + err);
    }
}

async function getchgTxt(itemname) {
    try {
        let cnt
        let sql = 'SELECT * FROM chgTxt';
        const [rows] = await conn.promise().query(sql)
        for (let j = 0; j < rows.length; j++) {
            // console.log(''+rows[j].txt1 ,''+rows[j].txt2)
            itemname = itemname.replace(rows[j].txt1, rows[j].txt2)
        }
        // for (let k = 0; k < 100; k++) {
        //     if (k < 10) {
        //         cnt = '00' + k + '.'
        //     } else { cnt = '00'+ k + '.' }
        //     itemname = itemname.replace(cnt, "")
        // }
        return itemname;
    } catch (err) {
        return ('getchgTxt' + err);
    }
}


async function ChgProvider(itemname) {
    try {
        let today = new Date();
        let _today = dayjs(today).format('YYYYMMDD');
        let proname, buymoney, keycode
        let sql2 = "select b.name ,a.buymoney ,a.keycode from item a left join provider b on a.proname=b.keycode where replace(itemname,' ','')=replace('" + itemname + "',' ','') and a.dealyn='Y' and str_date <= '" + _today + "' limit 1 ";
        const [rows2,] = await conn.promise().query(sql2)
        if (rows2 == 0) {
            proname = '거래처 확인불가';
            buymoney = '';
            keycode = '';
        } else {
            proname = '' + rows2[0].name;
            buymoney = '' + rows2[0].buymoney;
            keycode = '' + rows2[0].keycode;
        }
        return {
            proname: proname,
            buymoney: buymoney,
            keycode: keycode
        };
    } catch (err) {
        return ('ChgProvider' + err);
    }
}

async function UpdateOrderdel(orderNum, invoice) {
    try {
        const sql2 = "select * from orderDel where invoice like'%" + invoice + "%'"
        const [rows2] = await conn.promise().query(sql2)
        if (rows2.length === 0) {
            const sql = "UPDATE orderDel SET invoice=if(invoice='',CONCAT(invoice,'" + invoice + "'),CONCAT(invoice,'," + invoice + "'))where ordernum='" + orderNum + "'";
            const [result] = await conn.promise().query(sql);
            return result.affectedRows;
        } else {
            return '기입력건';
        }
    } catch (err) {
        console.error('UpdateOrderdel error:', err);
        throw err;
    }
}

async function checkOrder(ordernum) {
    try {
        const sql = "SELECT proname FROM orderDel  where ordernum='" + ordernum + "' limit 1";
        const [rows] = await conn.promise().query(sql);
        return rows.length;
    } catch (err) {
        console.error('checkOrder error:', err);
        throw err;
    }
}

function executeQuery(query) {
    return new Promise(function (resolve) {
        conn.query(query, function (err, result) {
            if (err) throw err;
            let newJsonObj = {};
            let obj = []
            for (let i = 0; i < result.length; i++) {
                let keys = Object.keys(result[i]);
                newJsonObj = {}
                keys.map((key) => {
                    newJsonObj[key] = '' + result[i][key]
                });
                obj.push(newJsonObj)
            }
            resolve(obj);
        });
    })
        .catch(function (err) {
            console.error('executeQuery error:', err);
            throw err;
        });
}



async function MakeOrdertotalProname(deldate) {
    try {
        const sql = "SELECT proname FROM orderDel WHERE deldate='" + deldate + "' GROUP BY proname";
        const [rows] = await conn.promise().query(sql);
        return rows;
    } catch (err) {
        console.error('getDistinctPronamesByDeliveryDate error:', err);
        throw err;
    }
}
async function MakeOrdertotal(deldate) {
    try {
        let pro = await MakeOrdertotalProname(deldate);
        let arr = new Array();
        let _arr = new Object();
        let _tcnt = 0;
        let _tcnt2 = 0;
        deldate = deldate.replace('-', '')
        deldate = deldate.replace('-', '')
        for (let i = 0; i < pro.length; i++) {
            let proname = '' + pro[i].proname
            arr.push([proname, '', '', '', '', '', '', '']);
            let sql = "SELECT deldate,itemname,sum(cnt)as cnt,buymoney,sum(cnt)*buymoney as tmoney ,proname FROM orderDel"
                + " where deldate='" + deldate + "' and proname='" + proname + "' group by itemname ,deldate ORDER BY deldate ,proname ASC";
            const [rows] = await conn.promise().query(sql)
            for (let j = 0; j < rows.length; j++) {
                _arr = new Array();
                _arr.deldate = '' + rows[j].deldate
                _arr.itemname = '' + rows[j].itemname
                _arr.cnt = '' + parseInt(rows[j].cnt)
                _tcnt = _tcnt + parseInt(rows[j].cnt)
                _arr.buymoney = '' + rows[j].buymoney
                _arr.tmoney = '' + rows[j].tmoney
                _tcnt2 = _tcnt2 + parseInt(rows[j].tmoney)
                arr.push(_arr);
            }
            _arr = new Array();
            _arr.deldate = ''
            _arr.itemname = '합계'
            _arr.cnt = _tcnt
            _arr.buymoney = ''
            _arr.tmoney = _tcnt2
            arr.push(_arr);
            arr.push(['']);
            _tcnt2 = 0;
            _tcnt = 0
        }
        return arr;
    } catch (err) {
        console.error('MakeOrdertotal error:', err);
        throw err;
    }
}

async function insertOrderdel(arr) {
    try {
        var sql = 'INSERT INTO orderDel(orderdate, ordernum, itemName, cnt, name, deldate, delName,invoice, etc, sellmoney,buymoney, proname, tel,Address,orderRoute) VALUES ?';
        const [result] = await conn.promise().query(sql, [arr]);
        return result.affectedRows;
    } catch (err) {
        console.error('insertOrderdel error:', err);
        throw err;
    }
}

export default {
    delprovider,
    schedule,
    getItemMoney,
    makeExportExcel,
    makeExcel,
    getProvider,
    getchgTxt,
    ChgProvider,
    UpdateOrderdel,
    checkOrder,
    MakeOrdertotal,
    insertOrderdel,
    executeQuery
}