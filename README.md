Backend Prendifacil

Descripción
- API REST para la prendería, con autenticación JWT, control de acceso por roles y persistencia vía Prisma.

Requisitos
- Node.js 18+
- Base de datos (MySQL o SQLite, configurable con Prisma)

Instalación
- npm install
- npm start

Entorno (.env)
- JWT_SECRET=clave_secreta
- DATABASE_URL=conexion_prisma

Rutas principales
- POST /api/auth/login
- GET /api/prestamos
- GET /api/prestamos/mios
- GET /api/prestamo/:id
- PUT /api/prestamos/:id/estado
- GET /api/intereses/prestamo/:id
- PUT /api/intereses/:id/estado
- GET /api/empenos
- POST /api/empenos
- GET /api/articulos
- POST /api/articulos
- GET /api/tipos-articulos
- POST /api/tipos-articulos
- GET /api/usuarios
- PUT /api/usuarios/:id

Notas
- No se deben subir archivos .env ni credenciales.
- Las respuestas usan JSON y códigos de estado HTTP estándar.

Configuración de base de datos (Prisma)

- MySQL
  - `.env`: `DATABASE_URL="mysql://usuario:password@localhost:3306/prendifacil"`
  - Migraciones y cliente:
    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```
  - Ver datos:
    ```bash
    npx prisma studio
    ```

- SQLite (local)
  - `.env`: `DATABASE_URL="file:./prisma/dev.db"`
  - Migraciones y cliente:
    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```
  - Ver datos:
    ```bash
    npx prisma studio
    ```

Pruebas rápidas
- Verificar conexión DB: `node testdb.js`
- Probar JWT: `node test-jwt.js` (requiere `JWT_SECRET` válido en `.env`)
