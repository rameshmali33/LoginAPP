const path = require("path");
const bcrypt = require("bcrypt");

const env = process.env.NODE_ENV || "development";
require("dotenv").config({ path: path.join(__dirname, `.env.${env}`) });
require("dotenv").config();

const pool = require("./config/db");

const departments = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Sales",
  "Operations",
  "Customer Success",
];

const skills = [
  "React",
  "Node.js",
  "PostgreSQL",
  "Payroll Compliance",
  "Recruitment",
  "Financial Reporting",
  "Client Communication",
  "Asset Management",
  "Data Analysis",
  "Project Management",
];

const employees = [
  ["Aarav Sharma", "aarav.sharma@epms-demo.com", "Engineering", "Senior Software Engineer", 128000, "9876501001", "Pune, Maharashtra", "admin"],
  ["Nisha Mehta", "nisha.mehta@epms-demo.com", "Human Resources", "HR Manager", 98000, "9876501002", "Mumbai, Maharashtra", "hr"],
  ["Rohan Iyer", "rohan.iyer@epms-demo.com", "Finance", "Finance Controller", 112000, "9876501003", "Bengaluru, Karnataka", "admin"],
  ["Priya Nair", "priya.nair@epms-demo.com", "Sales", "Regional Sales Manager", 105000, "9876501004", "Kochi, Kerala", "manager"],
  ["Vikram Rao", "vikram.rao@epms-demo.com", "Operations", "Operations Lead", 92000, "9876501005", "Hyderabad, Telangana", "manager"],
  ["Meera Kapoor", "meera.kapoor@epms-demo.com", "Customer Success", "Customer Success Lead", 86000, "9876501006", "Delhi", "manager"],
  ["Kabir Khan", "kabir.khan@epms-demo.com", "Engineering", "Frontend Developer", 74000, "9876501007", "Noida, Uttar Pradesh", "employee"],
  ["Ananya Desai", "ananya.desai@epms-demo.com", "Engineering", "Backend Developer", 79000, "9876501008", "Ahmedabad, Gujarat", "employee"],
  ["Siddharth Jain", "siddharth.jain@epms-demo.com", "Engineering", "QA Automation Engineer", 68000, "9876501009", "Jaipur, Rajasthan", "employee"],
  ["Isha Verma", "isha.verma@epms-demo.com", "Human Resources", "Talent Acquisition Specialist", 62000, "9876501010", "Gurugram, Haryana", "employee"],
  ["Dev Patel", "dev.patel@epms-demo.com", "Finance", "Accounts Executive", 57000, "9876501011", "Surat, Gujarat", "employee"],
  ["Sana Qureshi", "sana.qureshi@epms-demo.com", "Finance", "Payroll Analyst", 64000, "9876501012", "Lucknow, Uttar Pradesh", "employee"],
  ["Arjun Menon", "arjun.menon@epms-demo.com", "Sales", "Account Executive", 61000, "9876501013", "Chennai, Tamil Nadu", "employee"],
  ["Tara Singh", "tara.singh@epms-demo.com", "Sales", "Business Development Executive", 54000, "9876501014", "Chandigarh", "employee"],
  ["Neel Gupta", "neel.gupta@epms-demo.com", "Operations", "Logistics Coordinator", 52000, "9876501015", "Indore, Madhya Pradesh", "employee"],
  ["Pooja Kulkarni", "pooja.kulkarni@epms-demo.com", "Operations", "Procurement Executive", 59000, "9876501016", "Nagpur, Maharashtra", "employee"],
  ["Rahul Bose", "rahul.bose@epms-demo.com", "Customer Success", "Support Specialist", 48000, "9876501017", "Kolkata, West Bengal", "employee"],
  ["Aditi Banerjee", "aditi.banerjee@epms-demo.com", "Customer Success", "Implementation Consultant", 69000, "9876501018", "Kolkata, West Bengal", "employee"],
  ["Manav Bhatia", "manav.bhatia@epms-demo.com", "Engineering", "DevOps Engineer", 88000, "9876501019", "Gurugram, Haryana", "employee"],
  ["Kavya Reddy", "kavya.reddy@epms-demo.com", "Human Resources", "HR Operations Executive", 56000, "9876501020", "Hyderabad, Telangana", "employee"],
];

const assets = [
  ["LTP-1001", "Dell Latitude 7440", "Laptop", "2025-04-15", 112000, "allocated"],
  ["LTP-1002", "MacBook Air M3", "Laptop", "2025-06-10", 124000, "allocated"],
  ["LTP-1003", "Lenovo ThinkPad E14", "Laptop", "2025-07-18", 86000, "allocated"],
  ["MON-2001", "Dell 24 inch Monitor", "Monitor", "2025-03-08", 18000, "allocated"],
  ["MON-2002", "LG Ultrawide Monitor", "Monitor", "2025-05-21", 31000, "available"],
  ["PHN-3001", "iPhone 15", "Mobile", "2025-08-12", 79000, "allocated"],
  ["PHN-3002", "Samsung Galaxy S24", "Mobile", "2025-08-19", 72000, "available"],
  ["CHR-4001", "Ergonomic Office Chair", "Furniture", "2025-01-20", 14500, "allocated"],
  ["PRN-5001", "HP LaserJet Pro", "Printer", "2024-12-05", 28000, "available"],
  ["TAB-6001", "iPad Air", "Tablet", "2025-09-02", 64000, "damaged"],
  ["ACC-7001", "Jabra Headset", "Accessory", "2025-02-14", 9500, "allocated"],
  ["ACC-7002", "Logitech MX Keyboard", "Accessory", "2025-02-22", 11500, "lost"],
];

const money = (value) => Math.round(Number(value || 0) * 100) / 100;

async function tableExists(tableName) {
  const result = await pool.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
    [tableName]
  );
  return result.rows.length > 0;
}

async function getColumns(tableName) {
  const result = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
    [tableName]
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function upsertDepartment(name) {
  const existing = await pool.query("SELECT id FROM departments WHERE LOWER(department_name) = LOWER($1)", [name]);
  if (existing.rows[0]) return existing.rows[0].id;
  const created = await pool.query("INSERT INTO departments(department_name) VALUES($1) RETURNING id", [name]);
  return created.rows[0].id;
}

async function upsertSkill(name) {
  const existing = await pool.query("SELECT id FROM skills WHERE LOWER(skill_name) = LOWER($1)", [name]);
  if (existing.rows[0]) return existing.rows[0].id;
  const created = await pool.query("INSERT INTO skills(skill_name) VALUES($1) RETURNING id", [name]);
  return created.rows[0].id;
}

async function upsertUser(employee, userColumns, passwordHash) {
  const [name, email, , , , , , role] = employee;
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows[0]) {
    const updates = ["name = $1"];
    const values = [name];
    let index = 2;
    if (userColumns.has("role")) {
      updates.push(`role = $${index++}`);
      values.push(role);
    }
    if (userColumns.has("is_verified")) {
      updates.push(`is_verified = $${index++}`);
      values.push(true);
    }
    values.push(email);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE email = $${index}`, values);
    return existing.rows[0].id;
  }

  const fields = ["name", "email", "password"];
  const values = [name, email, passwordHash];
  if (userColumns.has("role")) {
    fields.push("role");
    values.push(role);
  }
  if (userColumns.has("is_verified")) {
    fields.push("is_verified");
    values.push(true);
  }

  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  const created = await pool.query(
    `INSERT INTO users(${fields.join(", ")}) VALUES(${placeholders}) RETURNING id`,
    values
  );
  return created.rows[0].id;
}

async function upsertEmployeeProfile(employee, userId, departmentId, profileColumns) {
  const [name, email, , designation, salary, phone, address] = employee;
  const existing = await pool.query("SELECT id FROM employee_profiles WHERE email = $1", [email]);

  const data = {
    user_id: userId,
    department_id: departmentId,
    name,
    email,
    phone,
    address,
    designation,
    salary,
    status: "active",
  };

  if (existing.rows[0]) {
    const fields = Object.keys(data).filter((key) => profileColumns.has(key));
    const values = fields.map((field) => data[field]);
    values.push(existing.rows[0].id);
    await pool.query(
      `UPDATE employee_profiles SET ${fields.map((field, index) => `${field} = $${index + 1}`).join(", ")} WHERE id = $${values.length}`,
      values
    );
    return existing.rows[0].id;
  }

  const fields = Object.keys(data).filter((key) => profileColumns.has(key));
  const values = fields.map((field) => data[field]);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  const created = await pool.query(
    `INSERT INTO employee_profiles(${fields.join(", ")}) VALUES(${placeholders}) RETURNING id`,
    values
  );
  return created.rows[0].id;
}

async function ensureUserProfileLink(userId, employeeId, userColumns) {
  if (userColumns.has("employee_profile_id")) {
    await pool.query("UPDATE users SET employee_profile_id = $1 WHERE id = $2", [employeeId, userId]);
  }
}

async function seedEmployeeSkills(employeeIds, skillIds) {
  if (!(await tableExists("employee_skills"))) return;
  for (let i = 0; i < employeeIds.length; i += 1) {
    const assigned = [skillIds[i % skillIds.length], skillIds[(i + 2) % skillIds.length], skillIds[(i + 5) % skillIds.length]];
    for (const skillId of assigned) {
      await pool.query(
        "INSERT INTO employee_skills(employee_id, skill_id) VALUES($1, $2) ON CONFLICT DO NOTHING",
        [employeeIds[i], skillId]
      );
    }
  }
}

async function seedImages(employeeIds) {
  if (!(await tableExists("employee_images"))) return;
  for (let i = 0; i < employeeIds.length; i += 1) {
    const imageUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(employees[i][0])}`;
    const existing = await pool.query(
      "SELECT id FROM employee_images WHERE employee_id = $1 AND image_url = $2",
      [employeeIds[i], imageUrl]
    );
    if (!existing.rows[0]) {
      await pool.query("INSERT INTO employee_images(employee_id, image_url) VALUES($1, $2)", [employeeIds[i], imageUrl]);
    }
  }
}

async function seedAttendance(employeeIds, adminId) {
  const start = new Date("2026-06-01T09:30:00");
  for (let employeeIndex = 0; employeeIndex < employeeIds.length; employeeIndex += 1) {
    for (let dayOffset = 0; dayOffset < 20; dayOffset += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + dayOffset);
      const day = date.getDay();
      if (day === 0 || day === 6) continue;

      const status = (employeeIndex + dayOffset) % 17 === 0
        ? "absent"
        : (employeeIndex + dayOffset) % 11 === 0
        ? "half_day"
        : (employeeIndex + dayOffset) % 7 === 0
        ? "late"
        : "present";

      const dateStr = date.toISOString().slice(0, 10);
      const clockIn = status === "absent" ? null : `${dateStr} ${status === "late" ? "10:20:00" : "09:30:00"}`;
      const clockOut = status === "absent" ? null : `${dateStr} ${status === "half_day" ? "14:00:00" : "18:15:00"}`;
      const workMinutes = status === "absent" ? 0 : status === "half_day" ? 240 : status === "late" ? 455 : 495;
      const overtimeMinutes = status === "present" && (employeeIndex + dayOffset) % 5 === 0 ? 45 : 0;

      await pool.query(
        `
        INSERT INTO attendance_records(employee_id, attendance_date, clock_in, clock_out, break_minutes, work_minutes, overtime_minutes, status, notes, marked_by)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (employee_id, attendance_date)
        DO UPDATE SET clock_in = EXCLUDED.clock_in, clock_out = EXCLUDED.clock_out, break_minutes = EXCLUDED.break_minutes,
          work_minutes = EXCLUDED.work_minutes, overtime_minutes = EXCLUDED.overtime_minutes, status = EXCLUDED.status,
          notes = EXCLUDED.notes, marked_by = EXCLUDED.marked_by, updated_at = CURRENT_TIMESTAMP
        `,
        [employeeIds[employeeIndex], dateStr, clockIn, clockOut, 45, workMinutes, overtimeMinutes, status, "Demo attendance seed", adminId]
      );
    }
  }
}

async function seedLeaves(employeeIds, userIds) {
  const leaveTypes = await pool.query("SELECT id, leave_name FROM leave_types ORDER BY id");
  if (leaveTypes.rows.length === 0) return;
  for (let i = 0; i < Math.min(employeeIds.length, 12); i += 1) {
    const leaveType = leaveTypes.rows[i % leaveTypes.rows.length];
    const fromDay = String(3 + i).padStart(2, "0");
    const toDay = String(3 + i + (i % 2)).padStart(2, "0");
    const status = i % 4 === 0 ? "pending_manager" : i % 4 === 1 ? "pending_hr" : i % 4 === 2 ? "approved" : "rejected";
    const existing = await pool.query(
      "SELECT id FROM leave_applications WHERE employee_id = $1 AND from_date = $2 AND leave_type_id = $3",
      [employeeIds[i], `2026-06-${fromDay}`, leaveType.id]
    );
    const totalDays = i % 2 === 0 ? 1 : 2;
    let leaveId;
    if (existing.rows[0]) {
      leaveId = existing.rows[0].id;
      await pool.query("UPDATE leave_applications SET status = $1, total_days = $2 WHERE id = $3", [status, totalDays, leaveId]);
    } else {
      const created = await pool.query(
        `
        INSERT INTO leave_applications(employee_id, leave_type_id, from_date, to_date, total_days, reason, status)
        VALUES($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        `,
        [employeeIds[i], leaveType.id, `2026-06-${fromDay}`, `2026-06-${toDay}`, totalDays, "Planned personal leave", status]
      );
      leaveId = created.rows[0].id;
    }

    if (status !== "pending_manager") {
      await pool.query(
        "INSERT INTO approval_history(leave_id, approved_by, action, remarks) VALUES($1, $2, $3, $4) ON CONFLICT DO NOTHING",
        [leaveId, userIds[0], status === "approved" ? "approved_by_hr" : "reviewed", "Demo approval workflow"]
      );
    }
  }
}

async function seedAssets(employeeIds, adminId) {
  const assetIds = [];
  for (let i = 0; i < assets.length; i += 1) {
    const [assetCode, assetName, assetType, purchaseDate, purchaseCost, status] = assets[i];
    const existing = await pool.query("SELECT id FROM assets WHERE asset_code = $1", [assetCode]);
    let assetId;
    if (existing.rows[0]) {
      assetId = existing.rows[0].id;
      await pool.query(
        "UPDATE assets SET asset_name = $1, asset_type = $2, purchase_date = $3, purchase_cost = $4, status = $5 WHERE id = $6",
        [assetName, assetType, purchaseDate, purchaseCost, status, assetId]
      );
    } else {
      const created = await pool.query(
        "INSERT INTO assets(asset_code, asset_name, asset_type, purchase_date, purchase_cost, status) VALUES($1, $2, $3, $4, $5, $6) RETURNING id",
        [assetCode, assetName, assetType, purchaseDate, purchaseCost, status]
      );
      assetId = created.rows[0].id;
    }
    assetIds.push(assetId);

    await pool.query(
      "INSERT INTO asset_history(asset_id, action, remarks, created_by) VALUES($1, $2, $3, $4) ON CONFLICT DO NOTHING",
      [assetId, "SEEDED", `Demo asset ${assetName} prepared for asset dashboard`, adminId]
    );

    if (status === "allocated") {
      const employeeId = employeeIds[i % employeeIds.length];
      const existingAllocation = await pool.query(
        "SELECT id FROM asset_allocations WHERE asset_id = $1 AND status = 'allocated'",
        [assetId]
      );
      if (!existingAllocation.rows[0]) {
        await pool.query(
          "INSERT INTO asset_allocations(asset_id, employee_id, allocated_by, allocated_date, status, remarks) VALUES($1, $2, $3, $4, 'allocated', $5)",
          [assetId, employeeId, adminId, "2026-06-01", "Allocated as demo operational equipment"]
        );
      }
    }
  }
  return assetIds;
}

async function seedPayroll(employeeIds, userIds) {
  const existingPeriod = await pool.query("SELECT id FROM payroll_periods WHERE payroll_month = 6 AND payroll_year = 2026");
  let periodId;
  if (existingPeriod.rows[0]) {
    periodId = existingPeriod.rows[0].id;
  } else {
    const created = await pool.query(
      `
      INSERT INTO payroll_periods(period_name, payroll_month, payroll_year, start_date, end_date, working_days, status, notes, processed_by, processed_at)
      VALUES('June 2026 Payroll', 6, 2026, '2026-06-01', '2026-06-30', 21, 'processed', 'Demo payroll period seeded for reporting', $1, CURRENT_TIMESTAMP)
      RETURNING id
      `,
      [userIds[0]]
    );
    periodId = created.rows[0].id;
  }

  for (let i = 0; i < employeeIds.length; i += 1) {
    const salary = employees[i][4];
    const absentDays = i % 6 === 0 ? 1 : 0;
    const halfDays = i % 8 === 0 ? 1 : 0;
    const paidDays = 21 - absentDays - halfDays * 0.5;
    const basicPay = money(salary * 0.5);
    const hra = money(basicPay * 0.4);
    const conveyance = money(Math.min(1600, salary * 0.05));
    const medical = money(Math.min(1250, salary * 0.04));
    const special = money(Math.max(salary - basicPay - hra - conveyance - medical, 0));
    const overtimePay = i % 5 === 0 ? 1800 : 0;
    const bonus = i % 4 === 0 ? 2500 : 0;
    const reimbursements = i % 3 === 0 ? 1200 : 0;
    const gross = money(basicPay + hra + conveyance + medical + special + overtimePay + bonus + reimbursements);
    const lossOfPay = money((salary / 21) * (absentDays + halfDays * 0.5));
    const pf = money(basicPay * 0.12);
    const esi = salary <= 21000 ? money(salary * 0.0075) : 0;
    const professionalTax = salary > 30000 ? 200 : 0;
    const tds = salary > 100000 ? money(salary * 0.08) : salary > 75000 ? money(salary * 0.04) : 0;
    const loan = i % 7 === 0 ? 1500 : 0;
    const other = i % 9 === 0 ? 500 : 0;
    const deductions = money(lossOfPay + pf + esi + professionalTax + tds + loan + other);
    const net = money(gross - deductions);
    const status = i % 10 === 0 ? "hold" : i % 3 === 0 ? "paid" : "approved";

    await pool.query(
      `
      INSERT INTO payroll_records(period_id, employee_id, basic_salary, paid_days, present_days, half_days, absent_days, leave_days,
        overtime_minutes, basic_pay, hra, conveyance_allowance, medical_allowance, special_allowance, overtime_pay, bonus,
        reimbursements, gross_earnings, loss_of_pay, provident_fund, esi, professional_tax, tds, loan_deduction,
        other_deductions, total_deductions, net_pay, status, payment_date, payment_reference, remarks, generated_by)
      VALUES($1, $2, $3, $4, 18, $5, $6, 1, 90, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, '2026-06-28', $26, 'Demo payroll generated for dashboard', $27)
      ON CONFLICT (period_id, employee_id)
      DO UPDATE SET paid_days = EXCLUDED.paid_days, gross_earnings = EXCLUDED.gross_earnings,
        total_deductions = EXCLUDED.total_deductions, net_pay = EXCLUDED.net_pay, status = EXCLUDED.status,
        tds = EXCLUDED.tds, provident_fund = EXCLUDED.provident_fund, loss_of_pay = EXCLUDED.loss_of_pay
      `,
      [
        periodId, employeeIds[i], salary, paidDays, halfDays, absentDays, basicPay, hra, conveyance, medical, special,
        overtimePay, bonus, reimbursements, gross, lossOfPay, pf, esi, professionalTax, tds, loan, other, deductions, net,
        status, `PAY-JUN26-${String(i + 1).padStart(3, "0")}`, userIds[0],
      ]
    );
  }
}

async function seedNotifications(userIds, employeeIds) {
  const notifications = [
    [userIds[0], "Dashboard Data Ready", "Demo workforce, attendance, assets, and payroll data has been prepared.", "system", null],
    [userIds[1], "Leave Queue Updated", "Several demo leave requests are waiting for HR review.", "leave", null],
    [userIds[2], "Payroll Processed", "June 2026 payroll records are ready for review.", "payroll", null],
    [userIds[6], "Asset Allocated", "A laptop and headset have been allocated to your employee profile.", "asset", employeeIds[6]],
    [userIds[7], "Payslip Approved", "Your June 2026 payslip is available for review.", "payroll", employeeIds[7]],
  ];

  for (const item of notifications) {
    const existing = await pool.query(
      "SELECT id FROM notifications WHERE user_id = $1 AND title = $2 AND message = $3",
      [item[0], item[1], item[2]]
    );
    if (!existing.rows[0]) {
      await pool.query(
        "INSERT INTO notifications(user_id, title, message, related_entity, related_id, is_read) VALUES($1, $2, $3, $4, $5, FALSE)",
        item
      );
    }
  }
}

async function seedAuditAndActivity(userIds) {
  if (await tableExists("activity_logs")) {
    const logs = [
      ["Demo Seed Completed", "Professional demo data seeded for dashboard and modules", userIds[0]],
      ["Payroll Prepared", "June 2026 payroll records generated", userIds[2]],
      ["Assets Audited", "Asset inventory seeded with allocations and statuses", userIds[4]],
      ["Attendance Imported", "June attendance records imported", userIds[1]],
    ];
    for (const log of logs) {
      await pool.query(
        "INSERT INTO activity_logs(action, description, user_id) VALUES($1, $2, $3)",
        log
      );
    }
  }

  if (await tableExists("audit_logs")) {
    await pool.query(
      `
      INSERT INTO audit_logs(table_name, action_type, record_id, old_data, new_data, performed_by)
      VALUES
      ('employee_profiles', 'CREATE', 1, NULL, '{"source":"demo seed"}', $1),
      ('payroll_records', 'CREATE', 1, NULL, '{"period":"June 2026"}', $1),
      ('assets', 'UPDATE', 1, '{"status":"available"}', '{"status":"allocated"}', $1)
      `,
      [userIds[0]]
    );
  }
}

async function seedProfileLinkRequest(userIds, employeeIds) {
  if (!(await tableExists("profile_link_requests"))) return;
  const existing = await pool.query(
    "SELECT id FROM profile_link_requests WHERE user_id = $1 AND employee_profile_id = $2",
    [userIds[19], employeeIds[18]]
  );
  if (!existing.rows[0]) {
    await pool.query(
      "INSERT INTO profile_link_requests(user_id, employee_profile_id, message, status) VALUES($1, $2, $3, 'pending')",
      [userIds[19], employeeIds[18], "Demo request for validating profile-link workflow"]
    );
  }
}

async function run() {
  const client = await pool.connect();
  client.release();

  const userColumns = await getColumns("users");
  const profileColumns = await getColumns("employee_profiles");
  const passwordHash = await bcrypt.hash("Demo@12345", 10);

  const departmentIds = {};
  for (const department of departments) {
    departmentIds[department] = await upsertDepartment(department);
  }

  const skillIds = [];
  for (const skill of skills) {
    skillIds.push(await upsertSkill(skill));
  }

  const userIds = [];
  const employeeIds = [];
  for (const employee of employees) {
    const userId = await upsertUser(employee, userColumns, passwordHash);
    const employeeId = await upsertEmployeeProfile(employee, userId, departmentIds[employee[2]], profileColumns);
    await ensureUserProfileLink(userId, employeeId, userColumns);
    userIds.push(userId);
    employeeIds.push(employeeId);
  }

  await seedEmployeeSkills(employeeIds, skillIds);
  await seedImages(employeeIds);
  await seedAttendance(employeeIds, userIds[0]);
  await seedLeaves(employeeIds, userIds);
  await seedAssets(employeeIds, userIds[0]);
  await seedPayroll(employeeIds, userIds);
  await seedNotifications(userIds, employeeIds);
  await seedAuditAndActivity(userIds);
  await seedProfileLinkRequest(userIds, employeeIds);

  console.log("Demo data seeded successfully.");
  console.log(`Employees: ${employeeIds.length}`);
  console.log(`Departments: ${departments.length}`);
  console.log(`Skills: ${skills.length}`);
  console.log("Default demo password for seeded users: Demo@12345");
}

run()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error("Demo seed failed:", error);
    await pool.end();
    process.exit(1);
  });
