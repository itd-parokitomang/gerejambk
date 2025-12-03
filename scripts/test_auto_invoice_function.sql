-- Script untuk testing function create_invoices_for_upcoming_period()
-- 
-- Langkah-langkah testing:
-- 1. Cek data pelanggan yang ada
-- 2. Cek tanggal jatuh tempo yang akan dihitung
-- 3. Jalankan function
-- 4. Cek tagihan yang dibuat

-- 1. Cek data pelanggan aktif dan package mereka
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  c.created_at,
  c.due_date,
  c.status,
  p.name as package_name,
  p.price_monthly,
  -- Hitung tanggal jatuh tempo pertama
  (DATE(c.created_at) + INTERVAL '30 days')::date as period_end_30_days,
  -- Hitung jumlah hari dari created_at
  (CURRENT_DATE - DATE(c.created_at))::integer as days_since_created
FROM customers c
LEFT JOIN packages p ON c.package_id = p.id
WHERE c.status = 'active'
ORDER BY c.created_at DESC;

-- 2. Cek tagihan yang sudah ada
SELECT 
  i.id,
  i.customer_id,
  c.name as customer_name,
  i.month,
  i.year,
  i.amount,
  i.status,
  i.created_at
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
ORDER BY i.created_at DESC
LIMIT 10;

-- 3. Jalankan function untuk membuat tagihan otomatis
SELECT * FROM create_invoices_for_upcoming_period();

-- 4. Cek tagihan setelah function dijalankan
SELECT 
  i.id,
  i.customer_id,
  c.name as customer_name,
  i.month,
  i.year,
  i.amount,
  i.status,
  i.created_at
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
ORDER BY i.created_at DESC
LIMIT 10;

-- 5. Test dengan contoh data (jika perlu)
-- Buat pelanggan test dengan created_at yang memungkinkan tagihan dibuat
-- UPDATE customers 
-- SET created_at = '2025-11-25'::timestamp
-- WHERE id = 'your-customer-id-here';

