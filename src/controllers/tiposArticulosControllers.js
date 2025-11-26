const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los tipos de artículo
exports.getTiposArticulos = async (req, res) => {
  try {
    const tipos = await prisma.tipoArticulo.findMany({
      orderBy: { nombre: 'asc' },
    });
    res.status(200).json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de artículo:', error);
    res.status(500).json({ error: 'No se pudieron recuperar los tipos de artículo.' });
  }
};

// Obtener un tipo por ID
exports.getTipoArticuloById = async (req, res) => {
  const { id } = req.params;
  try {
    const tipo = await prisma.tipoArticulo.findUnique({
      where: { id_tipo_articulo: parseInt(id) },
    });
    if (!tipo) {
      return res.status(404).json({ error: 'Tipo de artículo no encontrado.' });
    }
    res.status(200).json(tipo);
  } catch (error) {
    console.error('Error al obtener tipo de artículo por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Crear un nuevo tipo de artículo
exports.createTipoArticulo = async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }

  try {
    const nuevoTipo = await prisma.tipoArticulo.create({
      data: { nombre },
    });
    res.status(201).json(nuevoTipo);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El nombre del tipo de artículo ya existe.' });
    }
    console.error('Error al crear tipo de artículo:', error);
    res.status(500).json({ error: 'No se pudo crear el tipo de artículo.' });
  }
};

// Actualizar un tipo de artículo
exports.updateTipoArticulo = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    const tipoActualizado = await prisma.tipoArticulo.update({
      where: { id_tipo_articulo: parseInt(id) },
      data: { nombre },
    });
    res.status(200).json(tipoActualizado);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tipo de artículo a actualizar no encontrado.' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El nombre del tipo de artículo ya existe.' });
    }
    console.error('Error al actualizar tipo de artículo:', error);
    res.status(500).json({ error: 'No se pudo actualizar el tipo de artículo.' });
  }
};

// Eliminar un tipo de artículo
exports.deleteTipoArticulo = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.tipoArticulo.delete({
      where: { id_tipo_articulo: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(409).json({ error: 'No se puede eliminar el tipo porque tiene artículos asociados.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tipo de artículo a eliminar no encontrado.' });
    }
    console.error('Error al eliminar tipo de artículo:', error);
    res.status(500).json({ error: 'Error interno al intentar eliminar el tipo de artículo.' });
  }
};