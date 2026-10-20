CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"resource" text,
	"resource_id" text,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"event_date" timestamp with time zone,
	"company" text,
	"location" text,
	"description" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"external_link" text,
	"author_id" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"status" text DEFAULT 'published' NOT NULL,
	"legacy" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"purpose" text DEFAULT 'reset' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"legacy" jsonb
);
--> statement-breakpoint
CREATE TABLE "content_entries" (
	"key" text PRIMARY KEY NOT NULL,
	"published" jsonb,
	"draft" jsonb,
	"published_at" timestamp with time zone,
	"published_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"storage_key" text NOT NULL,
	"filename" text,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text,
	"blur_data_url" text,
	"sanity_asset_id" text,
	"uploaded_by" text,
	"legacy" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"general_newsletter" boolean DEFAULT false NOT NULL,
	"announcements_newsletter" boolean DEFAULT false NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"legacy" jsonb
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body_html" text DEFAULT '' NOT NULL,
	"main_image" jsonb,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"draft" jsonb,
	"updated_by" text,
	"legacy" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"author_id" text,
	"excerpt" text NOT NULL,
	"featured_image" jsonb,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"rating" integer,
	"status" text DEFAULT 'published' NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"legacy" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"user_type" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"account_status" text DEFAULT 'pending' NOT NULL,
	"oauth_provider" text,
	"oauth_id" text,
	"linkedin_profile_raw" text,
	"google_profile_raw" text,
	"profile_image" jsonb,
	"cover_image" jsonb,
	"promotion_year" integer,
	"city" text,
	"subjects" text[] DEFAULT '{}'::text[] NOT NULL,
	"current_studies" text,
	"linkedin" text,
	"bio" text,
	"description" text,
	"education" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"experience" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"role_association" text[] DEFAULT '{}'::text[] NOT NULL,
	"staff_category" text,
	"staff_details" text,
	"is_visible_in_directory" boolean DEFAULT true NOT NULL,
	"profile_reminder_sent_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"legacy" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_entries" ADD CONSTRAINT "content_entries_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_entries" ADD CONSTRAINT "content_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscriptions" ADD CONSTRAINT "newsletter_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_created_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_action_idx" ON "activity_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "announcements_slug_unique" ON "announcements" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "announcements_listing_idx" ON "announcements" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "announcements_author_idx" ON "announcements" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_tokens_hash_unique" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_tokens_email_idx" ON "auth_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "content_versions_entity_idx" ON "content_versions" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_sanity_asset_unique" ON "media" USING btree ("sanity_asset_id");--> statement-breakpoint
CREATE INDEX "media_created_idx" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_user_unique" ON "newsletter_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_unique" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_listing_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "testimonials_slug_unique" ON "testimonials" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "testimonials_listing_idx" ON "testimonials" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "testimonials_author_idx" ON "testimonials" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_directory_idx" ON "users" USING btree ("is_visible_in_directory","user_type");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("account_status");