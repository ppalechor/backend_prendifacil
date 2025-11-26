const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteControllers');

// REPORTE 1: Resumen de estadísticas
router.get('/stats-resumen', reporteController.getStatsResumen);

// REPORTE 2: Ingresos por intereses mensuales (Gráfico de barras)
router.get('/intereses-mensuales', reporteController.getInteresesMensuales);

// REPORTE 3: Cantidad de empeños por tipo de artículo (Gráfico circular)
router.get('/empenos-por-tipo', reporteController.getEmpenosPorTipoArticulo);

// REPORTE 4: Historial detallado de empeños (Tabla)
router.get('/historial-empenos', reporteController.getHistorialEmpenos);

module.exports = router;