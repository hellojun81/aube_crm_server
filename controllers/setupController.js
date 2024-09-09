// controllers/schedulesController.js
import setupService from '../services/setupService.js';

// 모든 setup 가져오기
const getAllsetup = async (req, res) => {
    try {
        const setup = await setupService.getAllsetup();
        console.log('schedules', setup)
        res.json(setup);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
};

// 특정 setup 가져오기
const getSetupTable = async (req, res) => {
console.log('getSetupTable',req.params)

    try {
        const tableName  = req.params;
        // console.log('tableName', tableName)

        let setup
             setup = await setupService.getSetupTable(tableName);
        if (setup) {
            res.json(setup);
        } else {
            res.status(404).json({ error: 'setup not found' });
        }
    } catch (error) {

        res.status(500).json({ error: 'Failed to fetch getSetupTable' });
    }
};

// // setup 생성
// const createSchedule = async (req, res) => {
//     try {
//         const newSchedule = req.body;
//         if (!newSchedule.calendarId || !newSchedule.title || !newSchedule.start || !newSchedule.end) {
//             return res.status(400).json({ error: 'Required fields are missing' });
//         }
//         const createdSchedule = await setupService.createSchedule(newSchedule);
//         res.status(201).json(createdSchedule);
//     } catch (error) {
//         console.error('Error creating schedule:', error);
//         res.status(500).json({ error: 'Failed to create schedule' });
//     }
// };

// // setup 수정
// const updateSchedule = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const updatedSchedule = req.body;
//         const result = await setupService.updateSchedule(id, updatedSchedule);
//         if (result) {
//             res.json({ message: 'Schedule updated successfully' });
//         } else {
//             res.status(404).json({ error: 'Schedule not found' });
//         }
//     } catch (error) {
//         console.error('Error updating schedule:', error);
//         res.status(500).json({ error: 'Failed to update schedule' });
//     }
// };

// // setup 삭제
// const deleteSchedule = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const result = await setupService.deleteSchedule(id);
//         if (result) {
//             res.json({ message: 'Schedule deleted successfully' });
//         } else {
//             res.status(404).json({ error: 'Schedule not found' });
//         }
//     } catch (error) {
//         console.error('Error deleting schedule:', error);
//         res.status(500).json({ error: 'Failed to delete schedule' });
//     }
// };

export default {
    getAllsetup,
    getSetupTable
    // createSchedule,
    // updateSchedule,
    // deleteSchedule,
};
