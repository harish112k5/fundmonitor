require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// ─────────────────────────── CORS ────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002', 
    'http://localhost:5173', 
    'https://fundmonitor.vercel.app',
    /^https:\/\/.*\.vercel\.app$/
  ],
  credentials: true
}));

// ─────────────────────────── Middleware ───────────────────────────
app.use(express.json());

// ─────────────────────── Swagger Definition ───────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Construction ERP API',
      version: '1.0.0',
      description:
        'REST API for the Construction Project Management & Fund Monitor system. ' +
        'All protected routes require a Bearer JWT token obtained from `/api/auth/login`.',
      contact: { name: 'Construction ERP Team' },
    },
    servers: [
      { url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT}`, description: 'Active server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────
        LoginRequest: {
          type: 'object', required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@example.com' },
            password: { type: 'string', format: 'password', example: 'secret123' },
          },
        },
        RegisterRequest: {
          type: 'object', required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'secret123' },
            role_id: { type: 'integer', example: 4, description: 'Defaults to 4 (viewer)' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        // ── User ──────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            role_id: { type: 'integer' },
            role_name: { type: 'string' },
          },
        },
        // ── Project ───────────────────────────────────────────────
        Project: {
          type: 'object',
          properties: {
            project_id: { type: 'integer' },
            project_name: { type: 'string' },
            location: { type: 'string' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            estimated_budget: { type: 'number' },
            status: { type: 'string', enum: ['ongoing', 'completed', 'on_hold'] },
            created_by: { type: 'integer' },
          },
        },
        ProjectInput: {
          type: 'object', required: ['project_name', 'created_by'],
          properties: {
            project_name: { type: 'string', example: 'Bridge Construction Phase 1' },
            location: { type: 'string', example: 'Mumbai' },
            start_date: { type: 'string', format: 'date', example: '2024-01-01' },
            end_date: { type: 'string', format: 'date', example: '2024-12-31' },
            estimated_budget: { type: 'number', example: 5000000 },
            status: { type: 'string', enum: ['ongoing', 'completed', 'on_hold'], default: 'ongoing' },
            created_by: { type: 'integer', example: 1 },
          },
        },
        // ── Loan ──────────────────────────────────────────────────
        Loan: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            project_id: { type: 'integer' },
            financier_id: { type: 'integer' },
            principal: { type: 'number' },
            interest_rate: { type: 'number' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
          },
        },
        LoanInput: {
          type: 'object', required: ['project_id', 'financier_id', 'principal', 'interest_rate', 'start_date'],
          properties: {
            project_id: { type: 'integer', example: 1 },
            financier_id: { type: 'integer', example: 2 },
            principal: { type: 'number', example: 1000000 },
            interest_rate: { type: 'number', example: 8.5 },
            start_date: { type: 'string', format: 'date', example: '2024-01-01' },
            end_date: { type: 'string', format: 'date', example: '2026-01-01' },
            created_by: { type: 'integer', example: 1 },
          },
        },
        // ── Generic ───────────────────────────────────────────────
        MessageResponse: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
        ErrorResponse: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', description: 'Process uptime in seconds' },
            environment: { type: 'string', example: 'production' },
            database: { type: 'string', example: 'connected' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'General',           description: 'Root and health endpoints' },
      { name: 'Auth',              description: 'Authentication & session management' },
      { name: 'Users',             description: 'User management' },
      { name: 'Roles',             description: 'Role management' },
      { name: 'Projects',          description: 'Project CRUD & full detail view' },
      { name: 'Materials',         description: 'Material master data' },
      { name: 'Material Usage',    description: 'Material consumption records' },
      { name: 'Machines',          description: 'Machine master data' },
      { name: 'Machine Usage',     description: 'Machine usage records' },
      { name: 'Workers',           description: 'Worker profiles' },
      { name: 'Worker Roles',      description: 'Worker role definitions' },
      { name: 'Manpower Usage',    description: 'Manpower usage records' },
      { name: 'Investors',         description: 'Investor profiles' },
      { name: 'Financiers',        description: 'Financier (lender) profiles' },
      { name: 'Investments',       description: 'Project investments' },
      { name: 'Loans',             description: 'Project loans' },
      { name: 'Interest Payments', description: 'Loan interest payment records' },
      { name: 'Expense Categories',description: 'Expense category definitions' },
      { name: 'Expenses',          description: 'Project expense entries' },
      { name: 'Billing',           description: 'Project invoices & billing' },
      { name: 'Project Progress',  description: 'Progress tracking per project' },
      { name: 'Project Team',      description: 'Team member assignments' },
      { name: 'Audit Log',         description: 'System audit trail' },
      { name: 'Dashboard',         description: 'Aggregated dashboard statistics' },
      { name: 'Recycle Bin',       description: 'Soft-deleted project recovery' },
      { name: 'Admin',             description: 'Admin-only operations' },
      { name: 'Import',            description: 'Excel project data import' },
    ],
    paths: {
      // ═══════════════════════ GENERAL ══════════════════════════
      '/': {
        get: {
          tags: ['General'], summary: 'API root', operationId: 'getRoot',
          security: [],
          responses: {
            200: {
              description: 'API welcome message with available endpoints',
              content: { 'application/json': { schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  version: { type: 'string' },
                  description: { type: 'string' },
                  docs: { type: 'string' },
                  health: { type: 'string' },
                  endpoints: { type: 'object' },
                },
              } } },
            },
          },
        },
      },
      '/api/health': {
        get: {
          tags: ['General'], summary: 'Health check', operationId: 'getHealth',
          security: [],
          responses: {
            200: { description: 'Service is healthy', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
            503: { description: 'Service unavailable (DB disconnected)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      // ═══════════════════════ AUTH ════════════════════════════
      '/api/auth/register': {
        post: {
          tags: ['Auth'], summary: 'Register a new user', operationId: 'registerUser',
          security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
          responses: {
            201: { description: 'User registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            400: { description: 'Missing required fields', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'], summary: 'Login and receive a JWT', operationId: 'loginUser',
          security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'], summary: 'Get current authenticated user', operationId: 'getMe',
          responses: {
            200: { description: 'Current user profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { description: 'No or invalid token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      // ═══════════════════════ USERS ═══════════════════════════
      '/api/users': {
        get: {
          tags: ['Users'], summary: 'List all users', operationId: 'listUsers',
          responses: { 200: { description: 'Array of users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } },
        },
        post: {
          tags: ['Users'], summary: 'Create a user', operationId: 'createUser',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['name', 'email', 'role_id'],
            properties: {
              name: { type: 'string', example: 'Alice Smith' },
              email: { type: 'string', example: 'alice@example.com' },
              password_hash: { type: 'string', example: 'plaintext_password' },
              role_id: { type: 'integer', example: 2 },
            },
          } } } },
          responses: { 201: { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } },
        },
      },
      '/api/users/{id}': {
        get: {
          tags: ['Users'], summary: 'Get a user by ID', operationId: 'getUser',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'User found', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
        put: {
          tags: ['Users'], summary: 'Update a user', operationId: 'updateUser',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object',
            properties: { name: { type: 'string' }, email: { type: 'string' }, role_id: { type: 'integer' } },
          } } } },
          responses: { 200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } } },
        },
        delete: {
          tags: ['Users'], summary: 'Soft-delete a user', operationId: 'deleteUser',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Soft-deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } } },
        },
      },
      // ═══════════════════════ ROLES ═══════════════════════════
      '/api/roles': {
        get: {
          tags: ['Roles'], summary: 'List all roles', operationId: 'listRoles',
          responses: { 200: { description: 'Array of roles', content: { 'application/json': { schema: { type: 'array', items: { type: 'object', properties: { role_id: { type: 'integer' }, role_name: { type: 'string' } } } } } } } },
        },
      },
      // ═══════════════════════ PROJECTS ════════════════════════
      '/api/projects': {
        get: {
          tags: ['Projects'], summary: 'List all projects', operationId: 'listProjects',
          responses: { 200: { description: 'Array of projects', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } } },
        },
        post: {
          tags: ['Projects'], summary: 'Create a project', operationId: 'createProject',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectInput' } } } },
          responses: { 201: { description: 'Project created', content: { 'application/json': { schema: { type: 'object', properties: { project_id: { type: 'integer' }, project_name: { type: 'string' } } } } } } },
        },
      },
      '/api/projects/{id}': {
        get: {
          tags: ['Projects'], summary: 'Get a project by ID', operationId: 'getProject',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Project found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
        put: {
          tags: ['Projects'], summary: 'Update a project', operationId: 'updateProject',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectInput' } } } },
          responses: { 200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } } },
        },
        delete: {
          tags: ['Projects'], summary: 'Soft-delete a project (admin/manager)', operationId: 'deleteProject',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Moved to recycle bin', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
            403: { description: 'Insufficient permissions', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/projects/{id}/details': {
        get: {
          tags: ['Projects'], summary: 'Get full project details (all sub-tables in one call)', operationId: 'getProjectDetails',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Full project detail including financials, usage, team, billing, expenses' },
            404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      // ═══════════════════════ MATERIALS ═══════════════════════
      '/api/materials': {
        get: { tags: ['Materials'], summary: 'List all materials', operationId: 'listMaterials', responses: { 200: { description: 'Array of materials' } } },
        post: {
          tags: ['Materials'], summary: 'Create a material', operationId: 'createMaterial',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['material_name', 'unit', 'unit_price'],
            properties: { material_name: { type: 'string' }, unit: { type: 'string' }, unit_price: { type: 'number' } },
          } } } },
          responses: { 201: { description: 'Material created' } },
        },
      },
      '/api/materials/{id}': {
        put: { tags: ['Materials'], summary: 'Update a material', operationId: 'updateMaterial', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Materials'], summary: 'Delete a material', operationId: 'deleteMaterial', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ MATERIAL USAGE ═════════════════
      '/api/material-usage': {
        get: { tags: ['Material Usage'], summary: 'List material usage records', operationId: 'listMaterialUsage', responses: { 200: { description: 'Array of records' } } },
        post: {
          tags: ['Material Usage'], summary: 'Log material usage', operationId: 'createMaterialUsage',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['project_id', 'material_id', 'quantity', 'unit_price', 'usage_date'],
            properties: { project_id: { type: 'integer' }, material_id: { type: 'integer' }, quantity: { type: 'number' }, unit_price: { type: 'number' }, usage_date: { type: 'string', format: 'date' } },
          } } } },
          responses: { 201: { description: 'Usage logged' } },
        },
      },
      '/api/material-usage/project/{projectId}': {
        get: { tags: ['Material Usage'], summary: 'Material usage for a project', operationId: 'getMaterialUsageByProject', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of records' } } },
      },
      '/api/material-usage/{id}': {
        put: { tags: ['Material Usage'], summary: 'Update usage record', operationId: 'updateMaterialUsage', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Material Usage'], summary: 'Delete usage record', operationId: 'deleteMaterialUsage', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ MACHINES ════════════════════════
      '/api/machines': {
        get: { tags: ['Machines'], summary: 'List all machines', operationId: 'listMachines', responses: { 200: { description: 'Array of machines' } } },
        post: { tags: ['Machines'], summary: 'Create a machine', operationId: 'createMachine', responses: { 201: { description: 'Machine created' } } },
      },
      '/api/machines/{id}': {
        put: { tags: ['Machines'], summary: 'Update a machine', operationId: 'updateMachine', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Machines'], summary: 'Delete a machine', operationId: 'deleteMachine', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ MACHINE USAGE ══════════════════
      '/api/machine-usage': {
        get: { tags: ['Machine Usage'], summary: 'List machine usage records', operationId: 'listMachineUsage', responses: { 200: { description: 'Array of records' } } },
        post: { tags: ['Machine Usage'], summary: 'Log machine usage', operationId: 'createMachineUsage', responses: { 201: { description: 'Usage logged' } } },
      },
      '/api/machine-usage/project/{projectId}': {
        get: { tags: ['Machine Usage'], summary: 'Machine usage for a project', operationId: 'getMachineUsageByProject', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of records' } } },
      },
      '/api/machine-usage/{id}': {
        put: { tags: ['Machine Usage'], summary: 'Update usage record', operationId: 'updateMachineUsage', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Machine Usage'], summary: 'Delete usage record', operationId: 'deleteMachineUsage', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ WORKERS ════════════════════════
      '/api/workers': {
        get: { tags: ['Workers'], summary: 'List all workers', operationId: 'listWorkers', responses: { 200: { description: 'Array of workers' } } },
        post: { tags: ['Workers'], summary: 'Create a worker', operationId: 'createWorker', responses: { 201: { description: 'Worker created' } } },
      },
      '/api/workers/{id}': {
        put: { tags: ['Workers'], summary: 'Update a worker', operationId: 'updateWorker', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Workers'], summary: 'Delete a worker', operationId: 'deleteWorker', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ WORKER ROLES ═══════════════════
      '/api/worker-roles': {
        get: { tags: ['Worker Roles'], summary: 'List all worker roles', operationId: 'listWorkerRoles', responses: { 200: { description: 'Array of worker roles' } } },
        post: { tags: ['Worker Roles'], summary: 'Create a worker role', operationId: 'createWorkerRole', responses: { 201: { description: 'Worker role created' } } },
      },
      // ═══════════════════════ MANPOWER USAGE ═════════════════
      '/api/manpower-usage': {
        get: { tags: ['Manpower Usage'], summary: 'List manpower usage records', operationId: 'listManpowerUsage', responses: { 200: { description: 'Array of records' } } },
        post: { tags: ['Manpower Usage'], summary: 'Log manpower usage', operationId: 'createManpowerUsage', responses: { 201: { description: 'Usage logged' } } },
      },
      '/api/manpower-usage/project/{projectId}': {
        get: { tags: ['Manpower Usage'], summary: 'Manpower usage for a project', operationId: 'getManpowerUsageByProject', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of records' } } },
      },
      '/api/manpower-usage/{id}': {
        put: { tags: ['Manpower Usage'], summary: 'Update usage record', operationId: 'updateManpowerUsage', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Manpower Usage'], summary: 'Delete usage record', operationId: 'deleteManpowerUsage', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ INVESTORS ══════════════════════
      '/api/investors': {
        get: { tags: ['Investors'], summary: 'List all investors', operationId: 'listInvestors', responses: { 200: { description: 'Array of investors' } } },
        post: { tags: ['Investors'], summary: 'Create an investor', operationId: 'createInvestor', responses: { 201: { description: 'Investor created' } } },
      },
      '/api/investors/{id}': {
        put: { tags: ['Investors'], summary: 'Update an investor', operationId: 'updateInvestor', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Investors'], summary: 'Delete an investor', operationId: 'deleteInvestor', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ FINANCIERS ═════════════════════
      '/api/financiers': {
        get: { tags: ['Financiers'], summary: 'List all financiers', operationId: 'listFinanciers', responses: { 200: { description: 'Array of financiers' } } },
        post: { tags: ['Financiers'], summary: 'Create a financier', operationId: 'createFinancier', responses: { 201: { description: 'Financier created' } } },
      },
      '/api/financiers/{id}': {
        put: { tags: ['Financiers'], summary: 'Update a financier', operationId: 'updateFinancier', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Financiers'], summary: 'Delete a financier', operationId: 'deleteFinancier', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ INVESTMENTS ════════════════════
      '/api/investments': {
        get: { tags: ['Investments'], summary: 'List all investments', operationId: 'listInvestments', responses: { 200: { description: 'Array of investments' } } },
        post: { tags: ['Investments'], summary: 'Create an investment', operationId: 'createInvestment', responses: { 201: { description: 'Investment created' } } },
      },
      '/api/investments/project/{projectId}': {
        get: { tags: ['Investments'], summary: 'Investments for a project', operationId: 'getInvestmentsByProject', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of investments' } } },
      },
      '/api/investments/{id}': {
        put: { tags: ['Investments'], summary: 'Update an investment', operationId: 'updateInvestment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Investments'], summary: 'Delete an investment', operationId: 'deleteInvestment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ LOANS ══════════════════════════
      '/api/loans': {
        get: { tags: ['Loans'], summary: 'List all loans', operationId: 'listLoans', responses: { 200: { description: 'Array of loans', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Loan' } } } } } } },
        post: {
          tags: ['Loans'], summary: 'Create a loan', operationId: 'createLoan',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoanInput' } } } },
          responses: { 201: { description: 'Loan created', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' } } } } } } },
        },
      },
      '/api/loans/project/{projectId}': {
        get: { tags: ['Loans'], summary: 'Loans for a project', operationId: 'getLoansByProject', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of loans' } } },
      },
      '/api/loans/{id}': {
        get: { tags: ['Loans'], summary: 'Get a loan by ID', operationId: 'getLoan', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Loan found' }, 404: { description: 'Not found' } } },
        put: { tags: ['Loans'], summary: 'Update a loan', operationId: 'updateLoan', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Loans'], summary: 'Delete a loan', operationId: 'deleteLoan', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ INTEREST PAYMENTS ══════════════
      '/api/interest-payments': {
        get: { tags: ['Interest Payments'], summary: 'List all interest payments', operationId: 'listInterestPayments', responses: { 200: { description: 'Array of payments' } } },
        post: { tags: ['Interest Payments'], summary: 'Log an interest payment', operationId: 'createInterestPayment', responses: { 201: { description: 'Payment logged' } } },
      },
      '/api/interest-payments/loan/{loanId}': {
        get: { tags: ['Interest Payments'], summary: 'Payments for a loan', operationId: 'getInterestPaymentsByLoan', parameters: [{ name: 'loanId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of payments' } } },
      },
      '/api/interest-payments/{id}': {
        put: { tags: ['Interest Payments'], summary: 'Update a payment', operationId: 'updateInterestPayment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Interest Payments'], summary: 'Delete a payment', operationId: 'deleteInterestPayment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ EXPENSE CATEGORIES ═════════════
      '/api/expense-categories': {
        get: { tags: ['Expense Categories'], summary: 'List expense categories', operationId: 'listExpenseCategories', responses: { 200: { description: 'Array of categories' } } },
        post: { tags: ['Expense Categories'], summary: 'Create a category', operationId: 'createExpenseCategory', responses: { 201: { description: 'Category created' } } },
      },
      // ═══════════════════════ EXPENSES ═══════════════════════
      '/api/expenses': {
        get: { tags: ['Expenses'], summary: 'List all expenses', operationId: 'listExpenses', responses: { 200: { description: 'Array of expenses' } } },
        post: {
          tags: ['Expenses'], summary: 'Create an expense', operationId: 'createExpense',
          requestBody: { required: true, content: { 'application/json': { schema: {
            type: 'object', required: ['project_id', 'category_id', 'amount', 'expense_date'],
            properties: { project_id: { type: 'integer' }, category_id: { type: 'integer' }, description: { type: 'string' }, amount: { type: 'number' }, expense_date: { type: 'string', format: 'date' } },
          } } } },
          responses: { 201: { description: 'Expense created' } },
        },
      },
      '/api/expenses/project/{projectId}': {
        get: { tags: ['Expenses'], summary: 'Expenses for a project', operationId: 'getExpensesByProject', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of expenses' } } },
      },
      '/api/expenses/{id}': {
        put: { tags: ['Expenses'], summary: 'Update an expense', operationId: 'updateExpense', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Expenses'], summary: 'Delete an expense', operationId: 'deleteExpense', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ BILLING ════════════════════════
      '/api/billing': {
        get: { tags: ['Billing'], summary: 'List all invoices', operationId: 'listBilling', responses: { 200: { description: 'Array of invoices' } } },
        post: { tags: ['Billing'], summary: 'Create an invoice', operationId: 'createBilling', responses: { 201: { description: 'Invoice created' } } },
      },
      '/api/billing/project/{projectId}': {
        get: { tags: ['Billing'], summary: 'Invoices for a project', operationId: 'getBillingByProject', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of invoices' } } },
      },
      '/api/billing/{id}': {
        put: { tags: ['Billing'], summary: 'Update an invoice', operationId: 'updateBilling', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Updated' } } },
        delete: { tags: ['Billing'], summary: 'Delete an invoice', operationId: 'deleteBilling', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } },
      },
      // ═══════════════════════ PROJECT PROGRESS ═══════════════
      '/api/project-progress/project/{projectId}': {
        get: { tags: ['Project Progress'], summary: 'Progress history for a project', operationId: 'getProjectProgress', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of progress entries' } } },
        post: { tags: ['Project Progress'], summary: 'Log progress entry', operationId: 'createProjectProgress', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 201: { description: 'Progress logged' } } },
      },
      // ═══════════════════════ PROJECT TEAM ═══════════════════
      '/api/project-team/project/{projectId}': {
        get: { tags: ['Project Team'], summary: 'Team members for a project', operationId: 'getProjectTeam', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Array of team members' } } },
        post: { tags: ['Project Team'], summary: 'Assign a user to project team', operationId: 'addProjectTeamMember', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 201: { description: 'Member assigned' } } },
      },
      // ═══════════════════════ AUDIT LOG ══════════════════════
      '/api/audit-log': {
        get: { tags: ['Audit Log'], summary: 'List audit log entries', operationId: 'listAuditLog', responses: { 200: { description: 'Array of audit entries' } } },
      },
      // ═══════════════════════ DASHBOARD ══════════════════════
      '/api/dashboard/stats': {
        get: { tags: ['Dashboard'], summary: 'Aggregated system-wide statistics', operationId: 'getDashboardStats', responses: { 200: { description: 'Stats object with projects, workers, machines, costs, financial data' } } },
      },
      '/api/dashboard/budget-comparison': {
        get: { tags: ['Dashboard'], summary: 'Per-project budget vs actual cost comparison', operationId: 'getBudgetComparison', responses: { 200: { description: 'Array of budget comparison per project' } } },
      },
      '/api/dashboard/material-summary': {
        get: { tags: ['Dashboard'], summary: 'Material consumption summary across all projects', operationId: 'getMaterialSummary', responses: { 200: { description: 'Array of material summaries' } } },
      },
      '/api/dashboard/alerts': {
        get: { tags: ['Dashboard'], summary: 'System alerts — overdue bills, pending interest, over-budget projects', operationId: 'getDashboardAlerts', responses: { 200: { description: 'Object with overdueBills, pendingInterest, overBudget, delayedProjects, loanAlerts' } } },
      },
      '/api/dashboard/recent': {
        get: { tags: ['Dashboard'], summary: 'Recent projects and expenses', operationId: 'getDashboardRecent', responses: { 200: { description: 'Object with recentProjects and recentExpenses' } } },
      },
      // ═══════════════════════ RECYCLE BIN ════════════════════
      '/api/recycle-bin': {
        get: { tags: ['Recycle Bin'], summary: 'List soft-deleted projects', operationId: 'listRecycleBin', responses: { 200: { description: 'Array of deleted projects' } } },
      },
      '/api/recycle-bin/{id}/restore': {
        post: { tags: ['Recycle Bin'], summary: 'Restore a deleted project', operationId: 'restoreProject', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Project restored' } } },
      },
      '/api/recycle-bin/{id}': {
        delete: { tags: ['Recycle Bin'], summary: 'Permanently delete a project', operationId: 'permanentDeleteProject', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Permanently deleted' } } },
      },
      // ═══════════════════════ ADMIN ══════════════════════════
      '/api/admin/stats': {
        get: { tags: ['Admin'], summary: 'Admin-only system statistics', operationId: 'getAdminStats', responses: { 200: { description: 'Admin stats object' } } },
      },
      '/api/admin/users': {
        get: { tags: ['Admin'], summary: 'Admin user list with login details', operationId: 'getAdminUsers', responses: { 200: { description: 'Array of users with admin info' } } },
      },
      '/api/admin/users/{id}/toggle': {
        put: { tags: ['Admin'], summary: 'Toggle user active/inactive status', operationId: 'toggleUserStatus', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Status toggled' } } },
      },
      // ═══════════════════════ IMPORT ═════════════════════════
      '/api/import/template-info': {
        get: { tags: ['Import'], summary: 'Get Excel import template information', operationId: 'getImportTemplateInfo', responses: { 200: { description: 'Template structure info' } } },
      },
      '/api/import/project': {
        post: {
          tags: ['Import'], summary: 'Import project data from Excel file', operationId: 'importProject',
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'Excel (.xlsx) file' } } } } },
          },
          responses: {
            200: { description: 'Import result' },
            400: { description: 'No file or invalid format' },
          },
        },
      },
    },
  },
  apis: [], // All docs are inline above — no JSDoc scanning needed
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Construction ERP API Docs',
  customCss: `
    .swagger-ui .topbar { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); }
    .swagger-ui .topbar-wrapper .link { display: none; }
    .swagger-ui .info .title { color: #1e293b; }
  `,
  swaggerOptions: { persistAuthorization: true },
}));

// Expose raw OpenAPI spec
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─────────────────────────── DB connection ───────────────────────────
const db = require('./db');
let dbStatus = 'connecting';
db.query('SELECT 1')
  .then(() => { dbStatus = 'connected'; console.log('✅ MySQL Connected'); })
  .catch(err => { dbStatus = 'disconnected'; console.error('❌ MySQL Connection Error:', err.message); });

// ─────────────────────────── Public routes ───────────────────────────

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Construction ERP API',
    version: '1.0.0',
    description: 'Backend API for the Construction Project Management & Fund Monitor system.',
    docs:   `${req.protocol}://${req.get('host')}/api/docs`,
    health: `${req.protocol}://${req.get('host')}/api/health`,
    endpoints: {
      auth:             '/api/auth',
      users:            '/api/users',
      projects:         '/api/projects',
      dashboard:        '/api/dashboard',
      loans:            '/api/loans',
      investments:      '/api/investments',
      materials:        '/api/materials',
      machines:         '/api/machines',
      workers:          '/api/workers',
      expenses:         '/api/expenses',
      billing:          '/api/billing',
      importProject:    '/api/import/project',
    },
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  const healthy = dbStatus === 'connected';
  res.status(healthy ? 200 : 503).json({
    status:      healthy ? 'ok' : 'degraded',
    timestamp:   new Date().toISOString(),
    uptime:      Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database:    dbStatus,
  });
});

// Auth routes (public — no token needed)
app.use('/api/auth', require('./routes/auth'));

// ─────────────────────── Protected routes ────────────────────────────
const { authMiddleware } = require('./middleware/auth');
app.use('/api', authMiddleware);

app.use('/api/roles',             require('./routes/roles'));
app.use('/api/users',             require('./routes/users'));
app.use('/api/projects',          require('./routes/projects'));
app.use('/api/materials',         require('./routes/materials'));
app.use('/api/machines',          require('./routes/machines'));
app.use('/api/worker-roles',      require('./routes/workerRoles'));
app.use('/api/workers',           require('./routes/workers'));
app.use('/api/material-usage',    require('./routes/materialUsage'));
app.use('/api/manpower-usage',    require('./routes/manpowerUsage'));
app.use('/api/machine-usage',     require('./routes/machineUsage'));
app.use('/api/investors',         require('./routes/investors'));
app.use('/api/financiers',        require('./routes/financiers'));
app.use('/api/investments',       require('./routes/investments'));
app.use('/api/loans',             require('./routes/loans'));
app.use('/api/interest-payments', require('./routes/interestPayments'));
app.use('/api/expense-categories',require('./routes/expenseCategories'));
app.use('/api/expenses',          require('./routes/expenses'));
app.use('/api/billing',           require('./routes/billing'));
app.use('/api/project-progress',  require('./routes/projectProgress'));
app.use('/api/project-team',      require('./routes/projectTeam'));
app.use('/api/audit-log',         require('./routes/auditLog'));
app.use('/api/dashboard',         require('./routes/dashboard'));
app.use('/api/recycle-bin',       require('./routes/recycleBin'));
app.use('/api/admin',             require('./routes/admin'));
app.use('/api/import',            require('./routes/import'));

// ─────────────────────── Error handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────── Start server ────────────────────────────────
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📋 API docs available at http://localhost:${PORT}/api/docs`);
  console.log(`❤️  Health check at    http://localhost:${PORT}/api/health`);
});