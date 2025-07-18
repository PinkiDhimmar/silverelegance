-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 18, 2025 at 11:14 AM
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
-- Database: `silver_elegance`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `user_id`, `product_id`, `quantity`) VALUES
(9, 18, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`) VALUES
(1, 'Rings', 'rings'),
(2, 'Earrings', 'earrings'),
(3, 'Bracelates', 'bracelates'),
(4, 'Necklaces', 'necklaces'),
(5, 'Ankelets', 'ankelets'),
(6, 'Chains', 'chains'),
(7, 'Pendants', 'pendants');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `name`, `email`, `message`, `created_at`) VALUES
(1, 'Anika', 'anika@gmail.com', 'I am looking for a diamond bracelate.', '2025-06-19 09:59:21');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','shipped') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `tracking_number` varchar(150) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `postal_code` varchar(20) NOT NULL,
  `payment_method` enum('pickup','stripe') NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `shipping_address` text NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `payment_id` varchar(100) NOT NULL,
  `payment_details` text NOT NULL,
  `shipping_method` varchar(50) NOT NULL,
  `courier_fee` decimal(10,2) NOT NULL,
  `courier_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `total_amount`, `status`, `created_at`, `tracking_number`, `address`, `city`, `postal_code`, `payment_method`, `updated_at`, `shipping_address`, `customer_name`, `email`, `payment_id`, `payment_details`, `shipping_method`, `courier_fee`, `courier_name`) VALUES
(1, 2, 0.00, 'pending', '2025-06-21 10:12:09', '0', 'britannia street', 'wellington', '5012', '', '2025-06-21 10:12:09', '', '', '', '', '', '', 0.00, ''),
(2, 2, 35.00, '', '2025-07-15 00:57:50', '0', 'britannia street', 'wellington', '5012', 'stripe', '2025-07-15 00:57:50', '', 'abc', 'abc@gmail.com', 'pi_3RkxBnDnqaJtUKSk4kZclOuq', '{\"id\":\"pi_3RkxBnDnqaJtUKSk4kZclOuq\",\"object\":\"payment_intent\",\"amount\":3500,\"amount_capturable\":0,\"amount_details\":{\"tip\":{}},\"amount_received\":3500,\"application\":null,\"application_fee_amount\":null,\"automatic_payment_methods\":{\"allow_redirects\":\"always\",\"enabled\":true},\"canceled_at\":null,\"cancellation_reason\":null,\"capture_method\":\"automatic_async\",\"client_secret\":\"pi_3RkxBnDnqaJtUKSk4kZclOuq_secret_2QQXr12puodSpqD2oGGpZTcAO\",\"confirmation_method\":\"automatic\",\"created\":1752541067,\"currency\":\"nzd\",\"customer\":null,\"description\":null,\"last_payment_error\":null,\"latest_charge\":\"ch_3RkxBnDnqaJtUKSk4GFvyYou\",\"livemode\":false,\"metadata\":{},\"next_action\":null,\"on_behalf_of\":null,\"payment_method\":\"pm_1RkxBoDnqaJtUKSkfnI78We2\",\"payment_method_configuration_details\":{\"id\":\"pmc_1Rkws0DnqaJtUKSkf1jj1yid\",\"parent\":null},\"payment_method_options\":{\"card\":{\"installments\":null,\"mandate_options\":null,\"network\":null,\"request_three_d_secure\":\"automatic\"},\"klarna\":{\"preferred_locale\":null},\"link\":{\"persistent_token\":null}},\"payment_method_types\":[\"card\",\"klarna\",\"link\"],\"processing\":null,\"receipt_email\":null,\"review\":null,\"setup_future_usage\":null,\"shipping\":null,\"source\":null,\"statement_descriptor\":null,\"statement_descriptor_suffix\":null,\"status\":\"succeeded\",\"transfer_data\":null,\"transfer_group\":null}', 'ship', 0.00, ''),
(3, 5, 120.00, '', '2025-07-15 01:17:02', '0', 'waterloo', 'wellington', '1234', 'stripe', '2025-07-15 01:17:02', '', 'xyz', 'xyz@gmail.com', 'pi_3RkxUNDnqaJtUKSk0mWXUbeC', '{\"id\":\"pi_3RkxUNDnqaJtUKSk0mWXUbeC\",\"object\":\"payment_intent\",\"amount\":12000,\"amount_capturable\":0,\"amount_details\":{\"tip\":{}},\"amount_received\":12000,\"application\":null,\"application_fee_amount\":null,\"automatic_payment_methods\":{\"allow_redirects\":\"always\",\"enabled\":true},\"canceled_at\":null,\"cancellation_reason\":null,\"capture_method\":\"automatic_async\",\"client_secret\":\"pi_3RkxUNDnqaJtUKSk0mWXUbeC_secret_kYvnyEDAGETR9pDFHqq1d27l4\",\"confirmation_method\":\"automatic\",\"created\":1752542219,\"currency\":\"nzd\",\"customer\":null,\"description\":null,\"last_payment_error\":null,\"latest_charge\":\"ch_3RkxUNDnqaJtUKSk0tMT3j9a\",\"livemode\":false,\"metadata\":{},\"next_action\":null,\"on_behalf_of\":null,\"payment_method\":\"pm_1RkxUODnqaJtUKSkQcrXxB6H\",\"payment_method_configuration_details\":{\"id\":\"pmc_1Rkws0DnqaJtUKSkf1jj1yid\",\"parent\":null},\"payment_method_options\":{\"card\":{\"installments\":null,\"mandate_options\":null,\"network\":null,\"request_three_d_secure\":\"automatic\"},\"klarna\":{\"preferred_locale\":null},\"link\":{\"persistent_token\":null}},\"payment_method_types\":[\"card\",\"klarna\",\"link\"],\"processing\":null,\"receipt_email\":null,\"review\":null,\"setup_future_usage\":null,\"shipping\":null,\"source\":null,\"statement_descriptor\":null,\"statement_descriptor_suffix\":null,\"status\":\"succeeded\",\"transfer_data\":null,\"transfer_group\":null}', 'ship', 0.00, ''),
(4, 18, 35.00, '', '2025-07-17 07:58:45', '0', 'Waterloo', 'Wellington', '5011', 'stripe', '2025-07-17 07:58:45', '', 'Customer', 'customer@gmail.com', 'pi_3RlmiGDnqaJtUKSk1XU667uw', '{\"id\":\"pi_3RlmiGDnqaJtUKSk1XU667uw\",\"object\":\"payment_intent\",\"amount\":3500,\"amount_capturable\":0,\"amount_details\":{\"tip\":{}},\"amount_received\":3500,\"application\":null,\"application_fee_amount\":null,\"automatic_payment_methods\":{\"allow_redirects\":\"always\",\"enabled\":true},\"canceled_at\":null,\"cancellation_reason\":null,\"capture_method\":\"automatic_async\",\"client_secret\":\"pi_3RlmiGDnqaJtUKSk1XU667uw_secret_PPtchEwyyTRd8r8JtKrbRPcdz\",\"confirmation_method\":\"automatic\",\"created\":1752739124,\"currency\":\"nzd\",\"customer\":null,\"description\":null,\"last_payment_error\":null,\"latest_charge\":\"ch_3RlmiGDnqaJtUKSk1gVihMPJ\",\"livemode\":false,\"metadata\":{},\"next_action\":null,\"on_behalf_of\":null,\"payment_method\":\"pm_1RlmiGDnqaJtUKSkDSjdpWFj\",\"payment_method_configuration_details\":{\"id\":\"pmc_1Rkws0DnqaJtUKSkf1jj1yid\",\"parent\":null},\"payment_method_options\":{\"card\":{\"installments\":null,\"mandate_options\":null,\"network\":null,\"request_three_d_secure\":\"automatic\"},\"klarna\":{\"preferred_locale\":null},\"link\":{\"persistent_token\":null}},\"payment_method_types\":[\"card\",\"klarna\",\"link\"],\"processing\":null,\"receipt_email\":null,\"review\":null,\"setup_future_usage\":null,\"shipping\":null,\"source\":null,\"statement_descriptor\":null,\"statement_descriptor_suffix\":null,\"status\":\"succeeded\",\"transfer_data\":null,\"transfer_group\":null}', 'ship', 0.00, ''),
(5, 20, 90.00, 'shipped', '2025-07-18 00:53:16', 'AA123456789NZ', 'Queens Drive', 'Wellington', '5011', 'stripe', '2025-07-18 09:09:53', '', 'Pinki Dhimmar', 'pinkidhimmar@gmail.com', 'pi_3Rm2Y3DnqaJtUKSk0Gn79iLi', '{\"id\":\"pi_3Rm2Y3DnqaJtUKSk0Gn79iLi\",\"object\":\"payment_intent\",\"amount\":9600,\"amount_capturable\":0,\"amount_details\":{\"tip\":{}},\"amount_received\":9600,\"application\":null,\"application_fee_amount\":null,\"automatic_payment_methods\":{\"allow_redirects\":\"always\",\"enabled\":true},\"canceled_at\":null,\"cancellation_reason\":null,\"capture_method\":\"automatic_async\",\"client_secret\":\"pi_3Rm2Y3DnqaJtUKSk0Gn79iLi_secret_8Dq5EZvYKxzSmzGmeLyCnQDQ2\",\"confirmation_method\":\"automatic\",\"created\":1752799995,\"currency\":\"nzd\",\"customer\":null,\"description\":null,\"last_payment_error\":null,\"latest_charge\":\"ch_3Rm2Y3DnqaJtUKSk0Cbc6xRx\",\"livemode\":false,\"metadata\":{},\"next_action\":null,\"on_behalf_of\":null,\"payment_method\":\"pm_1Rm2Y4DnqaJtUKSkhJSjIfwY\",\"payment_method_configuration_details\":{\"id\":\"pmc_1Rkws0DnqaJtUKSkf1jj1yid\",\"parent\":null},\"payment_method_options\":{\"card\":{\"installments\":null,\"mandate_options\":null,\"network\":null,\"request_three_d_secure\":\"automatic\"},\"klarna\":{\"preferred_locale\":null},\"link\":{\"persistent_token\":null}},\"payment_method_types\":[\"card\",\"klarna\",\"link\"],\"processing\":null,\"receipt_email\":null,\"review\":null,\"setup_future_usage\":null,\"shipping\":null,\"source\":null,\"statement_descriptor\":null,\"statement_descriptor_suffix\":null,\"status\":\"succeeded\",\"transfer_data\":null,\"transfer_group\":null}', 'ship', 6.00, 'NZ Courier');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`) VALUES
(1, 1, 4, 1, 35.00),
(2, 2, 4, 1, 35.00),
(3, 3, 3, 1, 120.00),
(4, 4, 4, 1, 35.00),
(5, 5, 4, 1, 35.00),
(6, 5, 8, 1, 55.00);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `stock` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `stock`, `image`, `category_id`, `created_at`) VALUES
(2, 'Diamond Ring', 'This ring offers a combination of elegance and affordability compared to gold or platinum rings. They are popular for various occasions, including engagements, weddings, anniversaries, and fashion accessories.', 60.00, 1, 'Diamond Ring.jpg', 1, '2025-06-19 03:16:41'),
(3, 'Bangle Style Bracelet', 'These bracelets are popular for their elegance and simplicity, making them perfect for everyday wear or adding a subtle touch of luxury to formal outfits.', 120.00, 1, 'Bracelet.jpg', 3, '2025-06-20 08:42:42'),
(4, 'Sparkling Pink Halo Ring', 'This stunning vintage-inspired ring is one you\'ll treasure forever. Crafted in sterling silver, this sophisticated S925 Timeless ring is embellished with a halo of sparkling cubic zirconia stones and features a large rectangular radiant-cut stone as a stand-out centrepiece. ', 35.00, 1, 'pink ring.jpg', 1, '2025-06-20 22:25:47'),
(5, 'Snake chain slider Anklets with flower round clasp', 'This stunning snake chain bracelet is a sophisticated spin on the classic friendship bracelet. Hand-finished in polished sterling silver, it features one movable and one fixed end cap — both set with shimmering stones. An innovative sliding clasp makes it easy to adjust it to your size. The perfect present for friends and loved ones, this bracelet can be styled by lifting the movable end cap and it has beautiful charms.', 75.00, 1, 'ankelet.jpg', 5, '2025-06-21 08:21:41'),
(8, 'Pear Blue/White Halo Party Ring', '       RING SIZE 56\r\nThis beautiful 925 sterling silver cocktail ring is a great addition to any wedding or party ensemble. crafted from highest quality materials, you can wear this ring with confidence.', 55.00, 1, 'bluewhite party ring (1).jpg', 1, '2025-07-16 09:25:52'),
(9, 'Halo Pear Gemstone Blue Sapphire Ring', '            RING SIZE 52\r\nThis ring capture the essence of timeless beauty and can be custom-made to reflect your unique love story.', 60.00, 1, 'bluewhite party ring (3).jpg', 1, '2025-07-16 09:27:44'),
(10, 'Kada Bracelet', '            Silver-toned kada bracelet\r\nMaterial and stone type: sterling silver with american diamond\r\nClosure: slip-on\r\n\r\nSize & Fit\r\nCircumference(in Cm):7.6\r\n\r\nMaterial & Care\r\nMaterial: Sterling Silver\r\nStone type: American Diamond', 40.00, 1, 'diamond bracelet.jpg', 3, '2025-07-16 09:32:11'),
(11, '2 Star Charm Bracelet', ' This Bracelet is designed to fit comfortably on your wrist, featuring an adjustable design that allows you to customize the fit for a snug and secure feel.   Whether you\'re dressing up for a special occasion or adding a unique touch to your everyday attire, this kada is versatile and suitable for various outfits and styles.', 35.00, 1, 'star bracelet.jpg', 3, '2025-07-16 09:34:09'),
(12, 'Dolphines Ankeletes with Snake Chain', '            One Size - 2 Piece\r\nIt is charm jewelry, so it\'s no surprise that the anklets has been adorned with small, meaningful charms. The anklets with dangling dolphine charms.', 100.00, 1, 'dolphine ankelet.jpg', 5, '2025-07-16 09:39:03'),
(13, 'Round Sparkle Halo Ring', '            Ring Size 56\r\nFinely crafted in sterling silver, this vintage-inspired piece features a large brilliant-cut cubic zirconia stone surrounded by tiny shimmering stones. This sparkling Pandora ring will add sophistication to every outfit, from simple, everyday ensembles to glamorous evening wear.', 25.00, 0, 'ring1.jpg', 1, '2025-07-16 23:26:41');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','customer') NOT NULL,
  `phone` varchar(20) NOT NULL,
  `DOB` date NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `postal_code` varchar(20) NOT NULL,
  `country` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reset_token` varchar(255) NOT NULL,
  `reset_token_expiry` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `DOB`, `address`, `city`, `postal_code`, `country`, `created_at`, `updated_at`, `reset_token`, `reset_token_expiry`) VALUES
(18, 'Customer', 'customer@gmail.com', '$2b$12$xSWNPTNzIC3dhGw/EqWJfuasmUCdV5VymSDfgpjWrWBqPLsDmYjHC', 'customer', '1234567890', '2025-06-30', 'Britannia street', 'Wellington', '5012', 'New Zealand', '2025-07-17 07:47:08', '2025-07-17 19:47:08', '', '0000-00-00 00:00:00'),
(19, 'Pinki', 'pinki@gmail.com', '$2b$12$ETmvzAotYuqO5ABtlOcs9.r1sjx531Wnj4TzpWyywMrxFTnfGYpxC', 'admin', '0210436535', '1989-11-24', 'Britannia Street Petone', 'Wellington', '5012', 'New Zealand', '2025-07-17 07:49:49', '2025-07-17 19:49:49', '', '0000-00-00 00:00:00'),
(20, 'Pinki Dhimmar', 'pinkidhimmar@gmail.com', '$2b$12$Ftx0rp2.2vMdVLg2hs06juorG/M5W7kO770aAPK7LW6VMaZ3lcNbW', 'customer', '0211160825', '1989-11-24', '32 Queens Drive Lower Hutt', 'Wellington', '5001', 'New Zealand', '2025-07-17 11:16:33', '2025-07-17 23:16:33', '', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `created_at` datetime NOT NULL,
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `users_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `users_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
