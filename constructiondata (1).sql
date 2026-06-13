-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 12, 2026 at 07:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `constructiondata`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_log`
--

CREATE TABLE `activity_log` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `table_name` varchar(50) NOT NULL,
  `record_id` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_log`
--

INSERT INTO `activity_log` (`log_id`, `user_id`, `action`, `table_name`, `record_id`, `ip_address`, `created_at`) VALUES
(1, 16, 'BLOCK_USER', 'users', '36', '::1', '2026-05-30 15:19:08'),
(2, 16, 'BLOCK_USER', 'users', '37', '::1', '2026-05-30 15:21:36'),
(3, 16, 'UNBLOCK_USER', 'users', '37', '::1', '2026-05-30 15:35:59'),
(4, 16, 'UNBLOCK_USER', 'users', '36', '::1', '2026-05-30 15:36:00'),
(5, 16, 'BLOCK_USER', 'users', '37', '::1', '2026-05-30 15:36:03'),
(6, 16, 'UNBLOCK_USER', 'users', '37', '::1', '2026-05-30 15:37:23'),
(7, 16, 'BLOCK_USER', 'users', '37', '::1', '2026-05-30 16:00:57'),
(8, 16, 'UNBLOCK_USER', 'users', '37', '::1', '2026-05-30 16:00:59'),
(9, 16, 'BLOCK_USER', 'users', '37', '::1', '2026-06-01 12:35:51'),
(10, 16, 'UNBLOCK_USER', 'users', '37', '::1', '2026-06-01 12:36:24'),
(11, 16, 'ASSIGN_PROJECT', 'project_team', '6→31', '::1', '2026-06-06 11:48:07'),
(12, 16, 'ASSIGN_PROJECT', 'project_team', '6→4', '::1', '2026-06-06 11:48:19'),
(13, 16, 'ASSIGN_PROJECT', 'project_team', '37→31', '::1', '2026-06-06 11:49:18'),
(14, 16, 'BLOCK_USER', 'users', '26', '::1', '2026-06-06 12:27:17'),
(15, 16, 'ASSIGN_PROJECT', 'project_team', '39→31', '::1', '2026-06-11 16:49:33'),
(16, 16, 'ASSIGN_PROJECT', 'project_team', '35→31', '::1', '2026-06-11 23:33:31'),
(17, 16, 'ASSIGN_PROJECT', 'project_team', '41→31', '::1', '2026-06-11 23:43:46'),
(18, 16, 'UNASSIGN_PROJECT', 'project_team', '41←31', '::1', '2026-06-11 23:43:55'),
(19, 16, 'ASSIGN_PROJECT', 'project_team', '41→31', '::1', '2026-06-11 23:44:05'),
(20, 16, 'ASSIGN_PROJECT', 'project_team', '41→1', '::1', '2026-06-12 11:59:53');

-- --------------------------------------------------------

--
-- Table structure for table `billing`
--

CREATE TABLE `billing` (
  `billing_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('draft','sent','paid','overdue') DEFAULT 'draft',
  `billing_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `billable_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'Work completed, eligible to raise invoice',
  `submitted_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'Amount in RA Bill sent to client/government',
  `certified_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'Amount officially approved by client/govt engineer',
  `payment_received` decimal(15,2) DEFAULT 0.00 COMMENT 'Amount actually credited to bank',
  `mb_reference` varchar(100) DEFAULT NULL COMMENT 'Measurement Book reference number',
  `billing_stage` enum('BILLABLE','SUBMITTED','CERTIFIED','PAYMENT_RECEIVED','PARTIALLY_PAID') DEFAULT 'BILLABLE' COMMENT 'Current stage in the billing lifecycle',
  `certified_date` date DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `rejection_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'Amount rejected/deducted by govt during certification',
  `rejection_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `billing`
--

INSERT INTO `billing` (`billing_id`, `project_id`, `invoice_number`, `amount`, `status`, `billing_date`, `due_date`, `created_by`, `created_at`, `updated_at`, `billable_amount`, `submitted_amount`, `certified_amount`, `payment_received`, `mb_reference`, `billing_stage`, `certified_date`, `payment_date`, `rejection_amount`, `rejection_reason`) VALUES
(14, 27, 'paid', 10000.00, 'draft', '2026-06-01', '2026-06-10', 1, '2026-06-01 07:29:17', '2026-06-11 17:08:21', 10000.00, 10000.00, 10000.00, 0.00, NULL, 'BILLABLE', NULL, NULL, 0.00, NULL),
(15, 27, 'sent', 20000.00, 'draft', '2026-07-01', '2026-07-10', 1, '2026-06-01 07:29:17', '2026-06-11 17:08:21', 20000.00, 20000.00, 20000.00, 0.00, NULL, 'BILLABLE', NULL, NULL, 0.00, NULL),
(18, 31, 'INV-SKY-001', 100000.00, 'paid', '2026-07-01', '2026-07-10', 16, '2026-06-01 07:49:23', '2026-06-11 17:08:21', 100000.00, 100000.00, 100000.00, 100000.00, NULL, 'PAYMENT_RECEIVED', NULL, NULL, 0.00, NULL),
(19, 31, 'INV-SKY-002', 50000.00, 'sent', '2026-07-20', '2026-07-30', 16, '2026-06-01 07:49:23', '2026-06-11 17:08:21', 50000.00, 50000.00, 50000.00, 0.00, NULL, 'SUBMITTED', NULL, NULL, 0.00, NULL),
(20, 31, 'inv-00', 68686.00, 'paid', '2026-06-11', '2026-06-13', NULL, '2026-06-11 10:04:18', '2026-06-11 17:08:21', 68686.00, 68686.00, 68686.00, 68686.00, NULL, 'PAYMENT_RECEIVED', NULL, NULL, 0.00, NULL),
(21, 14, 'sdf-099', 123455667.00, '', '2026-06-11', '2026-06-23', 16, '2026-06-11 17:12:21', NULL, 123455667.00, 12345.00, 12345.00, 12345.00, 'hi-90909', 'BILLABLE', '2026-06-11', '2026-06-11', 0.00, NULL),
(22, 1, 'asdf-00', 999.00, '', '2026-06-12', '2026-06-18', 16, '2026-06-12 06:37:22', NULL, 999.00, 999.00, 999.00, 998.00, 'mb-30/0/30', 'PAYMENT_RECEIVED', '2026-06-13', '2026-06-19', 0.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `budget_details`
--

CREATE TABLE `budget_details` (
  `detail_id` int(11) NOT NULL,
  `budget_id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `budget_details`
--

INSERT INTO `budget_details` (`detail_id`, `budget_id`, `category`, `allocated_amount`, `notes`, `created_at`) VALUES
(1, 1, 'Materials', 25000.00, NULL, '2026-06-03 08:01:04'),
(2, 1, 'Labor', 10000.00, NULL, '2026-06-03 08:01:04'),
(3, 1, 'Equipment', 400000.00, NULL, '2026-06-03 08:01:04'),
(4, 1, 'Other Expenses', 25000.00, NULL, '2026-06-03 08:01:04');

-- --------------------------------------------------------

--
-- Table structure for table `budget_master`
--

CREATE TABLE `budget_master` (
  `budget_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `budget_name` varchar(150) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('draft','approved','active','closed') DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `budget_master`
--

INSERT INTO `budget_master` (`budget_id`, `project_id`, `budget_name`, `total_amount`, `start_date`, `end_date`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 31, 'budget 1 ', 2500000.00, NULL, NULL, 'active', NULL, '2026-06-03 08:01:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cash_flow_statement`
--

CREATE TABLE `cash_flow_statement` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `period` varchar(50) NOT NULL,
  `operating_cash_flow` decimal(15,2) DEFAULT 0.00,
  `investing_cash_flow` decimal(15,2) DEFAULT 0.00,
  `financing_cash_flow` decimal(15,2) DEFAULT 0.00,
  `net_cash_flow` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `corporate_metrics`
--

CREATE TABLE `corporate_metrics` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `market_price_per_share` decimal(15,2) DEFAULT 100.00,
  `common_shares_outstanding` int(11) DEFAULT 10000,
  `preferred_dividends` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `db_audit_log`
--

CREATE TABLE `db_audit_log` (
  `id` bigint(20) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `record_id` int(11) NOT NULL,
  `action` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `changed_by` int(11) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dividend_payouts`
--

CREATE TABLE `dividend_payouts` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `dividend_per_share` decimal(10,2) NOT NULL,
  `payout_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expense_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `expense_date` date NOT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`expense_id`, `project_id`, `category_id`, `amount`, `description`, `expense_date`, `recorded_by`, `created_at`) VALUES
(19, 16, 3, 35000.00, 'Site office setup — furniture, electricity | Vendor: Madurai Office Supplies | Invoice: INV-MOS-001 | Status: paid', '2025-01-20', 34, '2026-05-30 09:29:24'),
(20, 16, 4, 18500.00, 'Cement and steel transportation from depot | Vendor: Sri Vel Transport | Invoice: INV-SVT-008 | Status: paid', '2025-03-15', 34, '2026-05-30 09:29:27'),
(21, 17, 1, 42000.00, 'Helmets, safety nets, harness sets for bridge work | Vendor: Industrial Safety Solutions | Invoice: INV-ISS-014 | Status: paid', '2025-02-10', 34, '2026-05-30 09:29:31'),
(22, 17, 5, 12000.00, 'Road cutting permission and district inspection fee | Vendor: Dindigul District Office | Invoice: RCPT-DDO-002 | Status: paid', '2025-03-01', 34, '2026-05-30 09:29:34'),
(23, 18, 2, 55000.00, 'Shuttering contractor payment for Level 1 | Vendor: Balaji Shuttering Works | Invoice: INV-BSW-003 | Status: partial', '2024-12-10', 34, '2026-05-30 09:29:38'),
(24, 16, 3, 28000.00, 'Workmen compensation insurance premium | Vendor: New India Assurance Co | Invoice: POL-NIA-2025-001 | Status: paid', '2025-01-10', 34, '2026-05-30 09:29:41'),
(25, 27, 1, 1000.00, 'Desc 1', '2026-06-01', 1, '2026-06-01 07:29:17'),
(26, 27, 1, 2000.00, 'Desc 2', '2026-06-02', 1, '2026-06-01 07:29:17'),
(27, 27, 1, 500.00, 'Desc 3', '2026-06-03', 1, '2026-06-01 07:29:17'),
(33, 31, 1, 5000.00, 'Fencing and boards', '2026-07-05', 16, '2026-06-01 07:49:23'),
(34, 31, 2, 2500.00, 'Material delivery', '2026-07-11', 16, '2026-06-01 07:49:23');

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expense_categories`
--

INSERT INTO `expense_categories` (`category_id`, `category_name`) VALUES
(1, 'Equipment'),
(2, 'Labor'),
(5, 'Miscellaneous'),
(3, 'Overhead'),
(4, 'Transport');

-- --------------------------------------------------------

--
-- Table structure for table `financial_forecasts`
--

CREATE TABLE `financial_forecasts` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `forecast_type` enum('revenue','cost','cash_flow') NOT NULL,
  `forecast_period` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `scenario` enum('optimistic','realistic','pessimistic') DEFAULT 'realistic',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_goals`
--

CREATE TABLE `financial_goals` (
  `goal_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `target_roi` decimal(5,2) DEFAULT NULL,
  `target_profit_margin` decimal(5,2) DEFAULT NULL,
  `target_revenue` decimal(15,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_parameters`
--

CREATE TABLE `financial_parameters` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `discount_rate` decimal(5,2) DEFAULT 10.00,
  `tax_rate` decimal(5,2) DEFAULT 18.00,
  `inflation_rate` decimal(5,2) DEFAULT 6.00,
  `currency` varchar(10) DEFAULT 'INR',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_ratios`
--

CREATE TABLE `financial_ratios` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `period` varchar(50) NOT NULL,
  `roi` decimal(8,2) DEFAULT NULL,
  `irr` decimal(8,2) DEFAULT NULL,
  `npv` decimal(15,2) DEFAULT NULL,
  `net_profit_margin` decimal(8,2) DEFAULT NULL,
  `current_ratio` decimal(8,2) DEFAULT NULL,
  `debt_to_equity` decimal(8,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_statements`
--

CREATE TABLE `financial_statements` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `statement_type` enum('income_statement','balance_sheet','trial_balance') NOT NULL,
  `period` varchar(50) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data`)),
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financiers`
--

CREATE TABLE `financiers` (
  `financier_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `company` varchar(200) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'Bank',
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `financiers`
--

INSERT INTO `financiers` (`financier_id`, `name`, `phone`, `email`, `created_at`, `company`, `type`, `address`, `notes`) VALUES
(1, 'Indian Bank — SME Branch', '0452-2345678', 'sme@indianbank.in', '2026-04-11 09:58:01', NULL, 'Bank', NULL, NULL),
(2, 'HDFC Project Finance', '1800-202-6161', 'projects@hdfc.com', '2026-04-11 09:58:01', NULL, 'Bank', NULL, NULL),
(5, 'Indian Bank — Madurai Branch', '0452-2345678', 'madurai.main@indianbank.in', '2026-05-30 09:30:13', NULL, 'Bank', NULL, NULL),
(6, 'HDFC Bank — Dindigul', '0451-2225566', 'dindigul.smecell@hdfc.com', '2026-05-30 09:30:17', NULL, 'Bank', NULL, NULL),
(7, 'SUDHARSAN', '234567890', 'S@G.COM', '2026-06-06 07:21:06', 'FICON', 'Bank', 'test', 'testtt');

-- --------------------------------------------------------

--
-- Table structure for table `fund_allocation`
--

CREATE TABLE `fund_allocation` (
  `allocation_id` int(11) NOT NULL,
  `receipt_id` int(11) NOT NULL,
  `schedule_id` int(11) NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL,
  `allocated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fund_allocation`
--

INSERT INTO `fund_allocation` (`allocation_id`, `receipt_id`, `schedule_id`, `allocated_amount`, `allocated_at`) VALUES
(1, 3, 1, 110000.00, '2026-06-04 07:46:08'),
(2, 4, 6, 700000.00, '2026-06-04 07:48:32'),
(3, 5, 7, 700000.00, '2026-06-04 07:48:36'),
(4, 6, 8, 700000.00, '2026-06-04 07:48:40'),
(5, 7, 9, 700000.00, '2026-06-04 07:48:44'),
(6, 9, 2, 110000.00, '2026-06-04 09:07:34');

-- --------------------------------------------------------

--
-- Table structure for table `interest_payments`
--

CREATE TABLE `interest_payments` (
  `id` int(11) NOT NULL,
  `loan_id` int(11) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` varchar(30) DEFAULT 'Pending',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `due_date` date DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  `delay_days` int(11) DEFAULT 0,
  `penalty` decimal(15,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interest_payments`
--

INSERT INTO `interest_payments` (`id`, `loan_id`, `payment_date`, `amount`, `status`, `created_by`, `created_at`, `due_date`, `paid_date`, `delay_days`, `penalty`, `notes`) VALUES
(14, 6, '2025-02-15', 28750.00, 'Paid', 34, '2026-05-30 09:30:37', NULL, '2026-06-06', 0, 0.00, NULL),
(15, 6, '2025-03-18', 28750.00, 'Paid', 34, '2026-05-30 09:30:41', NULL, '2026-06-06', 0, 0.00, NULL),
(16, 6, '2025-04-30', 28750.00, 'pending', 34, '2026-05-30 09:30:44', NULL, NULL, 0, 0.00, NULL),
(17, 7, '2025-03-01', 45000.00, 'paid', 34, '2026-05-30 09:30:48', NULL, NULL, 0, 0.00, NULL),
(18, 7, '2025-04-30', 45000.00, 'pending', 34, '2026-05-30 09:30:51', NULL, NULL, 0, 0.00, NULL),
(19, 9, '0000-00-00', 77777.00, 'Paid', NULL, '2026-06-06 07:56:02', '2026-06-06', '2026-06-06', 0, 0.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `investment_proposal`
--

CREATE TABLE `investment_proposal` (
  `proposal_id` int(11) NOT NULL,
  `investor_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `proposed_amount` decimal(15,2) NOT NULL,
  `expected_roi_percent` decimal(5,2) DEFAULT 15.00,
  `investment_duration_months` int(11) DEFAULT 36,
  `risk_level` enum('Low','Medium','High') DEFAULT 'Medium',
  `status` enum('Pending','Accepted','Rejected','Counter') DEFAULT 'Pending',
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investment_proposal`
--

INSERT INTO `investment_proposal` (`proposal_id`, `investor_id`, `project_id`, `proposed_amount`, `expected_roi_percent`, `investment_duration_months`, `risk_level`, `status`, `expiry_date`, `created_at`, `created_by`) VALUES
(1, 2, 31, 550000.00, 15.00, 36, 'Medium', '', NULL, '2026-06-04 07:20:43', NULL),
(2, 3, 16, 2800000.00, 15.00, 36, 'Medium', '', NULL, '2026-06-04 07:47:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `investors`
--

CREATE TABLE `investors` (
  `investor_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `pan` varchar(50) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'Individual',
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `gst` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `investors`
--

INSERT INTO `investors` (`investor_id`, `name`, `phone`, `email`, `pan`, `type`, `address`, `notes`, `created_at`, `gst`) VALUES
(1, 'praveen', '9360539078', 'praveen200529@gmail.com', 'ABC123HH', 'Individual', NULL, NULL, '2026-06-04 07:14:49', NULL),
(2, 'ficon', '9360339078', 'ficon@gmail.com', 'HHTP123h', 'Individual', NULL, NULL, '2026-06-04 07:20:23', NULL),
(3, 'sudharsan', '1234567890', 'sudharsan@gmail.com', 'ABC123HH', 'Individual', NULL, NULL, '2026-06-04 07:47:02', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `investors_legacy`
--

CREATE TABLE `investors_legacy` (
  `investor_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investors_legacy`
--

INSERT INTO `investors_legacy` (`investor_id`, `name`, `phone`, `email`, `created_at`) VALUES
(1, 'Rajesh Mehta', '9900001111', 'rajesh@mehtagroup.in', '2026-04-11 09:57:46'),
(2, 'Anitha Constructions Pvt Ltd', '9900002222', 'anitha@acpl.in', '2026-04-11 09:57:46'),
(3, 'Tamil Nadu Infra Fund', '9900003333', 'fund@tninfra.gov.in', '2026-04-11 09:57:46'),
(7, 'Rajendran Pillai', '9443112233', 'rajendran.p@gmail.com', '2026-05-30 09:30:03'),
(8, 'Karthika Ventures Pvt Ltd', '9843221100', 'finance@karthikaventures.com', '2026-05-30 09:30:06'),
(9, 'Murugesan Nadar', '9876001122', 'murugesan.nadar@yahoo.com', '2026-05-30 09:30:10');

-- --------------------------------------------------------

--
-- Table structure for table `investor_activity_log`
--

CREATE TABLE `investor_activity_log` (
  `log_id` int(11) NOT NULL,
  `investor_id` int(11) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investor_alerts`
--

CREATE TABLE `investor_alerts` (
  `alert_id` int(11) NOT NULL,
  `investor_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `alert_type` varchar(100) NOT NULL,
  `severity` enum('Critical','High','Medium','Low') NOT NULL,
  `message` text NOT NULL,
  `is_resolved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investor_allocation_priority`
--

CREATE TABLE `investor_allocation_priority` (
  `priority_id` int(11) NOT NULL,
  `investor_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `priority_level` enum('High','Medium','Low','Custom') DEFAULT 'Medium',
  `custom_priority_score` int(11) DEFAULT 50,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investor_basic_info`
--

CREATE TABLE `investor_basic_info` (
  `investor_id` int(11) NOT NULL,
  `investor_type` enum('Individual','Organization') NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `alt_contact` varchar(255) DEFAULT NULL,
  `category` enum('Individual','HNI','Corporate','Bank','Insurance','Other') DEFAULT 'Other',
  `pan_id` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `bank_details` text DEFAULT NULL,
  `kyc_status` enum('Pending','Verified','Rejected') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investor_basic_info`
--

INSERT INTO `investor_basic_info` (`investor_id`, `investor_type`, `name`, `email`, `phone`, `alt_contact`, `category`, `pan_id`, `address`, `bank_details`, `kyc_status`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'Individual', 'praveen', 'praveen200529@gmail.com', '9360539078', NULL, 'Other', 'ABC123HH', NULL, NULL, 'Pending', '2026-06-04 07:14:49', '2026-06-04 07:14:49', NULL),
(2, 'Individual', 'ficon', 'ficon@gmail.com', '9360339078', NULL, 'Other', 'HHTP123h', NULL, NULL, 'Pending', '2026-06-04 07:20:23', '2026-06-04 07:20:23', NULL),
(3, 'Individual', 'sudharsan', 'sudharsan@gmail.com', '1234567890', NULL, 'Other', 'ABC123HH', NULL, NULL, 'Pending', '2026-06-04 07:47:02', '2026-06-04 07:47:02', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `investor_commitment`
--

CREATE TABLE `investor_commitment` (
  `commitment_id` int(11) NOT NULL,
  `investor_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `proposal_id` int(11) DEFAULT NULL,
  `total_committed_amount` decimal(15,2) NOT NULL,
  `status` enum('Active','Completed','Suspended') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investor_commitment`
--

INSERT INTO `investor_commitment` (`commitment_id`, `investor_id`, `project_id`, `proposal_id`, `total_committed_amount`, `status`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 2, 31, 1, 550000.00, 'Active', '2026-06-04 07:20:43', '2026-06-04 07:20:43', NULL),
(2, 3, 16, 2, 2800000.00, 'Active', '2026-06-04 07:47:34', '2026-06-04 07:47:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `investor_funding_schedule`
--

CREATE TABLE `investor_funding_schedule` (
  `schedule_id` int(11) NOT NULL,
  `commitment_id` int(11) NOT NULL,
  `installment_number` int(11) NOT NULL,
  `scheduled_amount` decimal(15,2) NOT NULL,
  `scheduled_due_date` date NOT NULL,
  `status` enum('Pending','Partially Received','Fully Received') DEFAULT 'Pending',
  `payment_method_preference` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investor_funding_schedule`
--

INSERT INTO `investor_funding_schedule` (`schedule_id`, `commitment_id`, `installment_number`, `scheduled_amount`, `scheduled_due_date`, `status`, `payment_method_preference`, `notes`, `created_at`) VALUES
(1, 1, 1, 110000.00, '2026-07-04', 'Fully Received', NULL, NULL, '2026-06-04 07:20:55'),
(2, 1, 2, 110000.00, '2026-08-04', 'Fully Received', NULL, NULL, '2026-06-04 07:20:55'),
(3, 1, 3, 110000.00, '2026-09-04', 'Pending', NULL, NULL, '2026-06-04 07:20:55'),
(4, 1, 4, 110000.00, '2026-10-04', 'Pending', NULL, NULL, '2026-06-04 07:20:55'),
(5, 1, 5, 110000.00, '2026-11-04', 'Pending', NULL, NULL, '2026-06-04 07:20:55'),
(6, 2, 1, 700000.00, '2026-07-04', 'Fully Received', NULL, NULL, '2026-06-04 07:47:54'),
(7, 2, 2, 700000.00, '2026-08-04', 'Fully Received', NULL, NULL, '2026-06-04 07:47:54'),
(8, 2, 3, 700000.00, '2026-09-04', 'Fully Received', NULL, NULL, '2026-06-04 07:47:54'),
(9, 2, 4, 700000.00, '2026-10-04', 'Fully Received', NULL, NULL, '2026-06-04 07:47:54');

-- --------------------------------------------------------

--
-- Table structure for table `investor_fund_receipt`
--

CREATE TABLE `investor_fund_receipt` (
  `receipt_id` int(11) NOT NULL,
  `investor_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `received_amount` decimal(15,2) NOT NULL,
  `received_date` date NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `transaction_reference` varchar(100) DEFAULT NULL,
  `allocation_method` enum('FIFO','Manual','Priority') NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investor_fund_receipt`
--

INSERT INTO `investor_fund_receipt` (`receipt_id`, `investor_id`, `project_id`, `received_amount`, `received_date`, `payment_method`, `transaction_reference`, `allocation_method`, `notes`, `created_at`, `created_by`) VALUES
(1, 2, 31, 1000000.00, '2026-06-04', 'Bank Transfer', 'TXN123', 'Priority', NULL, '2026-06-04 07:22:07', NULL),
(2, 2, 31, 50000.00, '2026-06-04', 'Bank Transfer', '', 'Priority', NULL, '2026-06-04 07:42:13', NULL),
(3, 2, 31, 110000.00, '2026-06-04', 'Online', NULL, 'Manual', NULL, '2026-06-04 07:46:08', NULL),
(4, 3, 16, 700000.00, '2026-06-04', 'Online', NULL, 'Manual', NULL, '2026-06-04 07:48:32', NULL),
(5, 3, 16, 700000.00, '2026-06-04', 'Online', NULL, 'Manual', NULL, '2026-06-04 07:48:36', NULL),
(6, 3, 16, 700000.00, '2026-06-04', 'Online', NULL, 'Manual', NULL, '2026-06-04 07:48:40', NULL),
(7, 3, 16, 700000.00, '2026-06-04', 'Online', NULL, 'Manual', NULL, '2026-06-04 07:48:44', NULL),
(8, 3, 16, 400000.00, '2026-06-04', 'Bank Transfer', '', 'FIFO', NULL, '2026-06-04 07:49:39', NULL),
(9, 2, 31, 110000.00, '2026-06-04', 'Online', NULL, 'Manual', NULL, '2026-06-04 09:07:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `investor_project_assignment`
--

CREATE TABLE `investor_project_assignment` (
  `assignment_id` int(11) NOT NULL,
  `investor_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investor_project_assignment`
--

INSERT INTO `investor_project_assignment` (`assignment_id`, `investor_id`, `project_id`, `assigned_at`, `assigned_by`) VALUES
(1, 2, 31, '2026-06-04 07:20:28', NULL),
(2, 3, 16, '2026-06-04 07:47:10', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `investor_returns`
--

CREATE TABLE `investor_returns` (
  `return_id` int(11) NOT NULL,
  `investor_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `return_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investor_returns`
--

INSERT INTO `investor_returns` (`return_id`, `investor_id`, `project_id`, `amount`, `return_date`, `notes`, `created_at`) VALUES
(1, 2, 31, 500000.00, '2026-06-04', 'Manual return', '2026-06-04 08:48:00');

-- --------------------------------------------------------

--
-- Table structure for table `machines_master`
--

CREATE TABLE `machines_master` (
  `machine_id` int(11) NOT NULL,
  `machine_name` varchar(100) NOT NULL,
  `machine_type` varchar(100) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `ownership_type` enum('owned','rented') DEFAULT 'owned',
  `status` enum('available','in_use','maintenance') DEFAULT 'available',
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `machines_master`
--

INSERT INTO `machines_master` (`machine_id`, `machine_name`, `machine_type`, `hourly_rate`, `ownership_type`, `status`, `is_deleted`, `created_at`) VALUES
(1, 'JCB Backhoe Loader', 'Excavator', 1800.00, 'rented', 'in_use', 0, '2026-04-11 09:42:04'),
(2, 'Concrete Mixer 500L', 'Mixer', 450.00, 'owned', 'in_use', 0, '2026-04-11 09:42:04'),
(3, 'Tower Crane TC-5028', 'Crane', 3500.00, 'rented', 'in_use', 0, '2026-04-11 09:42:04'),
(5, 'Concrete Vibrator', 'Vibrator', 200.00, 'owned', 'available', 0, '2026-04-11 09:42:04'),
(6, 'Transit Mixer Truck', 'Transport', 2200.00, 'rented', 'maintenance', 0, '2026-04-11 09:42:04'),
(13, 'road roller', 'ongoing work', 1000.00, 'owned', 'available', 0, '2026-04-18 10:15:49'),
(14, 'test', 'test', 0.00, 'owned', 'available', 0, '2026-04-18 10:16:39'),
(15, 'test2', 'test2', 1000.00, 'rented', 'available', 1, '2026-04-18 10:23:26'),
(21, 'JCB 3DX Backhoe Loader', 'Earthwork', 1800.00, 'rented', 'available', 0, '2026-05-30 09:28:04'),
(22, 'Transit Mixer (6 CuM)', 'Concrete', 1200.00, 'rented', 'available', 0, '2026-05-30 09:28:07'),
(23, 'Tower Crane (50T)', 'Lifting', 2500.00, 'rented', 'available', 0, '2026-05-30 09:28:11'),
(24, 'Plate Compactor', 'Compaction', 450.00, 'rented', 'available', 0, '2026-05-30 09:28:14'),
(25, 'Concrete Vibrator (2HP)', 'Concrete', 200.00, 'rented', 'available', 0, '2026-05-30 09:28:18'),
(26, 'Bar Bending Machine', 'Fabrication', 350.00, 'rented', 'available', 0, '2026-05-30 09:28:21');

-- --------------------------------------------------------

--
-- Table structure for table `machine_usage`
--

CREATE TABLE `machine_usage` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `machine_id` int(11) NOT NULL,
  `usage_hours` decimal(8,2) NOT NULL COMMENT 'DECIMAL supports fractional hours e.g. 4.5',
  `hourly_rate` decimal(10,2) NOT NULL COMMENT 'snapshot rate at time of entry',
  `usage_date` date NOT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `operator_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `machine_usage`
--

INSERT INTO `machine_usage` (`id`, `project_id`, `machine_id`, `usage_hours`, `hourly_rate`, `usage_date`, `recorded_by`, `created_at`, `operator_name`) VALUES
(18, 1, 1, 10.00, 1800.00, '2026-05-27', 1, '2026-05-27 11:49:06', 'Ramesh'),
(19, 12, 1, 3.00, 1800.00, '2026-05-27', 16, '2026-05-28 07:58:23', NULL),
(20, 16, 21, 48.00, 1800.00, '2025-02-20', 30, '2026-05-30 09:29:04', 'Balu Operator'),
(21, 16, 22, 36.00, 1200.00, '2025-03-05', 30, '2026-05-30 09:29:08', 'Selvam Driver'),
(22, 17, 24, 24.00, 450.00, '2025-04-10', 30, '2026-05-30 09:29:12', 'Durai G'),
(23, 17, 25, 18.00, 200.00, '2025-04-18', 30, '2026-05-30 09:29:16', 'Anbu C'),
(24, 18, 26, 20.00, 350.00, '2024-11-25', 30, '2026-05-30 09:29:20', 'Suresh T'),
(25, 27, 26, 10.00, 500.00, '2026-06-01', 1, '2026-06-01 07:29:17', 'Op A'),
(26, 27, 2, 8.00, 600.00, '2026-06-02', 1, '2026-06-01 07:29:17', 'Op B'),
(30, 31, 26, 40.00, 150.00, '2026-07-18', 16, '2026-06-01 07:49:23', 'Operator John'),
(31, 31, 13, 6.00, 1000.00, '2026-06-11', NULL, '2026-06-11 11:36:57', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `manpower_usage`
--

CREATE TABLE `manpower_usage` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL COMMENT 'FK to workers master - fixes BCNF violation',
  `work_days` decimal(5,1) NOT NULL COMMENT 'DECIMAL supports half-days e.g. 0.5',
  `daily_rate` decimal(8,2) NOT NULL COMMENT 'snapshot rate at time of entry',
  `work_date` date NOT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `manpower_usage`
--

INSERT INTO `manpower_usage` (`id`, `project_id`, `worker_id`, `work_days`, `daily_rate`, `work_date`, `recorded_by`, `created_at`) VALUES
(20, 12, 1, 1.0, 800.00, '2026-05-27', 16, '2026-05-27 10:59:43'),
(21, 12, 2, 1.0, 800.00, '2026-05-27', 14, '2026-05-27 11:00:10'),
(22, 1, 1, 5.0, 800.00, '2026-05-27', 1, '2026-05-27 11:48:51'),
(23, 1, 1, 5.0, 800.00, '2026-05-27', 1, '2026-05-27 11:49:06'),
(24, 1, 2, 3.0, 600.00, '2026-05-27', 1, '2026-05-27 11:49:06'),
(25, 16, 1, 26.0, 800.00, '2025-03-31', 30, '2026-05-30 09:28:45'),
(26, 16, 4, 18.0, 900.00, '2025-04-30', 30, '2026-05-30 09:28:49'),
(27, 17, 8, 15.0, 950.00, '2025-04-15', 30, '2026-05-30 09:28:53'),
(28, 17, 7, 22.0, 550.00, '2025-04-30', 30, '2026-05-30 09:28:57'),
(29, 18, 3, 12.0, 750.00, '2024-12-15', 30, '2026-05-30 09:29:01'),
(30, 27, 1, 5.0, 800.00, '2026-06-01', 16, '2026-06-01 07:33:16'),
(31, 29, 4, 1.0, 900.00, '2026-06-01', 16, '2026-06-01 07:41:38'),
(32, 29, 1, 1.0, 800.00, '2026-06-01', 16, '2026-06-01 07:41:38'),
(35, 31, 23, 10.0, 800.00, '2026-07-15', 16, '2026-06-01 07:49:23'),
(36, 31, 24, 15.0, 600.00, '2026-07-16', 16, '2026-06-01 07:49:23');

-- --------------------------------------------------------

--
-- Table structure for table `materials_master`
--

CREATE TABLE `materials_master` (
  `material_id` int(11) NOT NULL,
  `material_name` varchar(100) NOT NULL,
  `unit` varchar(50) NOT NULL COMMENT 'e.g. kg, bags, m3',
  `unit_price` decimal(10,2) DEFAULT NULL,
  `total_purchased` decimal(12,2) DEFAULT 0.00,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `materials_master`
--

INSERT INTO `materials_master` (`material_id`, `material_name`, `unit`, `unit_price`, `total_purchased`, `is_deleted`, `created_at`) VALUES
(1, 'Cement (OPC 53 Grade)', 'bags', 400.00, 0.00, 0, '2026-04-11 09:42:04'),
(2, 'Steel TMT Bar (Fe500)', 'kg', 75.00, 0.00, 0, '2026-04-11 09:42:04'),
(3, 'praveen Sand', 'm3', 1200.00, 0.00, 0, '2026-04-11 09:42:04'),
(4, 'M20 Ready Mix Concrete', 'm3', 4500.00, 0.00, 0, '2026-04-11 09:42:04'),
(5, 'Red Bricks', 'units', 8.00, 0.00, 0, '2026-04-11 09:42:04'),
(6, 'Plumbing PVC Pipe', 'meters', 85.00, 0.00, 0, '2026-04-11 09:42:04'),
(7, 'Electrical Wire (6mm)', 'meters', 55.00, 0.00, 0, '2026-04-11 09:42:04'),
(8, 'Ceramic Floor Tiles', 'm2', 650.00, 0.00, 0, '2026-04-11 09:42:04'),
(25, 'Ordinary Portland Cement (OPC 53)', 'Bag (50kg)', 420.00, 0.00, 0, '2026-05-30 09:27:34'),
(26, 'TMT Steel Bar (Fe-500)', 'KG', 72.00, 0.00, 0, '2026-05-30 09:27:38'),
(27, 'River Sand (M-Sand)', 'CuFt', 55.00, 0.00, 0, '2026-05-30 09:27:42'),
(28, '20mm Crushed Stone Aggregate', 'CuFt', 48.00, 0.00, 0, '2026-05-30 09:27:45'),
(29, 'Red Brick (Wire Cut)', 'Nos', 9.00, 0.00, 0, '2026-05-30 09:27:49'),
(30, 'Hollow Block (200mm)', 'Nos', 38.00, 0.00, 0, '2026-05-30 09:27:52'),
(31, 'Waterproofing Compound (Dr. Fixit)', 'Litre', 310.00, 0.00, 0, '2026-05-30 09:27:56'),
(32, 'PVC Pipe (4 inch)', 'Metre', 185.00, 0.00, 0, '2026-05-30 09:28:00');

-- --------------------------------------------------------

--
-- Table structure for table `material_usage`
--

CREATE TABLE `material_usage` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL COMMENT 'snapshot price at time of entry',
  `usage_date` date NOT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `supplier_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `material_usage`
--

INSERT INTO `material_usage` (`id`, `project_id`, `material_id`, `quantity`, `unit_price`, `usage_date`, `recorded_by`, `created_at`, `supplier_name`) VALUES
(18, 12, 1, 4.00, 400.00, '2026-05-27', 16, '2026-05-27 10:57:52', NULL),
(19, 12, 2, 100.00, 75.00, '2026-05-27', 16, '2026-05-27 10:58:25', NULL),
(20, 12, 4, 4.00, 4500.00, '2026-05-27', 16, '2026-05-27 11:16:49', NULL),
(21, 1, 1, 100.00, 420.00, '2026-05-27', 1, '2026-05-27 11:49:06', 'UltraTech Cements'),
(22, 12, 1, 6.00, 400.00, '2026-05-27', 16, '2026-05-27 11:51:23', NULL),
(23, 12, 2, 7.00, 75.00, '2026-05-27', 16, '2026-05-27 11:51:23', NULL),
(24, 14, 3, 23.00, 1200.00, '2026-05-28', 16, '2026-05-27 13:13:41', NULL),
(25, 14, 1, 2.00, 400.00, '2026-05-28', 16, '2026-05-27 13:13:41', NULL),
(26, 16, 25, 250.00, 420.00, '2025-03-10', 30, '2026-05-30 09:28:25', 'Ramco Cements Ltd'),
(27, 16, 26, 3500.00, 72.00, '2025-03-12', 30, '2026-05-30 09:28:29', 'Vizag Steel Madurai Depot'),
(28, 17, 31, 120.00, 310.00, '2025-04-05', 30, '2026-05-30 09:28:33', 'Pidilite Industries'),
(29, 17, 28, 800.00, 48.00, '2025-04-08', 30, '2026-05-30 09:28:37', 'Sri Vel Murugan Quarry'),
(30, 18, 30, 2400.00, 38.00, '2024-11-20', 30, '2026-05-30 09:28:41', 'Kovai Block Industries'),
(31, 27, 28, 100.00, 50.00, '2026-06-01', 1, '2026-06-01 07:29:17', 'Supp A'),
(32, 27, 1, 200.00, 10.00, '2026-06-02', 1, '2026-06-01 07:29:17', 'Supp B'),
(33, 27, 28, 50.00, 52.00, '2026-06-03', 1, '2026-06-01 07:29:17', 'Supp A'),
(39, 31, 28, 500.00, 20.00, '2026-07-10', 16, '2026-06-01 07:49:23', 'Supplier A'),
(40, 31, 1, 250.00, 50.00, '2026-07-12', 16, '2026-06-01 07:49:23', 'Supplier B'),
(41, 31, 30, 6.00, 38.00, '2026-06-06', 16, '2026-06-06 06:22:51', NULL),
(42, 31, 31, 4.00, 100.00, '2026-06-06', NULL, '2026-06-06 06:22:51', NULL),
(43, 31, 26, 4.00, 72.00, '2026-06-11', NULL, '2026-06-11 09:57:40', NULL),
(45, 31, 1, 9.00, 400.00, '2026-06-11', NULL, '2026-06-11 10:41:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `project_id` int(11) NOT NULL,
  `project_name` varchar(150) NOT NULL,
  `location` varchar(150) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `estimated_budget` decimal(15,2) DEFAULT NULL,
  `status` enum('ongoing','completed','on_hold') DEFAULT 'ongoing',
  `created_by` int(11) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `deleted_by` int(11) DEFAULT NULL,
  `work_completed_percent` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`project_id`, `project_name`, `location`, `start_date`, `end_date`, `estimated_budget`, `status`, `created_by`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`, `deleted_by`, `work_completed_percent`) VALUES
(1, 'Greenfield Residential Complex', 'Madurai, Tamil Nadu', '2025-01-01', '2025-06-30', 12000000.00, 'ongoing', 2, 0, NULL, '2026-04-11 09:42:04', '2026-05-28 07:59:43', NULL, 0.00),
(2, 'City Ring Road Extension', 'Coimbatore, TN', '2025-02-01', '2025-08-31', 8500000.00, 'ongoing', 2, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0.00),
(4, 'Greenfield Residential Complex', 'Madurai, Tamil Nadu', '2025-01-01', '2025-06-30', 12000000.00, 'ongoing', 2, 0, NULL, '2026-04-11 09:54:46', NULL, NULL, 0.00),
(5, 'City Ring Road Extension', 'Coimbatore, TN', '2025-02-01', '2025-08-31', 8500000.00, 'ongoing', 2, 1, '2026-04-18 11:53:48', '2026-04-11 09:54:46', '2026-04-18 11:53:48', NULL, 0.00),
(6, 'Lakeside Commercial Hub', 'Chennai, Tamil Nadu', '2024-10-01', '2025-03-31', 5000000.00, 'completed', 2, 1, '2026-04-18 12:15:33', '2026-04-11 09:54:46', '2026-04-18 12:15:33', NULL, 0.00),
(7, 'test', 'test', '2026-04-18', '2026-04-18', 1234567890.00, 'ongoing', 1, 1, '2026-04-18 12:03:06', '2026-04-18 12:02:59', '2026-04-18 12:03:06', NULL, 0.00),
(8, 'test', 'test', '2026-04-30', '2026-04-18', 3456.00, 'ongoing', 1, 1, '2026-04-18 12:25:29', '2026-04-18 12:25:23', '2026-04-18 12:25:29', NULL, 0.00),
(12, 'testrun', 'testrun', '2026-05-27', '2026-05-29', 1000000.00, 'ongoing', 16, 0, NULL, '2026-05-27 10:56:17', NULL, NULL, 0.00),
(14, 'test', 'madurai', '2026-05-28', '2026-05-29', 1000000.00, 'ongoing', 16, 0, NULL, '2026-05-27 13:06:12', NULL, NULL, 0.00),
(15, '', NULL, NULL, NULL, NULL, 'ongoing', 34, 0, NULL, '2026-05-30 09:25:15', NULL, NULL, 0.00),
(16, 'Madurai Smart Residential Complex', 'Madurai, Tamil Nadu', '2025-01-15', '2026-06-30', 4500000.00, 'ongoing', 34, 0, NULL, '2026-05-30 09:27:23', NULL, NULL, 0.00),
(17, 'NH-38 Highway Bridge Repair', 'Dindigul, Tamil Nadu', '2025-02-01', '2025-12-31', 8000000.00, 'ongoing', 34, 0, NULL, '2026-05-30 09:27:27', NULL, NULL, 0.00),
(18, 'KLN Campus Parking Block', 'Pottapalayam, Sivagangai', '2024-10-01', '2025-08-31', 1800000.00, 'on_hold', 34, 0, NULL, '2026-05-30 09:27:31', NULL, NULL, 0.00),
(21, 'Auto Generated Project', 'Chennai', '2026-06-01', '2027-06-01', 100000.00, 'ongoing', 16, 0, NULL, '2026-06-01 07:05:28', NULL, NULL, 0.00),
(22, 'Project_Brute_Force_1780298758304', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:25:58', NULL, NULL, 0.00),
(23, 'Project_Brute_Force_1780298779818', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:26:20', NULL, NULL, 0.00),
(25, 'Project_Brute_Force_1780298882699', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:28:02', NULL, NULL, 0.00),
(26, 'Project_Brute_Force_1780298903610', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:28:23', NULL, NULL, 0.00),
(27, 'Project_Brute_Force_1780298956959', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:29:17', NULL, NULL, 0.00),
(29, 'report', 'madurai', '2026-06-01', '2026-06-03', 67890.00, 'ongoing', 25, 0, NULL, '2026-06-01 07:40:15', NULL, NULL, 0.00),
(31, 'Skyline Tower Project 2', 'Mumbai', '2026-07-01', '2028-07-01', 2000000.00, 'ongoing', 16, 0, NULL, '2026-06-01 07:49:23', NULL, NULL, 0.00),
(32, 'Sample Construction Project', 'Chennai, Tamil Nadu', NULL, '2027-06-30', 5000000.00, 'ongoing', 16, 0, NULL, '2026-06-09 10:41:11', NULL, NULL, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `project_investments`
--

CREATE TABLE `project_investments` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `investor_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `investment_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `repaid_amount` decimal(15,2) DEFAULT 0.00,
  `status` varchar(30) DEFAULT 'Active',
  `return_type` varchar(30) DEFAULT 'Fixed',
  `expected_return` decimal(10,2) DEFAULT 0.00,
  `lock_in_months` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_investments`
--

INSERT INTO `project_investments` (`id`, `project_id`, `investor_id`, `amount`, `investment_date`, `notes`, `created_by`, `created_at`, `repaid_amount`, `status`, `return_type`, `expected_return`, `lock_in_months`) VALUES
(9, 16, 7, 1500000.00, '2025-01-05', 'Equity partner — 20% share of net profit | Expected return: 1800000 | Return type: profit_share', 34, '2026-05-30 09:30:20', 0.00, 'Active', 'Fixed', 0.00, 0),
(10, 16, 8, 2000000.00, '2025-01-10', 'Returns on billing milestone completion | Expected return: 2400000 | Return type: billing_based | Billing stage: Ground Floor Slab', 34, '2026-05-30 09:30:24', 0.00, 'Active', 'Fixed', 0.00, 0),
(11, 17, 9, 800000.00, '2025-02-05', 'Fixed 20% return, payable on project close | Expected return: 960000 | Return type: fixed', 34, '2026-05-30 09:30:27', 0.00, 'Active', 'Fixed', 0.00, 0),
(12, 27, 1, 50000.00, '2026-01-01', 'Notes', 1, '2026-06-01 07:29:17', 0.00, 'Active', 'Fixed', 0.00, 0),
(13, 27, 1, 20000.00, '2026-06-01', 'Notes', 1, '2026-06-01 07:29:17', 0.00, 'Active', 'Fixed', 0.00, 0),
(14, 31, 1, 500000.00, '2026-06-15', 'Approved', 16, '2026-06-01 07:49:24', 0.00, 'Active', 'Fixed', 0.00, 0),
(15, 31, 4, 7000000.00, '2026-06-06', 'bill1', NULL, '2026-06-06 07:21:57', 0.00, 'Active', 'Percentage', 12.00, 0),
(16, 31, 3, 7009989.00, '2026-06-06', NULL, NULL, '2026-06-06 07:30:43', 0.00, 'Active', 'Fixed', 5.00, 0);

-- --------------------------------------------------------

--
-- Table structure for table `project_loans`
--

CREATE TABLE `project_loans` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `financier_id` int(11) NOT NULL,
  `principal` decimal(15,2) NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `interest_type` varchar(30) DEFAULT 'Simple',
  `tenure_months` int(11) DEFAULT 12,
  `repayment_type` varchar(30) DEFAULT 'Monthly',
  `repaid_amount` decimal(15,2) DEFAULT 0.00,
  `status` varchar(30) DEFAULT 'Active',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_loans`
--

INSERT INTO `project_loans` (`id`, `project_id`, `financier_id`, `principal`, `interest_rate`, `start_date`, `end_date`, `created_by`, `created_at`, `interest_type`, `tenure_months`, `repayment_type`, `repaid_amount`, `status`, `notes`) VALUES
(6, 16, 5, 3000000.00, 11.50, '2025-01-15', '2026-06-30', NULL, '2026-05-30 09:30:31', 'Simple', 12, 'Monthly', 0.00, 'Active', NULL),
(7, 17, 6, 5000000.00, 12.00, '2025-02-01', '2025-12-31', NULL, '2026-05-30 09:30:34', 'Simple', 12, 'Monthly', 0.00, 'Active', NULL),
(8, 27, 1, 100000.00, 0.00, '2026-01-01', '2030-01-01', 1, '2026-06-01 07:29:17', 'Simple', 12, 'Monthly', 0.00, 'Active', NULL),
(9, 31, 1, 1000000.00, 0.00, '2026-06-20', '2036-06-20', 16, '2026-06-01 07:49:24', 'Simple', 12, 'Monthly', 0.00, 'Active', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `project_progress`
--

CREATE TABLE `project_progress` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `month` int(11) NOT NULL CHECK (`month` between 1 and 12),
  `year` int(11) NOT NULL,
  `progress_percentage` decimal(5,2) NOT NULL CHECK (`progress_percentage` between 0 and 100),
  `remarks` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_progress`
--

INSERT INTO `project_progress` (`id`, `project_id`, `month`, `year`, `progress_percentage`, `remarks`, `recorded_by`, `created_at`) VALUES
(16, 12, 2, 2026, 5.00, NULL, NULL, '2026-05-27 12:01:56'),
(17, 16, 1, 2025, 8.50, 'Planned: 10.00% | Delay: 6 days | Work Done: Site clearing, leveling, PCC completed. Foundation layout done. | Blockers: Rain delay for 3 days in third week.', NULL, '2026-05-30 09:30:54'),
(18, 16, 2, 2025, 18.00, 'Planned: 20.00% | Delay: 4 days | Work Done: Foundation concreting completed. Column starters done for GF. | Blockers: Steel supply delayed by 2 days.', NULL, '2026-05-30 09:30:58'),
(19, 16, 3, 2025, 32.00, 'Planned: 35.00% | Delay: 5 days | Work Done: Ground floor columns and beam concreting done. Slab shuttering in progress. | Blockers: Labour shortage during Pongal holidays.', NULL, '2026-05-30 09:31:01'),
(20, 17, 2, 2025, 15.00, 'Planned: 15.00% | Delay: 0 days | Work Done: Traffic diversion in place. Deck chipping and surface preparation done. | Blockers: None.', NULL, '2026-05-30 09:31:05'),
(21, 17, 3, 2025, 28.00, 'Planned: 35.00% | Delay: 12 days | Work Done: Waterproofing membrane applied on 60% of deck area. | Blockers: Material delivery delayed. Monsoon pre-season light rain.', NULL, '2026-05-30 09:31:08'),
(22, 18, 11, 2024, 18.00, 'Planned: 20.00% | Delay: 5 days | Work Done: Pile foundation completed. Level 1 column casting started. | Blockers: Approval for structural drawing revision pending.', NULL, '2026-05-30 09:31:12'),
(23, 27, 6, 2026, 8.00, 'Foundation done', 1, '2026-06-01 07:29:17'),
(24, 31, 7, 2026, 5.00, 'Foundation started', 16, '2026-06-01 07:49:23');

-- --------------------------------------------------------

--
-- Table structure for table `project_team`
--

CREATE TABLE `project_team` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('site_engineer','project_manager','supervisor','accountant','viewer','manager','engineer') NOT NULL DEFAULT 'engineer',
  `joined_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_team`
--

INSERT INTO `project_team` (`id`, `project_id`, `user_id`, `role`, `joined_at`, `created_at`) VALUES
(15, 12, 14, 'project_manager', '2026-05-13', '2026-05-27 12:18:52'),
(16, 31, 6, '', NULL, '2026-06-06 06:18:07'),
(17, 4, 6, '', NULL, '2026-06-06 06:18:19'),
(18, 31, 37, '', NULL, '2026-06-06 06:19:18'),
(19, 31, 39, '', NULL, '2026-06-11 11:19:33'),
(20, 31, 35, 'accountant', NULL, '2026-06-11 18:03:31'),
(22, 31, 41, 'accountant', NULL, '2026-06-11 18:14:05'),
(23, 1, 41, 'accountant', NULL, '2026-06-12 06:29:53');

-- --------------------------------------------------------

--
-- Table structure for table `proposal_response`
--

CREATE TABLE `proposal_response` (
  `response_id` int(11) NOT NULL,
  `proposal_id` int(11) NOT NULL,
  `response_action` enum('Accept','Reject','Counter') NOT NULL,
  `counter_amount` decimal(15,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `responded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `proposal_response`
--

INSERT INTO `proposal_response` (`response_id`, `proposal_id`, `response_action`, `counter_amount`, `reason`, `responded_at`) VALUES
(1, 1, 'Accept', NULL, NULL, '2026-06-04 07:20:43'),
(2, 2, 'Accept', NULL, NULL, '2026-06-04 07:47:34');

-- --------------------------------------------------------

--
-- Table structure for table `recycle_bin`
--

CREATE TABLE `recycle_bin` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `project_name` varchar(255) NOT NULL,
  `deleted_by_user` int(11) NOT NULL,
  `deleted_by_name` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT current_timestamp(),
  `reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(4, 'accountant'),
(1, 'admin'),
(3, 'engineer'),
(2, 'manager'),
(5, 'supervisor'),
(6, 'viewer');

-- --------------------------------------------------------

--
-- Table structure for table `session_log`
--

CREATE TABLE `session_log` (
  `session_id` char(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `login_time` datetime NOT NULL DEFAULT current_timestamp(),
  `logout_time` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `status` enum('active','expired','logged_out') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `session_log`
--

INSERT INTO `session_log` (`session_id`, `user_id`, `login_time`, `logout_time`, `ip_address`, `user_agent`, `status`) VALUES
('029b694e-d3a8-42a0-9055-a05a5f87daf7', 16, '2026-06-06 11:48:50', '2026-06-06 11:49:19', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'logged_out'),
('2865f83d-bc4d-449a-91b5-d0481b39506a', 16, '2026-06-11 23:33:14', '2026-06-11 23:37:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('33797502-4af7-4764-ba7b-069a83c46458', 16, '2026-05-30 15:37:18', '2026-06-04 16:50:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('345d7de7-6984-479c-8a04-784b1b148d3f', 16, '2026-05-30 15:19:53', '2026-06-04 16:50:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('3cdf37e0-7035-43bf-bd39-323dc217797a', 16, '2026-06-11 16:53:09', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'active'),
('547205f4-681f-4c94-9c9e-baac4cce05af', 16, '2026-06-11 14:58:24', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'active'),
('59f11115-5317-4291-9527-8dc352279c6f', 16, '2026-06-11 23:39:01', '2026-06-11 23:42:15', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('5c28b89b-39c1-4de5-906a-ca0be8f57715', 37, '2026-06-11 23:42:24', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'active'),
('64424e86-8ce5-4c98-adc0-bd1ef87ea461', 16, '2026-05-30 15:24:16', '2026-06-04 16:50:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('6638ea82-231d-4e84-9cf3-b4cf7f7612ed', 16, '2026-06-12 11:55:29', '2026-06-12 11:59:56', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('69adcc77-250f-4af2-a59a-ed27770d7cb6', 16, '2026-06-11 22:34:44', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'active'),
('6fff1d01-b0b8-4cd7-88fd-180d4c3e3ece', 41, '2026-06-11 23:38:20', '2026-06-11 23:38:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('76397ec9-666c-4a74-a70e-f3f09fc1c674', 41, '2026-06-11 23:44:32', '2026-06-12 11:55:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('7808f8d4-ad8b-4733-908a-69974bdeafa3', 41, '2026-06-12 12:00:07', '2026-06-12 12:00:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('7a1ac952-ede8-46a3-befa-7c0798d5941d', 37, '2026-06-06 11:49:30', '2026-06-06 11:49:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'logged_out'),
('7be422e4-1765-4554-bcb8-9313bddf667b', 16, '2026-06-06 11:49:50', '2026-06-08 14:38:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('93208186-632f-466d-b3be-a1b6c44f1bd5', 40, '2026-06-11 14:58:36', '2026-06-11 14:59:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('960f3545-3276-40a2-879b-3c0ee7b1dda0', 37, '2026-05-30 15:37:39', '2026-06-06 11:48:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('a66c443d-6348-409a-9f31-d3bdb7831ce6', 16, '2026-06-08 14:38:58', '2026-06-09 15:31:07', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('ad0f98a3-3741-4ada-bdd4-46979333c15f', 16, '2026-06-11 15:00:08', '2026-06-11 16:52:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('b8d01c4c-5a90-4b2c-96c7-7ed6a0156685', 41, '2026-06-12 12:08:53', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'active'),
('b9bffac3-16d0-43e7-bd80-45de3933f0ba', 16, '2026-06-09 15:31:07', '2026-06-11 14:16:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('c28a1900-88f5-4043-a354-215702425b47', 16, '2026-06-11 14:40:16', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'active'),
('c6a3055b-b518-4962-a834-d4d79ff9f2ca', 16, '2026-06-12 12:00:35', '2026-06-12 12:08:29', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('cd923c91-45f7-4be1-9c1d-1728effef1e7', 37, '2026-05-30 15:22:02', '2026-06-06 11:48:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('ce0aa33d-c892-490e-b527-acda8ae2ff0c', 37, '2026-06-06 11:48:39', '2026-06-06 11:48:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'logged_out'),
('cf5ebae0-0e1f-4532-8426-44d0a43c7fe9', 16, '2026-06-11 14:16:49', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'active'),
('d3d4f90f-4ddb-4ff7-9199-42c3a16bce9a', 16, '2026-06-04 17:09:23', '2026-06-06 11:47:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('d4557ad0-72bd-4a6d-990b-6504eecfd833', 16, '2026-06-11 23:29:24', '2026-06-11 23:44:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'logged_out'),
('d98481bf-c6e4-4d15-8b8e-ec95fb1b63fa', 16, '2026-05-30 15:21:31', '2026-06-04 16:50:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('e1dff952-97a1-4d8b-99b8-4103ca6555cb', 16, '2026-05-30 16:16:19', '2026-06-04 16:50:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('e1fc3b12-e1c0-4e1e-82d2-337fee4be95b', 16, '2026-06-04 16:50:16', '2026-06-06 11:47:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('ed5eedf0-b8cf-444c-a7f0-69eff64a8c5f', 16, '2026-06-11 22:34:13', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'active'),
('f1be93ec-3943-482b-9155-b19b6542f7dd', 16, '2026-05-30 16:00:08', '2026-06-04 16:50:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'expired'),
('fdd68bda-7396-47e3-8150-a63d1445c2b8', 16, '2026-06-06 11:47:33', '2026-06-06 11:48:27', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'logged_out');

-- --------------------------------------------------------

--
-- Table structure for table `tax_compliance`
--

CREATE TABLE `tax_compliance` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `tax_type` varchar(100) NOT NULL,
  `period` varchar(50) NOT NULL,
  `amount_due` decimal(15,2) DEFAULT 0.00,
  `amount_paid` decimal(15,2) DEFAULT 0.00,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','paid','overdue') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tax_compliance`
--

INSERT INTO `tax_compliance` (`id`, `project_id`, `tax_type`, `period`, `amount_due`, `amount_paid`, `due_date`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 31, 'GST', 'Q12026', 5600.00, 0.00, '2026-06-04', 'paid', 'amount paid through upi', '2026-06-04 06:08:58', NULL),
(2, 32, 'GST', 'asdfafadsf', 3545.00, 3455.00, '2026-06-11', 'paid', 'fsdfasdfasdfd', '2026-06-11 09:43:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'bcrypt/Argon2id only - never plaintext',
  `role_id` int(11) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `last_login` datetime DEFAULT NULL,
  `login_attempts` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `is_approved` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password_hash`, `role_id`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`, `last_login`, `login_attempts`, `is_active`, `is_approved`) VALUES
(1, 'Test Admin', 'admin@test.com', '$2b$10$JXsZj3RRMfCf3ebYviewc.AD4V676I97K17IkrAwOliEu.R4.ej0W', 3, 0, NULL, '2026-04-11 07:51:25', NULL, NULL, 0, 1, 1),
(2, 'Admin User', 'admin@example.com', '$2b$10$BpnPN64Q4HmCZ/qfIsZXmO9GMEig65t1BwQi/AX3ry1sVoX435M9K', 1, 0, NULL, '2026-04-11 07:52:35', NULL, NULL, 0, 1, 1),
(3, 'Arjun Sharma', 'arjun@constructco.in', 'admin@123', 1, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1, 1),
(4, 'Priya Nair', 'priya@constructco.in', '$2b$12$KIXabcHashManager01xx', 2, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1, 1),
(5, 'Ravi Kumar', 'ravi@constructco.in', '$2b$12$KIXabcHashEngineer1xx', 3, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1, 1),
(6, 'Meena Selvam', 'meena@constructco.in', '$2b$12$KIXabcHashEngineer2xx', 3, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1, 1),
(7, 'Siva Prakash', 'siva@constructco.in', '$2b$12$KIXabcHashViewer001xx', 4, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1, 1),
(14, 'harish', 'harish@gmail.com', '$2b$10$I6sGnGb3zdWQT21XDCfep.K0rQDUpMMKQnZmPnB6FKMwlM1.WANm.', 1, 0, NULL, '2026-04-18 09:33:59', NULL, NULL, 0, 1, 1),
(15, 'Kandhan Infra', 'kandhaninfra@gmail.com', '$2b$10$PZssDR.MllGe2V2XjUNCMuthL7Zin36vS2vb/hvvaRCdvg5J4bgmq', 1, 0, NULL, '2026-04-24 11:25:19', NULL, NULL, 0, 1, 1),
(16, 'sudharsan', 'admin@expense.local', '$2b$10$xVBruloRyzxH368GtWZJRekaOFdyxwStRnwwLg1wXDv.mQhdOEHaO', 1, 0, NULL, '2026-05-27 09:47:58', '2026-06-12 06:30:35', '2026-06-12 12:00:35', 0, 1, 1),
(25, 'Admin User', 'admin@cpms.com', '$2b$10$cxehwgj5dwbgZ3uT/j6qaukF9bZH3mSpOoffHvKN.ScRq3uphqjxW', 1, 0, NULL, '2026-05-27 10:39:54', NULL, NULL, 0, 1, 1),
(26, 'Bulk API Tester', 'tester-1779882464726@cpms.com', '$2b$10$GvlpAXlTW1k4uWuSq8WweulLsBUrjHjLfpBSoJhNLPly9hava0sgK', 1, 0, NULL, '2026-05-27 11:47:44', '2026-06-06 06:57:17', NULL, 0, 0, 1),
(27, 'Bulk API Tester', 'tester-1779882489473@cpms.com', '$2b$10$3iLW8sU0z1Bk96ouHd2jR.JyPMpxFWHtmwsQCijmp9Q/Co/aX3hDu', 1, 0, NULL, '2026-05-27 11:48:09', NULL, NULL, 0, 1, 1),
(28, 'Bulk API Tester', 'tester-1779882531176@cpms.com', '$2b$10$Qe9rXjQtpKNACsyiY26WIuAGZtVcTzs6vlscwRUatquQxTb.6McgC', 1, 0, NULL, '2026-05-27 11:48:51', NULL, NULL, 0, 1, 1),
(29, 'Bulk API Tester', 'tester-1779882546542@cpms.com', '$2b$10$E1jfBqbRdBYp9HtN4c5vL.Ef6Lk3Gia0t.vZYoRHIaD45Zw3pYfru', 1, 0, NULL, '2026-05-27 11:49:06', NULL, NULL, 0, 1, 1),
(30, 'Arjun Raj', 'arjun@cpms.com', '$2b$10$yUrTX4pYINa07ncLl0d2wucHiCDunxdme0X/K.8lSCfuYydsYbxUe', 1, 0, NULL, '2026-05-28 08:19:47', NULL, NULL, 0, 1, 1),
(34, 'Sudharsan M', 'sudharsan@cpms.com', '$2b$10$7ooMj5uN62SNJelluRdQZO8LJPsb.qDtUXT8BJS/2fiUYvaVnN0Uu', 2, 0, NULL, '2026-05-30 09:25:02', NULL, NULL, 0, 1, 1),
(35, 'Harish K', 'harish@cpms.com', '$2b$10$C4//O6gaeeSCAzIjyUGgluh72Kri4mUHfCsS5Biuy8JvQz2jh1VY2', 3, 0, NULL, '2026-05-30 09:25:07', NULL, NULL, 0, 1, 1),
(36, 'Praveen S', 'praveen@cpms.com', '$2b$10$gKN29HhXt1HUkOlOEU8x6Opgh35xCwmXxvKasQMp9m64qRw6OcP3C', 1, 0, NULL, '2026-05-30 09:25:11', '2026-05-30 10:06:00', NULL, 0, 1, 1),
(37, 'a', 'a@g.com', '$2b$10$0XLoMvz52cnSbyJqYzLpHOL3a1v5UGDH/8OpwvzOba.RPEBM1mPSq', 2, 0, NULL, '2026-05-30 09:50:55', '2026-06-11 18:12:24', '2026-06-11 23:42:24', 0, 1, 1),
(38, 'praveen', 'praveen200529@gmail.com', '$2b$10$VKI9fZHR9.qmVuzVA6HijubivJ8OVDWo7qvkexNsKF1E/dCGYv06S', 1, 0, NULL, '2026-06-01 08:31:12', NULL, NULL, 0, 1, 1),
(39, 'Test User', 'test@example.com', '$2b$10$hTPhmIBavMkCceG3Xu6uo.aXUmVod3p2V7xCTLRlQEcjgoMVdBAEu', 4, 0, NULL, '2026-06-09 10:27:20', NULL, NULL, 0, 1, 0),
(40, 'Test User', 'testuser@example.com', '$2b$10$P0FCjttnEEz7dwOI93Uf7eCa0s0vXWvn7VO2jwFJ1vbVThWkl7JbO', 1, 0, NULL, '2026-06-11 09:27:56', '2026-06-11 09:30:57', '2026-06-11 14:58:36', 0, 1, 0),
(41, 'accountant', 'acc@g.com', '$2b$10$Mgcj.1VbrbB9.w4YFWQEm.13M.KPUAzhyYkl56KsP7lR/.rErm0X.', 4, 0, NULL, '2026-06-11 18:08:13', '2026-06-12 06:38:53', '2026-06-12 12:08:53', 0, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `workers`
--

CREATE TABLE `workers` (
  `worker_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `aadhar_number` varchar(20) DEFAULT NULL,
  `worker_role_id` int(11) DEFAULT NULL,
  `daily_rate` decimal(8,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `workers`
--

INSERT INTO `workers` (`worker_id`, `name`, `contact`, `aadhar_number`, `worker_role_id`, `daily_rate`, `is_active`, `is_deleted`, `deleted_at`, `created_at`) VALUES
(1, 'Murugan K', '9876543210', '1234-5678-9101', 1, 800.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(2, 'Selvam R', '9876543211', '1234-5678-9102', 1, 800.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(3, 'Kannan P', '9876543212', '1234-5678-9103', 2, 750.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(4, 'Rajan S', '9876543213', '1234-5678-9104', 3, 900.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(5, 'Balu M', '9876543214', '1234-5678-9105', 4, 850.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(6, 'Suresh T', '9876543215', '1234-5678-9106', 5, 550.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(7, 'Pandi L', '9876543216', '1234-5678-9107', 5, 550.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(8, 'Vijay N', '9876543217', '1234-5678-9108', 6, 950.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(9, 'Anbu C', '9876543218', '1234-5678-9109', 7, 700.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(10, 'Durai G', '9876543219', '1234-5678-9110', 1, 820.00, 1, 0, NULL, '2026-04-11 09:42:04'),
(23, 'Arun Kumar', NULL, NULL, 2, 0.00, 1, 0, NULL, '2026-06-01 07:49:23'),
(24, 'Ravi Raj', NULL, NULL, 3, 0.00, 1, 0, NULL, '2026-06-01 07:49:23');

-- --------------------------------------------------------

--
-- Table structure for table `worker_roles`
--

CREATE TABLE `worker_roles` (
  `worker_role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL COMMENT 'mason, carpenter, electrician, etc.',
  `daily_rate` decimal(8,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `worker_roles`
--

INSERT INTO `worker_roles` (`worker_role_id`, `role_name`, `daily_rate`) VALUES
(1, 'Mason', 800.00),
(2, 'Carpenter', 750.00),
(3, 'Electrician', 900.00),
(4, 'Plumber', 850.00),
(5, 'Helper / Unskilled', 550.00),
(6, 'Welder', 950.00),
(7, 'Painter', 700.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `billing`
--
ALTER TABLE `billing`
  ADD PRIMARY KEY (`billing_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_billing_project` (`project_id`),
  ADD KEY `idx_billing_status` (`status`);

--
-- Indexes for table `budget_details`
--
ALTER TABLE `budget_details`
  ADD PRIMARY KEY (`detail_id`),
  ADD KEY `budget_id` (`budget_id`);

--
-- Indexes for table `budget_master`
--
ALTER TABLE `budget_master`
  ADD PRIMARY KEY (`budget_id`);

--
-- Indexes for table `cash_flow_statement`
--
ALTER TABLE `cash_flow_statement`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `corporate_metrics`
--
ALTER TABLE `corporate_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_id` (`project_id`);

--
-- Indexes for table `db_audit_log`
--
ALTER TABLE `db_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_table_record` (`table_name`,`record_id`),
  ADD KEY `idx_audit_changed_at` (`changed_at`);

--
-- Indexes for table `dividend_payouts`
--
ALTER TABLE `dividend_payouts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expense_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_expenses_project_date` (`project_id`,`expense_date`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_name` (`category_name`);

--
-- Indexes for table `financial_forecasts`
--
ALTER TABLE `financial_forecasts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `financial_goals`
--
ALTER TABLE `financial_goals`
  ADD PRIMARY KEY (`goal_id`),
  ADD UNIQUE KEY `project_id` (`project_id`);

--
-- Indexes for table `financial_parameters`
--
ALTER TABLE `financial_parameters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_id` (`project_id`);

--
-- Indexes for table `financial_ratios`
--
ALTER TABLE `financial_ratios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_id` (`project_id`,`period`);

--
-- Indexes for table `financial_statements`
--
ALTER TABLE `financial_statements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `financiers`
--
ALTER TABLE `financiers`
  ADD PRIMARY KEY (`financier_id`);

--
-- Indexes for table `fund_allocation`
--
ALTER TABLE `fund_allocation`
  ADD PRIMARY KEY (`allocation_id`),
  ADD KEY `receipt_id` (`receipt_id`),
  ADD KEY `schedule_id` (`schedule_id`);

--
-- Indexes for table `interest_payments`
--
ALTER TABLE `interest_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_interest_loan` (`loan_id`),
  ADD KEY `idx_interest_status` (`status`);

--
-- Indexes for table `investment_proposal`
--
ALTER TABLE `investment_proposal`
  ADD PRIMARY KEY (`proposal_id`),
  ADD KEY `investor_id` (`investor_id`);

--
-- Indexes for table `investors`
--
ALTER TABLE `investors`
  ADD PRIMARY KEY (`investor_id`);

--
-- Indexes for table `investors_legacy`
--
ALTER TABLE `investors_legacy`
  ADD PRIMARY KEY (`investor_id`);

--
-- Indexes for table `investor_activity_log`
--
ALTER TABLE `investor_activity_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `investor_id` (`investor_id`);

--
-- Indexes for table `investor_alerts`
--
ALTER TABLE `investor_alerts`
  ADD PRIMARY KEY (`alert_id`),
  ADD KEY `investor_id` (`investor_id`),
  ADD KEY `schedule_id` (`schedule_id`);

--
-- Indexes for table `investor_allocation_priority`
--
ALTER TABLE `investor_allocation_priority`
  ADD PRIMARY KEY (`priority_id`),
  ADD KEY `investor_id` (`investor_id`);

--
-- Indexes for table `investor_basic_info`
--
ALTER TABLE `investor_basic_info`
  ADD PRIMARY KEY (`investor_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `investor_commitment`
--
ALTER TABLE `investor_commitment`
  ADD PRIMARY KEY (`commitment_id`),
  ADD KEY `investor_id` (`investor_id`),
  ADD KEY `proposal_id` (`proposal_id`);

--
-- Indexes for table `investor_funding_schedule`
--
ALTER TABLE `investor_funding_schedule`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `commitment_id` (`commitment_id`);

--
-- Indexes for table `investor_fund_receipt`
--
ALTER TABLE `investor_fund_receipt`
  ADD PRIMARY KEY (`receipt_id`),
  ADD KEY `investor_id` (`investor_id`);

--
-- Indexes for table `investor_project_assignment`
--
ALTER TABLE `investor_project_assignment`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `investor_id` (`investor_id`);

--
-- Indexes for table `investor_returns`
--
ALTER TABLE `investor_returns`
  ADD PRIMARY KEY (`return_id`);

--
-- Indexes for table `machines_master`
--
ALTER TABLE `machines_master`
  ADD PRIMARY KEY (`machine_id`),
  ADD UNIQUE KEY `machine_name` (`machine_name`);

--
-- Indexes for table `machine_usage`
--
ALTER TABLE `machine_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `machine_id` (`machine_id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_machine_usage_project_date` (`project_id`,`usage_date`);

--
-- Indexes for table `manpower_usage`
--
ALTER TABLE `manpower_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_manpower_usage_project_date` (`project_id`,`work_date`),
  ADD KEY `idx_manpower_usage_worker` (`worker_id`);

--
-- Indexes for table `materials_master`
--
ALTER TABLE `materials_master`
  ADD PRIMARY KEY (`material_id`),
  ADD UNIQUE KEY `material_name` (`material_name`);

--
-- Indexes for table `material_usage`
--
ALTER TABLE `material_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `material_id` (`material_id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_material_usage_project_date` (`project_id`,`usage_date`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`project_id`),
  ADD KEY `idx_projects_status` (`status`),
  ADD KEY `idx_projects_created_by` (`created_by`),
  ADD KEY `idx_projects_is_deleted` (`is_deleted`);

--
-- Indexes for table `project_investments`
--
ALTER TABLE `project_investments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `investor_id` (`investor_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_investments_project` (`project_id`);

--
-- Indexes for table `project_loans`
--
ALTER TABLE `project_loans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `financier_id` (`financier_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_loans_project` (`project_id`);

--
-- Indexes for table `project_progress`
--
ALTER TABLE `project_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_progress_month` (`project_id`,`year`,`month`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_progress_project_month` (`project_id`,`year`,`month`);

--
-- Indexes for table `project_team`
--
ALTER TABLE `project_team`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_project_user` (`project_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `proposal_response`
--
ALTER TABLE `proposal_response`
  ADD PRIMARY KEY (`response_id`),
  ADD KEY `proposal_id` (`proposal_id`);

--
-- Indexes for table `recycle_bin`
--
ALTER TABLE `recycle_bin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `session_log`
--
ALTER TABLE `session_log`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `idx_sl_user_id` (`user_id`),
  ADD KEY `idx_sl_login_time` (`login_time`);

--
-- Indexes for table `tax_compliance`
--
ALTER TABLE `tax_compliance`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `idx_users_email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `workers`
--
ALTER TABLE `workers`
  ADD PRIMARY KEY (`worker_id`),
  ADD UNIQUE KEY `aadhar_number` (`aadhar_number`),
  ADD KEY `idx_workers_role` (`worker_role_id`);

--
-- Indexes for table `worker_roles`
--
ALTER TABLE `worker_roles`
  ADD PRIMARY KEY (`worker_role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `billing`
--
ALTER TABLE `billing`
  MODIFY `billing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `budget_details`
--
ALTER TABLE `budget_details`
  MODIFY `detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `budget_master`
--
ALTER TABLE `budget_master`
  MODIFY `budget_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `cash_flow_statement`
--
ALTER TABLE `cash_flow_statement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `corporate_metrics`
--
ALTER TABLE `corporate_metrics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `db_audit_log`
--
ALTER TABLE `db_audit_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dividend_payouts`
--
ALTER TABLE `dividend_payouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `financial_forecasts`
--
ALTER TABLE `financial_forecasts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_goals`
--
ALTER TABLE `financial_goals`
  MODIFY `goal_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_parameters`
--
ALTER TABLE `financial_parameters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_ratios`
--
ALTER TABLE `financial_ratios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_statements`
--
ALTER TABLE `financial_statements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financiers`
--
ALTER TABLE `financiers`
  MODIFY `financier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `fund_allocation`
--
ALTER TABLE `fund_allocation`
  MODIFY `allocation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `interest_payments`
--
ALTER TABLE `interest_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `investment_proposal`
--
ALTER TABLE `investment_proposal`
  MODIFY `proposal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `investors`
--
ALTER TABLE `investors`
  MODIFY `investor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `investors_legacy`
--
ALTER TABLE `investors_legacy`
  MODIFY `investor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `investor_activity_log`
--
ALTER TABLE `investor_activity_log`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investor_alerts`
--
ALTER TABLE `investor_alerts`
  MODIFY `alert_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investor_allocation_priority`
--
ALTER TABLE `investor_allocation_priority`
  MODIFY `priority_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investor_basic_info`
--
ALTER TABLE `investor_basic_info`
  MODIFY `investor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `investor_commitment`
--
ALTER TABLE `investor_commitment`
  MODIFY `commitment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `investor_funding_schedule`
--
ALTER TABLE `investor_funding_schedule`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `investor_fund_receipt`
--
ALTER TABLE `investor_fund_receipt`
  MODIFY `receipt_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `investor_project_assignment`
--
ALTER TABLE `investor_project_assignment`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `investor_returns`
--
ALTER TABLE `investor_returns`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `machines_master`
--
ALTER TABLE `machines_master`
  MODIFY `machine_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `machine_usage`
--
ALTER TABLE `machine_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `manpower_usage`
--
ALTER TABLE `manpower_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `materials_master`
--
ALTER TABLE `materials_master`
  MODIFY `material_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `material_usage`
--
ALTER TABLE `material_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `project_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `project_investments`
--
ALTER TABLE `project_investments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `project_loans`
--
ALTER TABLE `project_loans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `project_progress`
--
ALTER TABLE `project_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `project_team`
--
ALTER TABLE `project_team`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `proposal_response`
--
ALTER TABLE `proposal_response`
  MODIFY `response_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `recycle_bin`
--
ALTER TABLE `recycle_bin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tax_compliance`
--
ALTER TABLE `tax_compliance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `workers`
--
ALTER TABLE `workers`
  MODIFY `worker_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `worker_roles`
--
ALTER TABLE `worker_roles`
  MODIFY `worker_role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `billing`
--
ALTER TABLE `billing`
  ADD CONSTRAINT `billing_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `billing_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `budget_details`
--
ALTER TABLE `budget_details`
  ADD CONSTRAINT `budget_details_ibfk_1` FOREIGN KEY (`budget_id`) REFERENCES `budget_master` (`budget_id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`category_id`),
  ADD CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `fund_allocation`
--
ALTER TABLE `fund_allocation`
  ADD CONSTRAINT `fund_allocation_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `investor_fund_receipt` (`receipt_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fund_allocation_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `investor_funding_schedule` (`schedule_id`) ON DELETE CASCADE;

--
-- Constraints for table `interest_payments`
--
ALTER TABLE `interest_payments`
  ADD CONSTRAINT `interest_payments_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `project_loans` (`id`),
  ADD CONSTRAINT `interest_payments_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `investment_proposal`
--
ALTER TABLE `investment_proposal`
  ADD CONSTRAINT `investment_proposal_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investor_basic_info` (`investor_id`) ON DELETE CASCADE;

--
-- Constraints for table `investor_activity_log`
--
ALTER TABLE `investor_activity_log`
  ADD CONSTRAINT `investor_activity_log_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investor_basic_info` (`investor_id`) ON DELETE SET NULL;

--
-- Constraints for table `investor_alerts`
--
ALTER TABLE `investor_alerts`
  ADD CONSTRAINT `investor_alerts_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investor_basic_info` (`investor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `investor_alerts_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `investor_funding_schedule` (`schedule_id`) ON DELETE SET NULL;

--
-- Constraints for table `investor_allocation_priority`
--
ALTER TABLE `investor_allocation_priority`
  ADD CONSTRAINT `investor_allocation_priority_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investor_basic_info` (`investor_id`) ON DELETE CASCADE;

--
-- Constraints for table `investor_commitment`
--
ALTER TABLE `investor_commitment`
  ADD CONSTRAINT `investor_commitment_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investor_basic_info` (`investor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `investor_commitment_ibfk_2` FOREIGN KEY (`proposal_id`) REFERENCES `investment_proposal` (`proposal_id`) ON DELETE SET NULL;

--
-- Constraints for table `investor_funding_schedule`
--
ALTER TABLE `investor_funding_schedule`
  ADD CONSTRAINT `investor_funding_schedule_ibfk_1` FOREIGN KEY (`commitment_id`) REFERENCES `investor_commitment` (`commitment_id`) ON DELETE CASCADE;

--
-- Constraints for table `investor_fund_receipt`
--
ALTER TABLE `investor_fund_receipt`
  ADD CONSTRAINT `investor_fund_receipt_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investor_basic_info` (`investor_id`) ON DELETE CASCADE;

--
-- Constraints for table `investor_project_assignment`
--
ALTER TABLE `investor_project_assignment`
  ADD CONSTRAINT `investor_project_assignment_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investor_basic_info` (`investor_id`) ON DELETE CASCADE;

--
-- Constraints for table `machine_usage`
--
ALTER TABLE `machine_usage`
  ADD CONSTRAINT `machine_usage_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `machine_usage_ibfk_2` FOREIGN KEY (`machine_id`) REFERENCES `machines_master` (`machine_id`),
  ADD CONSTRAINT `machine_usage_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `manpower_usage`
--
ALTER TABLE `manpower_usage`
  ADD CONSTRAINT `manpower_usage_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `manpower_usage_ibfk_2` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`worker_id`),
  ADD CONSTRAINT `manpower_usage_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `material_usage`
--
ALTER TABLE `material_usage`
  ADD CONSTRAINT `material_usage_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `material_usage_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials_master` (`material_id`),
  ADD CONSTRAINT `material_usage_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `project_investments`
--
ALTER TABLE `project_investments`
  ADD CONSTRAINT `project_investments_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `project_investments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `project_loans`
--
ALTER TABLE `project_loans`
  ADD CONSTRAINT `project_loans_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `project_loans_ibfk_2` FOREIGN KEY (`financier_id`) REFERENCES `financiers` (`financier_id`),
  ADD CONSTRAINT `project_loans_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `project_progress`
--
ALTER TABLE `project_progress`
  ADD CONSTRAINT `project_progress_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `project_progress_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `project_team`
--
ALTER TABLE `project_team`
  ADD CONSTRAINT `project_team_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `project_team_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `proposal_response`
--
ALTER TABLE `proposal_response`
  ADD CONSTRAINT `proposal_response_ibfk_1` FOREIGN KEY (`proposal_id`) REFERENCES `investment_proposal` (`proposal_id`) ON DELETE CASCADE;

--
-- Constraints for table `recycle_bin`
--
ALTER TABLE `recycle_bin`
  ADD CONSTRAINT `recycle_bin_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE;

--
-- Constraints for table `session_log`
--
ALTER TABLE `session_log`
  ADD CONSTRAINT `fk_sl_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);

--
-- Constraints for table `workers`
--
ALTER TABLE `workers`
  ADD CONSTRAINT `workers_ibfk_1` FOREIGN KEY (`worker_role_id`) REFERENCES `worker_roles` (`worker_role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
