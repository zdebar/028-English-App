CREATE TABLE IF NOT EXISTS "private"."settings" (
    "id" integer NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "private"."settings" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "private"."settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "private"."settings_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "private"."settings_id_seq" OWNED BY "private"."settings"."id";
ALTER TABLE ONLY "private"."settings" ALTER COLUMN "id" SET DEFAULT "nextval"('"private"."settings_id_seq"'::"regclass");
ALTER TABLE ONLY "private"."settings" ADD CONSTRAINT "settings_key_key" UNIQUE ("key");
ALTER TABLE ONLY "private"."settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");
ALTER TABLE "private"."settings" ENABLE ROW LEVEL SECURITY;



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "history_enabled" boolean DEFAULT false NOT NULL
);
ALTER TABLE "public"."users" OWNER TO "postgres";
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Policy with security definer functions" ON "public"."users" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));




CREATE TABLE IF NOT EXISTS "public"."user_scores" (
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "item_count" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "user_scores_item_count_check" CHECK (("item_count" >= 0))
);
ALTER TABLE "public"."user_scores" OWNER TO "postgres";
ALTER TABLE ONLY "public"."user_scores" ADD CONSTRAINT "user_score_pkey" PRIMARY KEY ("user_id", "date");
CREATE INDEX "idx_user_scores_updated_at" ON "public"."user_scores" USING "btree" ("updated_at");
CREATE INDEX "idx_user_scores_user_id_updated_at" ON "public"."user_scores" USING "btree" ("user_id", "updated_at");
CREATE OR REPLACE TRIGGER "trg_set_updated_at__user_scores" BEFORE UPDATE ON "public"."user_scores" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
ALTER TABLE ONLY "public"."user_scores" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."user_scores" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow regular users to modify their own data" ON "public"."user_scores" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));




CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "note" "text" NOT NULL,
    "sort_order" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "blocks_sort_order_check" CHECK (("sort_order" >= 1))
);
ALTER TABLE "public"."blocks" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."blocks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."blocks_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."blocks_id_seq" OWNED BY "public"."blocks"."id";
ALTER TABLE ONLY "public"."blocks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."blocks_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."blocks" ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."blocks" ADD CONSTRAINT "blocks_sort_order_key" UNIQUE ("sort_order");
CREATE OR REPLACE TRIGGER "trg_set_updated_at__blocks" BEFORE UPDATE ON "public"."blocks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "public"."blocks" FOR SELECT TO "authenticated" USING (true);




CREATE TABLE IF NOT EXISTS "public"."grammar" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "note" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "sort_order" integer NOT NULL,
    CONSTRAINT "grammar_sort_order_check" CHECK (("sort_order" >= 1))
);
ALTER TABLE "public"."grammar" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."grammar_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."grammar_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."grammar_id_seq" OWNED BY "public"."grammar"."id";
ALTER TABLE ONLY "public"."grammar" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."grammar_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."grammar" ADD CONSTRAINT "grammar_name_key" UNIQUE ("name");
ALTER TABLE ONLY "public"."grammar" ADD CONSTRAINT "grammar_pkey" PRIMARY KEY ("id");
CREATE OR REPLACE TRIGGER "trg_set_updated_at__grammar" BEFORE UPDATE ON "public"."grammar" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
ALTER TABLE "public"."grammar" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "public"."grammar" FOR SELECT TO "authenticated" USING (true);




CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" integer NOT NULL,
    "czech" "text" NOT NULL,
    "english" "text" NOT NULL,
    "pronunciation" "text",
    "audio" "text",
    "sort_order" integer NOT NULL,
    "grammar_id" integer,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lesson_id" integer NOT NULL,
    "is_study_item" boolean DEFAULT true NOT NULL,
    "block_id" integer,
    "note_id" integer,
    "is_vocabulary" boolean DEFAULT true NOT NULL,
    CONSTRAINT "items_sequence_check" CHECK (("sort_order" >= 0))
);
ALTER TABLE "public"."items" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."items_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."items_id_seq" OWNED BY "public"."items"."id";
ALTER TABLE ONLY "public"."items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."items_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."items" ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");
CREATE INDEX "idx_items_block_id" ON "public"."items" USING "btree" ("block_id");
CREATE INDEX "idx_items_grammar_id" ON "public"."items" USING "btree" ("grammar_id");
CREATE INDEX "idx_items_lesson_id" ON "public"."items" USING "btree" ("lesson_id");
CREATE INDEX "idx_items_note_id" ON "public"."items" USING "btree" ("note_id");
CREATE INDEX "idx_items_updated_at" ON "public"."items" USING "btree" ("updated_at");
CREATE OR REPLACE TRIGGER "trg_set_updated_at__items" BEFORE UPDATE ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
ALTER TABLE ONLY "public"."items" ADD CONSTRAINT "items_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."items" ADD CONSTRAINT "items_grammar_id_fkey" FOREIGN KEY ("grammar_id") REFERENCES "public"."grammar"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."items" ADD CONSTRAINT "items_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."items" ADD CONSTRAINT "items_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE SET NULL;
ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "public"."items" FOR SELECT TO "authenticated" USING (true);



CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "level_id" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "sort_order" integer NOT NULL,
    "note" "text" NOT NULL
);
ALTER TABLE "public"."lessons" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."lessons_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."lessons_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."lessons_id_seq" OWNED BY "public"."lessons"."id";
ALTER TABLE ONLY "public"."lessons" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lessons_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."lessons" ADD CONSTRAINT "lessons_name_key" UNIQUE ("name");
ALTER TABLE ONLY "public"."lessons" ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."lessons" ADD CONSTRAINT "lessons_sort_order_key" UNIQUE ("sort_order");
CREATE INDEX "idx_lessons_level_id" ON "public"."lessons" USING "btree" ("level_id");
CREATE INDEX "idx_lessons_level_sort_order" ON "public"."lessons" USING "btree" ("level_id", "sort_order");
CREATE OR REPLACE TRIGGER "trg_set_updated_at__lessons" BEFORE UPDATE ON "public"."lessons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
ALTER TABLE ONLY "public"."lessons" ADD CONSTRAINT "lessons_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE RESTRICT;
ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "public"."lessons" FOR SELECT TO "authenticated" USING (true);




CREATE TABLE IF NOT EXISTS "public"."levels" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "sort_order" integer NOT NULL,
    "note" "text" NOT NULL
);
ALTER TABLE "public"."levels" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."levels_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."levels_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."levels_id_seq" OWNED BY "public"."levels"."id";
ALTER TABLE ONLY "public"."levels" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."levels_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."levels" ADD CONSTRAINT "levels_name_key" UNIQUE ("name");
ALTER TABLE ONLY "public"."levels" ADD CONSTRAINT "levels_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."levels" ADD CONSTRAINT "levels_sort_order_key" UNIQUE ("sort_order");
CREATE INDEX "idx_levels_sort_order" ON "public"."levels" USING "btree" ("sort_order");
CREATE OR REPLACE TRIGGER "trg_set_updated_at__levels" BEFORE UPDATE ON "public"."levels" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
ALTER TABLE "public"."levels" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "public"."levels" FOR SELECT TO "authenticated" USING (true);




CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" integer NOT NULL,
    "note" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);
ALTER TABLE "public"."notes" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."notes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."notes_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."notes_id_seq" OWNED BY "public"."notes"."id";
ALTER TABLE ONLY "public"."notes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notes_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."notes" ADD CONSTRAINT "notes_note_key" UNIQUE ("note");
ALTER TABLE ONLY "public"."notes" ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "public"."notes" FOR SELECT TO "authenticated" USING (true);




CREATE TABLE IF NOT EXISTS "public"."user_items" (
    "user_id" "uuid" NOT NULL,
    "item_id" integer NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "next_at" timestamp with time zone,
    "mastered_at" timestamp with time zone,
    CONSTRAINT "user_items_progress_check" CHECK (("progress" >= 0))
);
ALTER TABLE "public"."user_items" OWNER TO "postgres";
ALTER TABLE ONLY "public"."user_items" ADD CONSTRAINT "user_items_pkey" PRIMARY KEY ("user_id", "item_id");
CREATE INDEX "idx_user_items_item_user" ON "public"."user_items" USING "btree" ("item_id", "user_id") INCLUDE ("progress", "started_at", "updated_at", "next_at", "mastered_at");
CREATE INDEX "idx_user_items_updated_at" ON "public"."user_items" USING "btree" ("updated_at");
CREATE INDEX "idx_user_items_user_updated_item" ON "public"."user_items" USING "btree" ("user_id", "updated_at", "item_id") INCLUDE ("progress", "started_at", "next_at", "mastered_at");
CREATE OR REPLACE TRIGGER "trg_set_updated_at__user_items" BEFORE UPDATE ON "public"."user_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
ALTER TABLE ONLY "public"."user_items" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."user_items" ADD CONSTRAINT "user_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;
ALTER TABLE "public"."user_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow regular users to modify their own data" ON "public"."user_items" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));




CREATE TABLE IF NOT EXISTS "public"."user_items_history" (
    "item_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "progress" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_items_history_progress_check" CHECK (("progress" >= 0))
);
ALTER TABLE "public"."user_items_history" OWNER TO "postgres";
ALTER TABLE ONLY "public"."user_items_history" ADD CONSTRAINT "user_items_history_pkey" PRIMARY KEY ("user_id", "item_id", "created_at");
CREATE INDEX "idx_user_items_history_item_id" ON "public"."user_items_history" USING "btree" ("item_id");
ALTER TABLE ONLY "public"."user_items_history" ADD CONSTRAINT "user_items_history_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."user_items_history" ADD CONSTRAINT "user_items_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."user_items_history" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for users based on user_id" ON "public"."user_items_history" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));