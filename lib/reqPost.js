import request from 'request';
import iconv from 'iconv-lite';
import charset from 'charset';
import cookie from 'cookie';


// const decodeUriComponent = require('decode-uri-component')



async function real_resOk(_pointdate, _pointname, _pointtime, _hand_tel1, _hand_tel2
    , _hand_tel3, _bookgDateSms, _bookgCourseSms, _certSeq, _certNo, session) {
    let url = 'https://lavieestbellegolfnresort.com/oldcourse/GolfRes/onepage/real_resOk.asp'
    let jsonData = await getJsonData(_pointdate, _pointname, _pointtime, _hand_tel1, _hand_tel2
        , _hand_tel3, _bookgDateSms, _bookgCourseSms, _certSeq, _certNo)
    let a = await PostReq(url, jsonData, session)
    return (a)

}


async function authorization(_pointdate, _pointname, _pointtime, _hand_tel1, _hand_tel2
    , _hand_tel3, _bookgDateSms, _bookgCourseSms, _certSeq, _certNo, session) {
    let url = 'https://lavieestbellegolfnresort.com/oldcourse/GolfRes/onepage/golfNoChk.asp'

    let jsonData = await getJsonData(_pointdate, _pointname, _pointtime, _hand_tel1, _hand_tel2
        , _hand_tel3, _bookgDateSms, _bookgCourseSms, _certSeq, _certNo)
    // console.log(jsonData)

    let a = await PostReq(url, jsonData, session)
    return (a);


}

async function logout(req, res, session) {
    let str = session.split('=')
    res.writeHead(302, {
        'set-cookie': [
            str[0] + '=; Max-Age=0',
            'ck_saveid=; Max-Age=0',
            'chk_savepw=; Max-Age=0',
            'Permanent=; Max-Age=0)'
        ]
    })
    res.end()
}


async function login(id, pw) {
    var url = 'https://lavieestbellegolfnresort.com/oldcourse/login/login_ok.asp'
    var jsonData = {
        mem_id: id,
        usr_pwd: pw,
        preurl: ''
    }
    let a = await PostReq(url, jsonData, '')
    let _getSession = "로그인을 해주세요"
    if (a.result.indexOf('환영합니다') > 0) {
        _getSession = getSession(a.res)
    }
    return { result: a.result, session: _getSession.Session }
}
async function myinfo(session) {
    var url = 'https://lavieestbellegolfnresort.com/dunescourse/pagesite/lounge/info/edit.asp'
    let a = await GetReq(url, session)
    let str = new Array()
    let _str, tel, name
    let id

    // console.log('getTel',a)
    if (a.indexOf('/dunescourse/memberInfor/smsChk.asp') > -1) {
        a = a.split('/dunescourse/memberInfor/smsChk.asp')
        a = a[1].split('</head>')
        id = a[1].split('<form')
        id = id[1].split('chg_mem_id')
        id = id[1].split('value')
        id = id[1].split('>')
        id = id[0].replace(/\"/gi, '')
        id = id.replace('=', '')
        a = a[0].replace(/\"/gi, "");
        for (let i = 0; i < 3; i++) {
            _str = a.split('name=hand_tel' + (i + 1) + ' value=')
            _str = _str[1].split('>')
            str.push(_str[0])
        }
        name = a.split('user_name value=')[1]
        name = name.split('>')[0]
        tel = str[0] + str[1] + str[2]
    } else {
        tel = "전화번호 가져오기 오류"
    }
    return { name: name, tel: tel, id: id }
}

async function getCourse(date, session) {
    var arr = new Array()
    var url = 'https://lavieestbellegolfnresort.com/oldcourse/GolfRes/onepage/real_timelist_ajax_list.asp'
    var jsonData = {
        golfrestype: 'real',
        courseid: '0',
        usrmemcd: '10',
        pointdate: date,
        openyn: '2',
        dategbn: '1',
        choice_time: '00',
        cssncourseum: '',
        inputtype: 'I',
    }
    let a = await PostReq(url, jsonData, session)
    if (a.result.indexOf('javascript:subcmd') > -1) {
        a = a.result.split('javascript:subcmd')
        for (let i = 0; i < a.length; i++) {
            let str = a[i].split('>')
            str = str[0].replace(/\'/gi, "")
            arr.push(str)
        }

    } else {
        arr = "Tee-off 타임이 없습니다"
    }
    return arr
}


async function getJsonData(_pointdate, _pointname, _pointtime, _hand_tel1, _hand_tel2
    , _hand_tel3, _bookgDateSms, _bookgCourseSms, _certSeq, _certNo) {
    let _bookgTimeSms = _pointtime.substring(0, 2) + ':' + _pointtime.substring(2, 4)
    let jsonData = {
        cmd: 'ins',
        cmval: '0',
        cmkind: '',
        calltype: 'AJAX',
        gonexturl: './my_golfreslist.asp',
        backurl: '',
        pointdate: _pointdate,
        openyn: '2',
        dategbn: '1',
        pointid: '1',
        pointname: _pointname,
        pointtime: _pointtime,
        golfuser_name: '',
        hand_tel1: _hand_tel1,
        hand_tel2: _hand_tel2,
        hand_tel3: _hand_tel3,
        join_bookg_cnt: '',
        pointhole: '18홀',
        pointpartcd: '',
        certSeq: _certSeq,
        certNo: _certNo,
        bookgDateSms: _bookgDateSms,
        bookgCourseSms: _bookgCourseSms,
        bookgTimeSms: _bookgTimeSms,
        ref_check: '',
        ref_name: '',
        ref_tel1: '',
        ref_tel2: '',
        ref_tel3: '',
        coupon_info: '',
        self_r_yn: 'N',
        self_c_yn: '',
        res_gubun: 'N',
    }
    return jsonData
}

async function GetReq(url, session) {
    return new Promise(function (resolve) {
        request.get({
            headers: {
                'Cookie': session
            },
            url: url,
            method: 'GET',
            encoding: null
        }, function (error, response, body) {
            if (error) { console.log(error) }
            const enc = charset(response.headers, body) // 해당 사이트의 charset값을 획득
            const result = iconv.decode(body, enc) // 획득한 charset값으로 body를 디코딩
            resolve(result)
        });

    })
}

async function PostReq(url, fomData, session) {
    return new Promise(function (resolve) {
        request.post({
            headers: {
                'cookie': session         //     // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            url: url,
            method: 'POST',
            form: fomData,
            json: true,
            encoding: null
        }, function (error, response, body) {
            if (error) { console.log(error) }
            var result = null;
            if (url.indexOf('golfNoChk') == -1 && url.indexOf('real_resOk') == -1) {
                const enc = charset(response.headers, body) // 해당 사이트의 charset값을 획득
                result = iconv.decode(body, enc) // 획득한 charset값으로 body를 디코딩   
                resolve({ result: result, res: response })
            } else {
                resolve(body)
            }

            
        })

    })
}

function getSession(request) {
    let Session
    let auth
    let ck_saveid
    if (request.headers["set-cookie"]) {
        var setCookie = cookie.serialize(request.headers["set-cookie"]);
        Session = cookie.parse(setCookie).path
        Session = Session.replace('/,', '')
        auth = Session
        ck_saveid = ''
    } else if (request.headers.cookie) {
        Session = cookie.parse(request.headers.cookie);
        // Session=cookie.parse(setCookie).path    
        for (let i = 0; i < Object.keys(Session).length; i++) {
            if (Object.keys(Session)[i].indexOf('ASP') == 0) {
                auth = Object.keys(Session)[i] + '=' + Object.values(Session)[i]

            }

        }

        ck_saveid = Session.ck_saveid
    }
    return { Session: auth, saveid: ck_saveid };
}

export default {
    real_resOk,
    authorization,
    logout,
    login,
    myinfo,
    getCourse,
    getJsonData,
    GetReq,
    PostReq,
    getSession
}