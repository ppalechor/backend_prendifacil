const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

function isDigits(v) {
  return typeof v === 'string' && /^[0-9]+$/.test(v);
}

function isStrongPassword(p) {
  return typeof p === 'string' && p.length >= 8;
}

// Obtener todos los usuarios
exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { nombres: 'asc' },
    });
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'No se pudieron recuperar los usuarios.' });
  }
};

// Obtener un usuario por ID
exports.getUsuarioById = async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(id) },
    });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Crear un nuevo usuario
exports.createUsuario = async (req, res) => {
  const { identificacion, nombres, direccion, telefono, rol, password } = req.body;
  if (!identificacion || !nombres) {
    return res.status(400).json({ error: 'Identificación y nombres son obligatorios.' });
  }

  try {
    if (!isDigits(identificacion)) {
      return res.status(400).json({ error: 'La identificación debe contener solo números.' });
    }
    const allowedRoles = ['ADMIN', 'CLIENTE'];
    const finalRol = rol && allowedRoles.includes(rol) ? rol : 'CLIENTE';
    if (password && !isStrongPassword(password)) {
      return res.status(400).json({ error: 'Contraseña insegura' });
    }
    const hashed = password ? await bcrypt.hash(password, 10) : null;
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        identificacion,
        nombres,
        direccion,
        telefono,
        rol: finalRol,
        password: hashed,
      },
    });
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    // Manejar error de unicidad (si la identificación ya existe)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'La identificación ya está registrada.' });
    }
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'No se pudo crear el usuario.' });
  }
};

// Actualizar un usuario existente
exports.updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { identificacion, nombres, direccion, telefono, rol, password } = req.body;

  try {
    if (identificacion && !isDigits(identificacion)) {
      return res.status(400).json({ error: 'La identificación debe contener solo números.' });
    }
    const allowedRoles = ['ADMIN', 'CLIENTE'];
    const finalRol = rol && allowedRoles.includes(rol) ? rol : undefined;
    if (password && !isStrongPassword(password)) {
      return res.status(400).json({ error: 'Contraseña insegura' });
    }
    const hashed = password ? await bcrypt.hash(password, 10) : undefined;
    const usuarioActualizado = await prisma.usuario.update({
      where: { id_usuario: parseInt(id) },
      data: {
        identificacion,
        nombres,
        direccion,
        telefono,
        rol,
        password: hashed,
        failed_attempts: password ? 0 : undefined,
        lock_until: password ? null : undefined,
      },
    });
    res.status(200).json(usuarioActualizado);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario a actualizar no encontrado.' });
    }
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'No se pudo actualizar el usuario.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const uid = req.user?.id_usuario;
    const me = await prisma.usuario.findUnique({
      where: { id_usuario: uid },
      select: {
        id_usuario: true,
        identificacion: true,
        nombres: true,
        direccion: true,
        telefono: true,
        rol: true,
      },
    });
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.status(200).json(me);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ error: 'Error al obtener perfil.' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const uid = req.user?.id_usuario;
    const { direccion, telefono } = req.body;
    const updated = await prisma.usuario.update({
      where: { id_usuario: uid },
      data: {
        direccion: direccion ?? undefined,
        telefono: telefono ?? undefined,
      },
      select: {
        id_usuario: true,
        identificacion: true,
        nombres: true,
        direccion: true,
        telefono: true,
        rol: true,
      },
    });
    return res.json(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    console.error('Error al actualizar perfil:', error);
    return res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
};

// Eliminar un usuario
exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    // Intentar eliminar, si tiene empeños asociados, Prisma lanzará un error de clave foránea.
    await prisma.usuario.delete({
      where: { id_usuario: parseInt(id) },
    });
    res.status(204).send(); // 204 No Content para eliminación exitosa
  } catch (error) {
    if (error.code === 'P2003') {
      // P2003: Foreign key constraint failed (El usuario tiene empeños asociados)
      return res.status(409).json({ error: 'No se puede eliminar el usuario porque tiene empeños registrados.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario a eliminar no encontrado.' });
    }
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno al intentar eliminar el usuario.' });
  }
};
