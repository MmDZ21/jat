ALTER TABLE "profiles" ADD COLUMN "shop_name" varchar(100);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "shop_slug" varchar(50);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_shop_slug_unique" UNIQUE("shop_slug");