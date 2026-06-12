/**
 * Joi Validation Schemas
 * Reusable validation schemas for employees, assets, allocations, etc.
 */

const Joi = require("joi");

// Asset Schemas
const assetCreateSchema = Joi.object({
  asset_code: Joi.string().required().max(50),
  asset_name: Joi.string().required().max(200),
  asset_type: Joi.string().required().max(100),
  purchase_date: Joi.date().iso().required(),
  purchase_cost: Joi.number().positive().required(),
  status: Joi.string()
    .valid("available", "allocated", "returned", "damaged", "lost")
    .default("available"),
});

const assetUpdateSchema = Joi.object({
  asset_code: Joi.string().max(50),
  asset_name: Joi.string().max(200),
  asset_type: Joi.string().max(100),
  purchase_date: Joi.date().iso(),
  purchase_cost: Joi.number().positive(),
  status: Joi.string().valid(
    "available",
    "allocated",
    "returned",
    "damaged",
    "lost"
  ),
});

const assetAllocationSchema = Joi.object({
  asset_id: Joi.number().integer().required(),
  employee_id: Joi.number().integer().required(),
  allocated_date: Joi.date().iso().required(),
  remarks: Joi.string().max(500).allow(""),
});

const assetReturnSchema = Joi.object({
  return_date: Joi.date().iso().required(),
  remarks: Joi.string().max(500).allow(""),
});

// Employee Schemas
const employeeCreateSchema = Joi.object({
  name: Joi.string().required().max(200),
  email: Joi.string().email().required(),
  designation: Joi.string().required().max(100),
  department_id: Joi.number().integer().required(),
  salary: Joi.number().positive().required(),
  phone: Joi.string().max(20).allow(""),
  address: Joi.string().max(500).allow(""),
  status: Joi.string().valid("active", "inactive").default("active"),
});

const employeeUpdateSchema = Joi.object({
  name: Joi.string().max(200),
  email: Joi.string().email(),
  designation: Joi.string().max(100),
  department_id: Joi.number().integer(),
  salary: Joi.number().positive(),
  phone: Joi.string().max(20).allow(""),
  address: Joi.string().max(500).allow(""),
  status: Joi.string().valid("active", "inactive"),
});

// Auth Schemas
const signupSchema = Joi.object({
  name: Joi.string().required().max(200),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6).max(100),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().max(100),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().required().min(6).max(100),
});

// Search Schema
const searchSchema = Joi.object({
  q: Joi.string().required().min(2).max(100),
});

// Pagination Schema
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Filter Schema
const filterSchema = Joi.object({
  sortBy: Joi.string().max(50),
  order: Joi.string().valid("ASC", "DESC").default("ASC"),
  department: Joi.string().max(100),
  status: Joi.string().max(50),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
});

// Validation middleware function
const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const err = new Error("Validation Error");
      err.isJoi = true;
      err.details = error.details;
      err.statusCode = 400;
      return next(err);
    }

    req.validated = value;
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const err = new Error("Validation Error");
      err.isJoi = true;
      err.details = error.details;
      err.statusCode = 400;
      return next(err);
    }

    req.queryValidated = value;
    next();
  };
};

module.exports = {
  // Schemas
  assetCreateSchema,
  assetUpdateSchema,
  assetAllocationSchema,
  assetReturnSchema,
  employeeCreateSchema,
  employeeUpdateSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  searchSchema,
  paginationSchema,
  filterSchema,

  // Middleware
  validateSchema,
  validateQuery,
};
