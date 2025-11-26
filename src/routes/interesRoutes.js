const express = require('express');
const router = express.Router();
const interesController = require('../controllers/interesController');

// Obtener todos los intereses
router.get('/intereses', interesController.getIntereses);

// Obtener intereses por ID de préstamo
router.get('/intereses/prestamo/:idPrestamo', interesController.getInteresesByPrestamo);

// Actualizar el estado de un registro de interés (ej. marcar como pagado)
router.put('/intereses/:id/estado', interesController.updateInteresEstado);

module.exports = router;
