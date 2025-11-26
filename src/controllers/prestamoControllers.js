const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Obtener todos los préstamos con datos del usuario
const getPrestamos = async (req, res) => {
  try {
    const prestamos = await prisma.prestamo.findMany({
      include: {
        empeno: {
          include: {
            usuario: {
              select: {
                nombres: true,
                identificacion: true
              }
            }
          }
        }
      },
      orderBy: { fecha_prestamo: "desc" }
    });

    res.json(prestamos);
  } catch (error) {
    console.error("Error al obtener préstamos:", error);
    res.status(500).json({ message: "Error al obtener préstamos" });
  }
};

// Obtener préstamo por ID
const getPrestamoById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[getPrestamoById] id param:', id);
    const pid = Number(id);
    if (!Number.isFinite(pid)) {
      return res.status(400).json({ message: 'ID de préstamo inválido' });
    }

    const prestamo = await prisma.prestamo.findUnique({
      where: { id_prestamo: pid },
      include: {
        empeno: {
          include: {
            usuario: {
              select: {
                nombres: true,
                identificacion: true
              }
            },
            articulos: true
          }
        },
        intereses: true
      }
    });

    if (!prestamo) {
      return res.status(404).json({ message: "Préstamo no encontrado" });
    }

    res.json(prestamo);
  } catch (error) {
    console.error("Error al obtener préstamo:", error);
    res.status(500).json({ message: "Error al obtener préstamo" });
  }
};

// Crear préstamo
const createPrestamo = async (req, res) => {
  try {
    const { empeno_id, valor, estado, fecha_prestamo } = req.body;

    // Get the empeño to get interes_porcentaje and meses
    const empeno = await prisma.empeno.findUnique({
      where: { id_empeno: Number(empeno_id) }
    });

    if (!empeno) {
      return res.status(404).json({ message: "Empeño no encontrado" });
    }

    // Check if prestamo already exists for this empeno
    const existingPrestamo = await prisma.prestamo.findUnique({
      where: { empeno_id: Number(empeno_id) },
      include: { intereses: true }
    });

    if (existingPrestamo) {
      // Update existing prestamo: add to valor
      const newValor = existingPrestamo.valor + parseFloat(valor);
      const updatedPrestamo = await prisma.prestamo.update({
        where: { id_prestamo: existingPrestamo.id_prestamo },
        data: { valor: newValor }
      });

      // Update pending intereses: add additional interest
      if (empeno.interes_porcentaje) {
        const additionalInterest = parseFloat(valor) * (empeno.interes_porcentaje / 100);
        await prisma.interes.updateMany({
          where: {
            prestamo_id: existingPrestamo.id_prestamo,
            estado: 'PENDIENTE'
          },
          data: {
            valor: { increment: additionalInterest }
          }
        });
      }

      res.status(200).json(updatedPrestamo);
    } else {
      // Create new prestamo
      const prestamo = await prisma.prestamo.create({
        data: {
          empeno_id: Number(empeno_id),
          valor: parseFloat(valor),
          estado: estado || 'ACTIVO',
          fecha_prestamo: fecha_prestamo ? new Date(fecha_prestamo) : new Date()
        }
      });

      // Create intereses for each month
      if (empeno.meses && empeno.interes_porcentaje) {
        const intereses = [];
        for (let i = 1; i <= empeno.meses; i++) {
          const fechaInteres = new Date(fecha_prestamo || new Date());
          fechaInteres.setMonth(fechaInteres.getMonth() + i - 1);
          intereses.push({
            prestamo_id: prestamo.id_prestamo,
            mes: i,
            valor: parseFloat(valor) * (empeno.interes_porcentaje / 100),
            fecha_interes: fechaInteres,
            estado: 'PENDIENTE'
          });
        }
        await prisma.interes.createMany({ data: intereses });
      }

      res.status(201).json(prestamo);
    }
  } catch (error) {
    console.error("Error al crear/actualizar préstamo:", error);
    res.status(500).json({ message: "Error al crear/actualizar préstamo" });
  }
};

// Actualizar estado
const updatePrestamoEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const prestamo = await prisma.prestamo.update({
      where: { id_prestamo: Number(id) },
      data: { estado }
    });

    res.json(prestamo);
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ message: "Error al actualizar estado" });
  }
};

// Registrar pago
const registrarPago = async (req, res) => {
  try {
    const { id } = req.params;

    const prestamo = await prisma.prestamo.update({
      where: { id_prestamo: Number(id) },
      data: { estado: "PAGADO" }
    });

    res.json({ message: "Pago registrado correctamente", prestamo });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ message: "Error al registrar pago" });
  }
};

module.exports = {
  getPrestamos,
  getPrestamoById,
  createPrestamo,
  updatePrestamoEstado,
  registrarPago,
  // Nuevo: préstamos del usuario autenticado
  getMisPrestamos: async (req, res) => {
    try {
      const userId = req.user?.id_usuario;
      console.log('[getMisPrestamos] userId:', userId);
      if (!userId) {
        return res.status(401).json({ message: 'Acceso denegado. Token requerido.' });
      }
      const misEmpenos = await prisma.empeno.findMany({
        where: { usuario_id: Number(userId) },
        select: { id_empeno: true }
      });
      const ids = misEmpenos.map(e => Number(e.id_empeno)).filter((n) => Number.isFinite(n));
      console.log('[getMisPrestamos] empenoIds:', ids);
      if (ids.length === 0) {
        return res.json([]);
      }
      const prestamos = await prisma.prestamo.findMany({
        where: { empeno_id: { in: ids } },
        include: {
          empeno: {
            include: {
              usuario: { select: { nombres: true, identificacion: true } },
              articulos: true,
            }
          },
          intereses: true,
        },
        orderBy: { fecha_prestamo: 'desc' }
      });
      console.log('[getMisPrestamos] prestamos count:', prestamos.length);
      res.json(prestamos);
    } catch (error) {
      console.error('Error al obtener mis préstamos:', error?.message || error);
      res.status(500).json({ message: 'Error al obtener mis préstamos' });
    }
  }
};
