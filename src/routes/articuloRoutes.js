const express = require('express');
const router = express.Router();
const articuloController = require('../controllers/articulosControllers');

router.get("/api/articulos", async (req, res) => {
  const articulos = await prisma.articulo.findMany();
  res.json(articulos);
});
// Obtener todos los artículos y crear uno nuevo
router.get('/articulos', articuloController.getArticulos);
router.post('/articulos', articuloController.createArticulo);

// Obtener, actualizar estado o eliminar un artículo por ID
router.get('/articulos/:id', articuloController.getArticuloById);
router.put('/articulos/:id/estado', articuloController.updateArticuloEstado);
router.delete('/articulos/:id', articuloController.deleteArticulo);

module.exports = router;