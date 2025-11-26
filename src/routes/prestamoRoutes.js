const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamoControllers');

// Obtener todos los préstamos
router.get('/prestamos', prestamoController.getPrestamos);
// Obtener préstamos del usuario autenticado
router.get('/prestamos/mios', prestamoController.getMisPrestamos);

// Obtener un préstamo por ID (ruta singular para evitar colisión con '/prestamos/mios')
router.get('/prestamo/:id', prestamoController.getPrestamoById);

// Crear un nuevo préstamo
router.post('/prestamos', prestamoController.createPrestamo);

// Actualizar el estado de un préstamo
router.put('/prestamos/:id/estado', prestamoController.updatePrestamoEstado);

// Simular el registro de un pago (simple)
router.post('/prestamos/:id/pago', prestamoController.registrarPago);

module.exports = router;
