-- Document 5 Database Migration
-- Creates new tables: assets, asset_allocations, asset_history, notifications, audit_logs
-- Creates view: employee_summary
-- Creates stored procedure: calculate_leave_balance

-- ============================================
-- ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_cost NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'allocated', 'returned', 'damaged', 'lost')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON assets(asset_code);

-- ============================================
-- ASSET ALLOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS asset_allocations (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    allocated_by INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    allocated_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(50) DEFAULT 'allocated' CHECK (status IN ('allocated', 'returned', 'pending_return')),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_allocations_asset_id ON asset_allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_allocations_employee_id ON asset_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_asset_allocations_status ON asset_allocations(status);

-- ============================================
-- ASSET HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS asset_history (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    remarks TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_history_asset_id ON asset_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_created_at ON asset_history(created_at);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity VARCHAR(100),
    related_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    record_id INT,
    old_data JSONB,
    new_data JSONB,
    performed_by INT REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- VIEW: EMPLOYEE SUMMARY
-- ============================================
CREATE OR REPLACE VIEW employee_summary AS
SELECT 
    ep.id,
    ep.name,
    ep.email,
    d.department_name,
    ep.designation,
    ep.salary,
    COUNT(DISTINCT aa.id) as assets_allocated
FROM employee_profiles ep
LEFT JOIN departments d ON d.id = ep.department_id
LEFT JOIN asset_allocations aa ON ep.id = aa.employee_id AND aa.status = 'allocated'
GROUP BY ep.id, ep.name, ep.email, d.department_name, ep.designation, ep.salary;

-- ============================================
-- STORED PROCEDURE: CALCULATE LEAVE BALANCE
-- ============================================
CREATE OR REPLACE FUNCTION calculate_leave_balance(emp_id INT)
RETURNS TABLE(
    leave_id INT,
    leave_name VARCHAR,
    available_days INT,
    total_days INT,
    used_days INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lt.id,
        lt.leave_name,
        lb.available_days,
        lt.total_days,
        (lt.total_days - lb.available_days) as used_days
    FROM leave_balance lb
    JOIN leave_types lt ON lb.leave_type_id = lt.id
    WHERE lb.employee_id = emp_id
    ORDER BY lt.leave_name;
END;
$$ LANGUAGE plpgsql;
