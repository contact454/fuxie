const { Client } = require('pg'); 
const client = new Client({ 
  connectionString: process.env.DATABASE_URL ?? '' 
}); 

async function update() { 
  await client.connect(); 
  const res = await client.query(`
    UPDATE users 
    SET role = 'ADMIN' 
    WHERE email IN ('dmfvietnam2026@gmail.com', 'contact@dmf.edu.vn', 'huynhngocphuc92@gmail.com') 
    RETURNING email, role
  `); 
  console.dir(res.rows); 
  await client.end(); 
} 
update();
