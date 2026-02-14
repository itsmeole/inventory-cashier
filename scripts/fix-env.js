const fs = require('fs');
const content = 'DATABASE_URL="postgresql://postgres.fuyafbatpairloefsacy:Leotampan123!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"';
fs.writeFileSync('.env', content, { encoding: 'utf8' });
console.log('.env file rewritten in UTF-8');
