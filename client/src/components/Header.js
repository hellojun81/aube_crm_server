import * as React from 'react';
import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DTPicker from './Dtpicker';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import { makeStyles } from '@material-ui/core';
// import ResultJexcel from './Result';
import dayjs from 'dayjs';
import io from "socket.io-client"; //모듈 가져오기
const apiUrl = process.env.REACT_APP_API_URL;
const socket = io.connect(apiUrl);
const drawerWidth = 240;
const href = ['order', 'provider', 'item', 'transaction', 'schedule'];
const useStyles = makeStyles((theme) => ({
  menuItem: {
    textAlign: 'left'
  }
}));
const styles = theme => ({
  root: {
    width: '100%',
    fontSize: '1.0rem',
    height: '20'
  },
  inputRoot: {
    height: '20'
  },
})


export default function DrawerAppBar(props) {
  const classes = useStyles();
  const today = new Date();
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [selProvider, setselProvider] = React.useState('전체');
  const [searchInput, setsearchInput] = React.useState('');
  const [OrderState, setOrderState] = React.useState('배송준비중');
  const [menuItems, setmenuItems] = React.useState();
  const [OrderData, setOrderData] = React.useState([]);
  const [strDate, setstrDate] = React.useState(dayjs(new Date()).subtract(7, 'day'));
  const [endDate, setendDate] = React.useState(dayjs(new Date()));
  const [receiveMsg, setReceiveMsg] = React.useState('')
  const [progress, setProgress] = React.useState(0);
  const [mode, setmode] = React.useState('order');
  const [sellmoney, setsellmoney] = React.useState(props.sellmoney);
  const [selectedButton, setSelectedButton] = React.useState(null);
  const [navItems, setnavItems] = React.useState(['주문관리', '거래처관리', '상품관리', '거래내역관리', '스케쥴관리']);
  var headerContents
  var msg = '';

  const inputRef = useRef(null);

  const setFocusToEnd = () => {
    // console.log('inputRef.current',inputRef.current)
    inputRef.current.focus();
    // if (inputRef.current) {
    //   // const { value } = inputRef.current;
    //   inputRef.current.focus();
    //   // inputRef.current.setSelectionRange(value.length+10, value.length+10);
    // }
  };


  React.useEffect(() => {
    console.log({ 'props.level': props.level, 'prop': props })
    if (props.sellmoney) { setsellmoney(props.sellmoney) }
    if (props.level == 1) { setnavItems(['주문관리']) }
    if (props.clickbtn == 'search') {
      // getProvider()
    }
    if (props.clickbtn == 'null') {
      getProvider()
      Addtextarea('로그인 성공')
    }
    // inputRef.current.focus();
    // Addtextarea('')
    // setFocusToEnd()
  }, [props.sendData]);


  // console.log('apiUrl',props.level)
  function LinearProgressWithLabel(props) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 10 }}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.value,
          )}%`}</Typography>
        </Box>
      </Box>
    );
  }


  function hrefClick(e) {
    // console.log('event', e)
    setmode(e)
    // setSelectedButton(e);
    props.sendData({ href: e });
  }

  const handleDateChange = async (event) => {
    setstrDate(event);
  }
  const handleDateChange2 = (event) => {
    setendDate(event);
  }
  const handleChange = (event) => {

    if (event.target.name == 'selProvider') {
      setselProvider(event.target.value);
    } else if (event.target.name == 'OrderState') {
      setOrderState(event.target.value);
    } else if (event.target.name == 'searchInput') {
      setsearchInput(event.target.value);
    }
  }



  async function search() {
    // console.log('mode', mode)
    if (mode === 'order') {
      ModeGetOrder()
    } else if (mode === 'provider') {
      ModeProvider()
    } else if (mode === 'item') {
      ModeItem()
    } else if (mode === 'transaction') {
      ModeTransaction()
    } else if (mode === 'schedule') {
      ModeSchecdule()
    }
  }
  async function ModeItem() {
    let search = searchInput
    let query = "select '' ,b.name,itemname,buymoney,sellmoney,a.keycode ,a.dealYN from item a "
      + " left join provider b on a.proname=b.keycode where itemname like '%" + search + "%'"
    if (selProvider != '전체') {
      query = query + "and b.name='" + selProvider + "'"
    }
    // console.log('query', query)
    const data = await getPromise('/gy/sql?query=' + query)
    setOrderData(data)
    props.sendData({ value: data });
  }
  async function ModeTransaction() {
    let str_date = dayjs(strDate).format("YYYYMMDD");
    let end_date = dayjs(endDate).format("YYYYMMDD");
    let proname = selProvider
    let query = 'select deldate,replace(itemName, " ", ""),sum(cnt),buymoney,sum(cnt)*buymoney as sellmoney ,proname from orderDel where deldate between "'
      + str_date + '" and "' + end_date + '" and invoice<>""'

    if (sellmoney == true) {
      query = 'select deldate,replace(itemName, " ", ""),sum(cnt),buymoney,sum(cnt)*buymoney as buyTotalmoney ,sum(cnt)*sellmoney as sellmoney  ,proname from orderDel where deldate between "'
        + str_date + '" and "' + end_date + '" and invoice<>""'
    }

    if (proname != "전체") {
      query = query + 'and proname="' + proname + '"'
    }
    query = query + 'group by deldate, replace(itemName, " ", ""), proname order by deldate,proname'
    const data = await getPromise('/gy/sql?query=' + query)
    // console.log('ModeTransaction query', query)
    setOrderData(data)
    props.sendData({ value: data, strDate: str_date, endDate: end_date, proname: proname });
  }
  async function ModeSchecdule() {
    let str_date = dayjs(strDate).format("YYYY-MM-DD");
    let end_date = dayjs(endDate).format("YYYY-MM-DD");
    let proname = selProvider
    let query = 'select date,value,fn from schedule where left(date,10) between "' + str_date + '" and "' + end_date + '"order by fn desc,date desc'
    // console.log('ModeSchecdule query', query)
    const data = await getPromise('/gy/sql?query=' + query)
    props.sendData({ value: data });
  }

  async function ModeProvider() {
    let str_date = dayjs(strDate).format("YYYYMMDD");
    let end_date = dayjs(endDate).format("YYYYMMDD");
    let proname = selProvider
    let query = 'SELECT "", name, email, '
      + ' shipping_company_code, carrier_id, shipping_name,'
      + ' invoice_col, ordercode_col, name_col, dealYN, '
      + ' str_row ,keycode FROM provider WHERE 1'

    if (proname != "전체") {
      query = query + 'and name="' + proname + '"'
    }
    // console.log('ModeProvider query', query)
    const data = await getPromise('/gy/sql?query=' + query)
    setOrderData(data)
    props.sendData({ value: data, strDate: str_date, endDate: end_date, proname: proname });
  }


  async function ModeGetOrder() {
    let str_date = dayjs(strDate).format("YYYY-MM-DD");
    let end_date = dayjs(endDate).format("YYYY-MM-DD");
    let checkpro = 0
    let provider = selProvider
    // console.log({ strDate: str_date, endDate: end_date, selProvider: selProvider, OrderState: OrderState })
    if (provider == '전체') {
      provider = 'ALL'
    }
    const data = await getPromise('/gy/GetOrder?proname=' + provider + '&strDate=' + str_date + '&endDate=' + end_date + '&order_status=' + OrderState);
    setOrderData(data)
    console.log('MoreGetOreder', data)
    props.sendData({ value: data, strDate: str_date, endDate: end_date, provider: provider, OrderState: OrderState, clickbtn: 'search' });
  }
  // socket.on('alert', function (data) {
  //   console.log(data)
  //   alert(data)
  // })

  
  socket.on('msg', function (data) {
    if (data.indexOf("%") > 0) {
      data = data.split('진행율:')
      data = data[1].replace('%', '')
      setProgress(data)
    } else {
      Addtextarea(data)
    }
  
   
  });
  function Addtextarea(message) {
    let now = dayjs().format('HH:mm:ss').replace(/,/g, '')
    msg = receiveMsg + '\n' + '[' + now + '] ' + message
    setReceiveMsg(msg)
  }


  async function getProvider() {
    const data = await getPromise('/gy/getProvider');
    const menuItem = data.map((option, index) => (
      <MenuItem email={option.email} invoice_col={option.invoice_col} name_col={option.name_col}
        ordercode_col={option.ordercode_col}
        shipping_company_code={option.shipping_company_code}
        shipping_name={option.shipping_name}
        str_row={option.str_row}
        key={index}
        value={option.name}
        className={classes.menuItem}
      >
        {option.name}
      </MenuItem>
    ));
    setmenuItems(menuItem)
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



  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  if (mode == 'order') {
    headerContents = <>
      <Grid item xs={3}>
        <Stack spacing={0}>
          <FormControl sx={{ minWidth: 80 }}>
            <Select className="bookingbtn"
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              value={OrderState}
              onChange={handleChange}
              name='OrderState'
              autoWidth
            >
              <MenuItem value='전체'>전체</MenuItem>
              <MenuItem value='배송준비중'>배송준비중</MenuItem>
              <MenuItem value='배송중'>배송중</MenuItem>
              <MenuItem value='배송완료'>배송완료</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Grid>
      <Grid item xs={7}>
        <Stack spacing={0}>
          <FormControl sx={{ minWidth: 80 }}>
            <Select className="bookingbtn"
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              name='selProvider'
              value={selProvider}
              onChange={handleChange}
              autoWidth
            >
              <MenuItem value='전체'>전체</MenuItem>
              {menuItems}
            </Select>


          </FormControl>
        </Stack>
      </Grid>
      <Grid item xs={2}>
        <Button sx={{ height: 50, width: '100%' }}
          className="bookingbtn" variant="contained" size="middle" onClick={() => {
            search()
          }}>
          검색
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Box
          component="form"
          sx={{
            '& .MuiTextField-root': { m: 0, width: '100%' },
          }}
          noValidate
          autoComplete="off"
        >

          <TextField
            inputRef={inputRef}
            //  ref={textFieldRef}
            id="filled-multiline-static"
            multiline
            rows={6}
            variant="filled"
            value={receiveMsg}
            inputProps={{ style: { fontSize: 12 } }} // font size of input text
            InputLabelProps={{ style: { fontSize: 12 } }} // font size of input label
            xs={{ width: '100%' }}
          />
          {/* <button onClick={setFocusToEnd}>Set Focus to End</button>
   */}
        </Box>
      </Grid>
    </>
  } else if (mode === 'provider' || mode === 'item' || mode === 'transaction' || mode === 'schedule') {
    headerContents = <>
      <Grid item xs={3}>
        <Stack spacing={0}>
          <FormControl sx={{ minWidth: 80 }}>
            {/* <InputLabel id="demo-simple-select-autowidth-label">{selProvider}</InputLabel> */}
            <Select className="bookingbtn"
              labelId="demo-simple-select-autowidth-label"
              id="demo-simple-select-autowidth"
              name='selProvider'
              value={selProvider}
              onChange={handleChange}
              autoWidth
            >
              <MenuItem value='전체'>전체</MenuItem>
              {menuItems}
            </Select>
          </FormControl>
        </Stack>
      </Grid>
      <Grid item xs={7}>
        <Stack spacing={0}>
          <TextField id="outlined-basic" label="" variant="outlined" value={searchInput} name='searchInput' onChange={handleChange} />
        </Stack>
      </Grid>
      <Grid item xs={2}>
        <Button sx={{ height: 50, width: '100%' }}
          className="bookingbtn" variant="contained" size="middle" onClick={() => {
            search()
          }}>
          검색
        </Button>
      </Grid>
    </>
  }

  const drawer = (
    <Box onClick={handleDrawerToggle} >
      <Typography variant="h6" sx={{ my: 2 }}>
        귤왕
      </Typography>
      <Divider />
      <List>
        {navItems.map((item, index) => (
          <ListItem key={item} disablePadding>
            <ListItemButton href={href[index]}
              style={{
                fontWeight: mode === href[index] ? 'bold' : 'normal',
                color: mode === href[index] ? '#F2A3E5' : 'black',
              }}
              onClick={e => {
                e.preventDefault();
                hrefClick(href[index]);
              }}>
              <ListItemText primary={item} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
  const container = window !== undefined ? () => window().document.body : undefined;
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar component="nav">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block', textAlign: 'left' } }}
          >
            귤왕
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {navItems.map((item, index) => (
              <Button key={item} href={href[index]} sx={{ color: '#fff' }}
                style={{
                  fontWeight: mode === href[index] ? 'bold' : 'normal',
                  color: mode === href[index] ? '#F2A3E5' : 'white',
                }}
                onClick={e => {
                  e.preventDefault();
                  hrefClick(href[index]);
                }}>
                {item}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav">
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ p: 1, width: '100%', mt: 3 }}>

        <Toolbar />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <DTPicker value={strDate} onChange={handleDateChange} classes={{
              root: classes.inputRoot,
            }} />
          </Grid>
          <Grid item xs={6}>
            <DTPicker value={endDate} onChange={handleDateChange2} classes={{
              root: classes.inputRoot,
            }} />
          </Grid>
          {headerContents}
        </Grid>
        <Box sx={{ width: '100%' }}>
          <LinearProgressWithLabel value={Number(progress)} />
        </Box>

      </Box>
    </Box>

  );
}

DrawerAppBar.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window: PropTypes.func,
};


