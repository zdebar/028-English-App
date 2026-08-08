SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 5LF1K8cSsAwMMczZGpNFMa2H2Jgs4Js7QPHafcAybzL0FJ9BrX9LegztQo0qqFU

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



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('e1fec50a-a578-47a6-a549-844f27305afe', NULL, '396bfa9e-239c-42e0-b921-f076b407a056', 's256', 'B-Yk1kJAdLMZZMdj5AUqsw44KzWVLl0OVLVShpAGtrA', 'google', '', '', '2026-07-25 04:19:41.636327+00', '2026-07-25 04:19:41.636327+00', 'oauth', NULL, NULL, 'https://zdebar.github.io/028-English-App/', NULL, NULL, false),
	('920c17ec-7fe1-4c20-ac9c-51cb82a92b01', NULL, '52f6d9fd-9e6d-495c-8e64-c4808b8303ff', 's256', 'vkQwRohx2trgwWWGftsw-fAyhOtnDfhm9wJAo4Z5CAg', 'google', '', '', '2026-08-04 05:53:20.526275+00', '2026-08-04 05:53:20.526275+00', 'oauth', NULL, NULL, 'https://zdebar.github.io/028-English-App/', NULL, NULL, false),
	('dc5d2753-261d-41df-8a3d-611860ca7bfe', NULL, '533b9a5f-eace-4834-b049-54db45924fc7', 's256', 'hFxPAFVW2_chxxPWeuig1wv1S7UoEK2CLrMatn-DQJE', 'google', '', '', '2026-08-06 10:54:04.760623+00', '2026-08-06 10:54:04.760623+00', 'oauth', NULL, NULL, 'https://zdebar.github.io/028-English-App/', NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', 'authenticated', 'authenticated', 'zdebarth@gmail.com', NULL, '2026-07-12 14:30:09.073125+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-08 11:35:23.170635+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "101975537491237582905", "name": "Zdeněk Barth", "email": "zdebarth@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIheOAJkc7dBRBI5YWOY1Ls7qcTVX1BcA01zF5HS-C8tRicZg=s96-c", "full_name": "Zdeněk Barth", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIheOAJkc7dBRBI5YWOY1Ls7qcTVX1BcA01zF5HS-C8tRicZg=s96-c", "provider_id": "101975537491237582905", "email_verified": true, "phone_verified": false}', NULL, '2026-07-12 14:30:09.053512+00', '2026-08-08 11:35:23.185251+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('101975537491237582905', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', '{"iss": "https://accounts.google.com", "sub": "101975537491237582905", "name": "Zdeněk Barth", "email": "zdebarth@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIheOAJkc7dBRBI5YWOY1Ls7qcTVX1BcA01zF5HS-C8tRicZg=s96-c", "full_name": "Zdeněk Barth", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIheOAJkc7dBRBI5YWOY1Ls7qcTVX1BcA01zF5HS-C8tRicZg=s96-c", "provider_id": "101975537491237582905", "email_verified": true, "phone_verified": false}', 'google', '2026-07-12 14:30:09.06794+00', '2026-07-12 14:30:09.067995+00', '2026-08-08 11:35:22.77062+00', 'ee1f3233-2703-4934-abc1-703293bef0e9');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('f740c359-a9b3-4a90-a57e-351faf7b95a2', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-06 10:53:39.973974+00', '2026-08-06 10:53:39.973974+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '78.80.232.103', NULL, NULL, NULL, NULL, NULL),
	('8bf1fd37-3213-43db-ad14-102b3d5ae669', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-07 03:32:49.447181+00', '2026-08-07 08:20:20.381348+00', NULL, 'aal1', NULL, '2026-08-07 08:20:20.381228', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '78.80.232.103', NULL, NULL, NULL, NULL, NULL),
	('67eb0943-96bf-464b-87f9-b0c0e4d76ecc', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-06 10:54:16.32318+00', '2026-08-07 08:27:41.63966+00', NULL, 'aal1', NULL, '2026-08-07 08:27:41.639557', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '78.80.232.103', NULL, NULL, NULL, NULL, NULL),
	('d8640d72-8130-4282-b83e-0064a2798bb5', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-07 11:14:34.11274+00', '2026-08-08 11:34:24.953398+00', NULL, 'aal1', NULL, '2026-08-08 11:34:24.953294', 'what', '78.80.232.103', NULL, NULL, NULL, NULL, NULL),
	('73e07c46-d461-4fbb-b1d6-ed779c49c11f', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-08 11:35:23.172862+00', '2026-08-08 11:35:23.172862+00', NULL, 'aal1', NULL, NULL, 'what', '78.80.232.103', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('f740c359-a9b3-4a90-a57e-351faf7b95a2', '2026-08-06 10:53:39.997802+00', '2026-08-06 10:53:39.997802+00', 'oauth', '0235ab11-9bba-43ee-b167-66b82aabbc10'),
	('67eb0943-96bf-464b-87f9-b0c0e4d76ecc', '2026-08-06 10:54:16.330538+00', '2026-08-06 10:54:16.330538+00', 'oauth', '01010c41-d81c-4f16-8d92-4362867c55b9'),
	('8bf1fd37-3213-43db-ad14-102b3d5ae669', '2026-08-07 03:32:49.4859+00', '2026-08-07 03:32:49.4859+00', 'oauth', '3b35d844-a7c7-4caa-87cb-4413719ff827'),
	('d8640d72-8130-4282-b83e-0064a2798bb5', '2026-08-07 11:14:34.144034+00', '2026-08-07 11:14:34.144034+00', 'oauth', '67cb9941-2ffc-4a85-8c8e-32aa58482202'),
	('73e07c46-d461-4fbb-b1d6-ed779c49c11f', '2026-08-08 11:35:23.192835+00', '2026-08-08 11:35:23.192835+00', 'oauth', '5048d7b2-4848-4bc7-afcc-09b02c238cff');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 233, 'yfmcwgmpfi4h', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-06 10:54:16.327488+00', '2026-08-06 11:53:02.855902+00', NULL, '67eb0943-96bf-464b-87f9-b0c0e4d76ecc'),
	('00000000-0000-0000-0000-000000000000', 234, 'iljm7pkf2grr', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-06 11:53:02.875937+00', '2026-08-06 13:47:17.590666+00', 'yfmcwgmpfi4h', '67eb0943-96bf-464b-87f9-b0c0e4d76ecc'),
	('00000000-0000-0000-0000-000000000000', 235, 'u6dwnmb7l6ou', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-06 13:47:17.60488+00', '2026-08-06 15:21:28.500451+00', 'iljm7pkf2grr', '67eb0943-96bf-464b-87f9-b0c0e4d76ecc'),
	('00000000-0000-0000-0000-000000000000', 236, 'tfakiqlofbyw', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-06 15:21:28.512328+00', '2026-08-06 16:52:47.224602+00', 'u6dwnmb7l6ou', '67eb0943-96bf-464b-87f9-b0c0e4d76ecc'),
	('00000000-0000-0000-0000-000000000000', 238, '7l55i77lvgnv', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 03:32:49.464105+00', '2026-08-07 04:35:03.674321+00', NULL, '8bf1fd37-3213-43db-ad14-102b3d5ae669'),
	('00000000-0000-0000-0000-000000000000', 239, 'eoww44t5kq3z', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 04:35:03.684224+00', '2026-08-07 05:43:58.81039+00', '7l55i77lvgnv', '8bf1fd37-3213-43db-ad14-102b3d5ae669'),
	('00000000-0000-0000-0000-000000000000', 240, 'sv3evmzaw52m', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 05:43:58.820822+00', '2026-08-07 06:59:11.170579+00', 'eoww44t5kq3z', '8bf1fd37-3213-43db-ad14-102b3d5ae669'),
	('00000000-0000-0000-0000-000000000000', 241, 'cocwghbnwkpl', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 06:59:11.178135+00', '2026-08-07 08:20:20.357979+00', 'sv3evmzaw52m', '8bf1fd37-3213-43db-ad14-102b3d5ae669'),
	('00000000-0000-0000-0000-000000000000', 242, 'kgyj24u7jima', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', false, '2026-08-07 08:20:20.365688+00', '2026-08-07 08:20:20.365688+00', 'cocwghbnwkpl', '8bf1fd37-3213-43db-ad14-102b3d5ae669'),
	('00000000-0000-0000-0000-000000000000', 237, 'xby6wohabaah', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-06 16:52:47.242128+00', '2026-08-07 08:27:41.619769+00', 'tfakiqlofbyw', '67eb0943-96bf-464b-87f9-b0c0e4d76ecc'),
	('00000000-0000-0000-0000-000000000000', 243, 'unkxwvtpzkge', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', false, '2026-08-07 08:27:41.627265+00', '2026-08-07 08:27:41.627265+00', 'xby6wohabaah', '67eb0943-96bf-464b-87f9-b0c0e4d76ecc'),
	('00000000-0000-0000-0000-000000000000', 244, 'au7wy5oqttdo', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 11:14:34.127502+00', '2026-08-07 12:22:42.048926+00', NULL, 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 245, 'rz7bapms2shj', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 12:22:42.062011+00', '2026-08-07 13:20:45.980243+00', 'au7wy5oqttdo', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 246, 'mzkb3p5rfwi3', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 13:20:45.99335+00', '2026-08-07 14:58:17.405674+00', 'rz7bapms2shj', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 247, 'wnf4qyctwdnv', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 14:58:17.415967+00', '2026-08-07 15:56:51.559583+00', 'mzkb3p5rfwi3', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 248, 'idhuwz26bop6', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 15:56:51.566452+00', '2026-08-07 18:31:28.297411+00', 'wnf4qyctwdnv', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 249, 'cek7vufcljsh', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-07 18:31:28.307379+00', '2026-08-08 03:05:04.148833+00', 'idhuwz26bop6', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 250, 'fgf5visiexvi', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-08 03:05:04.165825+00', '2026-08-08 04:03:24.314506+00', 'cek7vufcljsh', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 251, 'x6jkdpacjltk', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-08 04:03:24.328254+00', '2026-08-08 05:03:51.775243+00', 'fgf5visiexvi', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 252, '4fmq3hwkj3ez', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-08 05:03:51.780072+00', '2026-08-08 06:33:31.929986+00', 'x6jkdpacjltk', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 253, 'saoehsvxgaoc', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-08 06:33:31.942691+00', '2026-08-08 07:32:27.592713+00', '4fmq3hwkj3ez', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 254, 'c6neywhvgizo', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-08 07:32:27.604141+00', '2026-08-08 08:54:26.99323+00', 'saoehsvxgaoc', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 255, 'ish4wuulr5yz', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-08 08:54:27.00197+00', '2026-08-08 10:17:21.748155+00', 'c6neywhvgizo', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 256, 'ed5hg6td5wa7', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', true, '2026-08-08 10:17:21.757752+00', '2026-08-08 11:34:24.929705+00', 'ish4wuulr5yz', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 257, 'az2t4vsu5n3g', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', false, '2026-08-08 11:34:24.936071+00', '2026-08-08 11:34:24.936071+00', 'ed5hg6td5wa7', 'd8640d72-8130-4282-b83e-0064a2798bb5'),
	('00000000-0000-0000-0000-000000000000', 258, '3u5gbflx6r24', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', false, '2026-08-08 11:35:23.184069+00', '2026-08-08 11:35:23.184069+00', NULL, '73e07c46-d461-4fbb-b1d6-ed779c49c11f'),
	('00000000-0000-0000-0000-000000000000', 232, '6ewpiltttbp3', 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', false, '2026-08-06 10:53:39.982271+00', '2026-08-06 10:53:39.982271+00', NULL, 'f740c359-a9b3-4a90-a57e-351faf7b95a2');


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
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: settings; Type: TABLE DATA; Schema: private; Owner: postgres
--



--
-- Data for Name: grammar_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grammar_groups" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 'Být', NULL, 1, '2026-08-05 09:14:51.035048+00', NULL),
	(2, 'Být - zápor', NULL, 2, '2026-08-05 09:14:54.153023+00', NULL),
	(3, 'Být - zjišťovací otázky', NULL, 3, '2026-08-05 09:15:17.211688+00', NULL),
	(4, 'Být - tázací otázky', NULL, 4, '2026-08-05 09:15:29.720409+00', NULL),
	(5, 'Množné číslo', NULL, 5, '2026-08-06 06:36:49.845629+00', NULL),
	(6, 'Přivlastňování', NULL, 6, '2026-08-06 06:37:03.733087+00', NULL),
	(7, 'Členy', NULL, 7, '2026-08-06 06:37:32.365688+00', NULL),
	(8, 'Čísla', NULL, 8, '2026-08-06 06:37:52.046818+00', NULL),
	(9, 'Časy a datumy', NULL, 9, '2026-08-06 09:09:48.964105+00', NULL),
	(10, 'Předložky časy - in, on, at', NULL, 10, '2026-08-06 09:10:08.332428+00', NULL),
	(11, 'Předložky místa - in, on, at', NULL, 11, '2026-08-06 09:10:25.182383+00', NULL),
	(12, 'Přítomný čas prostý', NULL, 12, '2026-08-06 09:11:03.250864+00', NULL);


--
-- Data for Name: grammar_chunks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grammar_chunks" ("id", "name", "note", "sort_order", "updated_at", "deleted_at", "grammar_group_id") VALUES
	(1, 'být - základní tvary', '<p>Sloveso <b>být</b> je v angličtině nepravidelné a má různé tvary podle osoby a času.</p>', 1, '2026-08-04 08:58:00.643565+00', NULL, 1),
	(9, 'přivlastňování', 'Kromě přivlastňovacích zájmen (my, your, his, her, its, our, their) se v angličtině přivlastňuje pomocí apostrofu a -s. U množného čísla zakončeného na -s se používá pouze apostrof.', 9, '2026-08-06 07:20:26.999984+00', NULL, 6),
	(7, 'být - tázací otázky', '<p>Otázky s tázacím zájmenem se tvoří inverzí slovesa <b>být</b> a podmětu, přičemž tázací zájmeno stojí na začátku věty.</p>', 7, '2026-08-05 09:21:34.000596+00', NULL, 4),
	(6, 'být - záporné zjišťovací otázky', 'Obdobně se tvoří záporné zjišťovací otázky. Ty jsou ale méně běžné.', 6, '2026-08-05 09:22:04.080065+00', NULL, 3),
	(5, 'být - kladné zjišťovací otázky', '<p>Otázky ano/ne se tvoří inverzí slovesa <b>být</b> a podmětu. Běžně se na tázací věty odpovídá nejen ano / ne, ale i příslušným tvarem slovesa být. S ano se běžně používá nezkrácený tvar, s ne zkrácený.</p>', 5, '2026-08-05 09:22:08.255992+00', NULL, 3),
	(8, 'množné číslo', '<p><b>Počitatelná podstatná jména</b> označují věci, které lze spočítat (např. book, apple, car).</p><br /><p><b>Nepočitatelná podstatná jména</b> označují látky nebo abstraktní pojmy, které nelze počítat jako jednotlivé kusy (např. water, sugar, information).</p><br /><p><b>Množné číslo</b> tvoříme u počitatelných podstatných jmen obvykle přidáním -s, u slov končících na -ch, -sh, -x, -s, -z přidáváme -es. Některá slova mají<b> nepravidelné</b> tvary.Pokud má podstatné jméno nepravidelný množný tvar, bude ten tvar uveden samostatně.</p>', 8, '2026-08-06 07:19:01.919917+00', NULL, 5),
	(10, 'členy', '<p>V angličtině rozlišujeme <b>neurčitý člen</b> (<b>a / an</b>) a <b>určitý člen</b> (<b>the</b>).</p>
<br /><p><b>A / an</b> používáme u počitatelného podstatného jména v jednotném čísle, když o něm mluvíme poprvé nebo obecně.</p><p><b>An</b> píšeme před výslovností začínající samohláskou (an apple, an hour), jinak používáme <b>a</b>.</p><p><b>The</b> používáme, když je věc konkrétní, známá z kontextu nebo už byla zmíněna:</p><br /><p>U množného čísla a u nepočitatelných podstatných jmen často člen nepoužíváme, pokud mluvíme obecně.</p>', 10, '2026-08-06 07:23:37.123585+00', NULL, 7),
	(11, 'čísla 13 až 19', '<p><b>Čísla 13 až 19</b> se tvoří příponou <b>-teen</b></p>', 11, '2026-08-06 07:25:29.086479+00', NULL, 8),
	(12, 'desítky', '<p><b>Desítky</b> od 30 výše se obvykle tvoří příponou <b>-ty</b></p>', 12, '2026-08-06 07:26:14.010028+00', NULL, 8),
	(13, 'složená čísla', '<p><b>Složená čísla</b> se tvoří spojením stovek desítek číslic</p>', 13, '2026-08-06 07:26:48.586332+00', NULL, 8),
	(14, 'řadová čísla', '<p><b>Řadová čísla</b> vyjadřují pořadí. U first, second, third jde o nepravidelné tvary, od 4 výše se obvykle tvoří příponou <b>-th</b></p>', 14, '2026-08-06 07:27:38.007463+00', NULL, 8),
	(15, 'zlomky', '<p><b>Zlomky</b> od 3 dále se obvykle tvoří jako <b>číslo + příslušná řadová číslovka</b></p>', 15, '2026-08-06 07:28:26.969996+00', NULL, 8),
	(16, 'desetinná čísla', '<p><b>Desetinná čísla</b> čteme s výrazem <b>point</b></p>', 16, '2026-08-06 07:29:06.273583+00', NULL, 8),
	(17, 'Denní časy', '<p><b>Čas</b> se v angličtině často uvádí ve 12hodinovém formátu s označením AM (ante meridiem) pro dopoledne a PM (post meridiem) pro odpoledne. Například 3:00 PM znamená 15:00.</p>', 17, '2026-08-06 09:14:40.450071+00', NULL, 9),
	(18, 'Datumy', '<p><b>Datumy</b> v angličtině se obvykle píší ve formátu měsíc-den-rok (January 1, 2020). Pro zkrácenou formu se používá číslo měsíce a dne (1/1/2020).</p>', 18, '2026-08-06 09:15:11.214321+00', NULL, 9),
	(19, 'Předložka času - in', '<p><b>In</b> používáme pro delší časové úseky jako měsíce, roky, roční období a delší části dne.</p>', 19, '2026-08-06 09:23:09.985409+00', NULL, 10),
	(20, 'Předložka času - on', '<p><b>In</b> používáme pro delší časové úseky jako měsíce, roky, roční období a delší části dne.</p>', 20, '2026-08-06 09:24:00.576447+00', NULL, 10),
	(21, 'Předložky času - at', '<p><b>At</b> používáme pro konkrétní časy a některé výrazy jako at night.</p>', 21, '2026-08-06 09:25:15.560977+00', NULL, 10),
	(22, 'Předložky místa - in', '<p><b>In</b> používáme pro označení umístění uvnitř něčeho.</p>', 22, '2026-08-06 09:26:00.863746+00', NULL, 11),
	(23, 'Předložka místa - on', '<p><b>On</b> používáme pro označení umístění na povrchu něčeho.</p>', 23, '2026-08-06 09:26:51.980424+00', NULL, 11),
	(24, 'Předložka místa - at', '<p><b>At</b> používáme pro označení konkrétního místa nebo bodu.</p>', 24, '2026-08-06 09:27:39.673137+00', NULL, 11),
	(25, 'přítomný čas prostý', '<p><b>Přítomný čas prostý (present simple)</b> používáme pro popis obecných pravd, zvyků a pravidelných činností. Tvoří se přidáním -s nebo -es u třetí osoby jednotného čísla (he, she, it) a základní tvar slovesa pro ostatní osoby.</p>', 25, '2026-08-06 09:30:04.702808+00', NULL, 12),
	(2, 'být - zkrácené tvary', '<p>V mluveném jazyce se častěji používají zkrácené tvary slovesa být.</p>', 2, '2026-08-08 06:43:57.631498+00', NULL, 1),
	(4, 'být - zkrácený zápor', '<p>V mluveném jazyce se častěji používají zkrácené záporné tvary. Mají dvě varianta:</p></br><p>1. s vnímaným větším důrazem na zápor př. <b>he''s not</b></p><p>2. běžnější př. <b>he isn''t</b></p></br><p>Ve výuce bude vždy používána varianta, která je pro danou situaci častější.</p>', 4, '2026-08-08 06:54:18.551283+00', NULL, 2),
	(3, 'být - základní zápor', '<p>V angličtině se zápor tvoří pomocí záporky <b>not</b>, které se přidává za sloveso.</p><br /><p>', 3, '2026-08-08 07:03:12.104197+00', NULL, 2);


--
-- Data for Name: blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."blocks" ("id", "name", "note", "grammar_chunk_id", "sort_order", "updated_at", "deleted_at", "show_in_topics", "is_removed_from_practice", "requires_initial_training") VALUES
	(1, 'dny v týdnu', NULL, NULL, 1, '2026-08-02 12:14:05.115542+00', NULL, true, false, false),
	(2, 'čísla 1  až 12', NULL, NULL, 2, '2026-08-02 12:14:31.093064+00', NULL, true, false, false),
	(3, 'osobní zájmena', NULL, NULL, 3, '2026-08-02 12:43:15.726633+00', NULL, true, false, false),
	(4, 'být - základní tvary', NULL, 1, NULL, '2026-08-02 12:46:58.087402+00', NULL, false, false, true),
	(5, 'být - zkrácené tvary', NULL, 2, NULL, '2026-08-02 12:48:38.833899+00', NULL, false, false, true),
	(6, 'měsíce v roce', NULL, NULL, 4, '2026-08-02 12:49:10.566201+00', NULL, true, false, false),
	(7, 'být - zápor', NULL, 3, NULL, '2026-08-02 12:50:14.202037+00', NULL, false, false, true),
	(8, 'být - zkrácený zápor', NULL, 4, NULL, '2026-08-02 12:50:38.243399+00', NULL, false, false, true),
	(9, 'množné číslo', NULL, 8, NULL, '2026-08-06 07:32:20.251623+00', NULL, false, false, true),
	(10, 'přivlastňování', NULL, 9, NULL, '2026-08-06 07:35:32.354282+00', NULL, false, false, true),
	(11, 'členy', NULL, 10, NULL, '2026-08-06 07:38:35.37714+00', NULL, false, false, true),
	(12, 'čísla 13 až 19', NULL, 11, NULL, '2026-08-06 07:40:44.534653+00', NULL, false, false, true),
	(13, 'desítky', NULL, 12, NULL, '2026-08-06 07:41:43.396603+00', NULL, false, false, true),
	(14, 'složená čísla', NULL, 13, NULL, '2026-08-06 07:42:29.369682+00', NULL, false, false, true),
	(15, 'řadová čísla', NULL, 14, NULL, '2026-08-06 07:45:42.097186+00', NULL, false, false, true),
	(16, 'zlomky', NULL, 15, NULL, '2026-08-06 07:47:12.776085+00', NULL, false, false, true),
	(17, 'desetinná čísla', NULL, 16, NULL, '2026-08-06 07:47:50.65953+00', NULL, false, false, true),
	(18, 'Denní časy', NULL, 17, NULL, '2026-08-06 09:31:06.34134+00', NULL, false, false, true),
	(19, 'Datumy', NULL, 18, NULL, '2026-08-06 09:31:23.30061+00', NULL, false, false, true),
	(20, 'Předložky času - in', NULL, 19, NULL, '2026-08-06 09:40:38.795904+00', NULL, false, false, true),
	(21, 'Předložky času - on', NULL, 20, NULL, '2026-08-06 09:40:44.557895+00', NULL, false, false, true),
	(22, 'Předložky času - at', NULL, 21, NULL, '2026-08-06 09:40:50.029541+00', NULL, false, false, true),
	(23, 'Předložka místa - in', NULL, 22, NULL, '2026-08-06 10:35:29.721666+00', NULL, false, false, true),
	(24, 'Předložka místa - on', NULL, 23, NULL, '2026-08-06 10:35:46.241107+00', NULL, false, false, true),
	(25, 'Předložka místa - at', NULL, 24, NULL, '2026-08-06 10:36:05.713975+00', NULL, false, false, true);


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."levels" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(3, 'B1', 'Intermediate', 3, '2026-07-15 08:24:48.214302+00', NULL),
	(2, 'A2', 'Elementary', 2, '2026-07-15 08:25:04.033493+00', NULL),
	(4, 'B2', 'Upper-intermediate', 4, '2026-07-15 08:25:32.653513+00', NULL),
	(5, 'C1', 'Advanced', 5, '2026-07-15 08:25:48.936448+00', NULL),
	(6, 'C2', 'Proficient', 6, '2026-07-15 08:26:15.141799+00', NULL),
	(1, 'A1', 'Beginner', 1, '2026-07-17 12:17:16.034722+00', NULL);


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."lessons" ("id", "name", "note", "level_id", "sort_order", "updated_at", "deleted_at") VALUES
	(3, 'Být', NULL, 1, 3, '2026-08-04 07:39:13.020992+00', NULL),
	(4, 'Být - zápor', NULL, 1, 4, '2026-08-04 07:39:51.775471+00', NULL),
	(1, 'Základní slovní zásoba - 1', NULL, 1, 1, '2026-08-04 07:40:03.10179+00', NULL),
	(2, 'Základní slovní zásoba - 2', NULL, 1, 2, '2026-08-04 07:40:06.857157+00', NULL),
	(5, 'Být - otázky zjišťovací', NULL, 1, 5, '2026-08-05 09:14:15.652031+00', NULL),
	(6, 'Být - otázky tázací', NULL, 1, 6, '2026-08-05 09:14:32.373207+00', NULL),
	(11, 'Časy a datumy', NULL, 1, 11, '2026-08-06 09:06:53.935701+00', NULL),
	(12, 'Předložky času -  in, on, at', NULL, 1, 12, '2026-08-06 09:07:20.659073+00', NULL),
	(13, 'Předložky místa - in, on, at', NULL, 1, 13, '2026-08-06 09:08:03.937649+00', NULL),
	(14, 'Přítomný čas prostý', NULL, 1, 14, '2026-08-06 09:08:34.408035+00', NULL),
	(10, 'Čísla', NULL, 1, 10, '2026-08-06 09:08:39.793539+00', NULL),
	(9, 'Členy', NULL, 1, 9, '2026-08-06 09:08:46.936687+00', NULL),
	(8, 'Přivlastňování', NULL, 1, 8, '2026-08-06 09:08:50.786038+00', NULL),
	(7, 'Množné číslo', NULL, 1, 7, '2026-08-06 09:08:56.250964+00', NULL);


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notes" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 'short', 'Přídavné jméno "short" se v angličtině používá označení malé (nevysoké) postavy.', 1, '2026-08-02 12:52:28.700954+00', NULL),
	(4, 'jazyk', 'V angličtině se se pro jazyk v puse používá výraz "tongue", pro jazyk ve smyslu řeč "language".', 4, '2026-08-02 13:00:22.591051+00', NULL),
	(2, 'I''m cold', 'Správný překlad výrazu "I''m cold" není doslovné "Jsem studený", ale "Je mi zima". Obdobně pro ostatní osoby.', 2, '2026-08-02 13:00:58.002468+00', NULL),
	(3, 'zájmeno "I"', 'Zájmeno "I" se v angličtině vždy píše velkým písmenem. I uprostřed věty.', 3, '2026-08-08 07:07:59.095628+00', NULL);


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."items" ("id", "czech", "english", "pronunciation", "audio", "note_id", "sort_order", "block_id", "updated_at", "deleted_at", "lesson_id", "grammar_chunk_id", "is_vocabulary") VALUES
	(1, 'ahoj', 'hello', 'həlˈoʊ', 'hello.opus', NULL, 1000, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(2, 'čau', 'hi', 'hˈaɪ', 'hi.opus', NULL, 1001, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(3, 'dobrý', 'good', 'ɡˈʊd', 'good.opus', NULL, 1002, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(4, 'ráno', 'morning', 'mˈɔːɹnɪŋ', 'morning.opus', NULL, 1003, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(5, 'odpoledne', 'afternoon', 'ˌæftɚnˈuːn', 'afternoon.opus', NULL, 1004, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(6, 'večer', 'evening', 'ˈiːvnɪŋ', 'evening.opus', NULL, 1005, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(7, 'noc', 'night', 'nˈaɪt', 'night.opus', NULL, 1006, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(8, 'den', 'day', 'dˈeɪ', 'day.opus', NULL, 1007, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(9, 'nashledanou', 'goodbye', 'ɡʊdbˈaɪ', 'goodbye.opus', NULL, 1008, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(10, 'dobré ráno', 'good morning', 'ɡˈʊd mˈɔːɹnɪŋ', 'good_morning.opus', NULL, 1009, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(11, 'dobrý večer', 'good evening', 'ɡˈʊd ˈiːvnɪŋ', 'good_evening.opus', NULL, 1010, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(12, 'dobrou noc', 'good night', 'ɡˈʊd nˈaɪt', 'good_night.opus', NULL, 1011, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(13, 'prosím', 'please', 'plˈiːz', 'please.opus', NULL, 1012, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(14, 'děkuji', 'thank you', 'θˈæŋk juː', 'thank_you.opus', NULL, 1013, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(15, 'omlouvám se', 'sorry', 'sˈɑːɹi', 'sorry.opus', NULL, 1014, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(16, 'promiňte', 'excuse me', 'ɛkskjˈuːs mˌiː', 'excuse_me.opus', NULL, 1015, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(17, 'ano', 'yes', 'jˈɛs', 'yes.opus', NULL, 1016, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(18, 'ne', 'no', 'nˈoʊ', 'no.opus', NULL, 1017, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(19, 'možná', 'maybe', 'mˈeɪbiː', 'maybe.opus', NULL, 1018, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(20, 'pondělí', 'Monday', 'mˈʌndeɪ', 'monday.opus', NULL, 1019, 1, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(21, 'úterý', 'Tuesday', 'tˈuːzdeɪ', 'tuesday.opus', NULL, 1020, 1, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(22, 'středa', 'Wednesday', 'wˈɛnzdeɪ', 'wednesday.opus', NULL, 1021, 1, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(23, 'čtvrtek', 'Thursday', 'θˈɜːzdeɪ', 'thursday.opus', NULL, 1022, 1, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(24, 'pátek', 'Friday', 'fɹˈaɪdeɪ', 'friday.opus', NULL, 1023, 1, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(25, 'sobota', 'Saturday', 'sˈæɾɚdˌeɪ', 'saturday.opus', NULL, 1024, 1, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(26, 'neděle', 'Sunday', 'sˈʌndeɪ', 'sunday.opus', NULL, 1025, 1, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(27, 'jedna', 'one', 'wˈʌn', 'one.opus', NULL, 1026, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(28, 'dva', 'two', 'tˈuː', 'two.opus', NULL, 1027, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(29, 'tři', 'three', 'θɹˈiː', 'three.opus', NULL, 1028, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(30, 'čtyři', 'four', 'fˈɔːɹ', 'four.opus', NULL, 1029, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(31, 'pět', 'five', 'fˈaɪv', 'five.opus', NULL, 1030, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(32, 'šest', 'six', 'sˈɪks', 'six.opus', NULL, 1031, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(33, 'sedm', 'seven', 'sˈɛvən', 'seven.opus', NULL, 1032, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(34, 'osm', 'eight', 'ˈeɪt', 'eight.opus', NULL, 1033, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(35, 'devět', 'nine', 'nˈaɪn', 'nine.opus', NULL, 1034, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(36, 'deset', 'ten', 'tˈɛn', 'ten.opus', NULL, 1035, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(37, 'jedenáct', 'eleven', 'ᵻlˈɛvən', 'eleven.opus', NULL, 1036, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(38, 'dvanáct', 'twelve', 'twˈɛlv', 'twelve.opus', NULL, 1037, 2, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(39, 'sto', 'hundred', 'hˈʌndɹɪd', 'hundred.opus', NULL, 1038, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(40, 'tisíc', 'thousand', 'θˈaʊzənd', 'thousand.opus', NULL, 1039, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(41, 'milion', 'million', 'mˈɪliən', 'million.opus', NULL, 1040, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(42, 'miliarda', 'billion', 'bˈɪliən', 'billion.opus', NULL, 1041, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(43, 'matka', 'mother', 'mˈʌðɚ', 'mother.opus', NULL, 1042, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(44, 'otec', 'father', 'fˈɑːðɚ', 'father.opus', NULL, 1043, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(45, 'bratr', 'brother', 'bɹˈʌðɚ', 'brother.opus', NULL, 1044, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(46, 'sestra', 'sister', 'sˈɪstɚ', 'sister.opus', NULL, 1045, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(47, 'syn', 'son', 'sˈʌn', 'son.opus', NULL, 1046, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(48, 'dcera', 'daughter', 'dˈɔːɾɚ', 'daughter.opus', NULL, 1047, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(49, 'rodiče', 'parents', 'pˈɛɹənts', 'parents.opus', NULL, 1048, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(50, 'strýc', 'uncle', 'ˈʌŋkəl', 'uncle.opus', NULL, 1049, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(51, 'teta', 'aunt', 'ˈænt', 'aunt.opus', NULL, 1050, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(52, 'bratranec', 'cousin', 'kˈʌzən', 'cousin.opus', NULL, 1051, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(53, 'sestřenice', 'cousin', 'kˈʌzən', 'cousin.opus', NULL, 1052, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(54, 'babička', 'grandmother', 'ɡɹˈændmʌðɚ', 'grandmother.opus', NULL, 1053, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(55, 'dědeček', 'grandfather', 'ɡɹˈændfɑːðɚ', 'grandfather.opus', NULL, 1054, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(56, 'máma', 'mum', 'mˈʌm', 'mum.opus', NULL, 1055, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(57, 'táta', 'dad', 'dˈæd', 'dad.opus', NULL, 1056, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(58, 'babi', 'grandma', 'ɡɹˈændmɑː', 'grandma.opus', NULL, 1057, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(59, 'děda', 'grandpa', 'ɡɹˈændpɑː', 'grandpa.opus', NULL, 1058, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(60, 'červená', 'red', 'ɹˈɛd', 'red.opus', NULL, 1059, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(61, 'modrá', 'blue', 'blˈuː', 'blue.opus', NULL, 1060, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(62, 'zelená', 'green', 'ɡɹˈiːn', 'green.opus', NULL, 1061, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(63, 'žlutá', 'yellow', 'jˈɛloʊ', 'yellow.opus', NULL, 1062, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(64, 'černá', 'black', 'blˈæk', 'black.opus', NULL, 1063, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(65, 'bílá', 'white', 'wˈaɪt', 'white.opus', NULL, 1064, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(66, 'hnědá', 'brown', 'bɹˈaʊn', 'brown.opus', NULL, 1065, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(67, 'růžová', 'pink', 'pˈɪŋk', 'pink.opus', NULL, 1066, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(68, 'oranžová', 'orange', 'ˈɔɹɪndʒ', 'orange.opus', NULL, 1067, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(69, 'fialová', 'purple', 'pˈɜːpəl', 'purple.opus', NULL, 1068, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(70, 'šedá', 'grey', 'ɡɹˈeɪ', 'grey.opus', NULL, 1069, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(71, 'zlatá', 'gold', 'ɡˈoʊld', 'gold.opus', NULL, 1070, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(72, 'stříbrná', 'silver', 'sˈɪlvɚ', 'silver.opus', NULL, 1071, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(73, 'jíst', 'eat', 'ˈiːt', 'eat.opus', NULL, 1072, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(74, 'pít', 'drink', 'dɹˈɪŋk', 'drink.opus', NULL, 1073, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(75, 'jít', 'go', 'ɡˈoʊ', 'go.opus', NULL, 1074, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(76, 'přijít', 'come', 'kˈʌm', 'come.opus', NULL, 1075, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(77, 'hrát', 'play', 'plˈeɪ', 'play.opus', NULL, 1076, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(78, 'číst', 'read', 'ɹˈiːd', 'read.opus', NULL, 1077, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(79, 'psát', 'write', 'ɹˈaɪt', 'write.opus', NULL, 1078, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(80, 'běžet', 'run', 'ɹˈʌn', 'run.opus', NULL, 1079, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(81, 'chodit', 'walk', 'wˈɔːk', 'walk.opus', NULL, 1080, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(82, 'mluvit', 'talk', 'tˈɔːk', 'talk.opus', NULL, 1081, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(83, 'spát', 'sleep', 'slˈiːp', 'sleep.opus', NULL, 1082, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(84, 'pracovat', 'work', 'wˈɜːk', 'work.opus', NULL, 1083, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(85, 'sedět', 'sit', 'sˈɪt', 'sit.opus', NULL, 1084, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(86, 'stát', 'stand', 'stˈænd', 'stand.opus', NULL, 1085, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(87, 'otevřít', 'open', 'ˈoʊpən', 'open.opus', NULL, 1086, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(88, 'zavřít', 'close', 'klˈoʊs', 'close.opus', NULL, 1087, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(89, 'koupit', 'buy', 'bˈaɪ', 'buy.opus', NULL, 1088, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(90, 'prodat', 'sell', 'sˈɛl', 'sell.opus', NULL, 1089, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(91, 'vařit', 'cook', 'kˈʊk', 'cook.opus', NULL, 1090, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(92, 'týden', 'week', 'wˈiːk', 'week.opus', NULL, 1091, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(93, 'měsíc (kalendářní)', 'month', 'mˈʌnθ', 'month.opus', NULL, 1092, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(94, 'rok', 'year', 'jˈɪɹ', 'year.opus', NULL, 1093, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(95, 'dnes', 'today', 'tədˈeɪ', 'today.opus', NULL, 1094, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(96, 'zítra', 'tomorrow', 'təmˈɑːɹoʊ', 'tomorrow.opus', NULL, 1095, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(97, 'včera', 'yesterday', 'jˈɛstɚdˌeɪ', 'yesterday.opus', NULL, 1096, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(98, 'hodina', 'hour', 'ˈaʊɚ', 'hour.opus', NULL, 1097, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(99, 'minuta', 'minute', 'mˈɪnɪt', 'minute.opus', NULL, 1098, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(100, 'sekunda', 'second', 'sˈɛkənd', 'second.opus', NULL, 1099, NULL, '2026-08-07 11:12:55.668362+00', NULL, 1, NULL, true),
	(101, 'kniha', 'book', 'bˈʊk', 'book.opus', NULL, 2000, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(102, 'pero (psací)', 'pen', 'pˈɛn', 'pen.opus', NULL, 2001, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(103, 'stůl', 'table', 'tˈeɪbəl', 'table.opus', NULL, 2002, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(104, 'židle', 'chair', 'tʃˈɛɹ', 'chair.opus', NULL, 2003, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(105, 'škola', 'school', 'skˈuːl', 'school.opus', NULL, 2004, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(106, 'učitel', 'teacher', 'tˈiːtʃɚ', 'teacher.opus', NULL, 2005, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(107, 'žák', 'pupil', 'pjˈuːpəl', 'pupil.opus', NULL, 2006, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(108, 'taška', 'bag', 'bˈæɡ', 'bag.opus', NULL, 2007, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(109, 'dům', 'house', 'hˈaʊs', 'house.opus', NULL, 2008, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(110, 'auto', 'car', 'kˈɑːɹ', 'car.opus', NULL, 2009, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(111, 'telefon', 'phone', 'fˈoʊn', 'phone.opus', NULL, 2010, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(112, 'postel', 'bed', 'bˈɛd', 'bed.opus', NULL, 2011, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(113, 'počítač', 'computer', 'kəmpjˈuːɾɚ', 'computer.opus', NULL, 2012, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(114, 'hodiny (přístroj)', 'clock', 'klˈɑːk', 'clock.opus', NULL, 2013, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(115, 'horký', 'hot', 'hˈɑːt', 'hot.opus', NULL, 2014, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(116, 'studený', 'cold', 'kˈoʊld', 'cold.opus', NULL, 2015, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(117, 'velký', 'big', 'bˈɪɡ', 'big.opus', NULL, 2016, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(118, 'malý', 'small', 'smˈɔːl', 'small.opus', NULL, 2017, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(119, 'šťastný', 'happy', 'hˈæpi', 'happy.opus', NULL, 2018, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(120, 'smutný', 'sad', 'sˈæd', 'sad.opus', NULL, 2019, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(121, 'špatný', 'bad', 'bˈæd', 'bad.opus', NULL, 2020, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(122, 'rychlý', 'fast', 'fˈæst', 'fast.opus', NULL, 2021, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(123, 'pomalý', 'slow', 'slˈoʊ', 'slow.opus', NULL, 2022, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(124, 'vysoký', 'tall', 'tˈɔːl', 'tall.opus', NULL, 2023, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(125, 'krátký', 'short', 'ʃˈɔːɹt', 'short.opus', 1, 2024, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(126, 'světlý', 'light', 'lˈaɪt', 'light.opus', NULL, 2025, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(127, 'tmavý', 'dark', 'dˈɑːɹk', 'dark.opus', NULL, 2026, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(128, 'mladý', 'young', 'jˈʌŋ', 'young.opus', NULL, 2027, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(129, 'starý', 'old', 'ˈoʊld', 'old.opus', NULL, 2028, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(130, 'snadný', 'easy', 'ˈiːzi', 'easy.opus', NULL, 2029, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(131, 'těžký', 'hard', 'hˈɑːɹd', 'hard.opus', NULL, 2030, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(132, 'blízko', 'near', 'nˈɪɹ', 'near.opus', NULL, 2031, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(133, 'daleko', 'far', 'fˈɑːɹ', 'far.opus', NULL, 2032, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(134, 'hlava', 'head', 'hˈɛd', 'head.opus', NULL, 2033, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(135, 'vlasy', 'hair', 'hˈɛɹ', 'hair.opus', NULL, 2034, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(136, 'oko', 'eye', 'ˈaɪ', 'eye.opus', NULL, 2035, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(137, 'ucho', 'ear', 'ˈɪɹ', 'ear.opus', NULL, 2036, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(138, 'nos', 'nose', 'nˈoʊz', 'nose.opus', NULL, 2037, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(139, 'ústa', 'mouth', 'mˈaʊθ', 'mouth.opus', NULL, 2038, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(140, 'zuby', 'teeth', 'tˈiːθ', 'teeth.opus', NULL, 2039, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(141, 'jazyk', 'tongue', 'tˈʌŋ', 'tongue.opus', 4, 2040, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(142, 'krk', 'neck', 'nˈɛk', 'neck.opus', NULL, 2041, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(143, 'ruka', 'hand', 'hˈænd', 'hand.opus', NULL, 2042, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(144, 'paže', 'arm', 'ˈɑːɹm', 'arm.opus', NULL, 2043, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(145, 'noha', 'leg', 'lˈɛɡ', 'leg.opus', NULL, 2044, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(146, 'chodidlo', 'foot', 'fˈʊt', 'foot.opus', NULL, 2045, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(147, 'prst', 'finger', 'fˈɪŋɡɚ', 'finger.opus', NULL, 2046, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(148, 'prst na noze', 'toe', 'tˈoʊ', 'toe.opus', NULL, 2047, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(149, 'břicho', 'stomach', 'stˈʌmək', 'stomach.opus', NULL, 2048, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(150, 'záda', 'back', 'bˈæk', 'back.opus', NULL, 2049, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(151, 'chleba', 'bread', 'bɹˈɛd', 'bread.opus', NULL, 2050, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(152, 'rýže', 'rice', 'ɹˈaɪs', 'rice.opus', NULL, 2051, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(153, 'voda', 'water', 'wˈɔːɾɚ', 'water.opus', NULL, 2052, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(154, 'mléko', 'milk', 'mˈɪlk', 'milk.opus', NULL, 2053, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(155, 'jablko', 'apple', 'ˈæpəl', 'apple.opus', NULL, 2054, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(156, 'banán', 'banana', 'bɐnˈænə', 'banana.opus', NULL, 2055, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(157, 'pomeranč', 'orange', 'ˈɔɹɪndʒ', 'orange.opus', NULL, 2056, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(158, 'mango', 'mango', 'mˈæŋɡoʊ', 'mango.opus', NULL, 2057, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(159, 'maso', 'meat', 'mˈiːt', 'meat.opus', NULL, 2058, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(160, 'ryba', 'fish', 'fˈɪʃ', 'fish.opus', NULL, 2059, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(161, 'vejce', 'egg', 'ˈɛɡ', 'egg.opus', NULL, 2060, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(162, 'sýr', 'cheese', 'tʃˈiːz', 'cheese.opus', NULL, 2061, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(163, 'polévka', 'soup', 'sˈuːp', 'soup.opus', NULL, 2062, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(164, 'čaj', 'tea', 'tˈiː', 'tea.opus', NULL, 2063, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(165, 'káva', 'coffee', 'kˈɔfi', 'coffee.opus', NULL, 2064, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(166, 'džus', 'juice', 'dʒˈuːs', 'juice.opus', NULL, 2065, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(167, 'cukr', 'sugar', 'ʃˈʊɡɚ', 'sugar.opus', NULL, 2066, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(168, 'sůl', 'salt', 'sˈɔlt', 'salt.opus', NULL, 2067, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(169, 'slunce', 'sun', 'sˈʌn', 'sun.opus', NULL, 2068, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(170, 'déšť', 'rain', 'ɹˈeɪn', 'rain.opus', NULL, 2069, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(171, 'mrak', 'cloud', 'klˈaʊd', 'cloud.opus', NULL, 2070, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(172, 'sníh', 'snow', 'snˈoʊ', 'snow.opus', NULL, 2071, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(173, 'vítr', 'wind', 'wˈɪnd', 'wind.opus', NULL, 2072, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(174, 'bouře', 'storm', 'stˈɔːɹm', 'storm.opus', NULL, 2073, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(175, 'teplý', 'warm', 'wˈɔːɹm', 'warm.opus', NULL, 2074, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(176, 'léto', 'summer', 'sˈʌmɚ', 'summer.opus', NULL, 2075, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(177, 'zima', 'winter', 'wˈɪntɚ', 'winter.opus', NULL, 2076, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(178, 'jaro', 'spring', 'spɹˈɪŋ', 'spring.opus', NULL, 2077, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(179, 'podzim', 'autumn', 'ˈɔːɾʌm', 'autumn.opus', NULL, 2078, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(180, 'domov', 'home', 'hˈoʊm', 'home.opus', NULL, 2079, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(181, 'park', 'park', 'pˈɑːɹk', 'park.opus', NULL, 2080, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(182, 'nemocnice', 'hospital', 'hˈɑːspɪɾəl', 'hospital.opus', NULL, 2081, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(183, 'obchod', 'shop', 'ʃˈɑːp', 'shop.opus', NULL, 2082, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(184, 'trh', 'market', 'mˈɑːɹkɪt', 'market.opus', NULL, 2083, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(185, 'kancelář', 'office', 'ˈɑːfɪs', 'office.opus', NULL, 2084, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(186, 'banka', 'bank', 'bˈæŋk', 'bank.opus', NULL, 2085, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(187, 'restaurace', 'restaurant', 'ɹˈɛstɹɑːnt', 'restaurant.opus', NULL, 2086, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(188, 'nádraží', 'station', 'stˈeɪʃən', 'station.opus', NULL, 2087, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(189, 'letiště', 'airport', 'ˈɛɹpɔːɹt', 'airport.opus', NULL, 2088, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(190, 'ulice', 'street', 'stɹˈiːt', 'street.opus', NULL, 2089, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(191, 'město', 'city', 'sˈɪɾi', 'city.opus', NULL, 2090, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(192, 'vesnice', 'village', 'vˈɪlɪdʒ', 'village.opus', NULL, 2091, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(193, 'země', 'country', 'kˈʌntɹi', 'country.opus', NULL, 2092, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(194, 'košile', 'shirt', 'ʃˈɜːt', 'shirt.opus', NULL, 2093, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(195, 'tričko', 't-shirt', 'tˈiːʃˈɜːt', 'tshirt.opus', NULL, 2094, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(196, 'kalhoty', 'trousers', 'tɹˈaʊsɚz', 'trousers.opus', NULL, 2095, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(197, 'sukně', 'skirt', 'skˈɜːt', 'skirt.opus', NULL, 2096, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(198, 'boty', 'shoes', 'ʃˈuːz', 'shoes.opus', NULL, 2097, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(199, 'ponožky', 'socks', 'sˈɑːks', 'socks.opus', NULL, 2098, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(200, 'klobouk', 'hat', 'hˈæt', 'hat.opus', NULL, 2099, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(201, 'kabát', 'coat', 'kˈoʊt', 'coat.opus', NULL, 2100, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(202, 'bunda', 'jacket', 'dʒˈækɪt', 'jacket.opus', NULL, 2101, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(203, 'svetr', 'sweater', 'swˈɛɾɚ', 'sweater.opus', NULL, 2102, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(204, 'rukavice', 'gloves', 'ɡlˈʌvz', 'gloves.opus', NULL, 2103, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(205, 'šála', 'scarf', 'skˈɑːɹf', 'scarf.opus', NULL, 2104, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(206, 'pes', 'dog', 'dˈɑːɡ', 'dog.opus', NULL, 2105, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(207, 'kočka', 'cat', 'kˈæt', 'cat.opus', NULL, 2106, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(208, 'kráva', 'cow', 'kˈaʊ', 'cow.opus', NULL, 2107, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(209, 'koza', 'goat', 'ɡˈoʊt', 'goat.opus', NULL, 2108, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(210, 'kůň', 'horse', 'hˈɔːɹs', 'horse.opus', NULL, 2109, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(211, 'ovce', 'sheep', 'ʃˈiːp', 'sheep.opus', NULL, 2110, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(212, 'kuře', 'chicken', 'tʃˈɪkɪn', 'chicken.opus', NULL, 2111, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(213, 'pták', 'bird', 'bˈɜːd', 'bird.opus', NULL, 2112, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(214, 'kachna', 'duck', 'dˈʌk', 'duck.opus', NULL, 2113, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(215, 'lev', 'lion', 'lˈaɪən', 'lion.opus', NULL, 2114, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(216, 'tygr', 'tiger', 'tˈaɪɡɚ', 'tiger.opus', NULL, 2115, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(217, 'slon', 'elephant', 'ˈɛlɪfənt', 'elephant.opus', NULL, 2116, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(218, 'opice', 'monkey', 'mˈʌŋki', 'monkey.opus', NULL, 2117, NULL, '2026-08-07 11:13:02.728178+00', NULL, 2, NULL, true),
	(219, 'já', 'I', 'ˈaɪ', 'i.opus', 3, 3000, 3, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(220, 'ty', 'you', 'jˈuː', 'you.opus', NULL, 3001, 3, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(221, 'on', 'he', 'hˈiː', 'he.opus', NULL, 3002, 3, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(222, 'ona', 'she', 'ʃˈiː', 'she.opus', NULL, 3003, 3, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(223, 'ono', 'it', 'ˈɪt', 'it.opus', NULL, 3004, 3, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(224, 'my', 'we', 'wˈiː', 'we.opus', NULL, 3005, 3, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(225, 'vy', 'you', 'jˈuː', 'you.opus', NULL, 3006, 3, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(226, 'oni', 'they', 'ðˈeɪ', 'they.opus', NULL, 3007, 3, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(227, 'já jsem', 'I am', 'aɪˈæm', 'i_am.opus', NULL, 3008, 4, '2026-08-08 07:12:02.156964+00', NULL, 3, 1, false),
	(228, 'ty jsi', 'you are', 'juː ˈɑːɹ', 'you_are.opus', NULL, 3009, 4, '2026-08-08 07:12:02.156964+00', NULL, 3, 1, false),
	(229, 'on je', 'he is', 'hiː ˈɪz', 'he_is.opus', NULL, 3010, 4, '2026-08-08 07:12:02.156964+00', NULL, 3, 1, false),
	(230, 'ona je', 'she is', 'ʃiː ˈɪz', 'she_is.opus', NULL, 3011, 4, '2026-08-08 07:12:02.156964+00', NULL, 3, 1, false),
	(231, 'to je', 'it is', 'ɪɾ ˈɪz', 'it_is.opus', NULL, 3012, 4, '2026-08-08 07:12:02.156964+00', NULL, 3, 1, false),
	(232, 'my jsme', 'we are', 'wiː ˈɑːɹ', 'we_are.opus', NULL, 3013, 4, '2026-08-08 07:12:02.156964+00', NULL, 3, 1, false),
	(233, 'vy jste', 'you are', 'juː ˈɑːɹ', 'you_are.opus', NULL, 3014, 4, '2026-08-08 07:12:02.156964+00', NULL, 3, 1, false),
	(234, 'oni jsou', 'they are', 'ðeɪ ˈɑːɹ', 'they_are.opus', NULL, 3015, 4, '2026-08-08 07:12:02.156964+00', NULL, 3, 1, false),
	(235, 'angličtina', 'English', 'ˈɪŋɡlɪʃ', 'english.opus', NULL, 3016, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(236, 'čeština', 'Czech', 'tʃˈɛk', 'czech.opus', NULL, 3017, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(237, 'být', 'be', 'bˈiː', 'be.opus', NULL, 3018, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(238, 'unavený', 'tired', 'tˈaɪɚd', 'tired.opus', NULL, 3019, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(239, 'hladový', 'hungry', 'hˈʌŋɡɹi', 'hungry.opus', NULL, 3020, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(240, 'přítel', 'friend', 'fɹˈɛnd', 'friend.opus', NULL, 3021, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(241, 'přátelský', 'friendly', 'fɹˈɛndli', 'friendly.opus', NULL, 3022, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(242, 'naštvaný', 'angry', 'ˈæŋɡɹi', 'angry.opus', NULL, 3023, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(243, 'já jsem (zk.)', 'I''m', 'ˈaɪm', 'im.opus', NULL, 3024, 5, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(244, 'ty jsi (zk.)', 'you''re', 'jˈʊɹ', 'youre.opus', NULL, 3025, 5, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(245, 'on je (zk.)', 'he''s', 'hˈiːz', 'hes.opus', NULL, 3026, 5, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(246, 'ona je (zk.)', 'she''s', 'ʃˈiːz', 'shes.opus', NULL, 3027, 5, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(247, 'to je (zk.)', 'it''s', 'ˈɪts', 'its.opus', NULL, 3028, 5, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(248, 'my jsme (zk.)', 'we''re', 'wˈɪɹ', 'were.opus', NULL, 3029, 5, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(249, 'vy jste (zk.)', 'you''re', 'jˈʊɹ', 'youre.opus', NULL, 3030, 5, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(250, 'oni jsou (zk.)', 'they''re', 'ðeɪˈɚ', 'theyre.opus', NULL, 3031, 5, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(251, 'krásný', 'beautiful', 'bjˈuːɾifəl', 'beautiful.opus', NULL, 3032, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(252, 'ošklivý', 'ugly', 'ˈʌɡli', 'ugly.opus', NULL, 3033, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(253, 'silný', 'strong', 'stɹˈɔŋ', 'strong.opus', NULL, 3034, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(254, 'slabý', 'weak', 'wˈiːk', 'weak.opus', NULL, 3035, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(255, 'bohatý', 'rich', 'ɹˈɪtʃ', 'rich.opus', NULL, 3036, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(256, 'chudý', 'poor', 'pˈʊɹ', 'poor.opus', NULL, 3037, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(257, 'čistý', 'clean', 'klˈiːn', 'clean.opus', NULL, 3038, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(258, 'špinavý', 'dirty', 'dˈɜːɾi', 'dirty.opus', NULL, 3039, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(259, 'Já jsem šťastný.', 'I''m happy.', 'aɪm hˈæpi', 'im_happy.opus', NULL, 3040, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(260, 'Ty jsi smutný.', 'You''re sad.', 'jʊɹ sˈæd', 'youre_sad.opus', NULL, 3041, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(261, 'On je vysoký.', 'He''s tall.', 'hiːz tˈɔːl', 'hes_tall.opus', NULL, 3042, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(262, 'Ona je malá.', 'She''s small.', 'ʃiːz smˈɔːl', 'shes_small.opus', NULL, 3043, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(263, 'Je to špatné.', 'It''s bad.', 'ɪts bˈæd', 'its_bad.opus', NULL, 3044, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(264, 'My jsme bohatí.', 'We''re rich.', 'wɪɹ ɹˈɪtʃ', 'were_rich.opus', NULL, 3045, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(265, 'Vy jste mladí.', 'You''re young.', 'jʊɹ jˈʌŋ', 'youre_young.opus', NULL, 3046, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(266, 'Oni jsou staří.', 'They''re old.', 'ðeɪɚɹ ˈoʊld', 'theyre_old.opus', NULL, 3047, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(267, 'zde', 'here', 'hˈɪɹ', 'here.opus', NULL, 3048, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(268, 'tam', 'there', 'ðˈɛɹ', 'there.opus', NULL, 3049, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(269, 'dítě', 'child', 'tʃˈaɪld', 'child.opus', NULL, 3050, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(270, 'muž', 'man', 'mˈæn', 'man.opus', NULL, 3051, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(271, 'žena', 'woman', 'wˈʊmən', 'woman.opus', NULL, 3052, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(272, 'jídlo', 'food', 'fˈuːd', 'food.opus', NULL, 3053, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(273, 'pití', 'drink', 'dɹˈɪŋk', 'drink.opus', NULL, 3054, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(274, 'měsíc (na nebi)', 'moon', 'mˈuːn', 'moon.opus', NULL, 3055, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(275, 'Já jsem hladový.', 'I''m hungry.', 'aɪm hˈʌŋɡɹi', 'im_hungry.opus', NULL, 3056, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(276, 'Ty jsi unavená.', 'You''re tired.', 'jʊɹ tˈaɪɚd', 'youre_tired.opus', NULL, 3057, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(277, 'On je přátelský.', 'He''s friendly.', 'hiːz fɹˈɛndli', 'hes_friendly.opus', NULL, 3058, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(278, 'Je jí zima.', 'She''s cold.', 'ʃiːz kˈoʊld', 'shes_cold.opus', 2, 3059, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(279, 'Je to jednoduché.', 'It''s easy.', 'ɪts ˈiːzi', 'its_easy.opus', NULL, 3060, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(280, 'My jsme naštvaní.', 'We''re angry.', 'wɪɹ ˈæŋɡɹi', 'were_angry.opus', NULL, 3061, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(281, 'Vy jste oškliví.', 'You''re ugly.', 'jʊɹ ˈʌɡli', 'youre_ugly.opus', NULL, 3062, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(282, 'Oni jsou rychlí.', 'They''re fast.', 'ðeɪɚ fˈæst', 'theyre_fast.opus', NULL, 3063, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(283, 'obtížný', 'difficult', 'dˈɪfɪkəlt', 'difficult.opus', NULL, 3064, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(284, 'po', 'after', 'ˈæftɚ', 'after.opus', NULL, 3065, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(285, 'poledne', 'noon', 'nˈuːn', 'noon.opus', NULL, 3066, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(286, 'kdo', 'who', 'hˈuː', 'who.opus', NULL, 3067, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(287, 'co', 'what', 'wˈʌt', 'what.opus', NULL, 3068, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(288, 'kde', 'where', 'wˈɛɹ', 'where.opus', NULL, 3069, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(289, 'proč', 'why', 'wˈaɪ', 'why.opus', NULL, 3070, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(290, 'jak', 'how', 'hˈaʊ', 'how.opus', NULL, 3071, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, NULL, true),
	(291, 'Já jsem chudý.', 'I''m poor.', 'aɪm pˈʊɹ', 'im_poor.opus', NULL, 3072, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(292, 'Ty jsi krásná.', 'You''re beautiful.', 'jʊɹ bjˈuːɾifəl', 'youre_beautiful.opus', NULL, 3073, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(293, 'On je pomalý.', 'He''s slow.', 'hiːz slˈoʊ', 'hes_slow.opus', NULL, 3074, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(294, 'Ona je špinavá.', 'She''s dirty.', 'ʃiːz dˈɜːɾi', 'shes_dirty.opus', NULL, 3075, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(295, 'Je to čisté.', 'It''s clean.', 'ɪts klˈiːn', 'its_clean.opus', NULL, 3076, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(296, 'My jsme slabí.', 'We''re weak.', 'wɪɹ wˈiːk', 'were_weak.opus', NULL, 3077, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(297, 'Vy jste silní.', 'You''re strong.', 'jʊɹ stɹˈɔŋ', 'youre_strong.opus', NULL, 3078, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(298, 'Oni jsou dobří.', 'They''re good.', 'ðeɪɚ ɡˈʊd', 'theyre_good.opus', NULL, 3079, NULL, '2026-08-08 07:12:02.156964+00', NULL, 3, 2, false),
	(299, 'leden', 'January', 'dʒˈænjuːˌɛɹi', 'january.opus', NULL, 4000, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(300, 'únor', 'February', 'fˈɛbɹuːˌɛɹi', 'february.opus', NULL, 4001, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(301, 'březen', 'March', 'mˈɑːɹtʃ', 'march.opus', NULL, 4002, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(302, 'duben', 'April', 'ˈeɪpɹəl', 'april.opus', NULL, 4003, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(303, 'květen', 'May', 'mˈeɪ', 'may.opus', NULL, 4004, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(304, 'červen', 'June', 'dʒˈuːn', 'june.opus', NULL, 4005, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(305, 'červenec', 'July', 'dʒuːlˈaɪ', 'july.opus', NULL, 4006, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(306, 'srpen', 'August', 'ˈɔːɡəst', 'august.opus', NULL, 4007, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(307, 'září', 'September', 'sɛptˈɛmbɚ', 'september.opus', NULL, 4008, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(308, 'říjen', 'October', 'ɑːktˈoʊbɚ', 'october.opus', NULL, 4009, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(309, 'listopad', 'November', 'noʊvˈɛmbɚ', 'november.opus', NULL, 4010, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(310, 'prosinec', 'December', 'dᵻsˈɛmbɚ', 'december.opus', NULL, 4011, 6, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(311, 'já nejsem', 'I am not', 'aɪɐm nˈɑːt', 'i_am_not.opus', NULL, 4012, 7, '2026-08-08 07:12:11.086463+00', NULL, 4, 3, false),
	(312, 'ty nejsi', 'you are not', 'juː ɑːɹ nˈɑːt', 'you_are_not.opus', NULL, 4013, 7, '2026-08-08 07:12:11.086463+00', NULL, 4, 3, false),
	(313, 'on není', 'he is not', 'hiː ɪz nˈɑːt', 'he_is_not.opus', NULL, 4014, 7, '2026-08-08 07:12:11.086463+00', NULL, 4, 3, false),
	(314, 'ona není', 'she is not', 'ʃiː ɪz nˈɑːt', 'she_is_not.opus', NULL, 4015, 7, '2026-08-08 07:12:11.086463+00', NULL, 4, 3, false),
	(315, 'to není', 'it is not', 'ɪɾ ɪz nˈɑːt', 'it_is_not.opus', NULL, 4016, 7, '2026-08-08 07:12:11.086463+00', NULL, 4, 3, false),
	(316, 'my nejsme', 'we are not', 'wiː ɑːɹ nˈɑːt', 'we_are_not.opus', NULL, 4017, 7, '2026-08-08 07:12:11.086463+00', NULL, 4, 3, false),
	(317, 'vy nejste', 'you are not', 'juː ɑːɹ nˈɑːt', 'you_are_not.opus', NULL, 4018, 7, '2026-08-08 07:12:11.086463+00', NULL, 4, 3, false),
	(318, 'oni nejsou', 'they are not', 'ðeɪ ɑːɹ nˈɑːt', 'they_are_not.opus', NULL, 4019, 7, '2026-08-08 07:12:11.086463+00', NULL, 4, 3, false),
	(319, 'mít', 'have', 'hˈæv', 'have.opus', NULL, 4020, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(320, 'číslo', 'number', 'nˈʌmbɚ', 'number.opus', NULL, 4021, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(321, 'bochník', 'loaf', 'lˈoʊf', 'loaf.opus', NULL, 4022, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(322, 'šálek', 'cup', 'kˈʌp', 'cup.opus', NULL, 4023, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(323, 'já nejsem (zk.)', 'I''m not', 'aɪm nˈɑːt', 'im_not.opus', NULL, 4024, 8, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(324, 'ty nejsi (zk.)', 'you aren''t', 'juː ˈɑːɹnt', 'you_arent.opus', NULL, 4025, 8, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(325, 'on není (zk.)', 'he isn''t', 'hiː ˈɪzənt', 'he_isnt.opus', NULL, 4026, 8, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(326, 'ona není (zk.)', 'she isn''t', 'ʃiː ˈɪzənt', 'she_isnt.opus', NULL, 4027, 8, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(327, 'to není (zk.)', 'it isn''t', 'ɪɾ ˈɪzənt', 'it_isnt.opus', NULL, 4028, 8, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(328, 'my nejsme (zk.)', 'we aren''t', 'wiː ˈɑːɹnt', 'we_arent.opus', NULL, 4029, 8, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(329, 'vy nejste (zk.)', 'you aren''t', 'juː ˈɑːɹnt', 'you_arent.opus', NULL, 4030, 8, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(330, 'oni nejsou (zk.)', 'they aren''t', 'ðeɪ ˈɑːɹnt', 'they_arent.opus', NULL, 4031, 8, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(331, 'sklenice', 'glass', 'ɡlˈæs', 'glass.opus', NULL, 4032, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(332, 'myš', 'mouse', 'mˈaʊs', 'mouse.opus', NULL, 4033, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(333, 'dopis', 'letter', 'lˈɛɾɚ', 'letter.opus', NULL, 4034, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(334, 'věc', 'thing', 'θˈɪŋ', 'thing.opus', NULL, 4035, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(335, 'žádný', 'none', 'nˈʌn', 'none.opus', NULL, 4036, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(336, 'nic', 'nothing', 'nˈʌθɪŋ', 'nothing.opus', NULL, 4037, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(337, 'nějaký', 'some', 'sˈʌm', 'some.opus', NULL, 4038, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(338, 'něco', 'something', 'sˈʌmθɪŋ', 'something.opus', NULL, 4039, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(339, 'Já nejsem šťastný.', 'I''m not happy.', 'aɪm nˌɑːt hˈæpi', 'im_not_happy.opus', NULL, 4040, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(340, 'Ty nejsi smutný.', 'You aren''t sad.', 'juː ˌɑːɹnt sˈæd', 'you_arent_sad.opus', NULL, 4041, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(341, 'On není velký.', 'He isn''t big.', 'hiː ˌɪzənt bˈɪɡ', 'he_isnt_big.opus', NULL, 4042, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(342, 'Ona není malá.', 'She isn''t small.', 'ʃiː ˌɪzənt smˈɔːl', 'she_isnt_small.opus', NULL, 4043, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(343, 'Není to špatné.', 'It isn''t bad.', 'ɪɾ ˌɪzənt bˈæd', 'it_isnt_bad.opus', NULL, 4044, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(344, 'My nejsme mladí.', 'We aren''t young.', 'wiː ˌɑːɹnt jˈʌŋ', 'we_arent_young.opus', NULL, 4045, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(345, 'Vy nejste staří.', 'You aren''t old.', 'juː ˌɑːɹnt ˈoʊld', 'you_arent_old.opus', NULL, 4046, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(346, 'Oni nejsou vysocí.', 'They aren''t tall.', 'ðeɪ ˌɑːɹnt tˈɔːl', 'they_arent_tall.opus', NULL, 4047, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(347, 'jakýkoliv', 'any', 'ˈɛni', 'any.opus', NULL, 4048, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(348, 'cokoliv', 'anything', 'ˈɛnɪθˌɪŋ', 'anything.opus', NULL, 4049, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(349, 'který', 'which', 'wˈɪtʃ', 'which.opus', NULL, 4050, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(350, 'čí', 'whose', 'hˈuːz', 'whose.opus', NULL, 4051, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(351, 'z', 'from', 'fɹˈʌm', 'from.opus', NULL, 4052, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(352, 'jméno', 'name', 'nˈeɪm', 'name.opus', NULL, 4053, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(353, 'špatně', 'wrong', 'ɹˈɔŋ', 'wrong.opus', NULL, 4054, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(354, 'čas', 'time', 'tˈaɪm', 'time.opus', NULL, 4055, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(355, 'Já nejsem hladový.', 'I''m not hungry.', 'aɪm nˌɑːt hˈʌŋɡɹi', 'im_not_hungry.opus', NULL, 4056, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(356, 'Ty nejsi unavená.', 'You aren''t tired.', 'juː ˌɑːɹnt tˈaɪɚd', 'you_arent_tired.opus', NULL, 4057, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(357, 'On není přátelský.', 'He isn''t friendly.', 'hiː ˌɪzənt fɹˈɛndli', 'he_isnt_friendly.opus', NULL, 4058, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(358, 'Ona není naštvaná.', 'She isn''t angry.', 'ʃiː ˌɪzənt ˈæŋɡɹi', 'she_isnt_angry.opus', NULL, 4059, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(359, 'To není dobré.', 'It isn''t good.', 'ɪɾ ˌɪzənt ɡˈʊd', 'it_isnt_good.opus', NULL, 4060, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(360, 'Není nám zima.', 'We aren''t cold.', 'wiː ˌɑːɹnt kˈoʊld', 'we_arent_cold.opus', 2, 4061, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(361, 'Vy nejste oškliví.', 'You aren''t ugly.', 'juː ˌɑːɹnt ˈʌɡli', 'you_arent_ugly.opus', NULL, 4062, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(362, 'Oni nejsou krásní.', 'They aren''t beautiful.', 'ðeɪ ˌɑːɹnt bjˈuːɾifəl', 'they_arent_beautiful.opus', NULL, 4063, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(363, 'toto', 'this', 'ðˈɪs', 'this.opus', NULL, 4064, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(364, 'tamto', 'that', 'ðˈæt', 'that.opus', NULL, 4065, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(365, 'tyto', 'these', 'ðˈiːz', 'these.opus', NULL, 4066, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(366, 'ti', 'those', 'ðˈoʊz', 'those.opus', NULL, 4067, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(367, 'student', 'student', 'stˈuːdənt', 'student.opus', NULL, 4068, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(369, 'vzduch', 'air', 'ˈɛɹ', 'air.opus', NULL, 4070, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(370, 'sklad', 'store', 'stˈɔːɹ', 'store.opus', NULL, 4071, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, NULL, true),
	(371, 'Já nejsem slabý.', 'I''m not weak.', 'aɪm nˌɑːt wˈiːk', 'im_not_weak.opus', NULL, 4072, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(372, 'Ty nejsi silný.', 'You aren''t strong.', 'juː ˌɑːɹnt stɹˈɔŋ', 'you_arent_strong.opus', NULL, 4073, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(373, 'On není špinavý.', 'He isn''t dirty.', 'hiː ˌɪzənt dˈɜːɾi', 'he_isnt_dirty.opus', NULL, 4074, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(374, 'Ona není čistá.', 'She isn''t clean.', 'ʃiː ˌɪzənt klˈiːn', 'she_isnt_clean.opus', NULL, 4075, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(375, 'Není to snadné.', 'It isn''t easy.', 'ɪɾ ˌɪzənt ˈiːzi', 'it_isnt_easy.opus', NULL, 4076, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(376, 'My nejsme chudí.', 'We aren''t poor.', 'wiː ˌɑːɹnt pˈʊɹ', 'we_arent_poor.opus', NULL, 4077, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(377, 'Vy nejste bohatí.', 'You aren''t rich.', 'juː ˌɑːɹnt ɹˈɪtʃ', 'you_arent_rich.opus', NULL, 4078, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(378, 'Oni nejsou pomalí.', 'They aren''t slow.', 'ðeɪ ˌɑːɹnt slˈoʊ', 'they_arent_slow.opus', NULL, 4079, NULL, '2026-08-08 07:12:11.086463+00', NULL, 4, 4, false),
	(368, 'žít', 'live', 'lˈaɪv', 'live_IPA_liv.opus', NULL, 4069, NULL, '2026-08-08 07:17:16.726809+00', NULL, 4, NULL, true);


--
-- Data for Name: grammar_chunk_examples; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grammar_chunk_examples" ("grammar_chunk_id", "item_id", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 227, 1, '2026-08-08 07:17:16.726809+00', NULL),
	(1, 228, 2, '2026-08-08 07:17:16.726809+00', NULL),
	(1, 229, 3, '2026-08-08 07:17:16.726809+00', NULL),
	(1, 230, 4, '2026-08-08 07:17:16.726809+00', NULL),
	(1, 231, 5, '2026-08-08 07:17:16.726809+00', NULL),
	(1, 232, 6, '2026-08-08 07:17:16.726809+00', NULL),
	(1, 233, 7, '2026-08-08 07:17:16.726809+00', NULL),
	(1, 234, 8, '2026-08-08 07:17:16.726809+00', NULL),
	(2, 243, 1, '2026-08-08 07:18:09.277036+00', NULL),
	(2, 244, 2, '2026-08-08 07:18:09.277036+00', NULL),
	(2, 245, 3, '2026-08-08 07:18:09.277036+00', NULL),
	(2, 246, 4, '2026-08-08 07:18:09.277036+00', NULL),
	(2, 247, 5, '2026-08-08 07:18:09.277036+00', NULL),
	(2, 248, 6, '2026-08-08 07:18:09.277036+00', NULL),
	(2, 249, 7, '2026-08-08 07:18:09.277036+00', NULL),
	(2, 250, 8, '2026-08-08 07:18:09.277036+00', NULL),
	(3, 311, 1, '2026-08-08 07:18:49.712297+00', NULL),
	(3, 312, 2, '2026-08-08 07:18:49.712297+00', NULL),
	(3, 313, 3, '2026-08-08 07:18:49.712297+00', NULL),
	(3, 314, 4, '2026-08-08 07:18:49.712297+00', NULL),
	(3, 315, 5, '2026-08-08 07:18:49.712297+00', NULL),
	(3, 316, 6, '2026-08-08 07:18:49.712297+00', NULL),
	(3, 317, 7, '2026-08-08 07:18:49.712297+00', NULL),
	(3, 318, 8, '2026-08-08 07:18:49.712297+00', NULL),
	(4, 323, 1, '2026-08-08 07:19:09.958013+00', NULL),
	(4, 324, 2, '2026-08-08 07:19:09.958013+00', NULL),
	(4, 325, 3, '2026-08-08 07:19:09.958013+00', NULL),
	(4, 326, 4, '2026-08-08 07:19:09.958013+00', NULL),
	(4, 327, 5, '2026-08-08 07:19:09.958013+00', NULL),
	(4, 328, 6, '2026-08-08 07:19:09.958013+00', NULL),
	(4, 329, 7, '2026-08-08 07:19:09.958013+00', NULL),
	(4, 330, 8, '2026-08-08 07:19:09.958013+00', NULL);


--
-- Data for Name: pronunciation_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pronunciation_groups" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 'æ | ɛ', NULL, 1, '2026-08-04 08:22:29.882513+00', NULL);


--
-- Data for Name: pronunciation_group_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pronunciation_group_items" ("pronunciation_group_id", "item_id", "sort_order", "updated_at", "deleted_at", "contrast_set") VALUES
	(1, 112, 1, '2026-08-08 07:10:52.276316+00', NULL, 1),
	(1, 121, 2, '2026-08-08 07:11:05.940335+00', NULL, 1);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "history_enabled", "created_at", "deleted_at", "updated_at") VALUES
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', false, '2026-07-12 14:30:09.044811+00', NULL, '2026-07-18 08:26:58.266187+00');


--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_blocks" ("block_id", "user_id", "started_at", "updated_at") VALUES
	(4, 'afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-08 07:52:47.953+00', '2026-08-08 07:52:47.953+00');


--
-- Data for Name: user_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_items" ("user_id", "item_id", "started_at", "updated_at", "progress_cz_to_en", "progress_en_to_cz", "next_at_cz_to_en", "next_at_en_to_cz", "mastered_at_cz_to_en", "mastered_at_en_to_cz", "has_pronunciation_practice") VALUES
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 4, '2026-08-07 11:15:05.015+00', '2026-08-07 11:38:50.999+00', 0, 0, NULL, NULL, '2026-08-07 11:15:05.015+00', '2026-08-07 11:38:50.999+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 6, '2026-08-07 11:15:08.391+00', '2026-08-07 11:38:53.959+00', 0, 0, NULL, NULL, '2026-08-07 11:15:08.391+00', '2026-08-07 11:38:53.959+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 1, '2026-08-07 11:15:00.687+00', '2026-08-07 11:38:55.743+00', 0, 0, NULL, NULL, '2026-08-07 11:15:00.687+00', '2026-08-07 11:38:55.743+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 3, '2026-08-07 11:15:03.615+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:03.615+00', '2026-08-07 12:30:32.437+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 10, '2026-08-07 11:15:13.863+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:13.863+00', '2026-08-07 12:30:35.308+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 9, '2026-08-07 11:15:12.519+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:12.519+00', '2026-08-07 12:30:36.716+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 8, '2026-08-07 11:15:11.207+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:11.207+00', '2026-08-07 12:30:38.062+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 2, '2026-08-07 11:15:02.239+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:02.239+00', '2026-08-07 12:30:40.347+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 5, '2026-08-07 11:15:06.671+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:06.671+00', '2026-08-07 12:30:41.999+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 12, '2026-08-07 11:15:16.359+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:16.359+00', '2026-08-07 12:30:43.342+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 7, '2026-08-07 11:15:09.959+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:09.959+00', '2026-08-07 12:30:44.78+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 11, '2026-08-07 11:15:15.135+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:15.135+00', '2026-08-07 12:30:46.168+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 13, '2026-08-07 11:15:40.047+00', '2026-08-07 12:40:54.879481+00', 0, 0, NULL, NULL, '2026-08-07 11:15:40.047+00', '2026-08-07 12:31:06.294+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 14, '2026-08-07 11:15:41.447+00', '2026-08-07 12:50:29.842451+00', 0, 0, NULL, NULL, '2026-08-07 11:15:41.447+00', '2026-08-07 12:41:42.88+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 15, '2026-08-07 11:15:42.567+00', '2026-08-07 12:50:29.842451+00', 0, 0, NULL, NULL, '2026-08-07 11:15:42.567+00', '2026-08-07 12:41:44.655+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 16, '2026-08-07 11:15:43.903+00', '2026-08-07 12:50:29.842451+00', 0, 0, NULL, NULL, '2026-08-07 11:15:43.903+00', '2026-08-07 12:41:46.21+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 17, '2026-08-07 11:15:45.351+00', '2026-08-07 12:50:29.842451+00', 0, 0, NULL, NULL, '2026-08-07 11:15:45.351+00', '2026-08-07 12:41:47.443+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 20, '2026-08-07 12:40:42.748+00', '2026-08-07 12:50:29.842451+00', 0, 0, NULL, NULL, '2026-08-07 12:40:42.748+00', '2026-08-07 12:41:48.636+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 18, '2026-08-07 12:40:39.79+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:40:39.79+00', '2026-08-07 12:50:58.722+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 19, '2026-08-07 12:40:41.27+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:40:41.27+00', '2026-08-07 12:51:00.069+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 21, '2026-08-07 12:41:50.918+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:41:50.918+00', '2026-08-07 12:51:09.982+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 22, '2026-08-07 12:41:52.17+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:41:52.17+00', '2026-08-07 12:51:11.35+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 24, '2026-08-07 12:47:26.807+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:26.807+00', '2026-08-07 13:11:28.964+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 23, '2026-08-07 12:47:25.421+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:25.421+00', '2026-08-07 13:11:32.478+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 28, '2026-08-07 12:47:32.506+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:32.506+00', '2026-08-07 13:11:33.674+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 25, '2026-08-07 12:47:28.347+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:28.347+00', '2026-08-07 13:11:34.866+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 29, '2026-08-07 12:47:33.696+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:33.696+00', '2026-08-07 13:11:36.006+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 31, '2026-08-07 12:47:44.63+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:44.63+00', '2026-08-07 13:11:37.189+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 26, '2026-08-07 12:47:29.726+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:29.726+00', '2026-08-07 13:11:38.322+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 33, '2026-08-07 12:47:46.921+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:46.921+00', '2026-08-07 13:11:39.597+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 32, '2026-08-07 12:47:45.8+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:45.8+00', '2026-08-07 13:11:40.742+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 27, '2026-08-07 12:47:30.944+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:30.944+00', '2026-08-07 13:11:41.945+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 30, '2026-08-07 12:47:35.022+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:35.022+00', '2026-08-07 13:11:48.438+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 39, '2026-08-07 12:47:53.693+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:53.693+00', '2026-08-07 13:11:49.907+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 34, '2026-08-07 12:47:48.017+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:48.017+00', '2026-08-07 13:11:51.191+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 38, '2026-08-07 12:47:52.519+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:52.519+00', '2026-08-07 13:11:52.625+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 45, '2026-08-07 12:48:00.719+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:00.719+00', '2026-08-07 13:11:54.285+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 42, '2026-08-07 12:47:57.245+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:57.245+00', '2026-08-07 13:11:55.476+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 35, '2026-08-07 12:47:49.137+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:49.137+00', '2026-08-07 13:11:56.656+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 36, '2026-08-07 12:47:50.27+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:50.27+00', '2026-08-07 13:11:58.127+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 37, '2026-08-07 12:47:51.408+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:51.408+00', '2026-08-07 13:11:59.24+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 41, '2026-08-07 12:47:56.087+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:56.087+00', '2026-08-07 13:12:00.487+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 50, '2026-08-07 12:48:06.481+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:06.481+00', '2026-08-07 13:12:01.91+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 51, '2026-08-07 12:48:07.628+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:07.628+00', '2026-08-07 13:12:03.179+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 40, '2026-08-07 12:47:54.942+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:54.942+00', '2026-08-07 13:12:05.078+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 43, '2026-08-07 12:47:58.474+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:58.474+00', '2026-08-07 13:12:06.319+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 52, '2026-08-07 12:48:08.726+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:08.726+00', '2026-08-07 13:12:07.756+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 47, '2026-08-07 12:48:02.982+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:02.982+00', '2026-08-07 13:12:09.301+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 44, '2026-08-07 12:47:59.594+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:47:59.594+00', '2026-08-07 13:12:11.062+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 49, '2026-08-07 12:48:05.264+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:05.264+00', '2026-08-07 13:12:12.621+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 54, '2026-08-07 12:48:16.249+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:16.249+00', '2026-08-07 13:12:14.922+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 46, '2026-08-07 12:48:01.89+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:01.89+00', '2026-08-07 13:12:16.195+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 48, '2026-08-07 12:48:04.162+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:04.162+00', '2026-08-07 13:24:35.837+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 56, '2026-08-07 12:48:19.267+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:19.267+00', '2026-08-07 13:24:37.354+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 53, '2026-08-07 12:48:14.525+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:14.525+00', '2026-08-07 13:24:38.605+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 55, '2026-08-07 12:48:17.703+00', '2026-08-08 03:05:07.787087+00', 0, 0, NULL, NULL, '2026-08-07 12:48:17.703+00', '2026-08-07 13:24:39.782+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 57, '2026-08-07 13:15:45.805+00', '2026-08-07 13:24:41.095+00', 0, 0, NULL, NULL, '2026-08-07 13:15:45.805+00', '2026-08-07 13:24:41.095+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 64, '2026-08-07 13:15:54.217+00', '2026-08-07 13:24:42.334+00', 0, 0, NULL, NULL, '2026-08-07 13:15:54.217+00', '2026-08-07 13:24:42.334+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 70, '2026-08-07 13:16:02.611+00', '2026-08-07 13:24:43.603+00', 0, 0, NULL, NULL, '2026-08-07 13:16:02.611+00', '2026-08-07 13:24:43.603+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 60, '2026-08-07 13:15:49.589+00', '2026-08-07 13:24:44.944+00', 0, 0, NULL, NULL, '2026-08-07 13:15:49.589+00', '2026-08-07 13:24:44.944+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 59, '2026-08-07 13:15:48.374+00', '2026-08-07 13:24:46.379+00', 0, 0, NULL, NULL, '2026-08-07 13:15:48.374+00', '2026-08-07 13:24:46.379+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 68, '2026-08-07 13:15:59.451+00', '2026-08-07 13:24:47.627+00', 0, 0, NULL, NULL, '2026-08-07 13:15:59.451+00', '2026-08-07 13:24:47.627+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 58, '2026-08-07 13:15:47.186+00', '2026-08-07 13:24:48.908+00', 0, 0, NULL, NULL, '2026-08-07 13:15:47.186+00', '2026-08-07 13:24:48.908+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 62, '2026-08-07 13:15:51.782+00', '2026-08-07 13:27:50.299+00', 0, 0, NULL, NULL, '2026-08-07 13:15:51.782+00', '2026-08-07 13:27:50.299+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 63, '2026-08-07 13:15:52.989+00', '2026-08-07 13:27:51.57+00', 0, 0, NULL, NULL, '2026-08-07 13:15:52.989+00', '2026-08-07 13:27:51.57+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 61, '2026-08-07 13:15:50.623+00', '2026-08-07 13:27:52.794+00', 0, 0, NULL, NULL, '2026-08-07 13:15:50.623+00', '2026-08-07 13:27:52.794+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 71, '2026-08-07 13:16:04.403+00', '2026-08-07 13:27:54.03+00', 0, 0, NULL, NULL, '2026-08-07 13:16:04.403+00', '2026-08-07 13:27:54.03+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 65, '2026-08-07 13:15:55.442+00', '2026-08-07 13:27:55.199+00', 0, 0, NULL, NULL, '2026-08-07 13:15:55.442+00', '2026-08-07 13:27:55.199+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 69, '2026-08-07 13:16:01.18+00', '2026-08-07 13:27:56.332+00', 0, 0, NULL, NULL, '2026-08-07 13:16:01.18+00', '2026-08-07 13:27:56.332+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 67, '2026-08-07 13:15:57.869+00', '2026-08-07 13:27:57.691+00', 0, 0, NULL, NULL, '2026-08-07 13:15:57.869+00', '2026-08-07 13:27:57.691+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 72, '2026-08-07 13:16:17.881+00', '2026-08-07 13:43:14.769+00', 1, 0, NULL, NULL, '2026-08-07 13:43:14.769+00', '2026-08-07 13:27:59.12+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 73, '2026-08-07 13:16:19.385+00', '2026-08-07 13:43:20.277+00', 1, 0, NULL, NULL, '2026-08-07 13:28:06.708+00', '2026-08-07 13:43:20.277+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 75, '2026-08-07 13:16:37.84+00', '2026-08-07 13:43:21.625+00', 0, 0, NULL, NULL, '2026-08-07 13:16:37.84+00', '2026-08-07 13:43:21.625+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 76, '2026-08-07 13:16:39.169+00', '2026-08-07 13:43:23.374+00', 0, 0, NULL, NULL, '2026-08-07 13:16:39.169+00', '2026-08-07 13:43:23.374+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 74, '2026-08-07 13:16:36.488+00', '2026-08-07 13:43:24.573+00', 0, 0, NULL, NULL, '2026-08-07 13:16:36.488+00', '2026-08-07 13:43:24.573+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 66, '2026-08-07 13:15:56.692+00', '2026-08-07 13:45:38.179+00', 0, 1, NULL, NULL, '2026-08-07 13:15:56.692+00', '2026-08-07 13:45:38.179+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 79, '2026-08-07 13:43:18.619+00', '2026-08-07 13:54:18.014+00', 0, 0, NULL, NULL, '2026-08-07 13:43:18.619+00', '2026-08-07 13:54:18.014+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 77, '2026-08-07 13:43:16.184+00', '2026-08-07 13:54:19.313+00', 0, 0, NULL, NULL, '2026-08-07 13:43:16.184+00', '2026-08-07 13:54:19.313+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 78, '2026-08-07 13:43:17.369+00', '2026-08-07 13:54:20.562+00', 0, 0, NULL, NULL, '2026-08-07 13:43:17.369+00', '2026-08-07 13:54:20.562+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 86, '2026-08-07 13:45:46.959+00', '2026-08-07 13:54:21.938+00', 0, 0, NULL, NULL, '2026-08-07 13:45:46.959+00', '2026-08-07 13:54:21.938+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 88, '2026-08-07 13:45:49.148+00', '2026-08-07 13:54:23.191+00', 0, 0, NULL, NULL, '2026-08-07 13:45:49.148+00', '2026-08-07 13:54:23.191+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 85, '2026-08-07 13:45:45.906+00', '2026-08-07 13:54:24.461+00', 0, 0, NULL, NULL, '2026-08-07 13:45:45.906+00', '2026-08-07 13:54:24.461+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 83, '2026-08-07 13:45:43.654+00', '2026-08-07 13:54:25.856+00', 0, 0, NULL, NULL, '2026-08-07 13:45:43.654+00', '2026-08-07 13:54:25.856+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 80, '2026-08-07 13:45:40.267+00', '2026-08-07 13:54:28.089+00', 0, 0, NULL, NULL, '2026-08-07 13:45:40.267+00', '2026-08-07 13:54:28.089+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 81, '2026-08-07 13:45:41.401+00', '2026-08-07 13:54:29.42+00', 0, 0, NULL, NULL, '2026-08-07 13:45:41.401+00', '2026-08-07 13:54:29.42+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 87, '2026-08-07 13:45:48.025+00', '2026-08-07 13:54:31.003+00', 0, 0, NULL, NULL, '2026-08-07 13:45:48.025+00', '2026-08-07 13:54:31.003+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 89, '2026-08-07 13:45:50.298+00', '2026-08-07 13:54:32.466+00', 0, 0, NULL, NULL, '2026-08-07 13:45:50.298+00', '2026-08-07 13:54:32.466+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 84, '2026-08-07 13:45:44.802+00', '2026-08-07 13:54:34.916+00', 0, 0, NULL, NULL, '2026-08-07 13:45:44.802+00', '2026-08-07 13:54:34.916+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 82, '2026-08-07 13:45:42.619+00', '2026-08-07 13:54:36.334+00', 0, 0, NULL, NULL, '2026-08-07 13:45:42.619+00', '2026-08-07 13:54:36.334+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 90, '2026-08-07 13:45:51.481+00', '2026-08-07 13:54:37.729+00', 0, 0, NULL, NULL, '2026-08-07 13:45:51.481+00', '2026-08-07 13:54:37.729+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 91, '2026-08-07 13:45:52.771+00', '2026-08-07 13:54:39.055+00', 0, 0, NULL, NULL, '2026-08-07 13:45:52.771+00', '2026-08-07 13:54:39.055+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 92, '2026-08-07 13:45:54.124+00', '2026-08-07 13:56:20.688+00', 0, 0, NULL, NULL, '2026-08-07 13:45:54.124+00', '2026-08-07 13:56:20.688+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 93, '2026-08-07 13:54:13.451+00', '2026-08-07 13:56:21.84+00', 0, 0, NULL, NULL, '2026-08-07 13:54:13.451+00', '2026-08-07 13:56:21.84+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 94, '2026-08-07 13:54:15.253+00', '2026-08-07 13:56:23.166+00', 0, 0, NULL, NULL, '2026-08-07 13:54:15.253+00', '2026-08-07 13:56:23.166+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 95, '2026-08-07 13:54:40.735+00', '2026-08-07 13:56:24.689+00', 0, 0, NULL, NULL, '2026-08-07 13:54:40.735+00', '2026-08-07 13:56:24.689+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 96, '2026-08-07 13:54:41.907+00', '2026-08-07 13:56:25.906+00', 0, 0, NULL, NULL, '2026-08-07 13:54:41.907+00', '2026-08-07 13:56:25.906+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 99, '2026-08-07 13:56:18.97+00', '2026-08-07 13:58:38.424+00', 0, 0, NULL, NULL, '2026-08-07 13:56:18.97+00', '2026-08-07 13:58:38.424+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 98, '2026-08-07 13:56:17.945+00', '2026-08-07 13:58:39.418+00', 0, 0, NULL, NULL, '2026-08-07 13:56:17.945+00', '2026-08-07 13:58:39.418+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 97, '2026-08-07 13:56:16.81+00', '2026-08-07 13:58:40.518+00', 0, 0, NULL, NULL, '2026-08-07 13:56:16.81+00', '2026-08-07 13:58:40.518+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 104, '2026-08-07 13:56:33.725+00', '2026-08-07 14:00:51.394+00', 0, 0, NULL, NULL, '2026-08-07 13:56:33.725+00', '2026-08-07 14:00:51.394+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 101, '2026-08-07 13:56:29.253+00', '2026-08-07 14:00:52.673+00', 0, 0, NULL, NULL, '2026-08-07 13:56:29.253+00', '2026-08-07 14:00:52.673+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 105, '2026-08-07 13:56:35.106+00', '2026-08-07 14:00:53.784+00', 0, 0, NULL, NULL, '2026-08-07 13:56:35.106+00', '2026-08-07 14:00:53.784+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 102, '2026-08-07 13:56:30.812+00', '2026-08-07 14:00:54.91+00', 0, 0, NULL, NULL, '2026-08-07 13:56:30.812+00', '2026-08-07 14:00:54.91+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 100, '2026-08-07 13:56:27.952+00', '2026-08-07 14:00:56.042+00', 0, 0, NULL, NULL, '2026-08-07 13:56:27.952+00', '2026-08-07 14:00:56.042+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 103, '2026-08-07 13:56:32.295+00', '2026-08-07 14:00:57.182+00', 0, 0, NULL, NULL, '2026-08-07 13:56:32.295+00', '2026-08-07 14:00:57.182+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 106, '2026-08-07 13:56:36.495+00', '2026-08-07 14:00:58.441+00', 0, 0, NULL, NULL, '2026-08-07 13:56:36.495+00', '2026-08-07 14:00:58.441+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 109, '2026-08-07 13:58:35.995+00', '2026-08-07 14:00:59.59+00', 0, 0, NULL, NULL, '2026-08-07 13:58:35.995+00', '2026-08-07 14:00:59.59+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 107, '2026-08-07 13:58:33.724+00', '2026-08-07 14:01:00.745+00', 0, 0, NULL, NULL, '2026-08-07 13:58:33.724+00', '2026-08-07 14:01:00.745+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 108, '2026-08-07 13:58:34.854+00', '2026-08-07 14:01:01.781+00', 0, 0, NULL, NULL, '2026-08-07 13:58:34.854+00', '2026-08-07 14:01:01.781+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 110, '2026-08-07 14:01:03.807+00', '2026-08-07 14:02:20.231+00', 0, 0, NULL, NULL, '2026-08-07 14:01:03.807+00', '2026-08-07 14:02:20.231+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 111, '2026-08-07 14:01:05.129+00', '2026-08-07 14:02:21.367+00', 0, 0, NULL, NULL, '2026-08-07 14:01:05.129+00', '2026-08-07 14:02:21.367+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 114, '2026-08-07 14:01:09.122+00', '2026-08-07 14:02:22.507+00', 0, 0, NULL, NULL, '2026-08-07 14:01:09.122+00', '2026-08-07 14:02:22.507+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 117, '2026-08-07 14:01:12.862+00', '2026-08-07 14:02:23.699+00', 0, 0, NULL, NULL, '2026-08-07 14:01:12.862+00', '2026-08-07 14:02:23.699+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 113, '2026-08-07 14:01:07.769+00', '2026-08-07 14:02:25.043+00', 0, 0, NULL, NULL, '2026-08-07 14:01:07.769+00', '2026-08-07 14:02:25.043+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 112, '2026-08-07 14:01:06.434+00', '2026-08-07 14:02:26.409+00', 0, 0, NULL, NULL, '2026-08-07 14:01:06.434+00', '2026-08-07 14:02:26.409+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 120, '2026-08-07 14:01:16.539+00', '2026-08-07 14:02:27.708+00', 0, 0, NULL, NULL, '2026-08-07 14:01:16.539+00', '2026-08-07 14:02:27.708+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 118, '2026-08-07 14:01:14.046+00', '2026-08-07 14:02:28.861+00', 0, 0, NULL, NULL, '2026-08-07 14:01:14.046+00', '2026-08-07 14:02:28.861+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 116, '2026-08-07 14:01:11.643+00', '2026-08-07 14:02:29.945+00', 0, 0, NULL, NULL, '2026-08-07 14:01:11.643+00', '2026-08-07 14:02:29.945+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 115, '2026-08-07 14:01:10.361+00', '2026-08-07 14:02:31.133+00', 0, 0, NULL, NULL, '2026-08-07 14:01:10.361+00', '2026-08-07 14:02:31.133+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 119, '2026-08-07 14:01:15.24+00', '2026-08-07 14:58:28.926+00', 0, 0, NULL, NULL, '2026-08-07 14:01:15.24+00', '2026-08-07 14:58:28.926+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 126, '2026-08-07 14:01:50.372+00', '2026-08-07 14:58:30.224+00', 0, 0, NULL, NULL, '2026-08-07 14:01:50.372+00', '2026-08-07 14:58:30.224+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 121, '2026-08-07 14:01:44.029+00', '2026-08-07 14:58:31.562+00', 0, 0, NULL, NULL, '2026-08-07 14:01:44.029+00', '2026-08-07 14:58:31.562+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 127, '2026-08-07 14:01:51.436+00', '2026-08-07 14:58:33.075+00', 0, 0, NULL, NULL, '2026-08-07 14:01:51.436+00', '2026-08-07 14:58:33.075+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 125, '2026-08-07 14:01:49.076+00', '2026-08-07 14:58:34.276+00', 0, 0, NULL, NULL, '2026-08-07 14:01:49.076+00', '2026-08-07 14:58:34.276+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 123, '2026-08-07 14:01:46.563+00', '2026-08-07 14:58:35.858+00', 0, 0, NULL, NULL, '2026-08-07 14:01:46.563+00', '2026-08-07 14:58:35.858+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 122, '2026-08-07 14:01:45.22+00', '2026-08-07 14:58:37.18+00', 0, 0, NULL, NULL, '2026-08-07 14:01:45.22+00', '2026-08-07 14:58:37.18+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 124, '2026-08-07 14:01:47.819+00', '2026-08-07 14:58:38.309+00', 0, 0, NULL, NULL, '2026-08-07 14:01:47.819+00', '2026-08-07 14:58:38.309+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 130, '2026-08-07 14:01:55.102+00', '2026-08-07 14:58:39.474+00', 0, 0, NULL, NULL, '2026-08-07 14:01:55.102+00', '2026-08-07 14:58:39.474+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 128, '2026-08-07 14:01:52.643+00', '2026-08-07 14:58:40.657+00', 0, 0, NULL, NULL, '2026-08-07 14:01:52.643+00', '2026-08-07 14:58:40.657+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 132, '2026-08-07 14:01:58.42+00', '2026-08-07 14:58:41.828+00', 0, 0, NULL, NULL, '2026-08-07 14:01:58.42+00', '2026-08-07 14:58:41.828+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 138, '2026-08-07 14:02:06.834+00', '2026-08-07 14:58:42.965+00', 0, 0, NULL, NULL, '2026-08-07 14:02:06.834+00', '2026-08-07 14:58:42.965+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 142, '2026-08-07 14:02:11.658+00', '2026-08-07 14:58:44.08+00', 0, 0, NULL, NULL, '2026-08-07 14:02:11.658+00', '2026-08-07 14:58:44.08+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 134, '2026-08-07 14:02:00.986+00', '2026-08-07 15:18:05.963+00', 0, 0, NULL, NULL, '2026-08-07 14:02:00.986+00', '2026-08-07 15:18:05.963+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 135, '2026-08-07 14:02:02.21+00', '2026-08-07 15:18:07.236+00', 0, 0, NULL, NULL, '2026-08-07 14:02:02.21+00', '2026-08-07 15:18:07.236+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 140, '2026-08-07 14:02:09.355+00', '2026-08-07 15:18:08.301+00', 0, 0, NULL, NULL, '2026-08-07 14:02:09.355+00', '2026-08-07 15:18:08.301+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 129, '2026-08-07 14:01:53.895+00', '2026-08-07 15:18:09.512+00', 0, 0, NULL, NULL, '2026-08-07 14:01:53.895+00', '2026-08-07 15:18:09.512+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 133, '2026-08-07 14:01:59.571+00', '2026-08-07 15:18:12.874+00', 0, 0, NULL, NULL, '2026-08-07 14:01:59.571+00', '2026-08-07 15:18:12.874+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 143, '2026-08-07 14:02:12.887+00', '2026-08-07 15:18:14.165+00', 0, 0, NULL, NULL, '2026-08-07 14:02:12.887+00', '2026-08-07 15:18:14.165+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 141, '2026-08-07 14:02:10.551+00', '2026-08-07 15:18:15.408+00', 0, 0, NULL, NULL, '2026-08-07 14:02:10.551+00', '2026-08-07 15:18:15.408+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 131, '2026-08-07 14:01:56.342+00', '2026-08-07 15:18:16.753+00', 0, 0, NULL, NULL, '2026-08-07 14:01:56.342+00', '2026-08-07 15:18:16.753+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 136, '2026-08-07 14:02:04.085+00', '2026-08-07 15:18:18.134+00', 0, 0, NULL, NULL, '2026-08-07 14:02:04.085+00', '2026-08-07 15:18:18.134+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 137, '2026-08-07 14:02:05.241+00', '2026-08-07 15:18:19.379+00', 0, 0, NULL, NULL, '2026-08-07 14:02:05.241+00', '2026-08-07 15:18:19.379+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 139, '2026-08-07 14:02:08.144+00', '2026-08-07 15:18:20.808+00', 0, 0, NULL, NULL, '2026-08-07 14:02:08.144+00', '2026-08-07 15:18:20.808+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 144, '2026-08-07 14:02:13.988+00', '2026-08-07 15:18:22.107+00', 0, 0, NULL, NULL, '2026-08-07 14:02:13.988+00', '2026-08-07 15:18:22.107+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 145, '2026-08-07 14:02:18.149+00', '2026-08-07 15:18:23.427+00', 0, 0, NULL, NULL, '2026-08-07 14:02:18.149+00', '2026-08-07 15:18:23.427+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 146, '2026-08-07 14:02:33.018+00', '2026-08-07 15:18:24.643+00', 0, 0, NULL, NULL, '2026-08-07 14:02:33.018+00', '2026-08-07 15:18:24.643+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 148, '2026-08-07 14:02:36.231+00', '2026-08-07 15:18:25.841+00', 0, 0, NULL, NULL, '2026-08-07 14:02:36.231+00', '2026-08-07 15:18:25.841+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 149, '2026-08-07 14:02:38.047+00', '2026-08-07 15:18:27.082+00', 0, 0, NULL, NULL, '2026-08-07 14:02:38.047+00', '2026-08-07 15:18:27.082+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 151, '2026-08-07 14:02:40.818+00', '2026-08-07 15:18:28.316+00', 0, 0, NULL, NULL, '2026-08-07 14:02:40.818+00', '2026-08-07 15:18:28.316+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 147, '2026-08-07 14:02:34.715+00', '2026-08-07 15:18:29.579+00', 0, 0, NULL, NULL, '2026-08-07 14:02:34.715+00', '2026-08-07 15:18:29.579+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 150, '2026-08-07 14:02:39.595+00', '2026-08-07 15:18:30.765+00', 0, 0, NULL, NULL, '2026-08-07 14:02:39.595+00', '2026-08-07 15:18:30.765+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 152, '2026-08-07 14:58:23.271+00', '2026-08-07 15:18:31.945+00', 0, 0, NULL, NULL, '2026-08-07 14:58:23.271+00', '2026-08-07 15:18:31.945+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 153, '2026-08-07 14:58:24.436+00', '2026-08-07 15:21:09.602+00', 0, 0, NULL, NULL, '2026-08-07 14:58:24.436+00', '2026-08-07 15:21:09.602+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 155, '2026-08-07 14:58:26.934+00', '2026-08-07 15:21:10.629+00', 0, 0, NULL, NULL, '2026-08-07 14:58:26.934+00', '2026-08-07 15:21:10.629+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 154, '2026-08-07 14:58:25.656+00', '2026-08-07 15:21:11.655+00', 0, 0, NULL, NULL, '2026-08-07 14:58:25.656+00', '2026-08-07 15:21:11.655+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 156, '2026-08-07 15:18:33.687+00', '2026-08-07 15:21:12.721+00', 0, 0, NULL, NULL, '2026-08-07 15:18:33.687+00', '2026-08-07 15:21:12.721+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 158, '2026-08-07 15:18:35.965+00', '2026-08-07 15:21:13.738+00', 0, 0, NULL, NULL, '2026-08-07 15:18:35.965+00', '2026-08-07 15:21:13.738+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 157, '2026-08-07 15:18:34.842+00', '2026-08-07 15:22:02.603+00', 0, 0, NULL, NULL, '2026-08-07 15:18:34.842+00', '2026-08-07 15:22:02.603+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 164, '2026-08-07 15:18:43.548+00', '2026-08-07 15:22:03.756+00', 0, 0, NULL, NULL, '2026-08-07 15:18:43.548+00', '2026-08-07 15:22:03.756+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 162, '2026-08-07 15:18:41.044+00', '2026-08-07 15:22:05.141+00', 0, 0, NULL, NULL, '2026-08-07 15:18:41.044+00', '2026-08-07 15:22:05.141+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 166, '2026-08-07 15:18:46.068+00', '2026-08-07 15:22:06.331+00', 0, 0, NULL, NULL, '2026-08-07 15:18:46.068+00', '2026-08-07 15:22:06.331+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 159, '2026-08-07 15:18:37.073+00', '2026-08-07 15:22:07.34+00', 0, 0, NULL, NULL, '2026-08-07 15:18:37.073+00', '2026-08-07 15:22:07.34+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 161, '2026-08-07 15:18:39.867+00', '2026-08-07 15:22:15.684+00', 0, 0, NULL, NULL, '2026-08-07 15:18:39.867+00', '2026-08-07 15:22:15.684+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 160, '2026-08-07 15:18:38.406+00', '2026-08-07 15:22:16.759+00', 0, 0, NULL, NULL, '2026-08-07 15:18:38.406+00', '2026-08-07 15:22:16.759+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 165, '2026-08-07 15:18:44.781+00', '2026-08-07 15:22:17.832+00', 0, 0, NULL, NULL, '2026-08-07 15:18:44.781+00', '2026-08-07 15:22:17.832+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 163, '2026-08-07 15:18:42.388+00', '2026-08-07 15:22:19.08+00', 0, 0, NULL, NULL, '2026-08-07 15:18:42.388+00', '2026-08-07 15:22:19.08+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 170, '2026-08-07 15:21:08.06+00', '2026-08-07 15:22:20.359+00', 0, 0, NULL, NULL, '2026-08-07 15:21:08.06+00', '2026-08-07 15:22:20.359+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 168, '2026-08-07 15:21:05.907+00', '2026-08-07 15:23:26.432+00', 0, 0, NULL, NULL, '2026-08-07 15:21:05.907+00', '2026-08-07 15:23:26.432+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 167, '2026-08-07 15:21:04.766+00', '2026-08-07 15:23:27.506+00', 0, 0, NULL, NULL, '2026-08-07 15:21:04.766+00', '2026-08-07 15:23:27.506+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 169, '2026-08-07 15:21:07.046+00', '2026-08-07 15:23:28.571+00', 0, 0, NULL, NULL, '2026-08-07 15:21:07.046+00', '2026-08-07 15:23:28.571+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 172, '2026-08-07 15:22:10.589+00', '2026-08-07 15:23:29.679+00', 0, 0, NULL, NULL, '2026-08-07 15:22:10.589+00', '2026-08-07 15:23:29.679+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 176, '2026-08-07 15:22:21.984+00', '2026-08-07 15:23:30.692+00', 0, 0, NULL, NULL, '2026-08-07 15:22:21.984+00', '2026-08-07 15:23:30.692+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 178, '2026-08-07 15:22:24.209+00', '2026-08-07 15:23:31.729+00', 0, 0, NULL, NULL, '2026-08-07 15:22:24.209+00', '2026-08-07 15:23:31.729+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 173, '2026-08-07 15:22:11.719+00', '2026-08-07 15:23:32.695+00', 0, 0, NULL, NULL, '2026-08-07 15:22:11.719+00', '2026-08-07 15:23:32.695+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 174, '2026-08-07 15:22:12.962+00', '2026-08-07 15:23:33.659+00', 0, 0, NULL, NULL, '2026-08-07 15:22:12.962+00', '2026-08-07 15:23:33.659+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 175, '2026-08-07 15:22:14.02+00', '2026-08-07 15:23:34.631+00', 0, 0, NULL, NULL, '2026-08-07 15:22:14.02+00', '2026-08-07 15:23:34.631+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 171, '2026-08-07 15:22:09.342+00', '2026-08-07 15:23:35.753+00', 0, 0, NULL, NULL, '2026-08-07 15:22:09.342+00', '2026-08-07 15:23:35.753+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 179, '2026-08-07 15:22:25.351+00', '2026-08-07 15:23:37.688+00', 0, 0, NULL, NULL, '2026-08-07 15:22:25.351+00', '2026-08-07 15:23:37.688+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 181, '2026-08-07 15:22:27.485+00', '2026-08-07 15:28:07.453+00', 0, 0, NULL, NULL, '2026-08-07 15:22:27.485+00', '2026-08-07 15:28:07.453+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 184, '2026-08-07 15:22:32.852+00', '2026-08-07 15:28:08.813+00', 0, 0, NULL, NULL, '2026-08-07 15:22:32.852+00', '2026-08-07 15:28:08.813+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 183, '2026-08-07 15:22:31.165+00', '2026-08-07 15:28:09.902+00', 0, 0, NULL, NULL, '2026-08-07 15:22:31.165+00', '2026-08-07 15:28:09.902+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 177, '2026-08-07 15:22:23.027+00', '2026-08-07 15:28:11.037+00', 0, 0, NULL, NULL, '2026-08-07 15:22:23.027+00', '2026-08-07 15:28:11.037+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 180, '2026-08-07 15:22:26.442+00', '2026-08-07 15:28:12.083+00', 0, 0, NULL, NULL, '2026-08-07 15:22:26.442+00', '2026-08-07 15:28:12.083+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 182, '2026-08-07 15:22:29.264+00', '2026-08-07 15:28:13.1+00', 0, 0, NULL, NULL, '2026-08-07 15:22:29.264+00', '2026-08-07 15:28:13.1+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 186, '2026-08-07 15:22:36.329+00', '2026-08-07 15:28:14.171+00', 0, 0, NULL, NULL, '2026-08-07 15:22:36.329+00', '2026-08-07 15:28:14.171+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 188, '2026-08-07 15:22:47.661+00', '2026-08-07 15:28:15.243+00', 0, 0, NULL, NULL, '2026-08-07 15:22:47.661+00', '2026-08-07 15:28:15.243+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 185, '2026-08-07 15:22:35.044+00', '2026-08-07 15:28:16.285+00', 0, 0, NULL, NULL, '2026-08-07 15:22:35.044+00', '2026-08-07 15:28:16.285+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 187, '2026-08-07 15:22:45.844+00', '2026-08-07 15:28:17.296+00', 0, 0, NULL, NULL, '2026-08-07 15:22:45.844+00', '2026-08-07 15:28:17.296+00', true),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 189, '2026-08-07 15:22:49.054+00', '2026-08-07 15:29:48.196+00', 0, 0, NULL, NULL, '2026-08-07 15:22:49.054+00', '2026-08-07 15:29:48.196+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 191, '2026-08-07 15:28:20.365+00', '2026-08-07 15:29:49.348+00', 0, 0, NULL, NULL, '2026-08-07 15:28:20.365+00', '2026-08-07 15:29:49.348+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 198, '2026-08-07 15:28:28.229+00', '2026-08-07 15:29:50.42+00', 0, 0, NULL, NULL, '2026-08-07 15:28:28.229+00', '2026-08-07 15:29:50.42+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 194, '2026-08-07 15:28:23.698+00', '2026-08-07 15:29:51.541+00', 0, 0, NULL, NULL, '2026-08-07 15:28:23.698+00', '2026-08-07 15:29:51.541+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 195, '2026-08-07 15:28:24.89+00', '2026-08-07 15:30:18.958+00', 0, 0, NULL, NULL, '2026-08-07 15:28:24.89+00', '2026-08-07 15:30:18.958+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 199, '2026-08-07 15:28:29.234+00', '2026-08-07 15:30:20.203+00', 0, 0, NULL, NULL, '2026-08-07 15:28:29.234+00', '2026-08-07 15:30:20.203+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 201, '2026-08-07 15:28:31.358+00', '2026-08-07 15:30:21.625+00', 0, 0, NULL, NULL, '2026-08-07 15:28:31.358+00', '2026-08-07 15:30:21.625+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 200, '2026-08-07 15:28:30.283+00', '2026-08-07 15:30:22.73+00', 0, 0, NULL, NULL, '2026-08-07 15:28:30.283+00', '2026-08-07 15:30:22.73+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 193, '2026-08-07 15:28:22.577+00', '2026-08-07 15:30:23.872+00', 0, 0, NULL, NULL, '2026-08-07 15:28:22.577+00', '2026-08-07 15:30:23.872+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 197, '2026-08-07 15:28:27.153+00', '2026-08-07 15:30:24.964+00', 0, 0, NULL, NULL, '2026-08-07 15:28:27.153+00', '2026-08-07 15:30:24.964+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 206, '2026-08-07 15:28:36.85+00', '2026-08-07 15:30:26.1+00', 0, 0, NULL, NULL, '2026-08-07 15:28:36.85+00', '2026-08-07 15:30:26.1+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 203, '2026-08-07 15:28:33.548+00', '2026-08-07 15:30:27.397+00', 0, 0, NULL, NULL, '2026-08-07 15:28:33.548+00', '2026-08-07 15:30:27.397+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 190, '2026-08-07 15:28:19.136+00', '2026-08-07 15:30:28.41+00', 0, 0, NULL, NULL, '2026-08-07 15:28:19.136+00', '2026-08-07 15:30:28.41+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 192, '2026-08-07 15:28:21.547+00', '2026-08-07 15:30:29.482+00', 0, 0, NULL, NULL, '2026-08-07 15:28:21.547+00', '2026-08-07 15:30:29.482+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 205, '2026-08-07 15:28:35.707+00', '2026-08-07 15:30:30.62+00', 0, 0, NULL, NULL, '2026-08-07 15:28:35.707+00', '2026-08-07 15:30:30.62+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 208, '2026-08-07 15:28:38.935+00', '2026-08-07 15:30:31.773+00', 0, 0, NULL, NULL, '2026-08-07 15:28:38.935+00', '2026-08-07 15:30:31.773+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 207, '2026-08-07 15:28:37.883+00', '2026-08-07 15:30:32.824+00', 0, 0, NULL, NULL, '2026-08-07 15:28:37.883+00', '2026-08-07 15:30:32.824+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 196, '2026-08-07 15:28:26.074+00', '2026-08-07 15:30:34.023+00', 0, 0, NULL, NULL, '2026-08-07 15:28:26.074+00', '2026-08-07 15:30:34.023+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 209, '2026-08-07 15:28:40.332+00', '2026-08-07 15:30:35.084+00', 0, 0, NULL, NULL, '2026-08-07 15:28:40.332+00', '2026-08-07 15:30:35.084+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 202, '2026-08-07 15:28:32.43+00', '2026-08-07 15:30:36.256+00', 0, 0, NULL, NULL, '2026-08-07 15:28:32.43+00', '2026-08-07 15:30:36.256+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 204, '2026-08-07 15:28:34.669+00', '2026-08-07 15:30:37.331+00', 0, 0, NULL, NULL, '2026-08-07 15:28:34.669+00', '2026-08-07 15:30:37.331+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 210, '2026-08-07 15:29:18.303+00', '2026-08-07 15:30:39.004+00', 0, 0, NULL, NULL, '2026-08-07 15:29:18.303+00', '2026-08-07 15:30:39.004+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 212, '2026-08-07 15:29:20.559+00', '2026-08-07 15:30:40.746+00', 0, 0, NULL, NULL, '2026-08-07 15:29:20.559+00', '2026-08-07 15:30:40.746+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 214, '2026-08-07 15:29:22.872+00', '2026-08-07 15:30:54.591+00', 0, 0, NULL, NULL, '2026-08-07 15:29:22.872+00', '2026-08-07 15:30:54.591+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 211, '2026-08-07 15:29:19.451+00', '2026-08-07 15:30:55.631+00', 0, 0, NULL, NULL, '2026-08-07 15:29:19.451+00', '2026-08-07 15:30:55.631+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 213, '2026-08-07 15:29:21.636+00', '2026-08-07 15:30:56.716+00', 0, 0, NULL, NULL, '2026-08-07 15:29:21.636+00', '2026-08-07 15:30:56.716+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 217, '2026-08-07 15:30:50.668+00', '2026-08-07 15:31:48.682+00', 0, 0, NULL, NULL, '2026-08-07 15:30:50.668+00', '2026-08-07 15:31:48.682+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 216, '2026-08-07 15:30:49.541+00', '2026-08-07 15:37:51.679+00', 0, 0, NULL, NULL, '2026-08-07 15:30:49.541+00', '2026-08-07 15:37:51.679+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 215, '2026-08-07 15:30:48.461+00', '2026-08-07 15:37:52.79+00', 0, 0, NULL, NULL, '2026-08-07 15:30:48.461+00', '2026-08-07 15:37:52.79+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 218, '2026-08-07 15:30:52.637+00', '2026-08-07 15:37:54.786+00', 0, 0, NULL, NULL, '2026-08-07 15:30:52.637+00', '2026-08-07 15:37:54.786+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 228, '2026-08-08 07:52:38.961+00', '2026-08-08 07:52:47.953+00', 2, 2, '2026-08-08 08:09:26.981+00', '2026-08-08 08:27:25.981+00', '2026-08-08 07:52:38.961+00', NULL, false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 231, '2026-08-08 07:52:42.339+00', '2026-08-08 07:52:47.953+00', 2, 2, '2026-08-08 08:06:58.981+00', '2026-08-08 08:27:25.981+00', '2026-08-08 07:52:42.339+00', NULL, false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 220, '2026-08-08 07:52:16.511+00', '2026-08-08 08:01:51.998+00', 0, 0, NULL, NULL, '2026-08-08 07:52:16.511+00', '2026-08-08 08:01:51.998+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 221, '2026-08-08 07:52:17.645+00', '2026-08-08 08:01:53.423+00', 0, 0, NULL, NULL, '2026-08-08 07:52:17.645+00', '2026-08-08 08:01:53.423+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 223, '2026-08-08 07:52:21.919+00', '2026-08-08 08:01:54.603+00', 0, 0, NULL, NULL, '2026-08-08 07:52:21.919+00', '2026-08-08 08:01:54.603+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 225, '2026-08-08 07:52:24.118+00', '2026-08-08 08:01:56.012+00', 0, 0, NULL, NULL, '2026-08-08 07:52:24.118+00', '2026-08-08 08:01:56.012+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 219, '2026-08-08 07:52:15.289+00', '2026-08-08 08:01:57.173+00', 0, 0, NULL, NULL, '2026-08-08 07:52:15.289+00', '2026-08-08 08:01:57.173+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 222, '2026-08-08 07:52:18.837+00', '2026-08-08 08:16:32.802+00', 0, 0, NULL, NULL, '2026-08-08 07:52:18.837+00', '2026-08-08 08:16:32.802+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 226, '2026-08-08 07:52:25.28+00', '2026-08-08 08:16:34.039+00', 0, 0, NULL, NULL, '2026-08-08 07:52:25.28+00', '2026-08-08 08:16:34.039+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 224, '2026-08-08 07:52:23.077+00', '2026-08-08 08:16:35.315+00', 0, 0, NULL, NULL, '2026-08-08 07:52:23.077+00', '2026-08-08 08:16:35.315+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 235, '2026-08-08 08:01:58.99+00', '2026-08-08 08:16:36.489+00', 0, 0, NULL, NULL, '2026-08-08 08:01:58.99+00', '2026-08-08 08:16:36.489+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 236, '2026-08-08 08:02:00.497+00', '2026-08-08 08:16:37.712+00', 0, 0, NULL, NULL, '2026-08-08 08:02:00.497+00', '2026-08-08 08:16:37.712+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 237, '2026-08-08 08:02:01.864+00', '2026-08-08 08:16:38.927+00', 0, 0, NULL, NULL, '2026-08-08 08:02:01.864+00', '2026-08-08 08:16:38.927+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 241, '2026-08-08 08:02:10.056+00', '2026-08-08 08:54:33.075+00', 0, 0, NULL, NULL, '2026-08-08 08:02:10.056+00', '2026-08-08 08:54:33.075+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 238, '2026-08-08 08:02:05.561+00', '2026-08-08 08:54:34.486+00', 0, 0, NULL, NULL, '2026-08-08 08:02:05.561+00', '2026-08-08 08:54:34.486+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 240, '2026-08-08 08:02:08.585+00', '2026-08-08 08:54:35.977+00', 0, 0, NULL, NULL, '2026-08-08 08:02:08.585+00', '2026-08-08 08:54:35.977+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 239, '2026-08-08 08:02:07.294+00', '2026-08-08 08:54:37.075+00', 0, 0, NULL, NULL, '2026-08-08 08:02:07.294+00', '2026-08-08 08:54:37.075+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 242, '2026-08-08 08:02:11.406+00', '2026-08-08 08:54:38.192+00', 0, 0, NULL, NULL, '2026-08-08 08:02:11.406+00', '2026-08-08 08:54:38.192+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 230, '2026-08-08 07:52:41.268+00', '2026-08-08 08:54:39.852+00', 2, 2, '2026-08-08 08:07:01.981+00', NULL, '2026-08-08 07:52:41.268+00', '2026-08-08 08:54:39.852+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 234, '2026-08-08 07:52:45.889+00', '2026-08-08 08:54:41.357+00', 2, 2, '2026-08-08 08:10:21.981+00', NULL, '2026-08-08 07:52:45.889+00', '2026-08-08 08:54:41.357+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 229, '2026-08-08 07:52:40.201+00', '2026-08-08 08:54:42.813+00', 2, 2, '2026-08-08 08:06:26.981+00', NULL, '2026-08-08 07:52:40.201+00', '2026-08-08 08:54:42.813+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 233, '2026-08-08 07:52:44.756+00', '2026-08-08 08:54:44.111+00', 2, 2, '2026-08-08 08:06:02.981+00', NULL, '2026-08-08 07:52:44.756+00', '2026-08-08 08:54:44.111+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 232, '2026-08-08 07:52:43.486+00', '2026-08-08 08:54:46.332+00', 2, 2, '2026-08-08 08:07:01.981+00', NULL, '2026-08-08 07:52:43.486+00', '2026-08-08 08:54:46.332+00', false),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', 227, '2026-08-08 07:52:47.953+00', '2026-08-08 08:54:48.747+00', 2, 2, NULL, '2026-08-08 08:26:09.981+00', '2026-08-08 08:54:48.747+00', '2026-08-08 07:52:47.953+00', false);


--
-- Data for Name: user_items_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_scores" ("user_id", "date", "item_count", "updated_at", "deleted_at") VALUES
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-17', 320, '2026-07-17 12:11:12.382196+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-18', 427, '2026-07-19 03:35:59.63127+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-19', 1241, '2026-07-20 04:02:33.286872+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-20', 1531, '2026-07-21 03:13:49.038471+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-21', 400, '2026-07-21 10:04:12.234+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-25', 1432, '2026-07-26 08:06:22.749182+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-26', 1244, '2026-07-27 03:41:09.173942+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-27', 1921, '2026-07-28 03:19:05.360342+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-28', 947, '2026-07-28 13:23:42.051509+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-29', 1203, '2026-07-31 05:00:16.857565+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-30', 704, '2026-07-31 05:00:16.857565+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-07-31', 568, '2026-08-01 10:47:30.063311+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-03', 1560, '2026-08-06 10:53:43.279837+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-02', 204, '2026-08-02 09:05:51.208729+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-04', 1720, '2026-08-06 10:53:43.279837+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-01', 354, '2026-08-03 12:24:02.987293+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-05', 1156, '2026-08-06 10:53:43.279837+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-06', 1070, '2026-08-07 08:27:45.090365+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-07', 440, '2026-08-08 03:05:07.684994+00', NULL),
	('afde0966-74ea-4b04-8bc3-ee903f7e2d77', '2026-08-08', 47, '2026-08-08 08:54:48.748+00', NULL);


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('25089195-a086-484a-b613-9e80982b897a', 'audio-archive', '.emptyFolderPlaceholder', NULL, '2026-07-17 10:02:11.66204+00', '2026-07-17 10:02:11.66204+00', '2026-07-17 10:02:11.66204+00', '{"eTag": "\"d41d8cd98f00b204e9800998ecf8427e\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2026-07-17T10:02:11.661Z", "contentLength": 0, "httpStatusCode": 200}', '83e64bae-6d64-4a28-9fe5-dc5d4d6a55cc', NULL, '{}'),
	('beef3143-89a5-487f-9b09-ee417cf1396c', 'audio-archive', 'audio_01.zip', NULL, '2026-08-07 11:14:03.045047+00', '2026-08-07 11:14:03.045047+00', '2026-08-07 11:14:03.045047+00', '{"eTag": "\"cf97318f2d6f8ab55e3f1aaf982d0592-1\"", "size": 743770, "mimetype": "application/zip", "cacheControl": "max-age=3600", "lastModified": "2026-08-07T11:14:01.000Z", "contentLength": 743770, "httpStatusCode": 200}', '90a8efab-41e4-4a5c-be6c-06346d1a0cf7', NULL, NULL),
	('3b50ee86-e2eb-4d0b-be89-3a731bdf25f4', 'audio-archive', 'audio_02.zip', NULL, '2026-08-08 07:12:32.517049+00', '2026-08-08 07:12:32.517049+00', '2026-08-08 07:12:32.517049+00', '{"eTag": "\"e9e4001fd6c9a0402c99ef4745cc2295-1\"", "size": 608722, "mimetype": "application/zip", "cacheControl": "max-age=3600", "lastModified": "2026-08-08T07:12:32.000Z", "contentLength": 608722, "httpStatusCode": 200}', '3e446f22-1b6d-45a0-90fd-bc1008bf5e63', NULL, NULL);


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 258, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: private; Owner: postgres
--

SELECT pg_catalog.setval('"private"."settings_id_seq"', 1, false);


--
-- Name: blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."blocks_id_seq"', 1, false);


--
-- Name: grammar_chunks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."grammar_chunks_id_seq"', 4, true);


--
-- Name: grammar_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."grammar_groups_id_seq"', 1, false);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."items_id_seq"', 378, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."lessons_id_seq"', 1, false);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."levels_id_seq"', 1, false);


--
-- Name: notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."notes_id_seq"', 4, true);


--
-- Name: pronunciation_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."pronunciation_groups_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 5LF1K8cSsAwMMczZGpNFMa2H2Jgs4Js7QPHafcAybzL0FJ9BrX9LegztQo0qqFU

RESET ALL;
