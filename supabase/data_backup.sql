SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

\restrict BGJfzYpmhvLwx2vNCi7YYTROXtTHe3QnkwzFFYaTOkXv3EYro5JuoF2Ls6tYSj0

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '325eb0ba-d4da-4cf0-a241-d80bd50f2ef9', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"caucus-iron-expose@duck.com","user_id":"9edd4287-1248-42d8-b8ed-d538f0684376","user_phone":""}}', '2025-09-13 17:12:22.587211+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e29554aa-c376-4865-8317-e0429420f683', '{"action":"login","actor_id":"9edd4287-1248-42d8-b8ed-d538f0684376","actor_username":"caucus-iron-expose@duck.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-13 18:20:23.050852+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b6e0c7a5-7fa0-4ff7-9bf3-fe5894326989', '{"action":"token_refreshed","actor_id":"9edd4287-1248-42d8-b8ed-d538f0684376","actor_username":"caucus-iron-expose@duck.com","actor_via_sso":false,"log_type":"token"}', '2025-09-13 19:27:18.068801+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f660ab39-215c-4ed8-9d5c-6d7221766d08', '{"action":"token_revoked","actor_id":"9edd4287-1248-42d8-b8ed-d538f0684376","actor_username":"caucus-iron-expose@duck.com","actor_via_sso":false,"log_type":"token"}', '2025-09-13 19:27:18.091241+00', ''),
	('00000000-0000-0000-0000-000000000000', '256e29d7-cb97-40e3-8e33-b3d907636442', '{"action":"login","actor_id":"9edd4287-1248-42d8-b8ed-d538f0684376","actor_username":"caucus-iron-expose@duck.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-13 19:43:00.961551+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cce9f2a7-6eb1-48c8-a9b9-3c0ee460f49d', '{"action":"login","actor_id":"9edd4287-1248-42d8-b8ed-d538f0684376","actor_username":"caucus-iron-expose@duck.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-09-13 19:46:05.267652+00', ''),
	('00000000-0000-0000-0000-000000000000', '6325c12a-64c3-4e1d-bf62-972890b87f40', '{"action":"logout","actor_id":"9edd4287-1248-42d8-b8ed-d538f0684376","actor_username":"caucus-iron-expose@duck.com","actor_via_sso":false,"log_type":"account"}', '2025-09-13 19:46:15.540062+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '9edd4287-1248-42d8-b8ed-d538f0684376', 'authenticated', 'authenticated', 'caucus-iron-expose@duck.com', '$2a$10$sjUuuR6GT7NdBvAIB1oR5..ziAKFTQQ1Ik4G60.BgENlvVXANnEKm', '2025-09-13 17:12:22.595471+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-13 19:46:05.284848+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-09-13 17:12:22.566075+00', '2025-09-13 19:46:05.304813+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('9edd4287-1248-42d8-b8ed-d538f0684376', '9edd4287-1248-42d8-b8ed-d538f0684376', '{"sub": "9edd4287-1248-42d8-b8ed-d538f0684376", "email": "caucus-iron-expose@duck.com", "email_verified": false, "phone_verified": false}', 'email', '2025-09-13 17:12:22.578752+00', '2025-09-13 17:12:22.579377+00', '2025-09-13 17:12:22.579377+00', 'fe75c61e-5fbf-47d2-b313-73594fd0c708');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."products" ("id", "name", "description", "sku", "stock_count", "reorder_level", "created_at", "updated_at") VALUES
	('a4ba9151-7e51-410a-a02d-8aec59c89a39', 'Widget A', 'Standard widget for general use', 'WID-001', 25, 10, '2025-09-13 18:12:11.320778+00', '2025-09-13 18:12:11.320778+00'),
	('477038aa-6816-4276-a329-bc065a837859', 'Widget B', 'Premium widget with enhanced features', 'WID-002', 15, 5, '2025-09-13 18:12:11.320778+00', '2025-09-13 18:12:11.320778+00'),
	('029c0b85-483e-4fcb-8b37-f971b37be5dd', 'Gadget X', 'Multi-purpose gadget', 'GAD-001', 22, 15, '2025-09-13 18:12:11.320778+00', '2025-09-13 19:36:03.800034+00'),
	('e87de919-028d-4f68-b32c-19680ff32a7c', 'Tool Set', 'Complete tool set for maintenance', 'TOL-001', 5, 5, '2025-09-13 18:12:11.320778+00', '2025-09-13 19:37:50.549474+00'),
	('b8761966-4b0c-4c6b-a4ba-73b9fe8bec4d', 'Sensor Kit', 'Temperature and humidity sensors', 'SEN-001', 17, 8, '2025-09-13 18:12:11.320778+00', '2025-09-13 19:39:04.73029+00');


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."inventory_transactions" ("id", "product_id", "user_id", "change_amount", "timestamp", "notes") VALUES
	('558f580e-2b48-4dd9-9088-99b628b734aa', '029c0b85-483e-4fcb-8b37-f971b37be5dd', '9edd4287-1248-42d8-b8ed-d538f0684376', 2, '2025-09-13 19:34:08.21962+00', NULL),
	('ff62f3cb-c5be-40cd-83f8-7729e797e5ef', '029c0b85-483e-4fcb-8b37-f971b37be5dd', '9edd4287-1248-42d8-b8ed-d538f0684376', 2, '2025-09-13 19:34:11.168919+00', NULL),
	('09bb92a9-2728-4278-bf6e-1c7ef69f3c42', '029c0b85-483e-4fcb-8b37-f971b37be5dd', '9edd4287-1248-42d8-b8ed-d538f0684376', 10, '2025-09-13 19:36:03.800034+00', NULL),
	('5b34ac3f-0b36-438a-b28b-1b6fa226c85e', 'e87de919-028d-4f68-b32c-19680ff32a7c', '9edd4287-1248-42d8-b8ed-d538f0684376', 2, '2025-09-13 19:37:50.549474+00', NULL),
	('49bc3f43-8038-4382-90d5-f9859ef015ea', 'b8761966-4b0c-4c6b-a4ba-73b9fe8bec4d', '9edd4287-1248-42d8-b8ed-d538f0684376', 5, '2025-09-13 19:39:04.73029+00', NULL);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict BGJfzYpmhvLwx2vNCi7YYTROXtTHe3QnkwzFFYaTOkXv3EYro5JuoF2Ls6tYSj0

RESET ALL;
