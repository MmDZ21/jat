ALTER TABLE "orders" ALTER COLUMN "customer_phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "postal_code" varchar(10);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "background_mode" varchar(10) DEFAULT 'light';