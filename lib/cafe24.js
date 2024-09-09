import sql from './sql.js';
import fn from './function.js';
import request from 'request';
import { io } from '../web.js'
// import io from 'socket.io';
var cf24_Version = '2022-09-01';
let providerArr = []
async function getToken() {
    let _access_token
    let refresh_token = await sql.executeQuery("select refresh_token from cafe24_Token")
    refresh_token = refresh_token[0].refresh_token
    var payload = 'grant_type=refresh_token&refresh_token=' + refresh_token;
    var options = {
        method: 'POST',
        url: 'https://jcool2.cafe24api.com/api/v2/oauth/token',
        headers: {
            'Authorization': "Basic R0VGeUZBN2FCSlZrSVhBc3JGalV4Qjo1SlZ5VDF2TkhGaWtKUFZmdDV5UTZD",
            'Content-Type': "application/x-www-form-urlencoded"
        },
        body: payload,
        json: true
    };
    let body = await new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) reject(error);
            resolve(body);
        });
    });
    await sql.executeQuery('DELETE FROM cafe24_Token')
    let expires_at = fn.getCurrent();
    await sql.executeQuery('INSERT INTO cafe24_Token(access_token, expires_at, refresh_token) VALUES ('
        + '"' + body.access_token + '"'
        + ',"' + expires_at + '"'
        + ',"' + body.refresh_token + '")');
    _access_token = body.access_token
    return _access_token
}

async function CreateShipping(tracking_no, shipping_company_code, order_item_code, carrier_id) {
    let c = await sql.executeQuery('select access_token from jcooly.cafe24_Token')
    let access_token = c[0].access_token
    var item_code = order_item_code.split('-');
    item_code = item_code[0] + '-' + item_code[1];
    var callLimt
    var payload = {
        "shop_no": 1,
        "request": {
            "tracking_no": tracking_no,
            "shipping_company_code": shipping_company_code,
            "status": "shipping",
            "order_item_code": [
                order_item_code
            ],
            "shipping_code": "",
            "carrier_id": carrier_id
        }
    };
    var options = {
        method: 'POST',
        url: 'https://jcool2.cafe24api.com/api/v2/admin/orders/' + item_code + '/shipments',
        headers: {
            'Authorization': "Bearer " + access_token,
            'Content-Type': "application/json",
            'X-Cafe24-Api-Version': cf24_Version,
            'X-Api-Call-Limit': 1 / 40
        },
        body: payload,
        json: true
    };
    let body = await new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            console.log('response.rawHeaders.length',response.rawHeaders.length);
            if (response.rawHeaders.length == 36) {
                callLimt = response.rawHeaders[33];
            } else {
                callLimt = response.rawHeaders[31];
            }
            console.log('callLimt',callLimt);
            
            if (callLimt.indexOf('30/') >= 0) {
                sleep(2000).then(() => {
                    resolve(body);
                });
            } else {
                resolve(body);
            }
            if (error) reject(error);
        });
    });
    let a = await body;
    return a;
}
async function getOrder(strDate, endDate, order_status, order_id, type) {

   let c = await sql.executeQuery('select access_token from jcooly.cafe24_Token')
    let access_token =  c[0].access_token
    let _order_id = order_id
    var _url
    if (order_id) {
        order_id = order_id.split('-');
        order_id = order_id[0] + '-' + order_id[1];
    }
    var json = new Object();
    let arr = new Array()
    if (strDate) {
        _url = 'https://jcool2.cafe24api.com/api/v2/admin/orders?start_date=' + strDate + '&end_date=' + endDate + '&order_status=' + order_status
            + '&order_id=&limit=1000&embed=items,receivers,buyer&order_id=' + order_id
    } else {

        _url = 'https://jcool2.cafe24api.com/api/v2/admin/orders?&order_status=' + order_status
            + '&order_id=&limit=1000&embed=items,receivers,buyer&order_id=' + order_id
    }
    var options = {
        method: 'GET',
        url: _url,
        headers: {
            'Authorization': "Bearer " + access_token,
            'Content-Type': "application/json",
            'X-Cafe24-Api-Version': cf24_Version
        }
    };
    return new Promise((resolve) => {
        request(options, async function (error, response, body) {
            var OrderSplitcnt = 0;
            let progress, progresscnt
            if (error) throw new Error(error);
            var str = JSON.parse(body);
           
            if (str.orders) {
                var fOrderCnt=str.orders.length
                progress = 0
                progresscnt = 100 / str.orders.length;
                // progresscnt=Math.ceil(progresscnt)
                OrderSplitcnt = str.orders.length
                if (type == 'total') {
                    arr = str.orders.length
                } else {
                    OrderSplitcnt = 0;
                    for (let i = 0; i < str.orders.length; i++) {
                        progress = progresscnt * i;

                        if ((str.orders.length - i) == 1) { progress = 100 }
                        io.emit('msg', '진행율:' + parseInt(progress) + '%');
                        for (let j = 0; j < str.orders[i].items.length; j++) {

                            if (order_status.indexOf(str.orders[i].items[j].order_status) > -1) {
                                if (type == 'inserDb') {
                                    if (_order_id == str.orders[i].items[j].order_item_code) {
                                        OrderSplitcnt = str.orders[i].items[j].quantity
                                        break;
                                    }
                                } else {
                                    for (let l = 0; l < str.orders[i].items[j].quantity; l++) {
                                        json = new Object
                                        json.order_item_code = str.orders[i].items[j].order_item_code
                                        let itemname = await sql.getchgTxt(str.orders[i].items[j].option_value)
                                        json.order_item_name = itemname
                                        let quantity = str.orders[i].items[j].quantity
                                        json.quantity = 1
                                        json.product_name = str.orders[i].items[j].product_name
                                        var chgprovider = await sql.ChgProvider(itemname)
                                        let proname = chgprovider.proname;
                                        let buymoney = chgprovider.buymoney;
                                        let keycode = chgprovider.keycode
                                        if (providerArr.indexOf(proname) == -1) {
                                            providerArr.push(proname)
                                        }
                                        json.proname = proname
                                        json.itemnameOrigin = str.orders[i].items[j].option_value.replace(/,/g, '');
                                        let payment = str.orders[i].payment_amount;  //실제 결제금액
                                        let orderqty = str.orders[i].items.length
                                        json.sellmoney = Math.floor(Math.floor(payment / orderqty) / quantity);
                                        json.buymoney = buymoney;
                                        json.fee = Math.floor(json.sellmoney * 0.23);
                                        json.marjin = json.sellmoney - buymoney - json.fee;
                                        json.revname = str.orders[i].receivers[0].name
                                        json.revadd = str.orders[i].receivers[0].address_full.replace(/,/g, '')
                                        json.revcellphone = str.orders[i].receivers[0].cellphone
                                        json.revtel2 = str.orders[i].receivers[0].phone
                                        json.memo = str.orders[i].receivers[0].shipping_message
                                        json.buyer = str.orders[i].buyer.name
                                        json.buyercellphone = str.orders[i].buyer.cellphone
                                        json.buyerphone = str.orders[i].buyer.phone
                                        let c = await sql.checkOrder(json.order_item_code)
                                        if (c > 0) {
                                            json.checkOrder = 'Y'
                                        } else {
                                            json.checkOrder = 'N'
                                        }
                                        json.order_place_id = str.orders[i].order_place_name
                                        json.keycode = keycode;
                                        json.null = ''
                                        let d = await sql.executeQuery("select etc from deleydel where order_item_code='" + json.order_item_code + "'")
                                        if (d.length > 0) {
                                            json.checkOrder = 'D'
                                            json.null =  d[0].etc
                                        }
                                        if (type == '') {
                                            arr.push(json);
                                            OrderSplitcnt++
                                        }
                                        // if(proname=='프레시왕(성주참외)'){
                                        //     json.boxkind = '극소';
                                        //     if(itemname.indexOf('10kg')>-1){
                                        //         json.boxkind = '중';
                                        //     }
                                        //     console.log(json.boxkind)
                                        // }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if(type!='total'){
                arr=fn.sortJSON(arr,'order_item_name','desc')
            }
           
            resolve({arr:arr, OrderSplitcnt: OrderSplitcnt,providerArr: providerArr,fOrderCnt:fOrderCnt})
        }); 
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
        console.log('sleep:' + ms);
    });
}

export default {
    getToken,
    CreateShipping,
    getOrder
}



