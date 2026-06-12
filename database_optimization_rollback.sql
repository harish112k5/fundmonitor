-- Database Optimization Rollback Script

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Drop Foreign Keys
ALTER TABLE `workers` DROP FOREIGN KEY `fk_workers_role`;
ALTER TABLE `interest_payments` DROP FOREIGN KEY `fk_ip_loan`, DROP FOREIGN KEY `fk_ip_created_by`;
ALTER TABLE `project_loans` DROP FOREIGN KEY `fk_pl_project`, DROP FOREIGN KEY `fk_pl_financier`, DROP FOREIGN KEY `fk_pl_created_by`;
ALTER TABLE `project_investments` DROP FOREIGN KEY `fk_pi_project`, DROP FOREIGN KEY `fk_pi_investor`, DROP FOREIGN KEY `fk_pi_created_by`;
ALTER TABLE `project_progress` DROP FOREIGN KEY `fk_pp_project`, DROP FOREIGN KEY `fk_pp_recorded_by`;
ALTER TABLE `machine_usage` DROP FOREIGN KEY `fk_mcu_project`, DROP FOREIGN KEY `fk_mcu_machine`, DROP FOREIGN KEY `fk_mcu_recorded_by`;
ALTER TABLE `manpower_usage` DROP FOREIGN KEY `fk_mpu_project`, DROP FOREIGN KEY `fk_mpu_worker`, DROP FOREIGN KEY `fk_mpu_recorded_by`;
ALTER TABLE `material_usage` DROP FOREIGN KEY `fk_mu_project`, DROP FOREIGN KEY `fk_mu_material`, DROP FOREIGN KEY `fk_mu_recorded_by`;
ALTER TABLE `expenses` DROP FOREIGN KEY `fk_expenses_project`, DROP FOREIGN KEY `fk_expenses_category`, DROP FOREIGN KEY `fk_expenses_recorded_by`;
ALTER TABLE `billing` DROP FOREIGN KEY `fk_billing_project`, DROP FOREIGN KEY `fk_billing_created_by`;
ALTER TABLE `project_team` DROP FOREIGN KEY `fk_team_project`, DROP FOREIGN KEY `fk_team_user`;
ALTER TABLE `projects` DROP FOREIGN KEY `fk_projects_created_by`;
ALTER TABLE `users` DROP FOREIGN KEY `fk_users_role`;

-- 2. Drop Timestamps
ALTER TABLE `expense_categories` DROP COLUMN `created_at`, DROP COLUMN `updated_at`;
ALTER TABLE `financiers` DROP COLUMN `updated_at`;
ALTER TABLE `investors` DROP COLUMN `updated_at`;
ALTER TABLE `machines_master` DROP COLUMN `updated_at`;
ALTER TABLE `materials_master` DROP COLUMN `updated_at`;
ALTER TABLE `project_progress` DROP COLUMN `updated_at`;
ALTER TABLE `project_team` DROP COLUMN `updated_at`;
ALTER TABLE `roles` DROP COLUMN `created_at`, DROP COLUMN `updated_at`;
ALTER TABLE `worker_roles` DROP COLUMN `created_at`, DROP COLUMN `updated_at`;
ALTER TABLE `db_audit_log` DROP COLUMN `updated_at`;
ALTER TABLE `expenses` DROP COLUMN `updated_at`;
ALTER TABLE `interest_payments` DROP COLUMN `updated_at`;
ALTER TABLE `machine_usage` DROP COLUMN `updated_at`;
ALTER TABLE `manpower_usage` DROP COLUMN `updated_at`;
ALTER TABLE `material_usage` DROP COLUMN `updated_at`;
ALTER TABLE `project_investments` DROP COLUMN `updated_at`;
ALTER TABLE `project_loans` DROP COLUMN `updated_at`;
ALTER TABLE `workers` DROP COLUMN `updated_at`;

-- 3. Revert Monetary Columns (where appropriate to original size)
ALTER TABLE `machines_master` MODIFY COLUMN `hourly_rate` DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE `machine_usage` MODIFY COLUMN `hourly_rate` DECIMAL(10,2) NOT NULL;
ALTER TABLE `manpower_usage` MODIFY COLUMN `daily_rate` DECIMAL(8,2) NOT NULL;
ALTER TABLE `materials_master` MODIFY COLUMN `unit_price` DECIMAL(10,2) DEFAULT NULL, MODIFY COLUMN `total_purchased` DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE `material_usage` MODIFY COLUMN `unit_price` DECIMAL(10,2) NOT NULL;
ALTER TABLE `workers` MODIFY COLUMN `daily_rate` DECIMAL(8,2) DEFAULT NULL;
ALTER TABLE `worker_roles` MODIFY COLUMN `daily_rate` DECIMAL(8,2) DEFAULT NULL;

SET FOREIGN_KEY_CHECKS = 1;
