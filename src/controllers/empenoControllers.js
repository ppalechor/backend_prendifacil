const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los empeños con sus relaciones (Usuario, Artículos, Préstamo)
exports.getEmpenos = async (req, res) => {
  try {
    const empenos = await prisma.empeno.findMany({
      include: {
        usuario: { select: { id_usuario: true, nombres: true, identificacion: true } },
        articulos: {
          include: {
            tipo_articulo: { select: { nombre: true } }
          }
        },
        prestamos: true,
      },
      orderBy: { fecha_empeno: 'desc' }
    });
    res.status(200).json(empenos);
  } catch (error) {
    console.error('Error al obtener los empeños:', error);
    res.status(500).json({ error: 'No se pudieron recuperar los empeños.' });
  }
};

// Registrar un nuevo empeño (Transacción compleja)
exports.createEmpeno = async (req, res) => {
  const {
    usuarioId,
    descripcion,
    interes_porcentaje,
    meses,
    articulos,
  } = req.body;

  // Validación básica
  if (!usuarioId || articulos.length === 0) {
    return res.status(400).json({ error: 'Faltan datos requeridos (usuario o artículos).' });
  }

  try {
    // --- INICIO DE LA TRANSACCIÓN DE PRISMA ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el Empeño (Pawn)
      const nuevoEmpeno = await tx.empeno.create({
        data: {
          usuario_id: parseInt(usuarioId),
          descripcion: descripcion || 'Empeño sin descripción detallada.',
          interes_porcentaje: interes_porcentaje ? parseFloat(interes_porcentaje) : null,
          meses: meses ? parseInt(meses) : null,
          estado: 'ACTIVO',
        },
      });

      // 2. Crear los Artículos asociados al Empeño
      const articulosCreados = await Promise.all(
        articulos.map(articulo =>
          tx.articulo.create({
            data: {
              empeno_id: nuevoEmpeno.id_empeno,
              descripcion: articulo.descripcion,
              tipo_articulo_id: articulo.tipo_articulo_id ? parseInt(articulo.tipo_articulo_id) : null,
              valor_avaluo: parseFloat(articulo.valor) || 0,
              estado: 'EMPENADO',
            },
          })
        )
      );

      return { nuevoEmpeno, articulosCreados };
    });
    // --- FIN DE LA TRANSACCIÓN DE PRISMA ---

    res.status(201).json({
      message: 'Empeño y Artículos registrados con éxito.',
      id_empeno: result.nuevoEmpeno.id_empeno
    });
  } catch (error) {
    console.error('Error en la transacción de creación de empeño:', error);
    res.status(500).json({ error: 'Fallo al registrar el empeño. Transacción revertida.', details: error.message });
  }
};

// Actualizar un empeño existente
exports.updateEmpeno = async (req, res) => {
  const { id } = req.params;
  const { descripcion, estado } = req.body;

  try {
    const empenoActualizado = await prisma.empeno.update({
      where: { id_empeno: parseInt(id) },
      data: {
        descripcion,
        estado: estado || undefined
      }
    });
    res.status(200).json(empenoActualizado);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Empeño no encontrado.' });
    }
    console.error('Error al actualizar empeño:', error);
    res.status(500).json({ error: 'No se pudo actualizar el empeño.' });
  }
};

// Eliminar un empeño
exports.deleteEmpeno = async (req, res) => {
  const { id } = req.params;

  try {
    // Eliminar el empeño (Prisma debería manejar las restricciones de clave foránea)
    await prisma.empeno.delete({
      where: { id_empeno: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(409).json({ error: 'No se puede eliminar el empeño porque tiene artículos asociados.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Empeño no encontrado.' });
    }
    console.error('Error al eliminar empeño:', error);
    res.status(500).json({ error: 'Error interno al intentar eliminar el empeño.' });
  }
};

// Obtener los empeños del usuario autenticado
exports.getMisEmpenos = async (req, res) => {
  try {
    const userId = req.user?.id_usuario;
    if (!userId) {
      return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }
    const empenos = await prisma.empeno.findMany({
      where: { usuario_id: Number(userId) },
      include: {
        usuario: { select: { id_usuario: true, nombres: true, identificacion: true } },
        articulos: {
          include: { tipo_articulo: { select: { nombre: true } } }
        },
        prestamos: true,
      },
      orderBy: { fecha_empeno: 'desc' }
    });
    res.status(200).json(empenos);
  } catch (error) {
    console.error('Error al obtener mis empeños:', error);
    res.status(500).json({ error: 'No se pudieron recuperar los empeños del usuario.' });
  }
};
