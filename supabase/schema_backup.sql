
\restrict jDTBnMJvpDdmehrAYkEOJppqn6LG3PjGMvBgqf2Aax5KNk93Fh58Um5Wrown8MT


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_product_stock"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update the product's stock count
    UPDATE products
    SET
        stock_count = stock_count + NEW.change_amount,
        updated_at = NOW()
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_product_stock"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."inventory_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid",
    "user_id" "uuid",
    "change_amount" integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);


ALTER TABLE "public"."inventory_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "sku" character varying(100) NOT NULL,
    "stock_count" integer DEFAULT 0 NOT NULL,
    "reorder_level" integer DEFAULT 10 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."low_stock_products" AS
 SELECT "id",
    "name",
    "sku",
    "stock_count",
    "reorder_level",
    ("stock_count" - "reorder_level") AS "stock_difference"
   FROM "public"."products"
  WHERE ("stock_count" <= "reorder_level");


ALTER VIEW "public"."low_stock_products" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."transaction_history" AS
 SELECT "t"."id",
    "t"."product_id",
    "t"."timestamp",
    "t"."change_amount",
    "t"."notes",
    "p"."name" AS "product_name",
    "p"."sku" AS "product_sku",
    "u"."email" AS "user_email"
   FROM (("public"."inventory_transactions" "t"
     JOIN "public"."products" "p" ON (("t"."product_id" = "p"."id")))
     LEFT JOIN "auth"."users" "u" ON (("t"."user_id" = "u"."id")))
  ORDER BY "t"."timestamp" DESC;


ALTER VIEW "public"."transaction_history" OWNER TO "postgres";


ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



CREATE INDEX "idx_products_sku" ON "public"."products" USING "btree" ("sku");



CREATE INDEX "idx_products_stock_count" ON "public"."products" USING "btree" ("stock_count");



CREATE INDEX "idx_transactions_product_id" ON "public"."inventory_transactions" USING "btree" ("product_id");



CREATE INDEX "idx_transactions_timestamp" ON "public"."inventory_transactions" USING "btree" ("timestamp");



CREATE INDEX "idx_transactions_user_id" ON "public"."inventory_transactions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trigger_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_stock" AFTER INSERT ON "public"."inventory_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_stock"();



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to delete products" ON "public"."products" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert products" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert transactions" ON "public"."inventory_transactions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to read products" ON "public"."products" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read transactions" ON "public"."inventory_transactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to select products" ON "public"."products" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to update products" ON "public"."products" FOR UPDATE TO "authenticated" USING (true);



ALTER TABLE "public"."inventory_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_product_stock"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_stock"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_stock"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."inventory_transactions" TO "anon";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."low_stock_products" TO "anon";
GRANT ALL ON TABLE "public"."low_stock_products" TO "authenticated";
GRANT ALL ON TABLE "public"."low_stock_products" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_history" TO "anon";
GRANT ALL ON TABLE "public"."transaction_history" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_history" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























\unrestrict jDTBnMJvpDdmehrAYkEOJppqn6LG3PjGMvBgqf2Aax5KNk93Fh58Um5Wrown8MT

RESET ALL;
