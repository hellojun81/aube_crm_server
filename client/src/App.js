import './App.css';
import React, { useRef, useEffect, useState } from 'react';
import Header from './components/Header.js';
import Login from './components/Login.js';
import ResultJexcel, { insertRow } from './components/Result.js';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { FormControlLabel, Checkbox } from '@mui/material';
import Button from '@mui/material/Button';
import styled from 'styled-components';
import ButtonGroup from '@mui/material/ButtonGroup';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import jexcel from 'jspreadsheet-ce';
const apiUrl = process.env.REACT_APP_API_URL;

function App() {
  const today = new Date();
  const [Result, setResult] = useState('');
  const [data, setData] = useState('');
  const [Mailchecked, setMailchecked] = React.useState(false);
  const [Mailchkname, setMailchkname] = React.useState('엑셀다운로드');
  const [autoOrder, setautoOrder] = React.useState(false);
  const [duplication, setduplication] = React.useState(true);
  const [sellmoney, setsellmoney] = React.useState(false);
  const [href, sethref] = React.useState('login');
  const [clickbtn, setclickbtn] = React.useState('null');
  const [insertRow, setinsertRow] = useState('');
  const [width, setWidth] = useState(800);
  const [level, setlevel] = useState('level');
  const myJexcel = useRef(null);


  useEffect(() => {
    checkSchedeul()
    if (data.length > 0 || href == 'order') {
      checkResult()
    }

    if (href === 'transaction') {
      let cntSum = 0, moneySum = 0 ,sellmoneysum=0
      myJexcel.current.insertRow(1)
      // console.log(data)
      for (let i = 0; i < data.length; i++) {
        cntSum = cntSum + Number(data[i][2])
        moneySum = moneySum + Number(data[i][4])
        sellmoneysum=sellmoneysum+ Number(data[i][5])
      }
      myJexcel.current.setValue('C' + (data.length + 1), cntSum);
      myJexcel.current.setValue('E' + (data.length + 1), moneySum.toLocaleString());
      console.log({sellmoneysum:sellmoneysum,sellmoney:sellmoney})
      if(sellmoney==true){
        myJexcel.current.setValue('F' + (data.length + 1), sellmoneysum.toLocaleString());
      }

    }
  })

  function jexcelinsertRow() {
    myJexcel.current.insertRow(10)
  }
  async function saveDelete(mode) {
    let data = myJexcel.current.getData()
    let query
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === true) {
        if (mode === 'save') {
          query = save(data, i)
        } else if (mode === 'delete') {
          query = dbdelete(data, i)
        }

        const result = await getPromise('/gy/sql?query=' + query)
        if (result.length > 0) {
          myJexcel.current.setStyle('C' + (i + 1), 'background-color', '#dcdcdc')
        }
      }
    }

  }
  function dbdelete(data, i) {
    let query
    let tableName, keycode
    if (href === 'provider') {
      keycode = data[i][11]
      tableName = 'provider'
    } else if (href === 'item') {
      keycode = data[i][5]
      tableName = 'item'
    }
    query = 'delete from ' + tableName + ' where keycode="' + keycode + '"'
    return query
  }

  function save(data, i) {
    let query
    if (href === 'provider') {
      let name = data[i][1]
      let email = data[i][2]
      let shipping_company_code = data[i][3]
      let carrier_id = data[i][4]
      let shipping_name = data[i][5]
      let invoice_col = data[i][6]
      let ordercode_col = data[i][7]
      let name_col = data[i][8]
      let dealYN = data[i][9]
      let str_row = data[i][10]
      let keycode = data[i][11]
      if (keycode) {
        query = 'update provider set name="' + name + '",'
          + ' email="' + email + '" , shipping_company_code="' + shipping_company_code + '" , carrier_id="' + carrier_id + '" , '
          + ' shipping_name="' + shipping_name + '" , invoice_col="' + invoice_col + '" , ordercode_col="' + ordercode_col + '" , '
          + ' name_col="' + name_col + '" , dealYN="' + dealYN + '" , str_row="' + str_row + '"'
          + ' where keycode="' + keycode + '"'
      } else {
        query = 'INSERT INTO provider(name, license, tel, email, bank, bankname, etc, shipping_company_code,'
          + 'carrier_id, shipping_name, invoice_col, ordercode_col, name_col, dealYN, gubun, str_row) VALUES '
          + '("' + name + '","","","' + email + '" ,"","","","' + shipping_company_code + '","' + carrier_id + '","' + shipping_name + '"'
          + ',"' + invoice_col + '","' + ordercode_col + '","' + name_col + '","' + dealYN + '","","' + str_row + '")'
      }
    } else if (href === 'item') {
      let _today = dayjs(today).format("YYYYMMDD");
      let proname = data[i][1]
      let itemname = data[i][2]
      let buymoney = data[i][3]
      let sellmoney = data[i][4]
      let keycode = data[i][5]
      let dealYN = data[i][6]
      if (keycode != '') {
        query = 'update  item set proname=(select keycode from provider where name ="' + proname + '" limit 1)'
          + ' ,itemname="' + itemname + '" ,buymoney="' + buymoney + '"'
          + ' ,sellmoney="' + sellmoney + '", dealYN="' + dealYN + '" where keycode="' + keycode + '"';
      } else {
        query = "INSERT INTO item( proname, itemname, buymoney, sellmoney, etc, str_date, dealYN)"
          + "select keycode, '" + itemname + "','" + buymoney + "','" + sellmoney + "','','" + _today + "'"
          + ",'Y' from provider where name ='" + proname + "'"
      }
    }
    return query
  }
  const handleChange = (event) => {
    console.log(event.target.name)
    if (event.target.name == 'Mailchecked') {
      setMailchecked(event.target.checked);
      setclickbtn('Mailchecked')
      if (event.target.checked == true) {
        setMailchkname('엑셀_[메일보내기]')
      } else {
        setMailchkname('엑셀다운로드')
      }
    } else if (event.target.name == 'autoOrder') {
      setclickbtn('autoOrder')
      setautoOrder(event.target.checked);
      ScheduleOrder(event.target.checked)
    } else if (event.target.name == 'sellmoney') {
      console.log(event.target.name)
      setclickbtn('sellmoney')
      setsellmoney(event.target.checked);
    }else if (event.target.name == 'duplication') { 
      setclickbtn('duplication')
      setduplication(event.target.checked);
    }

  };

  async function checkSchedeul() {
    let query = 'select value from schedule where fn="autosystem"  '
    let data = await getPromise('/gy/sql?query=' + query)
    data = data[0].toString()
    if (data == 'N') {
      setautoOrder(false)
    } else {
      setautoOrder(true)
    }
  }

  function ScheduleOrder(event) {
    let query
    const checkbox = document.getElementById('autoOrder');
    if (event) {
      query = "UPDATE jcooly.schedule SET date='' ,"
        + "value='Y', fn='autosystem' where fn='autosystem'"
    } else {
      query = "UPDATE jcooly.schedule SET date='' ,"
        + "value='N', fn='autosystem' where fn='autosystem'"
    }
    data = getPromise('/gy/sql?query=' + query)
  }

  const handleData = (event) => {
    console.log('appHandleData',event)
    if (event) {
      if ('value' in event) {
        setData(event.value);
        setResult(event)
        setclickbtn(event.clickbtn)
      }
      if ('level' in event) {
        setData(level);
        console.log('event',event.level)
        setlevel(event.level)
        // setResult(event)
      }
      if ('href' in event) {
        sethref(event.href);
        setData([])
      }
      if ('login' in event) {
        if (event.login == true) {
          if(event.level==1){

          }
          console.log('event',event.level)
          sethref(event.href);
        }
      }
    }
  }
  function checkResult() {
    const data = myJexcel.current.getData();
    var proCheck = 0
    for (let i = 0; i < data.length; i++) {
      // console.log(data[i][4])
      if (data[i][4] == '거래처 확인불가') {
        proCheck++
        myJexcel.current.setStyle('B' + (i + 1), 'background-color', '#FFB300')
      }
      if (data[i][18] == 'Y') {

        SetJexcelColor('color', 'red', (i + 1))
        // myJexcel.current.setStyle('B' + (i + 1), 'background-color', '#DA0606')

      }
    }
    if (proCheck > 0) {
      window.confirm(proCheck + "건에 거래처 확인불가 주문이 존재합니다");
    }

  }
  function SetJexcelColor(style, color, row) {
    let maxcol = myJexcel.current.getData()
    maxcol = maxcol[0].length
    // console.log(maxcol)
    for (let i = 0; i < maxcol; i++) {
      let coor = String.fromCharCode(97 + i).toUpperCase() + row
      myJexcel.current.setStyle(coor, style, color);
    }

  }

  async function uploadInvoice() {
    var result = window.confirm("운송장번호 전송을 진행하시겠습니까?");
    if (result) {
      let post = await getPromise('/gy/createship2')
    }
  }

  async function MakeOrderList() {
    var obj = Result.provider
    let res, OrderProvider = []
    let automail = 'N';
    var result = window.confirm(Mailchkname + " 진행하시겠습니까?");
    if (result) {
      let a = await postOrderdata();
      console.log({ postOrderdata: a, result: result })
      for (let i = 0; i < data.length; i++) {
        let proname = data[i].proname
        if (proname != '거래처 확인불가') {
          if (!OrderProvider.includes(proname)) {
            OrderProvider.push(proname);
          }
        }
      }

      if (obj == "ALL") {
        for (let j = 0; j < OrderProvider.length; j++) {
          let proname = OrderProvider[j];
          // console.log({ proname: proname, prolength: OrderProvider.length })
          if (Mailchecked == true) {
            await sendMail(proname);
          } else {
            await excelDownload(proname)
          }
        }
      } else {
        let proname = obj
        if (Mailchecked == true) {
          await sendMail(proname)
        } else {
          await excelDownload(proname)
        }
      }
      insertDb()
    }
  }
 async function deleteMail(){
    
  var result = window.confirm("수신메일 문서를 모두 삭제 하시겠습니까");
  if (result) {
    let post = await getPromise('/gy/delfile')
  }
  // var result = window.confirm("수신메일 문서를 모두 삭제 하시겠습니까?");
  // if (result) {
  //   return await new Promise(async function (resolve, reject) {
  //     let arr = await postOrderdata();
  //     const Response = await fetch(apiUrl + '/gy/delfile', {
  //       method: 'POST', // 또는 'PUT'
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(arr),
  //     })
  //     const data = await Response.json();
  //     resolve(data);
  //   })
  // }
 }


  async function insertDb() {
    var result = window.confirm("발주서 를 DB에 저장하시겠습니까?");
    if (result) {
      return await new Promise(async function (resolve, reject) {
        let arr = await postOrderdata();
        const Response = await fetch(apiUrl + '/gy/InsertDb', {
          method: 'POST', // 또는 'PUT'
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(arr),
        })
        const data = await Response.json();
        resolve(data);
      })
    }
  }

  async function sendMail(proname) {
    return await new Promise(async function (resolve, reject) {
      let arr = await postOrderdata();
      let filename = dayjs(today).format("YYYY-MM-DD") + '_귤왕[' + proname + ']발주서.xlsx'
      // console.log({ arr: arr, filename: filename })
      const Response = await fetch(apiUrl + '/gy/makeOrdermail?proname=' + proname + '&filename=' + filename, {
        method: 'POST', // 또는 'PUT'
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(arr),
      })
      const data = await Response.json();
      resolve(data);
    })
  }

  async function excelDownload(proname) {
    // console.log({ excelDownload: proname })
    let res = await getPromise('/gy/excelDownload?proname=' + proname)
    // console.log({ excelDownload: proname, res: res })
    let filename = dayjs(today).format("YYYY-MM-DD") + '_귤왕[' + proname + ']발주서.xlsx'
    let cnt = res.length - 1
    filename = filename.replace('.xlsx', '(' + cnt + '건).xlsx')
    return await exportExcel(res, filename, 'A1')
  }

  async function exportExcel(data, filename, start) {
    const workBook = XLSX.utils.book_new();
    const workSheet = XLSX.utils.json_to_sheet(data, { origin: start, skipHeader: true });
    // XLSX.utils.sheet_add_aoa(workSheet, [Headers], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(workSheet, data, { origin: start });
    XLSX.utils.book_append_sheet(workBook, workSheet, '귤왕');
    let a = XLSX.writeFile(workBook, filename);
    return ('다운완료: ' + filename);
  }

  async function tableOrderdata() {
    const data = myJexcel.current.getData();
    let JsonData = new Object();
    let arr = new Array();
 
    // for (let i = 0; i < 200; i++) {
    for (let i = 0; i < data.length; i++) {
      JsonData = new Object();
      JsonData.order_item_code = data[i][0]
      JsonData.order_item_name = data[i][1]
      JsonData.quantity = data[i][2]
      JsonData.product_name = data[i][3]
      JsonData.proname = data[i][4]
      JsonData.itemnameOrigin = data[i][5]
      JsonData.sellmoney = data[i][6]
      JsonData.buymoney = data[i][7]
      JsonData.fee = data[i][8]
      JsonData.marjin = data[i][9]
      JsonData.revname = data[i][10]
      JsonData.revadd = data[i][11]
      JsonData.revcellphone = data[i][12]
      JsonData.revtel2 = data[i][13]
      JsonData.memo = data[i][14]
      JsonData.buyer = data[i][15]
      JsonData.buyercellphone = data[i][16]
      JsonData.buyerphone = data[i][17]
      JsonData.checkOrder = data[i][18]
      JsonData.order_place_id = data[i][19] 
      console.log('data.length',data[i].length)
      if(data[i].length>22){  //박스 중량 표시가 필요할떄 현재는 성주참외만 필요함(20230426)
      JsonData.boxkind = data[i][22]
      }
      if (JsonData.proname != '거래처 확인불가') {
        console.log({'duplication':duplication,'checkOrder':JsonData.checkOrder})
        if(duplication==true){
          if (JsonData.checkOrder == 'N') {
            arr.push(JsonData);
          }
        }else{
           arr.push(JsonData);
        }     
      }
    }
    // arr = new Array();
    return arr;
  }

  async function postOrderdata() {
    let arr = await tableOrderdata()
     console.log('arr', arr)
    await fetch(apiUrl + '/gy/sendtable', {
      method: 'POST', // 또는 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arr),
    })
      .then((response) => response.json())
    return arr;
  }
  async function getPromise(param) {
    return await new Promise(async function (resolve, reject) {
      const Response = await fetch(apiUrl + param, {
        headers: {
          'origin': 'http://gyulwang.cafe24app.com/',
        }
      })
      const data = await Response.json();
      resolve(data)
    })
  }


  let content = null;

  if (href == 'order') {
    // console.log('order')
    content =
      <>

        <Grid item xs={12}>
          <Box sx={{ display: 'inline' }}>
            <Header sendData={(value) => handleData(value)} level={level} clickbtn={clickbtn}/>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel control={<Checkbox
            checked={Mailchecked}
            onChange={handleChange} name='Mailchecked' />}
            label="메일전송" />
          <FormControlLabel
            control={<Checkbox
              checked={autoOrder}
              onChange={handleChange} name='autoOrder' />}
            label="자동발주" />
               <FormControlLabel
            control={<Checkbox
              checked={duplication}
              onChange={handleChange} name='duplication' />}
            label="중복제외" />
          <Button
            onClick={() => {
              insertDb()
            }}
          >DB저장</Button>
             <Button
            onClick={() => {
              deleteMail()
            }}
          >수신문서삭제</Button>
        </Grid>
        <Grid container>
          <Grid item xs={12} sx={{ width: '100%' }}>
            <ButtonGroup
              disableElevation
              variant="contained"
              aria-label="Disabled elevation buttons"
              sx={{ width: '100%', mb: 1 }} >
              <Button
                onClick={() => {
                  MakeOrderList()
                }}
                variant='contained' sx={{ width: '50%' }}>{Mailchkname}</Button>
              <Button variant='outlined' sx={{ width: '50%' }}
                onClick={() => {
                  uploadInvoice()
                }} >운송장번호 전송</Button>
            </ButtonGroup>
          </Grid>
          <Grid item xs={12} sx={{ width: '100%' }}>
            <ResultJexcel value={data} ref={myJexcel} mode={href} insertRow={insertRow} width={width} />
          </Grid>
        </Grid>
      </>

  } else if (href === 'item' || href === 'provider') {
    content =
      <>
        <Grid item xs={12}>
          <Box sx={{ display: 'inline' }}>
            <Header sendData={(value) => handleData(value)} level={level}/>
          </Box>
        </Grid>
        <Grid container>
          <Grid item xs={12} sx={{ width: '100%' }}>
            <ButtonGroup
              disableElevation
              variant="contained"
              aria-label="Disabled elevation buttons"
              sx={{ width: '100%', mb: 1 }} >

              <Button variant='contained' sx={{ width: '40%' }}
                onClick={() => {
                  saveDelete('save')
                }} >저장</Button>
              <Button variant='outlined' sx={{ width: '40%' }}
                onClick={() => {
                  saveDelete('delete')
                }} >삭제</Button>

              <Button
                onClick={() => {
                  jexcelinsertRow()
                }}
                variant='outlined' sx={{ width: '20%' }}>테이블열추가</Button>
            </ButtonGroup>
          </Grid>
          <Grid item xs={12} sx={{ width: '100%' }}>
            <ResultJexcel value={data} ref={myJexcel} mode={href} insertRow={insertRow} width={width} />
          </Grid>
        </Grid>
      </>
  } else if (href === 'transaction') {
    content =
      <>
        <Grid item xs={12}>
          <Box sx={{ display: 'inline' }}>
            <Header sendData={(value) => handleData(value)} sellmoney={sellmoney}/>
          </Box>
        </Grid>
        <Grid container>
        
          <Grid item xs={12} sx={{ width: '100%' }}>
            <FormControlLabel
              control={<Checkbox
                checked={sellmoney}
                onChange={handleChange} name='sellmoney' />}
              label="판매가 보기" />
          </Grid>
          <Grid item xs={12} sx={{ width: '100%' }}>
            <ResultJexcel value={data} ref={myJexcel} mode={href}  width={width} />
          </Grid>
        </Grid>
      </>
  } else if (href === 'schedule') {
    content =
      <>
        <Grid item xs={12}>
          <Box sx={{ display: 'inline' }}>
            <Header sendData={(value) => handleData(value)} />
          </Box>
        </Grid>
        <Grid container>
          <Grid item xs={12} sx={{ width: '100%' }}>
            <ResultJexcel value={data} ref={myJexcel} mode={href} insertRow={insertRow} width={width} />
          </Grid>
        </Grid>
      </>
  }
  if (href === 'login') {

    content =
      <><Login sendData={(value) => handleData(value)}></Login>
      </>
  }

  return (
    <div className="App" sx={{ width: '100%' }}>
      <Grid container>
        {content}
      </Grid>

    </div>
  );
}

export default App;
