const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los registros de intereses
exports.getIntereses = async (req, res) => {
  try {
    const intereses = await prisma.interes.findMany({
      include: {
        prestamo: {
          select: {
            id_prestamo: true,
            valor: true,
            empeno: {
              select: {
                usuario: { select: { nombres: true, identificacion: true } }
              }
            }
          }
        }
      },
      orderBy: { fecha_interes: 'asc' }
    });
    res.status(200).json(intereses);
  } catch (error) {
    console.error('Error al obtener intereses:', error);
    res.status(500).json({ error: 'No se pudieron recuperar los registros de intereses.' });
  }
};

// Obtener intereses por ID de Préstamo
exports.getInteresesByPrestamo = async (req, res) => {
  const { idPrestamo } = req.params;
  try {
    const pid = parseInt(idPrestamo);
    // Si es CLIENTE, verificar propiedad del préstamo
    const role = req.user?.role;
    if (role === 'CLIENTE') {
      const prestamo = await prisma.prestamo.findUnique({
        where: { id_prestamo: pid },
        include: { empeno: true }
      });
      if (!prestamo) return res.status(404).json({ error: 'Préstamo no encontrado.' });
      if (prestamo.empeno.usuario_id !== req.user?.id_usuario) {
        return res.status(403).json({ error: 'No autorizado para ver intereses de este préstamo.' });
      }
    }
    const intereses = await prisma.interes.findMany({
      where: { prestamo_id: pid },
      orderBy: { fecha_interes: 'asc' }
    });
    res.status(200).json(intereses);
  } catch (error) {
    console.error('Error al obtener intereses por préstamo:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Actualizar el estado de un registro de interés (ej. a PAGADO)
exports.updateInteresEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ error: 'El nuevo estado del interés es obligatorio.' });
  }

  // Validar estados
  const estadosValidos = ['PENDIENTE', 'PAGADO'];
  if (!estadosValidos.includes(estado.toUpperCase())) {
    return res.status(400).json({ error: `Estado inválido. Use uno de: ${estadosValidos.join(', ')}` });
  }

  try {
    const interesActualizado = await prisma.interes.update({
      where: { id_interes: parseInt(id) },
      data: { estado: estado.toUpperCase() },
    });

    // Check if all intereses of the préstamo are paid
    if (estado.toUpperCase() === 'PAGADO') {
      const prestamoId = interesActualizado.prestamo_id;
      const allIntereses = await prisma.interes.findMany({
        where: { prestamo_id: prestamoId }
      });
      const allPaid = allIntereses.every(i => i.estado === 'PAGADO');
      if (allPaid) {
        await prisma.prestamo.update({
          where: { id_prestamo: prestamoId },
          data: { estado: 'PAGADO' }
        });
      }
    }

    res.status(200).json(interesActualizado);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Registro de interés no encontrado.' });
    }
    console.error('Error al actualizar el estado del interés:', error);
    res.status(500).json({ error: 'No se pudo actualizar el estado del interés.' });
  }
};
