
// services/schedulesService.js
import sql from '../lib/sql.js';
import dayjs from 'dayjs';

const selectqueryinit=`A.id, B.customerName,CONCAT('[', C.title, ']', B.customerName) AS title, A.start,A.end,A.rentPlace,A.startTime,A.endTime,A.userInt,A.estPrice
    ,A.gubun,A.etc,A.csKind,C.title as cskindTitle,C.category,C.bgcolor ,B.notes as customerEtc,B.contactPerson FROM schedules A INNER JOIN Customers B ON A.customerName = B.id  INNER JOIN csKind C ON A.csKind = C.id`



const getAllSchedules = async () => {
    const query = `SELECT ${selectqueryinit}`;
    return await sql.executeQuery(query);

};
const getCustomerID = async (CustomerName) => {
    console.log('getCustomerID')
    const query = 'SELECT id FROM Customers where customerName = ?';
    const result = await sql.executeQuery(query, CustomerName);
    return result[0]
}

const createSchedule = async (schedule) => {
    const { calendarId, csKind, NewTitle, start, end, startTime, endTime, userInt, estPrice, gubun, etc, customerName, rentPlace } = schedule;
    const customerId = await getCustomerID(customerName)
    console.log('customerId', customerId.id)
    const query = `INSERT INTO schedules (calendarId, csKind,title, start, end, startTime,endTime, userInt,estPrice,gubun,etc, customerName, rentPlace)VALUES (?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?)`;
    const result = await sql.executeQuery(query, [calendarId, csKind, NewTitle, start, end, startTime, endTime, userInt, estPrice, gubun, etc, customerId.id, rentPlace]);

};
const getScheduleByCoustomerId = async (id) => {
    const query = `SELECT * from schedules WHERE customerName = ?`;
    const result = await sql.executeQuery(query,id);
    return result;
};
const getScheduleById = async (id) => {
    const query = `SELECT ${selectqueryinit} WHERE A.id = ?`;
    const result = await sql.executeQuery(query,id);
    console.log("getScheduleById", result)
    return result[0];
};

const getcsByDate = async (startDate, endDate, customerName) => {
    if (customerName == undefined) { customerName = '' }
    console.log('getcsByDate',)
    const query = `SELECT ${selectqueryinit} WHERE A.created_at >= '${startDate} 00:00:00' AND A.created_at <= '${endDate} 23:59:59' and B.customerName like '%${customerName}%'`;
    const result = await sql.executeQuery(query);
    return result;
};



const getScheduleByMonth = async (Month) => {
    const year = Month.substring(0, 4)
    const month = Month.substring(5, 7) // 9월이지만 0부터 시작하므로 8
    const date = new Date(year, month);
    // 이전 달
    const previousMonth = new Date(date);
    previousMonth.setMonth(date.getMonth() - 1);
    // 다음 달
    const nextMonth = new Date(date);
    nextMonth.setMonth(date.getMonth() + 1);
    const NewPrevMonth = previousMonth.toISOString().slice(0, 7)
    const NewNextMonth = nextMonth.toISOString().slice(0, 7)
    const query = `SELECT ${selectqueryinit}
    WHERE LEFT(A.start, 7) BETWEEN '${NewPrevMonth}' AND '${NewNextMonth}'
    and C.calView='1'`

    const result = await sql.executeQuery(query);
    console.log(result)
    return result;
};
const updateCsKind = async (update_ID) => {
    await Inint_csKind()
    console.log(update_ID)
    const query = `UPDATE csKind SET calView=1 where id IN(${update_ID})`;
    const result = await sql.executeQuery(query);
    return result.affectedRows > 0;
};
const Inint_csKind = async () => {
    const query = 'UPDATE csKind SET calView=0';
    const result = await sql.executeQuery(query);
    return result.affectedRows > 0;
}

const updateSchedule = async (id, schedule) => {
    const customerId = await getCustomerID(schedule.customerName)
    schedule.customerName=customerId.id
    schedule.start = dayjs(schedule.start).format('YYYY-MM-DD');
    schedule.end = dayjs(schedule.end).format('YYYY-MM-DD');

    console.log('schedule.customerName',schedule.customerName)
    const query = 'UPDATE schedules SET ? WHERE id = ?';
    const result = await sql.executeQuery(query, [schedule, id]);
    return result.affectedRows > 0;
};



const deleteSchedule = async (id) => {
    const query = 'DELETE FROM schedules WHERE id = ?';
    const result = await sql.executeQuery(query, [id]);
    return result.affectedRows > 0;
};

export default {
    getAllSchedules,
    createSchedule,
    getScheduleByCoustomerId,
    getScheduleById,
    getScheduleByMonth,
    updateSchedule,
    deleteSchedule,
    updateCsKind,
    getcsByDate,
    Inint_csKind
};
