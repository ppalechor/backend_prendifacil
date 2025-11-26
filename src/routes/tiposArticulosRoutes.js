const express = require('express');
const router = express.Router();
const tiposArticulosController = require('../controllers/tiposArticulosControllers');

// Rutas para tipos de artículo
router.get('/', tiposArticulosController.getTiposArticulos);
router.get('/:id', tiposArticulosController.getTipoArticuloById);
router.post('/', tiposArticulosController.createTipoArticulo);
router.put('/:id', tiposArticulosController.updateTipoArticulo);
router.delete('/:id', tiposArticulosController.deleteTipoArticulo);

module.exports = router;