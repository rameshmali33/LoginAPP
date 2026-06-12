-- Attendance system tables

-- Compatibility for older local schemas where employee profile identity lived on users.
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(200);
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE employee_profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'employee_profiles' AND column_name = 'user_id'
    ) THEN
        UPDATE employee_profiles ep
        SET
            name = COALESCE(ep.name, u.name),
            email = COALESCE(ep.email, u.email),
            status = COALESCE(ep.status, 'active')
        FROM users u
        WHERE ep.user_id = u.id;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    break_minutes INT DEFAULT 0 CHECK (break_minutes >= 0),
    work_minutes INT DEFAULT 0 CHECK (work_minutes >= 0),
    overtime_minutes INT DEFAULT 0 CHECK (overtime_minutes >= 0),
    status VARCHAR(30) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'holiday', 'late')),
    notes TEXT,
    marked_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_attendance_employee_date UNIQUE (employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

CREATE OR REPLACE VIEW attendance_summary AS
SELECT
    ep.id AS employee_id,
    ep.name AS employee_name,
    d.department_name,
    COUNT(ar.id) AS total_records,
    COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_days,
    COUNT(ar.id) FILTER (WHERE ar.status = 'half_day') AS half_days,
    COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS absent_days,
    COALESCE(SUM(ar.work_minutes), 0) AS total_work_minutes,
    COALESCE(SUM(ar.overtime_minutes), 0) AS total_overtime_minutes
FROM employee_profiles ep
LEFT JOIN departments d ON d.id = ep.department_id
LEFT JOIN attendance_records ar ON ar.employee_id = ep.id
GROUP BY ep.id, ep.name, d.department_name;
