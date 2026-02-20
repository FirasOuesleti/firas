require('dotenv').config();

const assertSafe = () => {
  const env = process.env.NODE_ENV || 'development';
  const ack = process.env.I_UNDERSTAND_THIS_WILL_DROP_DATA;
  if (env === 'production') {
    throw new Error('Refusing to run in production.');
  }
  if (ack !== 'YES') {
    throw new Error('Refusing to run without I_UNDERSTAND_THIS_WILL_DROP_DATA=YES');
  }
};

(async () => {
  assertSafe();
  // ... your existing drop logic here ...
  console.log('Drop completed (non-production).');
})();
