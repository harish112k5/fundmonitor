-- Database Optimization Migration Script
-- Ensure you have a backup before running this script.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Standardize Monetary Columns to DECIMAL(15,2)
ALTER TABLE `machines_master` MODIFY COLUMN `hourly_rate` DECIMAL(15,2) DEFAULT NULL;
ALTER TABLE `machine_usage` MODIFY COLUMN `hourly_rate` DECIMAL(15,2) NOT NULL;
ALTER TABLE `manpower_usage` MODIFY COLUMN `daily_rate` DECIMAL(15,2) NOT NULL;
ALTER TABLE `materials_master` MODIFY COLUMN `unit_price` DECIMAL(15,2) DEFAULT NULL, MODIFY COLUMN `total_purchased` DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE `material_usage` MODIFY COLUMN `unit_price` DECIMAL(15,2) NOT NULL;
ALTER TABLE `workers` MODIFY COLUMN `daily_rate` DECIMAL(15,2) DEFAULT NULL;
ALTER TABLE `worker_roles` MODIFY COLUMN `daily_rate` DECIMAL(15,2) DEFAULT NULL;

-- 2. Add Missing TIMESTAMP columns
ALTER TABLE `expense_categories` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `financiers` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `investors` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `machines_master` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `materials_master` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `project_progress` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `project_team` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `roles` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `worker_roles` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `db_audit_log` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `expenses` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `interest_payments` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `machine_usage` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `manpower_usage` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `material_usage` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `project_investments` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `project_loans` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `workers` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

-- 3. Add Foreign Keys with CASCADE / SET NULL (Indexing is auto-created for FKs)

-- Users -> Roles
ALTER TABLE `users` ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Projects -> Users (Created By)
ALTER TABLE `projects` ADD CONSTRAINT `fk_projects_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Project Team
ALTER TABLE `project_team` ADD CONSTRAINT `fk_team_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `project_team` ADD CONSTRAINT `fk_team_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Billing
ALTER TABLE `billing` ADD CONSTRAINT `fk_billing_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `billing` ADD CONSTRAINT `fk_billing_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Expenses
ALTER TABLE `expenses` ADD CONSTRAINT `fk_expenses_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `expenses` ADD CONSTRAINT `fk_expenses_category` FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `expenses` ADD CONSTRAINT `fk_expenses_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Material Usage
ALTER TABLE `material_usage` ADD CONSTRAINT `fk_mu_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `material_usage` ADD CONSTRAINT `fk_mu_material` FOREIGN KEY (`material_id`) REFERENCES `materials_master`(`material_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `material_usage` ADD CONSTRAINT `fk_mu_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Manpower Usage
ALTER TABLE `manpower_usage` ADD CONSTRAINT `fk_mpu_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `manpower_usage` ADD CONSTRAINT `fk_mpu_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers`(`worker_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `manpower_usage` ADD CONSTRAINT `fk_mpu_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Machine Usage
ALTER TABLE `machine_usage` ADD CONSTRAINT `fk_mcu_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `machine_usage` ADD CONSTRAINT `fk_mcu_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines_master`(`machine_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `machine_usage` ADD CONSTRAINT `fk_mcu_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Project Progress
ALTER TABLE `project_progress` ADD CONSTRAINT `fk_pp_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `project_progress` ADD CONSTRAINT `fk_pp_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Investments
ALTER TABLE `project_investments` ADD CONSTRAINT `fk_pi_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `project_investments` ADD CONSTRAINT `fk_pi_investor` FOREIGN KEY (`investor_id`) REFERENCES `investors`(`investor_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `project_investments` ADD CONSTRAINT `fk_pi_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Loans & Interest
ALTER TABLE `project_loans` ADD CONSTRAINT `fk_pl_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`project_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `project_loans` ADD CONSTRAINT `fk_pl_financier` FOREIGN KEY (`financier_id`) REFERENCES `financiers`(`financier_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `project_loans` ADD CONSTRAINT `fk_pl_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `interest_payments` ADD CONSTRAINT `fk_ip_loan` FOREIGN KEY (`loan_id`) REFERENCES `project_loans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `interest_payments` ADD CONSTRAINT `fk_ip_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Workers -> Worker Roles
ALTER TABLE `workers` ADD CONSTRAINT `fk_workers_role` FOREIGN KEY (`worker_role_id`) REFERENCES `worker_roles`(`worker_role_id`) ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
