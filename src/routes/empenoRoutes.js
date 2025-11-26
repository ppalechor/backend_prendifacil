const express = require('express');
const router = express.Router();
const empenoController = require('../controllers/empenoControllers');

// Obtener todos los empeños y registrar uno nuevo
router.get('/empenos', empenoController.getEmpenos);
router.get('/empenos/mios', empenoController.getMisEmpenos);
router.post('/empenos', empenoController.createEmpeno);
router.put('/empenos/:id', empenoController.updateEmpeno);
router.delete('/empenos/:id', empenoController.deleteEmpeno);

// router.get('/empenos/:id', empenoController.getEmpenoById); // Pendiente de implementar si es necesario

module.exports = router;
