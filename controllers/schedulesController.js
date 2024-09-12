// controllers/schedulesController.js
import schedulesService from '../services/schedulesService.js';
import sql from '../lib/sql.js';
import dayjs from 'dayjs';
// 모든 스케줄 가져오기
const getAllSchedules = async (req, res) => {
    try {
        console.log('getAllSchedules')
        const schedules = await schedulesService.getAllSchedules();
        console.log('schedules', schedules)
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
};

// 특정 Month 스케줄 가져오기
const getScheduleById = async (req, res) => {
    try {
        console.log('getScheduleById')
        let result
        const { id } = req.params;
        const { startDate, endDate, customerName, SearchMonth } = req.query;
        console.log({ 'req.query': req.query, id: id, SearchMonth: SearchMonth })

        if (id == 'customers') {
            const NewId=req.query.id
            result = await schedulesService.getScheduleByCoustomerId(NewId);
        } else if (id == 'cs') {
            result = await schedulesService.getcsByDate(startDate, endDate, customerName);
        } else if (id == 'schedules') {
            if (SearchMonth) {
                result = await schedulesService.getScheduleByMonth(SearchMonth);
            } else {
                result = await schedulesService.getScheduleById(SearchMonth);
            }
        } else if (id == 'getCsKind') {
            const query = `SELECT id,title,calView FROM csKind`;
            result = await sql.executeQuery(query);
        } else {
            console.log({ 'getScheduleById(id)': req.query, id: id })

            result = await schedulesService.getScheduleById(id);
        }

        if (result) {
            res.json(result);
        } else {
            res.status(404).json({ error: 'Schedule not found' });
        }

    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
};

// 스케줄 생성
const createSchedule = async (req, res) => {
    try {
        let newSchedule = await chgSchedule(req.body);
        if (!newSchedule.calendarId || !newSchedule.NewTitle || !newSchedule.start || !newSchedule.end) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }
        console.log('newSchedule2', newSchedule)
        const createdSchedule = await schedulesService.createSchedule(newSchedule);
        console.log('createdSchedule', createdSchedule)
        res.status(201).json(createdSchedule);
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ error: 'Failed to create schedule' });
    }
};




const chgSchedule = async (Schedule) => {
    let newSchedule = Schedule
    const { csKind } = newSchedule
    const { customerName } = newSchedule
    const getTitle = await GetCsKindTitle(csKind)
    const NewTitle = '[' + getTitle[0].title + ']' + customerName
    newSchedule.NewTitle = NewTitle
    // const NewrentPlace = newSchedule.rentPlace.join(', ');
    // newSchedule.rentPlace = NewrentPlace
    newSchedule.start = dayjs(newSchedule.start).format('YYYY-MM-DD');
    newSchedule.end = dayjs(newSchedule.end).format('YYYY-MM-DD');
    return newSchedule;
}

const GetCsKindTitle = async (id) => {
    const query = `SELECT title,calView FROM csKind where id=${id}`;
    return await sql.executeQuery(query);
};


// 스케줄 수정
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedSchedule = req.body;
        const { update_ID, SearchMonth } = req.query
        console.log({ '스케쥴수정': req.params, id: id, 'update_ID': update_ID, 'SearchMonth': SearchMonth })
        let result

        if (id === 'getCsKind') {
            if (update_ID !== '') {
                result = await schedulesService.updateCsKind(update_ID);
            } else {
                result = await schedulesService.Inint_csKind();
            }
            result = await schedulesService.getScheduleByMonth(SearchMonth);
        } else {
            result = await schedulesService.updateSchedule(id, updatedSchedule);
        }

        if (result) {
            res.json({ message: 'Schedule updated successfully' });
        } else {
            res.status(404).json({ error: 'Schedule not found' });
        }
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
};

// 스케줄 삭제
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await schedulesService.deleteSchedule(id);
        if (result) {
            res.json({ message: 'Schedule deleted successfully' });
        } else {
            res.status(404).json({ error: 'Schedule not found' });
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
};

export default {
    getAllSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
};
