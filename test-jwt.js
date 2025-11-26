const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

console.log('=== JWT SECRET TEST ===');
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);


// Test token verification
try {
  const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log(' Token verification successful:', decoded);
} catch (error) {
  console.log(' Token verification failed:', error.message);
}