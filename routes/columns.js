// routes/columns.js
import express from 'express';
import columnsController from '../controllers/columnsController.js';

const router = express.Router();

//검색
router.get('/', columnsController.getColumns);
//추가
router.post('/', columnsController.addColumn);
//수정
router.put('/', columnsController.updateColumn);
//삭제
router.delete('/:id', columnsController.deleteColumn);

export default router;
