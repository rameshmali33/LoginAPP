-- Database Optimization and Views Migration

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_email ON employee_profiles(email);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_department_id ON employee_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_leave_applications_employee_id ON leave_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_applications_status ON leave_applications(status);
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee_id ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_skill_id ON employee_skills(skill_id);

-- ============================================
-- VIEWS FOR REPORTING & DASHBOARDS
-- ============================================

-- 1. Employee Dashboard View: Consolidated employee information with counts
CREATE OR REPLACE VIEW employee_dashboard_view AS
SELECT 
    ep.id,
    ep.name,
    ep.email,
    d.department_name,
    ep.designation,
    ep.status,
    COUNT(DISTINCT aa.id) as active_assets_count,
    COUNT(DISTINCT la.id) as total_leaves_applied
FROM employee_profiles ep
LEFT JOIN departments d ON ep.department_id = d.id
LEFT JOIN asset_allocations aa ON ep.id = aa.employee_id AND aa.status = 'allocated'
LEFT JOIN leave_applications la ON ep.id = la.employee_id
GROUP BY ep.id, ep.name, ep.email, d.department_name, ep.designation, ep.status;

-- 2. Leave Summary View: Aggregates leave statistics per employee
CREATE OR REPLACE VIEW leave_summary_view AS
SELECT 
    la.employee_id,
    ep.name as employee_name,
    lt.leave_name,
    COUNT(la.id) as total_applications,
    SUM(CASE WHEN la.status = 'approved' THEN la.total_days ELSE 0 END) as approved_leave_days,
    SUM(CASE WHEN la.status = 'pending_manager' OR la.status = 'pending_hr' THEN 1 ELSE 0 END) as pending_applications_count
FROM leave_applications la
JOIN employee_profiles ep ON la.employee_id = ep.id
JOIN leave_types lt ON la.leave_type_id = lt.id
GROUP BY la.employee_id, ep.name, lt.leave_name;

-- 3. Asset Summary View: Aggregates asset counts by type and current status
CREATE OR REPLACE VIEW asset_summary_view AS
SELECT 
    asset_type,
    COUNT(*) as total_assets,
    SUM(CASE WHEN status = 'allocated' THEN 1 ELSE 0 END) as allocated_assets,
    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_assets,
    SUM(CASE WHEN status = 'damaged' THEN 1 ELSE 0 END) as damaged_assets
FROM assets
GROUP BY asset_type;
