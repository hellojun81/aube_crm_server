
// services/schedulesService.js
import sql from '../lib/sql.js';

const getAllSchedules = async () => {
    const query = 'SELECT * FROM schedules';
    return await sql.executeQuery(query);

};

const createSchedule = async (schedule) => {
    const { calendarId, csKind, NewTitle, start, end, startTime, endTime, userInt, estPrice, gubun, etc, category, customerName, rentPlace, bgColor } = schedule;
    const query = `INSERT INTO schedules (calendarId, csKind,title, start, end, startTime,endTime, userInt,estPrice,gubun,etc,category, customerName, rentPlace, bgColor) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?)`;
    const result = await sql.executeQuery(query, [calendarId, csKind, NewTitle, start, end, startTime, endTime, userInt, estPrice, gubun, etc, category, customerName, rentPlace, bgColor]);
    console.log('createSchedule', result)
    return { id: result.insertId, ...schedule };
};

const getScheduleById = async (id) => {
    const query = 'SELECT * FROM schedules WHERE id = ?';
    const result = await sql.executeQuery(query, [id]);
    console.log(result)
    return result[0];
};

const getcsByDate = async (startDate, endDate, customerName) => {
    // const query = 'SELECT * FROM schedules WHERE left(startDate) = ?';
    if (customerName == undefined) { customerName = '' }
    // const query=`SELECT * FROM schedules WHERE created_at >= '${startDate} 00:00:00' AND created_at <= '${endDate} 23:59:59' and customerName like '%${customerName}%'`;
    const query = `SELECT A.*, B.title as csKind FROM schedules A INNER JOIN csKind B ON A.cskind = B.id WHERE created_at >= '${startDate} 00:00:00' AND created_at <= '${endDate} 23:59:59' and customerName like '%${customerName}%'`;
    const result = await sql.executeQuery(query);
    // console.log(result)
    return result;
};



const getScheduleByMonth = async (Month) => {
    const query = 'SELECT * FROM schedules WHERE left(start,7) = ?';
    const result = await sql.executeQuery(query, [Month]);
    console.log(result)
    return result;
};


const updateSchedule = async (id, schedule) => {
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
    getScheduleById,
    getScheduleByMonth,
    updateSchedule,
    deleteSchedule,
    getcsByDate
};
