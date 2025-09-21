-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 21, 2025 at 05:49 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dineup`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `appointment_id` int(11) NOT NULL,
  `queue_no` int(11) NOT NULL DEFAULT 0,
  `user_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `type_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `duration` int(11) NOT NULL DEFAULT 90,
  `guest_count` int(11) NOT NULL,
  `deposit_amount` decimal(10,2) DEFAULT 0.00,
  `note` varchar(255) DEFAULT NULL,
  `status` enum('pending','confirmed','completed','canceled') DEFAULT 'pending',
  `employee_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`appointment_id`, `queue_no`, `user_id`, `branch_id`, `type_id`, `date`, `time`, `duration`, `guest_count`, `deposit_amount`, `note`, `status`, `employee_id`, `created_at`) VALUES
(34, 0, 5, 11, 1, '2025-09-21', '19:17:00', 120, 2, 0.00, '', 'pending', NULL, '2025-09-21 12:17:19'),
(35, 0, 5, 11, 1, '2025-09-21', '19:20:00', 120, 2, 0.00, '', 'pending', NULL, '2025-09-21 12:20:34'),
(36, 1, 5, 11, 1, '2025-09-21', '20:18:00', 120, 2, 0.00, '', 'pending', NULL, '2025-09-21 13:18:10'),
(37, 2, 5, 11, 1, '2025-09-21', '20:18:00', 120, 2, 0.00, '', 'pending', NULL, '2025-09-21 13:18:13'),
(38, 3, 5, 11, 1, '2025-09-21', '20:18:00', 120, 2, 0.00, '', 'pending', NULL, '2025-09-21 13:18:22');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `branch_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `brand_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`branch_id`, `name`, `address`, `phone`, `image_url`, `created_at`, `brand_id`) VALUES
(10, 'Wong Swang11', '11', '111', '/uploads/branches/1758455753033-al6schzfsvk.jpg', '2025-09-21 11:55:53', 17),
(11, 'ลาดพร้าว', '2222', '222', '/uploads/branches/1758455774491-8hsr04lkhep.jpg', '2025-09-21 11:56:14', 16),
(12, 'Wong Swang12', '33', '33', '/uploads/branches/1758457801557-mg8zf7p4tw.jpg', '2025-09-21 12:30:01', 17);

-- --------------------------------------------------------

--
-- Table structure for table `branch_table_types`
--

CREATE TABLE `branch_table_types` (
  `branch_id` int(11) NOT NULL,
  `type_id` int(11) NOT NULL,
  `total_slots` int(11) NOT NULL,
  `brand_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branch_table_types`
--

INSERT INTO `branch_table_types` (`branch_id`, `type_id`, `total_slots`, `brand_id`) VALUES
(10, 1, 2, 17),
(10, 2, 2, 17),
(11, 1, 2, 16),
(11, 2, 2, 16),
(12, 1, 1, 17),
(12, 2, 1, 17);

-- --------------------------------------------------------

--
-- Table structure for table `brands`
--

CREATE TABLE `brands` (
  `brand_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `brands`
--

INSERT INTO `brands` (`brand_id`, `name`, `logo_url`) VALUES
(16, 'MK Restaurant', '/uploads/brands/1758454814917-fy3ale771r4.jpg'),
(17, 'SukiTeenoi', '/uploads/brands/1758454845895-63gf4wed9nx.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `employee_branches`
--

CREATE TABLE `employee_branches` (
  `user_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_branches`
--

INSERT INTO `employee_branches` (`user_id`, `branch_id`) VALUES
(5, 10),
(5, 11);

-- --------------------------------------------------------

--
-- Table structure for table `table_types`
--

CREATE TABLE `table_types` (
  `type_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `min_capacity` int(11) NOT NULL,
  `max_capacity` int(11) NOT NULL,
  `min_spend` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `table_types`
--

INSERT INTO `table_types` (`type_id`, `name`, `description`, `min_capacity`, `max_capacity`, `min_spend`) VALUES
(1, '2 ที่นั่ง', '', 1, 2, 299.00),
(2, '4-6 ที่นั่ง', '', 4, 6, 299.00);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('customer','admin','employee') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `first_name`, `last_name`, `name`, `email`, `phone`, `role`, `created_at`) VALUES
(1, 'somchai', '123456', 'Somchai', 'Jaidee', '', 'somchai@example.com', '0812345678', 'customer', '2025-09-17 16:17:35'),
(2, 'podjanan', '123456', 'Podjanan', 'Osatanan', '', 'podjanan@email.com', '0802693656', 'admin', '2025-09-17 16:56:44'),
(3, 'somchaiw', '123456', 'Somchai', 'Jaidee', '', 'somchai@example.comm', NULL, 'customer', '2025-09-17 17:34:53'),
(4, 'somchaiww', '123456', 'Somchai', 'Jaidee', '', 'somchai@example.comw', NULL, 'employee', '2025-09-17 17:35:18'),
(5, 'menu', 'menu', 'Menu', 'Menu', '', 'menu@menu.com', NULL, 'employee', '2025-09-17 18:21:46'),
(6, 'wiang', '1', 'Wiang', 'Ping', '', 'w@w.w', '1', 'customer', '2025-09-17 23:22:55'),
(8, 'test', 'test', 'test', 'test', '', 't@t.t', '0802693652', 'customer', '2025-09-19 19:28:27');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `fk_appt_type` (`type_id`),
  ADD KEY `fk_appt_employee` (`employee_id`),
  ADD KEY `idx_branch_type_slot` (`branch_id`,`type_id`,`date`,`time`),
  ADD KEY `idx_user_date` (`user_id`,`date`),
  ADD KEY `idx_date_queue` (`date`,`queue_no`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`branch_id`),
  ADD KEY `idx_brand_id` (`brand_id`);

--
-- Indexes for table `branch_table_types`
--
ALTER TABLE `branch_table_types`
  ADD PRIMARY KEY (`branch_id`,`type_id`),
  ADD KEY `fk_btt_type` (`type_id`),
  ADD KEY `fk_branch_brand` (`brand_id`);

--
-- Indexes for table `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`brand_id`);

--
-- Indexes for table `employee_branches`
--
ALTER TABLE `employee_branches`
  ADD PRIMARY KEY (`user_id`,`branch_id`),
  ADD KEY `fk_emp_branch` (`branch_id`);

--
-- Indexes for table `table_types`
--
ALTER TABLE `table_types`
  ADD PRIMARY KEY (`type_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `branch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `brands`
--
ALTER TABLE `brands`
  MODIFY `brand_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `table_types`
--
ALTER TABLE `table_types`
  MODIFY `type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `fk_appt_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appt_employee` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appt_type` FOREIGN KEY (`type_id`) REFERENCES `table_types` (`type_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `fk_branches_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`brand_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `branch_table_types`
--
ALTER TABLE `branch_table_types`
  ADD CONSTRAINT `fk_branch_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`brand_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_btt_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_btt_type` FOREIGN KEY (`type_id`) REFERENCES `table_types` (`type_id`) ON UPDATE CASCADE;

--
-- Constraints for table `employee_branches`
--
ALTER TABLE `employee_branches`
  ADD CONSTRAINT `fk_emp_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_emp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
