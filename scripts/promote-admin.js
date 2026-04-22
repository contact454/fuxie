const { Client } = require('pg'); 
const client = new Client({ 
  connectionString: 'postgresql://neondb_owner:npg_aU0YPhW6zZQp@ep-rough-thunder-a1m0qm18-pooler.ap-southeast-1.aws.neon.tech/fuxie_prod?sslmode=require' 
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
