import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import jexcel from 'jspreadsheet-ce';

const apiUrl = process.env.REACT_APP_API_URL;

const MyJexcel = forwardRef((props, ref) => {
  const jexcelRef = useRef(null);
  const jexcelInstance = useRef(null);
  const [data, setData] = useState(props.value)
  const [proArr, setproArr] = useState()
  const insertRow = props.insertRow
  const mode = props.mode
  // console.log('import Result.js')
  useImperativeHandle(ref, () => {
    const setStyle = (cell, property, value) => {
      if (jexcelInstance.current) {
        console.log('useImperativeHandle setStyle', value)
        jexcelInstance.current.setStyle(cell, property, value);
      }
    };
    const getValue = (col, row) => {
      console.log('%c useImperativeHandle getValue', "color:red")
      if (jexcelInstance.current) {
        return jexcelInstance.current.getValue(col, row);
      }
    };
    const setValue = (col, row, value) => {
      if (jexcelInstance.current) {
        console.log('%c useImperativeHandle setValue', "color:red", col + row + value)
        jexcelInstance.current.setValue(col, row, value);
      }
    };
    return {
      getData() {
        if (jexcelInstance.current) {
          // console.log('jexcelInstance',jexcelInstance.current.getData())
          return jexcelInstance.current.getData();
        }
      },
      insertRow() {
        console.log('%c useImperativeHandle insertRow', "color:red")
        if (jexcelInstance.current) {
          return jexcelInstance.current.insertRow();
        }
        return false;
      },
      setStyle,
      getValue,
      setValue,
      // setJexcelInstance,
    };
  });
  async function getProvider() {
    const data = await getPromise('/gy/getdropProvider')
    setproArr(data);
    console.log('setproArr',data)
  }


  async function getPromise(param) {
    return await new Promise(async function (resolve, reject) {
      const Response = await fetch(apiUrl + param)
      const data = await Response.json();
      resolve(data)
    })
  }



  // const handleSelection = (instance, col, row, col2, row2) => {
  //   const data = [];
  //   for (let i = row; i <= row2; i++) {
  //     const rowValues = [];
  //     for (let j = col; j <= col2; j++) {
  //       const value = instance.jexcel.getValueFromCoords(j, i);
  //       rowValues.push(value);
  //     }
  //     data.push(rowValues);
  //   }
  //   const csvData = data.map(row => row.join('\t')).join('\n');
  //   const textarea = document.createElement('textarea');
  //   textarea.textContent = csvData;
  //   document.body.appendChild(textarea);
  //   textarea.select();
  //   document.execCommand('copy');
  //   document.body.removeChild(textarea);
  //   console.log('Data copied to clipboard:', csvData);
  // };

  const handleSelection = (instance, col, row, col2, row2) => {
    const data = [];
    for (let i = row; i <= row2; i++) {
      const rowValues = [];
      for (let j = col; j <= col2; j++) {
        const value = instance.jexcel.getValueFromCoords(j, i);
        rowValues.push(value);
      }
      data.push(rowValues);
    }
    const csvData = data.map(row => row.join('\t')).join('\n');  //\t=수평탭 \n=줄바꿈 https://ninearies.tistory.com/300

    navigator.clipboard.writeText(csvData).then(() => {
      console.log('Data copied to clipboard:', csvData);
    }).catch(err => {
      console.error('Error copying data to clipboard:', err);
    });

  };




  useEffect(() => {

    const data = Object.values(props.value).map(obj => Object.values(obj));
    setData(data)
    var columns, width
    var title = []
    getProvider()
    // console.log('result useEffect')
    if (mode === 'order') {
      title = ['주문번호', '옵션명', '수량', '상품명', '거래처명', '옵션명', '판매가', '매입가', '비용[23%]', '마진', '받는분', '주소'
        , '받는분연락처', '받는분연락처2', '배송메세지', '보내는분', '보내는분연락처', '보내는분연락처2', '중복여부', '주문경로', 'Key'
      ]
      width = [80, 150, 30, 80];
      columns = title.map((t, index) => ({
        type: 'text',
        title: t,
        width: width[index],
      }))
      // columns.unshift({ type: 'checkbox', width: '60' ,title:'선택'})
    } else if (mode === 'provider') {
      title = ['거래처명', '이메일', '배송코드', 'CARRIER_ID', '택배사', '송장번호[열]', '주문번호[열]', '수취인[열]', '거래여부', '시작[행]', 'Key']
      width = [80, 150, 50, 30, 80, 60, 60, 60];
      columns = title.map((t, index) => ({
        type: 'text',
        title: t,
        width: width[index],
      }))
      columns.unshift({ type: 'checkbox', width: '60', title: '선택' })
    } else if (mode === 'item') {
      title = ['상품명', '매입가', '판매가', '상품코드', '거래구분']
      width = [120, 50, 50, 30, 30];
      columns = title.map((t, index) => ({
        type: 'text',
        title: t,
        width: width[index],
      }))
      console.log('proArr',proArr)
      columns.unshift({ type: 'dropdown', width: '80', title: '거래처명', source: proArr, dropdown: false })
      columns.unshift({ type: 'checkbox', width: '40', title: '선택' })
    } else if (mode === 'transaction') {
      title = ['출고일', '상품명', '수량', '매입가', '합계', '거래처명']
      width = [80, 150, 30, 80];
      columns = title.map((t, index) => ({
        type: 'text',
        title: t,
        width: width[index],
      }))

    } else if (mode === 'schedule') {
      title = ['날짜', '스케쥴작업', '결과']
      width = [120, 90, 120];
      columns = title.map((t, index) => ({
        type: 'text',
        title: t,
        width: width[index],
      }))
    }

    if (!jexcelInstance.current) {
      jexcelInstance.current = jexcel(jexcelRef.current, {
        headers: [title],
        data: data,
        columns: columns,
        table: {
          style: {
            'font-size': '9px',
          },
        },
        height: '300px'
        // onselection: handleSelection,
      });
    }
    else {
      jexcelInstance.current.destroy(); // 기존 jExcel 객체 파괴
      jexcelInstance.current = jexcel(jexcelRef.current, {
        headers: [title],
        data: data,
        columns: columns,
        table: {
          style: {
            'font-size': '9px',
          },
        },
        onselection: handleSelection,
        height: '300px'
      });

    }
  }, [props.value, props.insertRow]

  );


  return (
    <div style={{ overflow: 'auto' }}>
      <div ref={jexcelRef} />
    </div>
  );
})

export default MyJexcel;


