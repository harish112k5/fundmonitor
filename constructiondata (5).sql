-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 01, 2026 at 10:28 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

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
(10, 16, 'UNBLOCK_USER', 'users', '37', '::1', '2026-06-01 12:36:24');

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
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `billing`
--

INSERT INTO `billing` (`billing_id`, `project_id`, `invoice_number`, `amount`, `status`, `billing_date`, `due_date`, `created_by`, `created_at`, `updated_at`) VALUES
(14, 27, 'paid', 10000.00, 'draft', '2026-06-01', '2026-06-10', 1, '2026-06-01 07:29:17', NULL),
(15, 27, 'sent', 20000.00, 'draft', '2026-07-01', '2026-07-10', 1, '2026-06-01 07:29:17', NULL),
(18, 31, 'INV-SKY-001', 100000.00, 'paid', '2026-07-01', '2026-07-10', 16, '2026-06-01 07:49:23', NULL),
(19, 31, 'INV-SKY-002', 50000.00, 'sent', '2026-07-20', '2026-07-30', 16, '2026-06-01 07:49:23', NULL);

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
-- Table structure for table `financiers`
--

CREATE TABLE `financiers` (
  `financier_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `financiers`
--

INSERT INTO `financiers` (`financier_id`, `name`, `phone`, `email`, `created_at`) VALUES
(1, 'Indian Bank — SME Branch', '0452-2345678', 'sme@indianbank.in', '2026-04-11 09:58:01'),
(2, 'HDFC Project Finance', '1800-202-6161', 'projects@hdfc.com', '2026-04-11 09:58:01'),
(5, 'Indian Bank — Madurai Branch', '0452-2345678', 'madurai.main@indianbank.in', '2026-05-30 09:30:13'),
(6, 'HDFC Bank — Dindigul', '0451-2225566', 'dindigul.smecell@hdfc.com', '2026-05-30 09:30:17');

-- --------------------------------------------------------

--
-- Table structure for table `interest_payments`
--

CREATE TABLE `interest_payments` (
  `id` int(11) NOT NULL,
  `loan_id` int(11) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('paid','pending') DEFAULT 'pending',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interest_payments`
--

INSERT INTO `interest_payments` (`id`, `loan_id`, `payment_date`, `amount`, `status`, `created_by`, `created_at`) VALUES
(14, 6, '2025-02-15', 28750.00, 'paid', 34, '2026-05-30 09:30:37'),
(15, 6, '2025-03-18', 28750.00, 'paid', 34, '2026-05-30 09:30:41'),
(16, 6, '2025-04-30', 28750.00, 'pending', 34, '2026-05-30 09:30:44'),
(17, 7, '2025-03-01', 45000.00, 'paid', 34, '2026-05-30 09:30:48'),
(18, 7, '2025-04-30', 45000.00, 'pending', 34, '2026-05-30 09:30:51');

-- --------------------------------------------------------

--
-- Table structure for table `investors`
--

CREATE TABLE `investors` (
  `investor_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investors`
--

INSERT INTO `investors` (`investor_id`, `name`, `phone`, `email`, `created_at`) VALUES
(1, 'Rajesh Mehta', '9900001111', 'rajesh@mehtagroup.in', '2026-04-11 09:57:46'),
(2, 'Anitha Constructions Pvt Ltd', '9900002222', 'anitha@acpl.in', '2026-04-11 09:57:46'),
(3, 'Tamil Nadu Infra Fund', '9900003333', 'fund@tninfra.gov.in', '2026-04-11 09:57:46'),
(7, 'Rajendran Pillai', '9443112233', 'rajendran.p@gmail.com', '2026-05-30 09:30:03'),
(8, 'Karthika Ventures Pvt Ltd', '9843221100', 'finance@karthikaventures.com', '2026-05-30 09:30:06'),
(9, 'Murugesan Nadar', '9876001122', 'murugesan.nadar@yahoo.com', '2026-05-30 09:30:10');

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
(30, 31, 26, 40.00, 150.00, '2026-07-18', 16, '2026-06-01 07:49:23', 'Operator John');

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
(40, 31, 1, 250.00, 50.00, '2026-07-12', 16, '2026-06-01 07:49:23', 'Supplier B');

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
  `deleted_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`project_id`, `project_name`, `location`, `start_date`, `end_date`, `estimated_budget`, `status`, `created_by`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`, `deleted_by`) VALUES
(1, 'Greenfield Residential Complex', 'Madurai, Tamil Nadu', '2025-01-01', '2025-06-30', 12000000.00, 'ongoing', 2, 0, NULL, '2026-04-11 09:42:04', '2026-05-28 07:59:43', NULL),
(2, 'City Ring Road Extension', 'Coimbatore, TN', '2025-02-01', '2025-08-31', 8500000.00, 'ongoing', 2, 0, NULL, '2026-04-11 09:42:04', NULL, NULL),
(4, 'Greenfield Residential Complex', 'Madurai, Tamil Nadu', '2025-01-01', '2025-06-30', 12000000.00, 'ongoing', 2, 0, NULL, '2026-04-11 09:54:46', NULL, NULL),
(5, 'City Ring Road Extension', 'Coimbatore, TN', '2025-02-01', '2025-08-31', 8500000.00, 'ongoing', 2, 1, '2026-04-18 11:53:48', '2026-04-11 09:54:46', '2026-04-18 11:53:48', NULL),
(6, 'Lakeside Commercial Hub', 'Chennai, Tamil Nadu', '2024-10-01', '2025-03-31', 5000000.00, 'completed', 2, 1, '2026-04-18 12:15:33', '2026-04-11 09:54:46', '2026-04-18 12:15:33', NULL),
(7, 'test', 'test', '2026-04-18', '2026-04-18', 1234567890.00, 'ongoing', 1, 1, '2026-04-18 12:03:06', '2026-04-18 12:02:59', '2026-04-18 12:03:06', NULL),
(8, 'test', 'test', '2026-04-30', '2026-04-18', 3456.00, 'ongoing', 1, 1, '2026-04-18 12:25:29', '2026-04-18 12:25:23', '2026-04-18 12:25:29', NULL),
(12, 'testrun', 'testrun', '2026-05-27', '2026-05-29', 1000000.00, 'ongoing', 16, 0, NULL, '2026-05-27 10:56:17', NULL, NULL),
(14, 'test', 'madurai', '2026-05-28', '2026-05-29', 1000000.00, 'ongoing', 16, 0, NULL, '2026-05-27 13:06:12', NULL, NULL),
(15, '', NULL, NULL, NULL, NULL, 'ongoing', 34, 0, NULL, '2026-05-30 09:25:15', NULL, NULL),
(16, 'Madurai Smart Residential Complex', 'Madurai, Tamil Nadu', '2025-01-15', '2026-06-30', 4500000.00, 'ongoing', 34, 0, NULL, '2026-05-30 09:27:23', NULL, NULL),
(17, 'NH-38 Highway Bridge Repair', 'Dindigul, Tamil Nadu', '2025-02-01', '2025-12-31', 8000000.00, 'ongoing', 34, 0, NULL, '2026-05-30 09:27:27', NULL, NULL),
(18, 'KLN Campus Parking Block', 'Pottapalayam, Sivagangai', '2024-10-01', '2025-08-31', 1800000.00, 'on_hold', 34, 0, NULL, '2026-05-30 09:27:31', NULL, NULL),
(21, 'Auto Generated Project', 'Chennai', '2026-06-01', '2027-06-01', 100000.00, 'ongoing', 16, 0, NULL, '2026-06-01 07:05:28', NULL, NULL),
(22, 'Project_Brute_Force_1780298758304', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:25:58', NULL, NULL),
(23, 'Project_Brute_Force_1780298779818', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:26:20', NULL, NULL),
(25, 'Project_Brute_Force_1780298882699', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:28:02', NULL, NULL),
(26, 'Project_Brute_Force_1780298903610', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:28:23', NULL, NULL),
(27, 'Project_Brute_Force_1780298956959', 'Test City', '2026-01-01', '2026-12-31', 500000.00, 'ongoing', 1, 0, NULL, '2026-06-01 07:29:17', NULL, NULL),
(29, 'report', 'madurai', '2026-06-01', '2026-06-03', 67890.00, 'ongoing', 25, 0, NULL, '2026-06-01 07:40:15', NULL, NULL),
(31, 'Skyline Tower Project 2', 'Mumbai', '2026-07-01', '2028-07-01', 2000000.00, 'ongoing', 16, 0, NULL, '2026-06-01 07:49:23', NULL, NULL);

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_investments`
--

INSERT INTO `project_investments` (`id`, `project_id`, `investor_id`, `amount`, `investment_date`, `notes`, `created_by`, `created_at`) VALUES
(9, 16, 7, 1500000.00, '2025-01-05', 'Equity partner — 20% share of net profit | Expected return: 1800000 | Return type: profit_share', 34, '2026-05-30 09:30:20'),
(10, 16, 8, 2000000.00, '2025-01-10', 'Returns on billing milestone completion | Expected return: 2400000 | Return type: billing_based | Billing stage: Ground Floor Slab', 34, '2026-05-30 09:30:24'),
(11, 17, 9, 800000.00, '2025-02-05', 'Fixed 20% return, payable on project close | Expected return: 960000 | Return type: fixed', 34, '2026-05-30 09:30:27'),
(12, 27, 1, 50000.00, '2026-01-01', 'Notes', 1, '2026-06-01 07:29:17'),
(13, 27, 1, 20000.00, '2026-06-01', 'Notes', 1, '2026-06-01 07:29:17'),
(14, 31, 1, 500000.00, '2026-06-15', 'Approved', 16, '2026-06-01 07:49:24');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_loans`
--

INSERT INTO `project_loans` (`id`, `project_id`, `financier_id`, `principal`, `interest_rate`, `start_date`, `end_date`, `created_by`, `created_at`) VALUES
(6, 16, 5, 3000000.00, 11.50, '2025-01-15', '2026-06-30', NULL, '2026-05-30 09:30:31'),
(7, 17, 6, 5000000.00, 12.00, '2025-02-01', '2025-12-31', NULL, '2026-05-30 09:30:34'),
(8, 27, 1, 100000.00, 0.00, '2026-01-01', '2030-01-01', 1, '2026-06-01 07:29:17'),
(9, 31, 1, 1000000.00, 0.00, '2026-06-20', '2036-06-20', 16, '2026-06-01 07:49:24');

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
  `role` enum('site_engineer','project_manager','supervisor','accountant') NOT NULL,
  `joined_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_team`
--

INSERT INTO `project_team` (`id`, `project_id`, `user_id`, `role`, `joined_at`, `created_at`) VALUES
(15, 12, 14, 'project_manager', '2026-05-13', '2026-05-27 12:18:52');

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
(1, 'admin'),
(3, 'engineer'),
(2, 'manager'),
(4, 'viewer');

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
('33797502-4af7-4764-ba7b-069a83c46458', 16, '2026-05-30 15:37:18', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'active'),
('345d7de7-6984-479c-8a04-784b1b148d3f', 16, '2026-05-30 15:19:53', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'active'),
('64424e86-8ce5-4c98-adc0-bd1ef87ea461', 16, '2026-05-30 15:24:16', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'active'),
('960f3545-3276-40a2-879b-3c0ee7b1dda0', 37, '2026-05-30 15:37:39', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'active'),
('cd923c91-45f7-4be1-9c1d-1728effef1e7', 37, '2026-05-30 15:22:02', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'active'),
('d98481bf-c6e4-4d15-8b8e-ec95fb1b63fa', 16, '2026-05-30 15:21:31', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'active'),
('e1dff952-97a1-4d8b-99b8-4103ca6555cb', 16, '2026-05-30 16:16:19', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'active'),
('f1be93ec-3943-482b-9155-b19b6542f7dd', 16, '2026-05-30 16:00:08', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'active');

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
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password_hash`, `role_id`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`, `last_login`, `login_attempts`, `is_active`) VALUES
(1, 'Test Admin', 'admin@test.com', '$2b$10$JXsZj3RRMfCf3ebYviewc.AD4V676I97K17IkrAwOliEu.R4.ej0W', 3, 0, NULL, '2026-04-11 07:51:25', NULL, NULL, 0, 1),
(2, 'Admin User', 'admin@example.com', '$2b$10$BpnPN64Q4HmCZ/qfIsZXmO9GMEig65t1BwQi/AX3ry1sVoX435M9K', 1, 0, NULL, '2026-04-11 07:52:35', NULL, NULL, 0, 1),
(3, 'Arjun Sharma', 'arjun@constructco.in', 'admin@123', 1, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1),
(4, 'Priya Nair', 'priya@constructco.in', '$2b$12$KIXabcHashManager01xx', 2, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1),
(5, 'Ravi Kumar', 'ravi@constructco.in', '$2b$12$KIXabcHashEngineer1xx', 3, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1),
(6, 'Meena Selvam', 'meena@constructco.in', '$2b$12$KIXabcHashEngineer2xx', 3, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1),
(7, 'Siva Prakash', 'siva@constructco.in', '$2b$12$KIXabcHashViewer001xx', 4, 0, NULL, '2026-04-11 09:42:04', NULL, NULL, 0, 1),
(14, 'harish', 'harish@gmail.com', '$2b$10$I6sGnGb3zdWQT21XDCfep.K0rQDUpMMKQnZmPnB6FKMwlM1.WANm.', 1, 0, NULL, '2026-04-18 09:33:59', NULL, NULL, 0, 1),
(15, 'Kandhan Infra', 'kandhaninfra@gmail.com', '$2b$10$PZssDR.MllGe2V2XjUNCMuthL7Zin36vS2vb/hvvaRCdvg5J4bgmq', 1, 0, NULL, '2026-04-24 11:25:19', NULL, NULL, 0, 1),
(16, 'sudharsan', 'admin@expense.local', '$2b$10$xVBruloRyzxH368GtWZJRekaOFdyxwStRnwwLg1wXDv.mQhdOEHaO', 1, 0, NULL, '2026-05-27 09:47:58', '2026-05-30 10:46:19', '2026-05-30 16:16:19', 0, 1),
(25, 'Admin User', 'admin@cpms.com', '$2b$10$cxehwgj5dwbgZ3uT/j6qaukF9bZH3mSpOoffHvKN.ScRq3uphqjxW', 1, 0, NULL, '2026-05-27 10:39:54', NULL, NULL, 0, 1),
(26, 'Bulk API Tester', 'tester-1779882464726@cpms.com', '$2b$10$GvlpAXlTW1k4uWuSq8WweulLsBUrjHjLfpBSoJhNLPly9hava0sgK', 1, 0, NULL, '2026-05-27 11:47:44', NULL, NULL, 0, 1),
(27, 'Bulk API Tester', 'tester-1779882489473@cpms.com', '$2b$10$3iLW8sU0z1Bk96ouHd2jR.JyPMpxFWHtmwsQCijmp9Q/Co/aX3hDu', 1, 0, NULL, '2026-05-27 11:48:09', NULL, NULL, 0, 1),
(28, 'Bulk API Tester', 'tester-1779882531176@cpms.com', '$2b$10$Qe9rXjQtpKNACsyiY26WIuAGZtVcTzs6vlscwRUatquQxTb.6McgC', 1, 0, NULL, '2026-05-27 11:48:51', NULL, NULL, 0, 1),
(29, 'Bulk API Tester', 'tester-1779882546542@cpms.com', '$2b$10$E1jfBqbRdBYp9HtN4c5vL.Ef6Lk3Gia0t.vZYoRHIaD45Zw3pYfru', 1, 0, NULL, '2026-05-27 11:49:06', NULL, NULL, 0, 1),
(30, 'Arjun Raj', 'arjun@cpms.com', '$2b$10$yUrTX4pYINa07ncLl0d2wucHiCDunxdme0X/K.8lSCfuYydsYbxUe', 1, 0, NULL, '2026-05-28 08:19:47', NULL, NULL, 0, 1),
(34, 'Sudharsan M', 'sudharsan@cpms.com', '$2b$10$7ooMj5uN62SNJelluRdQZO8LJPsb.qDtUXT8BJS/2fiUYvaVnN0Uu', 2, 0, NULL, '2026-05-30 09:25:02', NULL, NULL, 0, 1),
(35, 'Harish K', 'harish@cpms.com', '$2b$10$C4//O6gaeeSCAzIjyUGgluh72Kri4mUHfCsS5Biuy8JvQz2jh1VY2', 3, 0, NULL, '2026-05-30 09:25:07', NULL, NULL, 0, 1),
(36, 'Praveen S', 'praveen@cpms.com', '$2b$10$gKN29HhXt1HUkOlOEU8x6Opgh35xCwmXxvKasQMp9m64qRw6OcP3C', 1, 0, NULL, '2026-05-30 09:25:11', '2026-05-30 10:06:00', NULL, 0, 1),
(37, 'a', 'a@g.com', '$2b$10$0XLoMvz52cnSbyJqYzLpHOL3a1v5UGDH/8OpwvzOba.RPEBM1mPSq', 3, 0, NULL, '2026-05-30 09:50:55', '2026-06-01 07:06:24', '2026-05-30 15:37:39', 0, 1);

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
-- Indexes for table `db_audit_log`
--
ALTER TABLE `db_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_table_record` (`table_name`,`record_id`),
  ADD KEY `idx_audit_changed_at` (`changed_at`);

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
-- Indexes for table `financiers`
--
ALTER TABLE `financiers`
  ADD PRIMARY KEY (`financier_id`);

--
-- Indexes for table `interest_payments`
--
ALTER TABLE `interest_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_interest_loan` (`loan_id`),
  ADD KEY `idx_interest_status` (`status`);

--
-- Indexes for table `investors`
--
ALTER TABLE `investors`
  ADD PRIMARY KEY (`investor_id`);

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
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `billing`
--
ALTER TABLE `billing`
  MODIFY `billing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `db_audit_log`
--
ALTER TABLE `db_audit_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT for table `financiers`
--
ALTER TABLE `financiers`
  MODIFY `financier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `interest_payments`
--
ALTER TABLE `interest_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `investors`
--
ALTER TABLE `investors`
  MODIFY `investor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `machines_master`
--
ALTER TABLE `machines_master`
  MODIFY `machine_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `machine_usage`
--
ALTER TABLE `machine_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `project_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `project_investments`
--
ALTER TABLE `project_investments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

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
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

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
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`),
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`category_id`),
  ADD CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `interest_payments`
--
ALTER TABLE `interest_payments`
  ADD CONSTRAINT `interest_payments_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `project_loans` (`id`),
  ADD CONSTRAINT `interest_payments_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

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
  ADD CONSTRAINT `project_investments_ibfk_2` FOREIGN KEY (`investor_id`) REFERENCES `investors` (`investor_id`),
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
