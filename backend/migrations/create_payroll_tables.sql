-- Payroll system tables

CREATE TABLE IF NOT EXISTS payroll_periods (
    id SERIAL PRIMARY KEY,
    period_name VARCHAR(120) NOT NULL,
    payroll_month INT NOT NULL CHECK (payroll_month BETWEEN 1 AND 12),
    payroll_year INT NOT NULL CHECK (payroll_year >= 2000),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    working_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid', 'locked')),
    notes TEXT,
    processed_by INT REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_payroll_period UNIQUE (payroll_month, payroll_year),
    CONSTRAINT valid_payroll_dates CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS payroll_records (
    id SERIAL PRIMARY KEY,
    period_id INT NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
    basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    present_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    half_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    absent_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    leave_days NUMERIC(6, 2) NOT NULL DEFAULT 0,
    overtime_minutes INT NOT NULL DEFAULT 0,

    basic_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
    hra NUMERIC(12, 2) NOT NULL DEFAULT 0,
    conveyance_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    medical_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    special_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    overtime_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
    bonus NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reimbursements NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gross_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0,

    loss_of_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,
    provident_fund NUMERIC(12, 2) NOT NULL DEFAULT 0,
    esi NUMERIC(12, 2) NOT NULL DEFAULT 0,
    professional_tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tds NUMERIC(12, 2) NOT NULL DEFAULT 0,
    loan_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
    other_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_pay NUMERIC(12, 2) NOT NULL DEFAULT 0,

    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid', 'hold')),
    payment_date DATE,
    payment_reference VARCHAR(120),
    remarks TEXT,
    generated_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_payroll_employee_period UNIQUE (period_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON payroll_periods(status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period_id ON payroll_records(period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON payroll_records(status);
