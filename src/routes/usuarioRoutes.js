const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioControllers');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/usuarios/me', authenticateToken, usuarioController.getMe);
router.put('/usuarios/me', authenticateToken, usuarioController.updateMe);

// Obtener todos los usuarios y crear uno nuevo
router.get('/usuarios', authorizeRoles('ADMIN'), usuarioController.getUsuarios);
router.post('/usuarios', authorizeRoles('ADMIN'), usuarioController.createUsuario);

// Obtener, actualizar o eliminar un usuario por ID
router.get('/usuarios/:id', authorizeRoles('ADMIN'), usuarioController.getUsuarioById);
router.put('/usuarios/:id', authorizeRoles('ADMIN'), usuarioController.updateUsuario);
router.delete('/usuarios/:id', authorizeRoles('ADMIN'), usuarioController.deleteUsuario);

module.exports = router;
