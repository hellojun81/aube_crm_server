
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import  MailListener  from "mail-listener4";
import jsonfile from 'jsonfile';
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const json = jsonfile.readFileSync(__dirname+'/database.json');

async function sendMail(path, fileArr, tomail, textbody) {
    try {
        let _sendMail
        let transporter = nodemailer.createTransport({
            host: "smtp.naver.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: json.Email.user, // generated ethereal user
                pass: json.Email.pass, // generated ethereal password
            },
        });
        if (path != '') {
            let files = [{ filename: fileArr, path: path + '/' + fileArr }]
            _sendMail = await transporter.sendMail({
                from: '프레시왕<freshwangs@naver.com>', // sender address
                to: tomail, // list of receivers
                subject: fileArr, // Subject line
                text: textbody, // plain text body
                attachments: files
            });
            fs.unlink(path + '/' + fileArr, await function (err) {
                if (err) {
                    console.log("메일발송Error : ", err)
                } else {
                    console.log('sendMail:' + fileArr + ':파일삭제완료')
                }
            })
        } else {
            _sendMail = await transporter.sendMail({
                from: '프레시왕<freshwangs@naver.com>', // sender address
                to: tomail, // list of receivers
                subject: fileArr, // Subject line
                text: textbody, // plain text body
            });
        }
        return (_sendMail.response);
    } catch (err) {
        return ('sendMail' + err);
    }
}



function reciveMail(mailbox) {
    return new Promise(function (resolve) {
        let mailListener
        let uid
        let file
        let emailDate = '2023-01-25';
        let arr = new Array();

        mailListener = new MailListener({
            username: json.Email.mail,
            password: json.Email.pass,
            host: "imap.naver.com",
            port: 993, // imap port
            tls: true,
            connTimeout: 10000, // Default by node-imap
            authTimeout: 5000, // Default by node-imap,
            // debug: console.log, // Or your custom function with only one incoming argument. Default: null
            tlsOptions: { rejectUnauthorized: false },
            mailbox: mailbox, // mailbox to monitor
            searchFilter: ["UNSEEN", ["SINCE", emailDate]],// the search filter being used after an IDLE notification has been retrieved
            markSeen: true, // all fetched email willbe marked as seen and not fetched next time
            fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
            mailParserOptions: { streamAttachments: true }, // options to be passed to mailParser lib.
            attachments: true, // download attachments as they are encountered to the project directory
            attachmentOptions: { directory: "attachments/" },// specify a download directory for attachments,
        });

        mailListener.start(); // start listening
        // const __dirname = path.dirname(new URL(import.meta.url).pathname);
        mailListener.on("attachment", async function (attachment) {
            file = fs.createWriteStream(path.join(__dirname) + "/attachements/" + mailbox + '_' + attachment.fileName);
            attachment.stream.pipe(file)
            arr.push(file.path)
        })


        mailListener.on("mail", async function (mail, seqno, attributes) {
            uid = attributes.uid;
            mailListener.imap.addFlags(uid, ['\\Seen'], () => {
            });
        });

        resolve(arr);
    });
}

export default {
    sendMail,
    reciveMail
}
