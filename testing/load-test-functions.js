// Load test helper functions
module.exports = {
  generateRandomExpense,
  generateTestUser,
  validateResponse
};

function generateRandomExpense(context, events, done) {
  const categories = ['groceries', 'transport', 'entertainment', 'utilities', 'healthcare'];
  const descriptions = [
    'Coffee and snacks',
    'Gas station fill-up',
    'Movie tickets',
    'Electricity bill',
    'Doctor visit',
    'Grocery shopping',
    'Bus fare',
    'Restaurant dinner',
    'Internet bill',
    'Pharmacy purchase'
  ];
  
  context.vars.randomAmount = (Math.random() * 200 + 10).toFixed(2);
  context.vars.randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
  context.vars.randomCategory = Math.floor(Math.random() * 5) + 1;
  
  return done();
}

function generateTestUser(context, events, done) {
  const timestamp = Date.now();
  context.vars.testEmail = `test${timestamp}@example.com`;
  context.vars.testPassword = 'TestPassword123!';
  
  return done();
}

function validateResponse(context, events, done) {
  // Custom validation logic
  if (context.vars.health_status !== 'healthy') {
    console.warn('Health check returned non-healthy status');
  }
  
  return done();
}
