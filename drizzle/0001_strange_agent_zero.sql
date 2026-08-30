CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_product_buyer_unique` UNIQUE(`productId`,`buyerId`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(60) NOT NULL,
	`priceCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` varchar(1024) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(30);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `photoKey` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `photoUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `conversations_buyer_idx` ON `conversations` (`buyerId`);--> statement-breakpoint
CREATE INDEX `conversations_seller_idx` ON `conversations` (`sellerId`);--> statement-breakpoint
CREATE INDEX `messages_conversation_created_idx` ON `messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `products_seller_idx` ON `products` (`sellerId`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `products_created_idx` ON `products` (`createdAt`);