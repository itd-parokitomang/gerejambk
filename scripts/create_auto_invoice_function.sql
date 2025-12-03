-- Function untuk membuat tagihan otomatis 7 hari sebelum tanggal jatuh tempo
-- Berdasarkan due_date dari tabel customers
-- 
-- Logika:
-- 1. Periode pertama dimulai dari created_at
-- 2. Jatuh tempo pertama = due_date di bulan setelah created_at (30 hari pertama)
-- 3. Setiap periode berikutnya = due_date di bulan berikutnya
-- 4. Tagihan dibuat 7 hari sebelum jatuh tempo

CREATE OR REPLACE FUNCTION create_invoices_for_upcoming_period()
RETURNS TABLE(
  customer_id uuid,
  invoice_id uuid,
  month integer,
  year integer,
  amount numeric,
  due_date_target date
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer RECORD;
  v_package RECORD;
  v_due_date_target DATE;
  v_invoice_date DATE; -- Tanggal pembuatan tagihan (7 hari sebelum jatuh tempo)
  v_current_date DATE := CURRENT_DATE;
  v_existing_invoice uuid;
  v_invoice_month integer;
  v_invoice_year integer;
  v_invoice_id uuid;
  v_days_in_month integer;
  v_found BOOLEAN := FALSE;
BEGIN
  -- Loop melalui semua pelanggan aktif
  FOR v_customer IN 
    SELECT 
      c.id,
      c.name,
      c.created_at,
      c.due_date,
      c.package_id,
      c.status
    FROM customers c
    WHERE c.status = 'active'
  LOOP
    -- Reset flag
    v_found := FALSE;
    
    -- Ambil data package
    SELECT 
      id,
      price_monthly
    INTO v_package
    FROM packages
    WHERE id = v_customer.package_id;
    
    -- Skip jika package tidak ditemukan atau tidak ada harga
    IF v_package.id IS NULL OR v_package.price_monthly IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Hitung tanggal jatuh tempo pertama (30 hari setelah created_at, dengan tanggal = due_date)
    -- Contoh: created_at = '2025-11-21', due_date = 1
    -- Jatuh tempo pertama = 1 Desember 2025 (30 hari kemudian, dengan tanggal = 1)
    
    v_due_date_target := DATE(v_customer.created_at) + INTERVAL '30 days';
    
    -- Set ke due_date di bulan tersebut
    -- Jika due_date lebih besar dari jumlah hari di bulan, gunakan hari terakhir bulan
    v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', v_due_date_target) + INTERVAL '1 month' - INTERVAL '1 day'))::integer;
    
    v_due_date_target := MAKE_DATE(
      EXTRACT(YEAR FROM v_due_date_target)::integer,
      EXTRACT(MONTH FROM v_due_date_target)::integer,
      LEAST(v_customer.due_date::integer, v_days_in_month)
    );
    
    -- Loop untuk mencari jatuh tempo yang perlu dibuat tagihannya
    -- (cek mulai dari jatuh tempo pertama sampai maksimal 12 bulan ke depan)
    WHILE v_due_date_target <= v_current_date + INTERVAL '7 days' + INTERVAL '12 months' LOOP
      -- Tanggal pembuatan tagihan = jatuh tempo - 7 hari
      v_invoice_date := v_due_date_target - INTERVAL '7 days';
      
      -- Bulan dan tahun untuk invoice = bulan dan tahun dari tanggal jatuh tempo
      v_invoice_month := EXTRACT(MONTH FROM v_due_date_target)::integer;
      v_invoice_year := EXTRACT(YEAR FROM v_due_date_target)::integer;
      
      -- Cek apakah sudah ada tagihan untuk periode ini
      SELECT i.id INTO v_existing_invoice
      FROM invoices i
      WHERE i.customer_id = v_customer.id
        AND i.month = v_invoice_month
        AND i.year = v_invoice_year;
      
      -- Jika tagihan belum ada dan sudah waktunya membuat tagihan
      IF v_existing_invoice IS NULL AND v_current_date >= v_invoice_date THEN
        v_found := TRUE;
        EXIT; -- Temukan jatuh tempo yang perlu dibuat tagihannya
      END IF;
      
      -- Jika jatuh tempo ini sudah lewat dan tagihan sudah ada, cek jatuh tempo berikutnya
      IF v_due_date_target <= v_current_date AND v_existing_invoice IS NOT NULL THEN
        -- Tambah 1 bulan untuk cek jatuh tempo berikutnya
        v_due_date_target := DATE_TRUNC('month', v_due_date_target) + INTERVAL '1 month';
        
        -- Set ke due_date di bulan baru
        v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', v_due_date_target) + INTERVAL '1 month' - INTERVAL '1 day'))::integer;
        
        v_due_date_target := MAKE_DATE(
          EXTRACT(YEAR FROM v_due_date_target)::integer,
          EXTRACT(MONTH FROM v_due_date_target)::integer,
          LEAST(v_customer.due_date::integer, v_days_in_month)
        );
      ELSIF v_invoice_date > v_current_date THEN
        -- Belum waktunya, tidak perlu cek lagi
        EXIT;
      ELSE
        -- Jika sudah lewat tapi belum ada tagihan, buat tagihan
        v_found := TRUE;
        EXIT;
      END IF;
    END LOOP;
    
    -- Jika tidak menemukan jatuh tempo yang perlu dibuat tagihan, skip
    IF NOT v_found THEN
      CONTINUE;
    END IF;
    
    -- Pastikan belum ada tagihan untuk periode ini (double check)
    SELECT i.id INTO v_existing_invoice
    FROM invoices i
    WHERE i.customer_id = v_customer.id
      AND i.month = v_invoice_month
      AND i.year = v_invoice_year;
    
    IF v_existing_invoice IS NOT NULL THEN
      CONTINUE; -- Tagihan sudah ada, skip
    END IF;
    
    -- Buat tagihan baru
    INSERT INTO invoices (
      customer_id,
      month,
      year,
      amount,
      status,
      created_at
    )
    VALUES (
      v_customer.id,
      v_invoice_month,
      v_invoice_year,
      v_package.price_monthly,
      'pending',
      NOW()
    )
    RETURNING id INTO v_invoice_id;
    
    -- Return hasil
    customer_id := v_customer.id;
    invoice_id := v_invoice_id;
    month := v_invoice_month;
    year := v_invoice_year;
    amount := v_package.price_monthly;
    due_date_target := v_due_date_target;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- Contoh penggunaan:
-- SELECT * FROM create_invoices_for_upcoming_period();
