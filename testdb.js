const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  const hashed = await bcrypt.hash('Admin#123', 10);
  await prisma.usuario.upsert({
    where: { identificacion: '999999999' },
    update: { nombres: 'Administrador', rol: 'ADMIN', password: hashed },
    create: {
      identificacion: '999999999',
      nombres: 'Administrador',
      direccion: 'Oficina',
      telefono: '0000000000',
      rol: 'ADMIN',
      password: hashed,
    },
  });
  const admin = await prisma.usuario.findUnique({ where: { identificacion: '999999999' } });
  console.log({ adminSeeded: !!admin });
  await prisma.$disconnect();
}

main();
