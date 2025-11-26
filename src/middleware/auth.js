const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  console.log('=== AUTHENTICATION MIDDLEWARE DEBUG ===');
  console.log('1. Request method:', req.method);
  console.log('2. Request URL:', req.url);
  console.log('3. All headers:', req.headers);
  console.log('4. Authorization header:', req.headers['authorization']);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  console.log('5. Extracted token:', token);
  console.log('6. Token length:', token?.length);
  console.log('7. JWT_SECRET exists:', !!process.env.JWT_SECRET);

  if (!token) {
    console.log('❌ FAILED: No token provided');
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log('8. JWT verify result - err:', err);
    console.log('9. JWT verify result - user:', user);
    
    if (err) {
      console.log('❌ FAILED: Token verification failed:', err.message);
      return res.status(403).json({ error: 'Token inválido.' });
    }
    
    console.log('✅ SUCCESS: Token verified, user:', user);
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
