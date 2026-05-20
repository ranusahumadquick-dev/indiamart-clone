const BASE = process.env.BASE_URL || 'http://localhost:8000';

async function waitForHealth(timeout = 15000){
  const start = Date.now();
  while(Date.now() - start < timeout){
    try{
      const res = await fetch(`${BASE}/api/health`);
      if(res.ok){
        console.log('✔ Backend healthy');
        return true;
      }
    }catch(e){ }
    await new Promise(r=>setTimeout(r,1000));
  }
  throw new Error('Backend did not become healthy in time');
}

async function main(){
  await waitForHealth();

  // 1) Register an admin so we can create a category
  const admin = {
    name: 'Test Admin',
    email: `admin+${Date.now()}@example.com`,
    phone: `800000${Math.floor(Math.random()*9000)+1000}`,
    password: 'AdminPass123!',
    role: 'admin',
  };

  let res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin)
  });
  const regAdmin = await res.json();
  console.log('register admin:', res.status, regAdmin.message || regAdmin);

  // Login admin
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: admin.password })
  });
  const loginAdmin = await res.json();
  console.log('login admin:', res.status, loginAdmin.message || loginAdmin);
  const adminToken = loginAdmin.data?.token || loginAdmin.token || (loginAdmin.data && loginAdmin.data.token);
  if(!adminToken){
    console.error('No admin token received, aborting');
    process.exit(1);
  }

  // Create a category using admin token
  const categoryRes = await fetch(`${BASE}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ name: `TestCategory${Date.now()}` })
  });
  const createdCat = await categoryRes.json();
  console.log('create category:', categoryRes.status, createdCat.message || createdCat);
  const categoryId = createdCat.data?._id;

  // 2) Register seller
  const seller = {
    name: 'Test Seller',
    email: `seller+${Date.now()}@example.com`,
    phone: `900000${Math.floor(Math.random()*9000)+1000}`,
    password: 'Password123!',
    role: 'seller',
    companyName: 'TestCo'
  };

  res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seller)
  });
  const reg = await res.json();
  console.log('register seller:', res.status, reg.message || reg);

  // 3) Login seller
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: seller.email, password: seller.password })
  });
  const loginSeller = await res.json();
  const token = loginSeller.data?.token || loginSeller.token || (loginSeller.data && loginSeller.data.token);
  if(!token){ console.error('No token received for seller, aborting'); process.exit(1); }

  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 4) Create product
  const productPayload = {
    name: 'Test Product',
    description: 'This is a test product',
    price: 99.99,
    category: categoryId || undefined,
  };

  res = await fetch(`${BASE}/api/products`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify(productPayload)
  });
  const created = await res.json();
  console.log('create product:', res.status, created.message || created);
  const productId = created.data?._id;

  // 5) List products
  res = await fetch(`${BASE}/api/products`);
  const list = await res.json();
  console.log('list products:', res.status, list.message || (list.data && list.data.products && list.data.products.length+' products'));

  // 6) Get single product
  if(productId){
    res = await fetch(`${BASE}/api/products/${productId}`);
    const single = await res.json();
    console.log('get product:', res.status, single.message || single);

    // 7) Update product
    res = await fetch(`${BASE}/api/products/${productId}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({ name: 'Test Product (Updated)' })
    });
    const updated = await res.json();
    console.log('update product:', res.status, updated.message || updated);

    // 8) Delete product
    res = await fetch(`${BASE}/api/products/${productId}`, {
      method: 'DELETE',
      headers: authHeader
    });
    const deleted = await res.json();
    console.log('delete product:', res.status, deleted.message || deleted);
  }

  console.log('Test script finished');
}

main().catch(err=>{console.error(err); process.exit(1);});
