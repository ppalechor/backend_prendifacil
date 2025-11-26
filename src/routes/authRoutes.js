const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

function isStrongPassword(p) {
  return typeof p === 'string' && p.length >= 8;
}

function isDigits(v) {
  return typeof v === 'string' && /^[0-9]+$/.test(v);
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!isDigits(username)) {
      return res.status(400).json({ error: 'La identificación debe contener solo números' });
    }
    const user = await prisma.usuario.findUnique({
      where: { identificacion: username },
      select: {
        id_usuario: true,
        identificacion: true,
        nombres: true,
        rol: true,
        password: true,
        failed_attempts: true,
        lock_until: true,
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return res.status(423).json({ error: 'Cuenta bloqueada temporalmente' });
    }

    const ok = await bcrypt.compare(password, user.password);
    console.log('auth login', { username, hasUser: !!user, ok });
    if (!ok) {
      const attempts = (user.failed_attempts || 0) + 1;
      let data = { failed_attempts: attempts };
      if (attempts >= 5) {
        const lock = new Date(Date.now() + 15 * 60 * 1000);
        data.lock_until = lock;
        data.failed_attempts = 0;
      }
      await prisma.usuario.update({ where: { id_usuario: user.id_usuario }, data });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      id_usuario: user.id_usuario,
      identificacion: user.identificacion,
      username: user.nombres,
      role: user.rol || 'CLIENTE',
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    await prisma.usuario.update({ where: { id_usuario: user.id_usuario }, data: { failed_attempts: 0, lock_until: null } });
    return res.json({ token, role: payload.role });
  } catch (err) {
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.post('/register', async (req, res) => {
  const { identificacion, nombres, direccion, telefono, password } = req.body;
  if (!identificacion || !nombres || !password) {
    return res.status(400).json({ error: 'Identificación, nombres y password son obligatorios' });
  }
  if (!isDigits(identificacion)) {
    return res.status(400).json({ error: 'La identificación debe contener solo números' });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Contraseña insegura' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const nuevo = await prisma.usuario.create({
      data: { identificacion, nombres, direccion, telefono, rol: 'CLIENTE', password: hashed },
    });
    return res.status(201).json({ id_usuario: nuevo.id_usuario });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'La identificación ya está registrada' });
    }
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id_usuario;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseñas requeridas' });
  }
  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: 'Contraseña insegura' });
  }
  try {
    const user = await prisma.usuario.findUnique({
      where: { id_usuario: userId },
      select: { password: true },
    });
    if (!user?.password) {
      return res.status(400).json({ error: 'Usuario sin contraseña establecida' });
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.usuario.update({ where: { id_usuario: userId }, data: { password: hashed } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

module.exports = router;
