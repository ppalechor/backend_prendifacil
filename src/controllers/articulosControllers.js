const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los artículos (con información del empeño, préstamo, intereses y del cliente)
exports.getArticulos = async (req, res) => {
  try {
    const articulos = await prisma.articulo.findMany({
      include: {
        tipo_articulo: {
          select: {
            id_tipo_articulo: true,
            nombre: true,
          }
        },
        empeno: {
          select: {
            id_empeno: true,
            fecha_empeno: true,
            descripcion: true,
            interes_porcentaje: true,
            meses: true,
            estado: true,
            usuario: {
              select: {
                id_usuario: true,
                nombres: true,
                identificacion: true
              }
            },
            prestamos: {
              select: {
                id_prestamo: true,
                valor: true,
                estado: true,
                intereses: {
                  select: {
                    id_interes: true,
                    mes: true,
                    valor: true,
                    estado: true,
                    fecha_interes: true
                  },
                  orderBy: { fecha_interes: 'desc' }
                }
              }
            }
          }
        }
      },
      orderBy: { id_articulo: "asc" }
    });

    res.status(200).json(articulos);
  } catch (error) {
    console.error("Error al obtener artículos:", error);
    res.status(500).json({ error: "No se pudieron recuperar los artículos." });
  }
};


// Obtener un artículo por ID
exports.getArticuloById = async (req, res) => {
  const { id } = req.params;

  try {
    const articulo = await prisma.articulo.findUnique({
      where: { id_articulo: parseInt(id) },
      include: {
        empeno: {
          include: {
            usuario: true
          }
        }
      }
    });

    if (!articulo) return res.status(404).json({ error: 'Artículo no encontrado.' });

    res.status(200).json(articulo);
  } catch (error) {
    console.error('Error al obtener artículo:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Crear un nuevo artículo
exports.createArticulo = async (req, res) => {
  const { empeno_id, descripcion, tipo_articulo_id, valor_avaluo, estado } = req.body;

  if (!empeno_id || !descripcion) {
    return res.status(400).json({ error: 'El ID del empeño y la descripción son obligatorios.' });
  }

  try {
    const nuevoArticulo = await prisma.articulo.create({
      data: {
        empeno_id: parseInt(empeno_id),
        descripcion,
        tipo_articulo_id: tipo_articulo_id ? parseInt(tipo_articulo_id) : null,
        valor_avaluo: valor_avaluo ? parseFloat(valor_avaluo) : 0,
        estado: estado?.toUpperCase() || 'EMPEÑADO'
      }
    });

    res.status(201).json(nuevoArticulo);
  } catch (error) {
    console.error('Error al crear artículo:', error);
    res.status(500).json({ error: 'No se pudo crear el artículo.' });
  }
};

// Actualizar estado del artículo
exports.updateArticuloEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['EMPENADO', 'RETIRADO', 'VENDIDO'];
  if (!estado || !estadosValidos.includes(estado.toUpperCase())) {
    return res.status(400).json({ error: `Estado inválido. Use uno de: ${estadosValidos.join(', ')}` });
  }

  try {
    const articuloActualizado = await prisma.articulo.update({
      where: { id_articulo: parseInt(id) },
      data: { estado: estado.toUpperCase() }
    });

    res.status(200).json(articuloActualizado);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }
    console.error('Error al actualizar artículo:', error);
    res.status(500).json({ error: 'No se pudo actualizar.' });
  }
};

// Eliminar artículo
exports.deleteArticulo = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.articulo.delete({
      where: { id_articulo: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Artículo no encontrado.' });
    }
    console.error('Error al eliminar artículo:', error);
    res.status(500).json({ error: 'No se pudo eliminar.' });
  }
};
