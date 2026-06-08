-- Create leave_types table
CREATE TABLE IF NOT EXISTS leave_types (
    id SERIAL PRIMARY KEY,
    leave_name VARCHAR(100) UNIQUE NOT NULL,
    total_days INT NOT NULL
);

-- Insert sample leave types if they don't exist
INSERT INTO leave_types (leave_name, total_days) VALUES
('Casual Leave', 12),
('Sick Leave', 15),
('Earned Leave', 20),
('Maternity Leave', 90)
ON CONFLICT (leave_name) DO UPDATE SET total_days = EXCLUDED.total_days;

-- Create leave_balance table
CREATE TABLE IF NOT EXISTS leave_balance (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
    leave_type_id INT REFERENCES leave_types(id) ON DELETE CASCADE,
    available_days INT NOT NULL,
    CONSTRAINT unique_employee_leave_type UNIQUE (employee_id, leave_type_id)
);

-- Create leave_applications table
CREATE TABLE IF NOT EXISTS leave_applications (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employee_profiles(id) ON DELETE CASCADE,
    leave_type_id INT REFERENCES leave_types(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'pending_manager', -- 'pending_manager', 'pending_hr', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create approval_history table
CREATE TABLE IF NOT EXISTS approval_history (
    id SERIAL PRIMARY KEY,
    leave_id INT REFERENCES leave_applications(id) ON DELETE CASCADE,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'approved_by_manager', 'rejected_by_manager', 'approved_by_hr', 'rejected_by_hr'
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auto-initialize leave balance trigger function for new employee profiles
CREATE OR REPLACE FUNCTION initialize_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leave_balance (employee_id, leave_type_id, available_days)
    SELECT NEW.id, id, total_days FROM leave_types
    ON CONFLICT (employee_id, leave_type_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up the trigger on employee_profiles
DROP TRIGGER IF EXISTS trigger_initialize_leave_balance ON employee_profiles;
CREATE TRIGGER trigger_initialize_leave_balance
AFTER INSERT ON employee_profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_leave_balance();

-- Populate leave balance for existing employees
INSERT INTO leave_balance (employee_id, leave_type_id, available_days)
SELECT ep.id, lt.id, lt.total_days
FROM employee_profiles ep
CROSS JOIN leave_types lt
ON CONFLICT (employee_id, leave_type_id) DO NOTHING;
