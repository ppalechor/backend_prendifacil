const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const prisma = new PrismaClient();

// Importar rutas (si ya existen)
const authRoutes = require('./src/routes/authRoutes.js');
const usuarioRoutes = require('./src/routes/usuarioRoutes.js');
const usuarioController = require('./src/controllers/usuarioControllers.js');
const empenoRoutes = require('./src/routes/empenoRoutes.js');
const articuloRoutes = require('./src/routes/articuloRoutes.js');
const tiposArticulosRoutes = require('./src/routes/tiposArticulosRoutes.js');
const prestamoRoutes = require('./src/routes/prestamoRoutes.js');
const interesRoutes = require('./src/routes/interesRoutes.js');
const reporteRoutes = require('./src/routes/reporteRoutes.js');

// Middleware de autenticación
const { authenticateToken } = require('./src/middleware/auth.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Rutas de la API ---
// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas
// Endpoints de perfil del usuario (evitar conflicto con rutas dinámicas)
app.get('/api/usuarios/me', authenticateToken, usuarioController.getMe);
app.put('/api/usuarios/me', authenticateToken, usuarioController.updateMe);

// Alias estable para perfil (evita conflictos con rutas de usuarios)
app.get('/api/me', authenticateToken, usuarioController.getMe);
app.put('/api/me', authenticateToken, usuarioController.updateMe);

app.use('/api', authenticateToken, usuarioRoutes);
app.use('/api', authenticateToken, empenoRoutes);
app.use('/api', authenticateToken, articuloRoutes);
app.use('/api/tipos-articulos', authenticateToken, tiposArticulosRoutes);
app.use('/api', authenticateToken, prestamoRoutes);
app.use('/api', authenticateToken, interesRoutes);
app.use('/api', authenticateToken, reporteRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor funcionando ✅');
});

// --- Ruta para probar conexión a la DB y todas las tablas principales ---
app.get("/test-db", async (req, res) => {
  const tables = [
    { name: "Usuarios", query: "SELECT COUNT(*) as count FROM usuarios" },
    { name: "Empeños", query: "SELECT COUNT(*) as count FROM empenos" },
    { name: "Artículos", query: "SELECT COUNT(*) as count FROM articulos" },
    { name: "Préstamos", query: "SELECT COUNT(*) as count FROM prestamos" },
    { name: "Intereses", query: "SELECT COUNT(*) as count FROM intereses" },
    { name: "Tipos de Artículos", query: "SELECT COUNT(*) as count FROM tipos_articulos" }
  ];

  const results = [];

  try {
    for (const table of tables) {
      try {
        const countResult = await prisma.$queryRawUnsafe(table.query);
        const count = Number(countResult[0].count);
        results.push({ table: table.name, status: "✅ OK", count });
      } catch (err) {
        results.push({ table: table.name, status: "❌ Error", error: err.message });
      }
    }

    res.status(200).json({
      message: "Prueba de conexión a la base de datos completa",
      results
    });

  } catch (error) {
    console.error("Error general al conectar DB:", error);
    res.status(500).json({
      message: "No se pudo completar la prueba de la DB ❌",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
