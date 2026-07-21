SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict lRIcbPxf4n3WI2d1YYHkFzswgVQwGe4YBJeIQTEoSdKXnAFzoz7nlg55dc6bXkH

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



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 'authenticated', 'authenticated', 'zdebarth@gmail.com', NULL, '2026-07-12 14:30:09.073125+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-07-14 10:53:45.135469+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "101975537491237582905", "name": "Zdeněk Barth", "email": "zdebarth@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIheOAJkc7dBRBI5YWOY1Ls7qcTVX1BcA01zF5HS-C8tRicZg=s96-c", "full_name": "Zdeněk Barth", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIheOAJkc7dBRBI5YWOY1Ls7qcTVX1BcA01zF5HS-C8tRicZg=s96-c", "provider_id": "101975537491237582905", "email_verified": true, "phone_verified": false}', NULL, '2026-07-12 14:30:09.053512+00', '2026-07-17 11:29:22.177311+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('101975537491237582905', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '{"iss": "https://accounts.google.com", "sub": "101975537491237582905", "name": "Zdeněk Barth", "email": "zdebarth@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIheOAJkc7dBRBI5YWOY1Ls7qcTVX1BcA01zF5HS-C8tRicZg=s96-c", "full_name": "Zdeněk Barth", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIheOAJkc7dBRBI5YWOY1Ls7qcTVX1BcA01zF5HS-C8tRicZg=s96-c", "provider_id": "101975537491237582905", "email_verified": true, "phone_verified": false}', 'google', '2026-07-12 14:30:09.06794+00', '2026-07-12 14:30:09.067995+00', '2026-07-14 10:53:45.131761+00', 'ee1f3233-2703-4934-abc1-703293bef0e9');


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
	('4d09aa06-ec53-4517-afb9-cb707a3f6371', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-14 10:53:45.136371+00', '2026-07-17 11:29:22.18774+00', NULL, 'aal1', NULL, '2026-07-17 11:29:22.187635', 'what', '78.80.232.103', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('4d09aa06-ec53-4517-afb9-cb707a3f6371', '2026-07-14 10:53:45.138694+00', '2026-07-14 10:53:45.138694+00', 'oauth', '20bd67ae-3363-4ecd-8fba-1b2ccc478a47');


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
	('00000000-0000-0000-0000-000000000000', 36, 'd6sooufck5vr', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-17 04:29:15.761056+00', '2026-07-17 06:15:50.445763+00', 'hspwfahbxrj7', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 37, 'd5ykhpqugsmr', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-17 06:15:50.459055+00', '2026-07-17 07:27:56.250466+00', 'd6sooufck5vr', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 38, 'popvvq7dca3j', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-17 07:27:56.264712+00', '2026-07-17 08:59:01.314487+00', 'd5ykhpqugsmr', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 39, '4ioncvunesbg', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-17 08:59:01.325867+00', '2026-07-17 09:59:32.963482+00', 'popvvq7dca3j', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 40, 'iwf3sxui3qt5', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-17 09:59:32.969205+00', '2026-07-17 11:29:22.159945+00', '4ioncvunesbg', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 41, 'dmkngib6crbz', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', false, '2026-07-17 11:29:22.171265+00', '2026-07-17 11:29:22.171265+00', 'iwf3sxui3qt5', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 22, 'o2f5sjq53u77', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-14 10:53:45.137289+00', '2026-07-14 14:34:05.190385+00', NULL, '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 23, 'qfzy742itvzt', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-14 14:34:05.206767+00', '2026-07-14 16:06:40.995816+00', 'o2f5sjq53u77', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 24, 'ia2boxhja34r', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-14 16:06:41.007933+00', '2026-07-14 17:30:57.358666+00', 'qfzy742itvzt', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 25, 'rtguylfpbl3z', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-14 17:30:57.371183+00', '2026-07-14 18:30:36.666027+00', 'ia2boxhja34r', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 26, 'amu5f3hiw2po', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-14 18:30:36.674425+00', '2026-07-15 03:54:20.133449+00', 'rtguylfpbl3z', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 27, '3xbcdn5lywrl', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-15 03:54:20.148454+00', '2026-07-15 05:01:09.462315+00', 'amu5f3hiw2po', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 28, 'ttc3zrt3hrek', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-15 05:01:09.467913+00', '2026-07-15 06:09:52.284151+00', '3xbcdn5lywrl', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 29, 'zxtcii76r3fv', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-15 06:09:52.295462+00', '2026-07-15 07:23:44.923864+00', 'ttc3zrt3hrek', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 30, '5kqgqezwfunf', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-15 07:23:44.931517+00', '2026-07-15 08:23:12.435706+00', 'zxtcii76r3fv', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 31, '5fwphewnbm2i', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-15 08:23:12.441489+00', '2026-07-15 10:21:11.77408+00', '5kqgqezwfunf', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 32, 'yi7jtczwmv2u', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-15 10:21:11.780967+00', '2026-07-16 14:54:57.802583+00', '5fwphewnbm2i', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 33, '2ckahfsi6cp6', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-16 14:54:57.827369+00', '2026-07-16 19:45:24.979054+00', 'yi7jtczwmv2u', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 34, 't3ttth2l5cxa', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-16 19:45:24.990158+00', '2026-07-17 03:27:31.218493+00', '2ckahfsi6cp6', '4d09aa06-ec53-4517-afb9-cb707a3f6371'),
	('00000000-0000-0000-0000-000000000000', 35, 'hspwfahbxrj7', 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', true, '2026-07-17 03:27:31.232794+00', '2026-07-17 04:29:15.754676+00', 't3ttth2l5cxa', '4d09aa06-ec53-4517-afb9-cb707a3f6371');


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
-- Data for Name: grammar_chunks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grammar_chunks" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 'sloveso být', '<p>Sloveso <b>být</b> je v angličtině nepravidelné a má různé tvary podle osoby a času.</p><br /><p><span class=''inline-block w-30 pl-2''>já jsem</span><b>I am</b></p><p><span class=''inline-block w-30 pl-2''>ty jsi</span><b>you are</b></p><p><span class=''inline-block w-30 pl-2''>on je</span><b>he is</b></p><p><span class=''inline-block w-30 pl-2''>ona je</span><b>she is</b></p><p><span class=''inline-block w-30 pl-2''>ono je</span><b>it is</b></p><p><span class=''inline-block w-30 pl-2''>my jsme</span><b>we are</b></p><p><span class=''inline-block w-30 pl-2''>vy jste</span><b>you are</b></p><p><span class=''inline-block w-30 pl-2''>oni jsou</span><b>they are</b></p><br /><p>V mluveném jazyce se běžně používají zkrácené tvary:</p><br /><p><span class=''inline-block w-30 pl-2''>já jsem</span><b>I''m</b></p><p><span class=''inline-block w-30 pl-2''>ty jsi</span><b>you''re</b></p><p><span class=''inline-block w-30 pl-2''>on je</span><b>he''s</b></p><p><span class=''inline-block w-30 pl-2''>ona je</span><b>she''s</b></p><p><span class=''inline-block w-30 pl-2''>ono je</span><b>it''s</b></p><p><span class=''inline-block w-30 pl-2''>my jsme</span><b>we''re</b></p><p><span class=''inline-block w-30 pl-2''>vy jste</span><b>you''re</b></p><p><span class=''inline-block w-30 pl-2''>oni jsou</span><b>they''re</b></p>', 2, '2026-07-17 09:42:43.807261+00', NULL),
	(2, 'pořadí slov ve větě', '<p>Angličtina má pevné pořadí slov:</p><p class=''pl-2''><b>podmět + sloveso</b></p><br /><p>Ostatní větné členy se většinou řadí za sloveso podle významu a důrazu, podobně jako v češtině.</p>', 1, '2026-07-17 09:42:43.807261+00', NULL),
	(3, 'sloveso být - zápor', '<p>V angličtině se zápor tvoří pomocí pomocného slovesa <b>not</b>, které se přidává za sloveso.</p><br /><p><span class=''inline-block w-32 pl-2''>já nejsem</span><b>I am not</b></p><p><span class=''inline-block w-32 pl-2''>ty nejsi</span><b>you are not</b></p><p><span class=''inline-block w-32 pl-2''>on není</span><b>he is not</b></p><p><span class=''inline-block w-32 pl-2''>ona není</span><b>she is not</b></p><p><span class=''inline-block w-32 pl-2''>ono není</span><b>it is not</b></p><p><span class=''inline-block w-32 pl-2''>my nejsme</span><b>we are not</b></p><p><span class=''inline-block w-32 pl-2''>vy nejste</span><b>you are not</b></p><p><span class=''inline-block w-32 pl-2''>oni nejsou</span><b>they are not</b></p><br /><p>V mluveném jazyce se běžně používají zkrácené tvary:</p><br /><p><span class=''inline-block w-32 pl-2''>já nejsem</span><b>I''m not</b></p><p><span class=''inline-block w-32 pl-2''>ty nejsi</span><b>you aren''t</b></p><p><span class=''inline-block w-32 pl-2''>on není</span><b>he isn''t</b></p><p><span class=''inline-block w-32 pl-2''>ona není</span><b>she isn''t</b></p><p><span class=''inline-block w-32 pl-2''>my nejsme</span><b>we aren''t</b></p><p><span class=''inline-block w-32 pl-2''>vy nejste</span><b>you aren''t</b></p><p><span class=''inline-block w-32 pl-2''>oni nejsou</span><b>they aren''t</b></p><br /><p>Existuje i druhá varianta zkráceného tvaru, která je vnímána s větším důrazem na negaci:</p><br /><p><span class=''inline-block w-32 pl-2''>já nejsem</span><b>I''m not</b></p><p><span class=''inline-block w-32 pl-2''>ty nejsi</span><b>you''re not</b></p><p><span class=''inline-block w-32 pl-2''>on není</span><b>he''s not</b></p><p><span class=''inline-block w-32 pl-2''>ona není</span><b>she''s not</b></p><p><span class=''inline-block w-32 pl-2''>ono není</span><b>it''s not</b></p><p><span class=''inline-block w-32 pl-2''>my nejsme</span><b>we''re not</b></p><p><span class=''inline-block w-32 pl-2''>vy nejste</span><b>you''re not</b></p><p><span class=''inline-block w-32 pl-2''>oni nejsou</span><b>they''re not</b></p>', 3, '2026-07-17 09:42:43.807261+00', NULL),
	(4, 'sloveso být - otázky YN', '<p>Otázky ano/ne se tvoří inverzí slovesa <b>být</b> a podmětu.</p><br /><p><span class=''inline-block w-36 pl-2''>Jsem hladový?</span><b>Am I hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Jsi hladový?</span><b>Are you hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Je hladový?</span><b>Is he hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Je hladová?</span><b>Is she hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Je to hladové?</span><b>Is it hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Jsme hladoví?</span><b>Are we hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Jste hladoví?</span><b>Are you hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Jsou hladoví?</span><b>Are they hungry?</b></p><br /><p>Obdobně se tvoří záporné verze otázek.</p><br /><p><span class=''inline-block w-36 pl-2''>Nejsem hladový?</span><b>Am I not hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Nejsi hladový?</span><b>Aren''t you hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Není hladový?</span><b>Isn''t hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Není hladová?</span><b>Isn''t she hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Není to hladové?</span><b>Isn''t it hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Nejsme hladoví?</span><b>Aren''t we hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Nejste hladoví?</span><b>Aren''t you hungry?</b></p><p><span class=''inline-block w-36 pl-2''>Nejsou hladoví?</span><b>Aren''t they hungry?</b></p><br /><p>Běžně se na tázací věty odpovídá nejen ano / ne, ale i příslušným tvarem slovesa být. S ano se běžně používá nezkrácený tvar, s ne zkrácený.</p><br /><p><span class=''inline-block w-36 pl-2''>Ano, jsem.</span><b>Yes, I am.</b></p><p><span class=''inline-block w-36 pl-2''>Ano, jsi.</span><b>Yes, you are.</b></p><p><span class=''inline-block w-36 pl-2''>Ano, je.</span><b>Yes, he/she/it is.</b></p><p><span class=''inline-block w-36 pl-2''>Ano, jsme</span><b>Yes, we are.</b></p><p><span class=''inline-block w-36 pl-2''>Ano, jste.</span><b>Yes, you are.</b></p><p><span class=''inline-block w-36 pl-2''>Ano, jsou.</span><b>Yes, they are.</b></p><br /><p><span class=''inline-block w-36 pl-2''>Ne, nejsem.</span><b>Yes, I''m not.</b></p><p><span class=''inline-block w-36 pl-2''>Ne, nejsi.</span><b>Yes, you aren''t.</b></p><p><span class=''inline-block w-36 pl-2''>Ne, není.</span><b>Yes, he/she/it isn''t.</b></p><p><span class=''inline-block w-36 pl-2''>Ne, nejsme</span><b>Yes, we aren''t.</b></p><p><span class=''inline-block w-36 pl-2''>Ne, nejste.</span><b>Yes, you aren''t.</b></p><p><span class=''inline-block w-36 pl-2''>Ne, nejsou.</span><b>Yes, they aren''t.</b></p>', 4, '2026-07-17 09:42:43.807261+00', NULL),
	(5, 'sloveso být - otázky WH', '<p>Otázky s tázacím zájmenem se tvoří inverzí slovesa <b>být</b> a podmětu, přičemž tázací zájmeno stojí na začátku věty.</p><br /><p><span class=''inline-block w-32 pl-2''>Kdo jsem?</span><b>Who am I?</b></p><p><span class=''inline-block w-32 pl-2''>Kdo jsi?</span><b>Who are you?</b></p><p><span class=''inline-block w-32 pl-2''>Kdo je to? (on)</span><b>Who is he?</b></p><p><span class=''inline-block w-32 pl-2''>Kdo je to? (ona)</span><b>Who is she?</b></p><p><span class=''inline-block w-32 pl-2''>Kdo je to? (ono)</span><b>What is it?</b></p><p><span class=''inline-block w-32 pl-2''>Kdo jsme?</span><b>Who are we?</b></p><p><span class=''inline-block w-32 pl-2''>Kdo jste?</span><b>Who are you?</b></p><p><span class=''inline-block w-32 pl-2''>Kdo jsou?</span><b>Who are they?</b></p>', 5, '2026-07-17 09:42:43.807261+00', NULL),
	(7, 'množné číslo', '<p><b>Počitatelná podstatná jména</b> označují věci, které lze spočítat (např. book, apple, car).</p><br /><p><b>Nepočitatelná podstatná jména</b> označují látky nebo abstraktní pojmy, které nelze počítat jako jednotlivé kusy (např. water, sugar, information).</p><br /><p><b>Množné číslo</b> tvoříme u počitatelných podstatných jmen obvykle přidáním -s, u slov končících na -ch, -sh, -x, -s, -z přidáváme -es.</p><br /><p><span class=''inline-block w-32 pl-2''>book</span><b>books</b></p><p><span class=''inline-block w-32 pl-2''>box</span><b>boxes</b></p><br /><p>Některá slova mají nepravidelné tvary.Pokud má podstatné jméno nepravidelný množný tvar, bude ten tvar uveden samostatně.</p><br /><p><span class=''inline-block w-32 pl-2''>child</span><b>children</b></p><p><span class=''inline-block w-32 pl-2''>mouse</span><b>mice</b></p>', 7, '2026-07-17 09:42:43.807261+00', NULL),
	(6, 'přivlastňování', '<p>Kromě přivlastňovacích zájmen (my, your, his, her, its, our, their) se v angličtině přivlastňuje pomocí apostrofu a -s:</p><br /><p><span class=''inline-block w-32 pl-2''>Tomova kniha</span><b>Tom''s book</b></p><br /><p>U množného čísla zakončeného na -s se používá pouze apostrof:</p><br /><p><span class=''inline-block w-32 pl-2''>pokoj studentů</span><b>students'' room</b></p>', 6, '2026-07-17 09:42:43.807261+00', NULL),
	(8, 'členy', '<p>V angličtině rozlišujeme <b>neurčitý člen</b> (<b>a / an</b>) a <b>určitý člen</b> (<b>the</b>).</p><br /><p><b>A / an</b> používáme u počitatelného podstatného jména v jednotném čísle, když o něm mluvíme poprvé nebo obecně:</p><br /><p><span class=''inline-block w-32 pl-2''>učitel</span><b>a teacher</b></p><br /><p><b>An</b> píšeme před výslovností začínající samohláskou (an apple, an hour), jinak používáme <b>a</b>.</p><br /><p><b>The</b> používáme, když je věc konkrétní, známá z kontextu nebo už byla zmíněna:</p><br /><p><span class=''inline-block w-32 pl-2''>ten učitel</span><b>the teacher</b></p><br /><p>U množného čísla a u nepočitatelných podstatných jmen často člen nepoužíváme, pokud mluvíme obecně:</p><br /><p><span class=''inline-block w-32 pl-2''>učitelé</span><b>teachers</b></p><br /><p><span class=''inline-block w-32 pl-2''>chleba</span><b>bread</b></p>', 8, '2026-07-17 09:42:43.807261+00', NULL),
	(9, 'čísla', '<p><b>Čísla 13 až 19</b> se tvoří příponou <b>-teen</b></p><p><span class=''inline-block w-32 pl-2''>čtrnáct</span><b>fourteen</b></p><br /><p><b>Desítky</b> od 30 výše se obvykle tvoří příponou <b>-ty</b></p><p><span class=''inline-block w-32 pl-2''>čtyřicet</span><b>fourty</b></p><br /><p><b>Složená čísla</b> se tvoří spojením stovek desítek číslic</p><p><span class=''inline-block w-32 pl-2''>sto dvacet jedna</span><b>one hundred twenty-one</b></p><br /><p><b>Řadové číslovky</b> vyjadřují pořadí. U first, second, third jde o nepravidelné tvary, od 4 výše se obvykle tvoří příponou <b>-th</b></p><p><span class=''inline-block w-32 pl-2''>čtvrtý</span><b>fourth</b></p><br /><p><b>Zlomky</b> od 3 dále se obvykle tvoří jako <b>číslo + příslušná řadová číslovka</b></p><p><span class=''inline-block w-32 pl-2''>jedna čtvrtina</span><b>one fourth</b></p><br /><p><b>Desetinná čísla</b> čteme s výrazem <b>point</b></p><p><span class=''inline-block w-32 pl-2''>osm celých pět</span><b>eight point five</b></p>', 9, '2026-07-17 09:42:43.807261+00', NULL),
	(10, 'čas a datumy', '<p><b>Datumy</b> v angličtině se obvykle píší ve formátu měsíc-den-rok (January 1, 2020). Pro zkrácenou formu se používá číslo měsíce a dne (1/1/2020).</p><br /><p><b>Čas</b> se v angličtině často uvádí ve 12hodinovém formátu s označením AM (ante meridiem) pro dopoledne a PM (post meridiem) pro odpoledne. Například 3:00 PM znamená 15:00.</p>', 10, '2026-07-17 09:42:43.807261+00', NULL),
	(11, 'předložky času in, on, at', '<p><b>In</b> používáme pro delší časové úseky jako měsíce, roky, roční období a delší části dne:</p><br /><p><span class=''inline-block w-32 pl-2''>v lednu</span><b>in January</b></p><br /><p><b>On</b> používáme pro konkrétní dny a data:</p><br /><p><span class=''inline-block w-32 pl-2''>v pondělí</span><b>on Monday</b></p><br /><p><b>At</b> používáme pro konkrétní časy a některé výrazy jako at night:</p><br /><p><span class=''inline-block w-32 pl-2''>v deset hodin</span><b>at ten o''clock</b></p>', 11, '2026-07-17 09:42:43.807261+00', NULL),
	(12, 'předložky místa in, on, at', '<p><b>In</b> používáme pro označení umístění uvnitř něčeho:</p><br /><p><span class=''inline-block w-32 pl-2''>v krabici</span><b>in the box</b></p><br /><p><b>On</b> používáme pro označení umístění na povrchu něčeho:</p><br /><p><span class=''inline-block w-32 pl-2''>na stole</span><b>on the table</b></p><br /><p><b>At</b> používáme pro označení konkrétního místa nebo bodu:</p><br /><p><span class=''inline-block w-32 pl-2''>u školy</span><b>at the school</b></p>', 12, '2026-07-17 09:42:43.807261+00', NULL),
	(13, 'přítomný čas prostý', '<p><b>Přítomný čas prostý (present simple)</b> používáme pro popis obecných pravd, zvyků a pravidelných činností. Tvoří se přidáním -s nebo -es u třetí osoby jednotného čísla (he, she, it) a základní tvar slovesa pro ostatní osoby.</p><br /><p><span class=''inline-block w-32 pl-2''>já pracuji</span><b>I work</b></p><p><span class=''inline-block w-32 pl-2''>ty pracuješ</span><b>you work</b></p><p><span class=''inline-block w-32 pl-2''>on pracuje</span><b>he works</b></p><p><span class=''inline-block w-32 pl-2''>ona pracuje</span><b>she works</b></p><p><span class=''inline-block w-32 pl-2''>to pracuje</span><b>it works</b></p><p><span class=''inline-block w-32 pl-2''>my pracujeme</span><b>we work</b></p><p><span class=''inline-block w-32 pl-2''>vy pracujete</span><b>you work</b></p><p><span class=''inline-block w-32 pl-2''>oni pracují</span><b>they work</b></p>', 13, '2026-07-17 09:42:43.807261+00', NULL),
	(14, 'přítomný čas prostý - zápor', '<p>Pro tvoření záporu v přítomném čase prostém používáme pomocné sloveso <b>do</b> (pro I, you, we, they) nebo <b>does</b> (pro he, she, it) a základní tvar slovesa s negací <b>not</b>.</p><br /><p><span class=''inline-block w-36 pl-2''>já nepracuji</span><b>I do not work</b></p><p><span class=''inline-block w-36 pl-2''>ty nepracuješ</span><b>you do not work</b></p><p><span class=''inline-block w-36 pl-2''>on nepracuje</span><b>he does not work</b></p><p><span class=''inline-block w-36 pl-2''>my nepracujeme</span><b>we do not work</b></p><p><span class=''inline-block w-36 pl-2''>vy nepracujete</span><b>you do not work</b></p><p><span class=''inline-block w-36 pl-2''>oni nepracují</span><b>they do not work</b></p><br /><p>Běžně se používá zkrácený tvar <b>don''t</b> (pro I, you, we, they) nebo <b>doesn''t</b> (pro he, she, it).</p><br /><p><span class=''inline-block w-36 pl-2''>já nepracuji</span><b>I don''t work</b></p><p><span class=''inline-block w-36 pl-2''>ty nepracuješ</span><b>you don''t work</b></p><p><span class=''inline-block w-36 pl-2''>on nepracuje</span><b>he doesn''t work</b></p><p><span class=''inline-block w-36 pl-2''>my nepracujeme</span><b>we don''t work</b></p><p><span class=''inline-block w-36 pl-2''>vy nepracujete</span><b>you don''t work</b></p><p><span class=''inline-block w-36 pl-2''>oni nepracují</span><b>they don''t work</b></p>', 14, '2026-07-17 09:42:43.807261+00', NULL),
	(15, 'zvratná zájmena', '<p><b>Zvratná zájmena</b> se používají, když podmět a předmět věty jsou stejné osoby nebo věci. Tvoří se přidáním přípony <b>-self</b> pro jednotné číslo a <b>-selves</b> pro množné číslo k osobním zájmenům.</p><br /><p><span class=''inline-block w-32 pl-2''>já sám</span><b>myself</b></p><p><span class=''inline-block w-32 pl-2''>ty sám</span><b>yourself</b></p><p><span class=''inline-block w-32 pl-2''>on sám</span><b>himself</b></p><p><span class=''inline-block w-32 pl-2''>ona sama</span><b>herself</b></p><p><span class=''inline-block w-32 pl-2''>to samo</span><b>itself</b></p><p><span class=''inline-block w-32 pl-2''>my sami</span><b>ourselves</b></p><p><span class=''inline-block w-32 pl-2''>vy sami</span><b>yourselves</b></p><p><span class=''inline-block w-32 pl-2''>oni sami</span><b>themselves</b></p>', 15, '2026-07-17 09:42:43.807261+00', NULL),
	(16, 'zájmena v předmětu', '<p><b>Zájmena v předmětu</b> se používají jako předmět věty, tedy pro označení osoby nebo věci, která je ovlivněna dějem.</p><br /><p><span class=''inline-block w-32 pl-2''>já</span><b>me</b></p><p><span class=''inline-block w-32 pl-2''>ty</span><b>you</b></p><p><span class=''inline-block w-32 pl-2''>on</span><b>him</b></p><p><span class=''inline-block w-32 pl-2''>ona</span><b>her</b></p><p><span class=''inline-block w-32 pl-2''>to</span><b>it</b></p><p><span class=''inline-block w-32 pl-2''>my</span><b>us</b></p><p><span class=''inline-block w-32 pl-2''>vy</span><b>you</b></p><p><span class=''inline-block w-32 pl-2''>oni</span><b>them</b></p>', 16, '2026-07-17 09:42:43.807261+00', NULL),
	(17, 'přítomný čas prostý - otázky ano/ne', '<p>Pro tvoření otázek v přítomném čase prostém používáme pomocné sloveso <b>do</b> (pro I, you, we, they) nebo <b>does</b> (pro he, she, it) a základní tvar slovesa.</p><br /><p><span class=''inline-block w-32 pl-2''>Pracuji?</span><b>Do I work?</b></p><p><span class=''inline-block w-32 pl-2''>Pracuješ?</span><b>Do you work?</b></p><p><span class=''inline-block w-32 pl-2''>Pracuje?</span><b>Does he/she/it work?</b></p><p><span class=''inline-block w-32 pl-2''>Pracujeme?</span><b>Do we work?</b></p><p><span class=''inline-block w-32 pl-2''>Pracujete?</span><b>Do you work?</b></p><p><span class=''inline-block w-32 pl-2''>Pracují?</span><b>Do they work?</b></p><br /><p>Pro tvoření otázek v negativním tvaru se používá <b>do you not</b> etc.</p><br /><p><span class=''inline-block w-32 pl-2''>Nepracuji?</span><b>Do I not work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracuješ?</span><b>Do you not work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracuje?</span><b>Does he/she/it not work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracujeme?</span><b>Do we not work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracujete?</span><b>Do you not work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracují?</span><b>Do they not work?</b></p><br /><p>Běžněji se ale používají zkrácené tvary <b>don''t you</b> etc.</p><br /><p><span class=''inline-block w-32 pl-2''>Nepracuji?</span><b>Don''t I work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracuješ?</span><b>Don''t you work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracuje?</span><b>Doesn''t he/she/it work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracujeme?</span><b>Don''t we work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracujete?</span><b>Don''t you work?</b></p><p><span class=''inline-block w-32 pl-2''>Nepracují?</span><b>Don''t they work?</b></p>', 17, '2026-07-17 09:42:43.807261+00', NULL),
	(18, 'přítomný čas prostý - otázky s tázacím zájmenem', '<p>Pro tvoření otázek s tázacím zájmenem v přítomném čase prostém používáme tázací zájmena (what, where, when, why, who, how) následovaná pomocným slovesem <b>do</b> (pro I, you, we, they) nebo <b>does</b> (pro he, she, it) a základním tvarem slovesa. Záporné tvary otázek se tvoří stejně jako u předchozího příkladu.</p><br /><p><span class=''inline-block w-32 pl-2''>Co děláš?</span><b>What do you do?</b></p><p><span class=''inline-block w-32 pl-2''>Co beděláš?</span><b>What do you not do?</b></p><p><span class=''inline-block w-32 pl-2''>Co neděláš?</span><b>What don''t you do?</b></p>', 18, '2026-07-17 09:42:43.807261+00', NULL),
	(19, 'stupňování přídavných jmen', '<p><b>Stupňování přídavných jmen</b> (comparison of adjectives) v angličtině:</p><br /><p><b>1. Stupňování pomocí -er/-est:</b> Krátká přídavná jména tvoří 2. stupeň přidáním -er  a 3. stupeň přidáním -est.</p><br /><p><span class=''inline-block w-36 pl-2''>velký</span><b>big</b></p><p><span class=''inline-block w-36 pl-2''>větší</span><b>bigger</b></p><p><span class=''inline-block w-36 pl-2''>největší</span><b>biggest</b></p><br /><p><b>2. Stupňování pomocí more/most:</b> Dlouhá přídavná jména tvoří 2. stupeň s ''more'' a 3. stupeň s ''most''.</p><br /><p><span class=''inline-block w-36 pl-2''>zajímavý</span><b>interesting</b></p><p><span class=''inline-block w-36 pl-2''>více zajímavý</span><b>more interesting</b></p><p><span class=''inline-block w-36 pl-2''>nejvíce zajímavý</span><b>the most interesting</b></p><br /><p><b>3. Stupňování pomocí less/least:</b> Pro vyjádření menší míry použijeme ''less'' a ''least''.</p><br /><p><span class=''inline-block w-36 pl-2''>zajímavý</span><b>interesting</b></p><p><span class=''inline-block w-36 pl-2''>méně zajímavý</span><b>less interesting</b></p><p><span class=''inline-block w-36 pl-2''>nejméně zajímavý</span><b>the least interesting</b></p>', 19, '2026-07-17 09:42:43.807261+00', NULL),
	(20, 'rozkazovací způsob', '<p><b>Rozkazovací způsob</b> (imperative mood) se v angličtině tvoří většinou použitím základního tvaru slovesa bez podmětu.</p><br /><p><span class=''inline-block w-36 pl-2''>Jdi domů.</span><b>Go home.</b></p>', 20, '2026-07-17 09:42:43.807261+00', NULL),
	(21, 'modální slovesa', '<p><b>Modální slovesa</b> (modal verbs) jsou pomocná slovesa, která vyjadřují schopnost, možnost, povinnost nebo pravděpodobnost. Mezi nejběžnější modální slovesa patří:</p><br /><p><span class=''inline-block w-36 pl-2''>moci</span><b>can</b></p><p><span class=''inline-block w-36 pl-2''>moci (minulost)</span><b>could</b></p><p><span class=''inline-block w-36 pl-2''>muset</span><b>must</b></p><p><span class=''inline-block w-36 pl-2''>muset (povinnost)</span><b>have to</b></p><p><span class=''inline-block w-36 pl-2''>nemoci</span><b>can''t</b></p><p><span class=''inline-block w-36 pl-2''>nesmět</span><b>mustn''t</b></p><br /><p><b>Must </b> vyjadřuje subjektivní nutnost např. Musím se najíst.</p><p><b>Have to </b> vyjadřuje objektivní povinnost např. Musím jít do školy.</p>', 21, '2026-07-17 09:42:43.807261+00', NULL),
	(22, 'navrhovací způsob', '<p><b>Navrhovací způsob</b> (making suggestions) v angličtině se nejčastěji vyjadřuje pomocí těchto vět:</p><ul><li><b>Let''s</b> + základní tvar slovesa</li><li><b>Shall we</b> + základní tvar slovesa?</li><li><b>How about / What about</b> + -ing?</li><li><b>Why don''t we</b> + základní tvar slovesa?</li><li><b>Would you like to</b> + základní tvar slovesa?</li><li><b>We could</b> + základní tvar slovesa.</li><li><b>Maybe we should</b> + základní tvar slovesa.</li></ul>', 22, '2026-07-17 09:42:43.807261+00', NULL),
	(23, 'přítomný čas průběhový', '<p><b>Přítomný čas průběhový</b> (present continuous) se v angličtině tvoří pomocí pomocného slovesa ''to be'' v přítomném čase a příčestí přítomného času (-ing form) hlavního slovesa.</p><br /><p class=''pl-2''><b>to be + verb-ing</b></p><br /><p>Průběhový tvar se používá pro právě probíhající činnost - Právě teď pracuji.</p><p><span class=''inline-block w-36 pl-2''>Já pracuji.</span><b>I am working.</b></p><br /><p>Prostý tvar se používá pro obecnou činnost - pracuji, mám zaměstnání.</p><p><span class=''inline-block w-36 pl-2''>Já pracuji.</span><b>I work.</b></p><br /><p>Běžněji se používají zkrácené tvary.</p><p><span class=''inline-block w-36 pl-2''>Já pracuji.</span><b>I''m working.</b></p>', 23, '2026-07-17 09:42:43.807261+00', NULL),
	(24, 'přítomný čas průběhový - zápor', '<p><b>Přítomný čas průběhový - zápor</b> se tvoří pomocí záporky ''not'' mezi pomocným slovesem ''to be'' a příčestím přítomného času (-ing form) hlavního slovesa.</p><br /><p class=''pl-2''><b>to be + not + verb-ing</b></p><br /><p><span class=''inline-block w-36 pl-2''>Nepracuješ.</span><b>You are not working.</b></p><br /><p>Běžněji se používají zkrácené tvary.</p><br /><p><span class=''inline-block w-36 pl-2''>Já nepracuji.</span><b>You aren''t working.</b></p>', 24, '2026-07-17 09:42:43.807261+00', NULL),
	(25, 'přítomný čas průběhový - otázky ano/ne + krátké odpovědi', '<p><b>Přítomný čas průběhový - otázky ano/ne</b> se tvoří pomocí inverze pomocného slovesa ''to be'' a podmětu, následovanou příčestím přítomného času (-ing form) hlavního slovesa.</p><br /><p class=''pl-2''><b>to be + subject + verb-ing?</b></p><p class=''pl-2''><b>to be + not + subject + verb-ing?</b></p><br /><p><span class=''inline-block w-36 pl-2''>Pracuješ?</span><b>Are you working?</b></p><p><span class=''inline-block w-36 pl-2''>Nepracuješ?</span><b>Aren''t you working?</b></p><br /><p>Kratké odpovědi jsou shodné jako u prostého tvaru:</p><p><span class=''inline-block w-36 pl-2''>Ano, pracuji.</span><b>Yes, I am.</b></p><p><span class=''inline-block w-36 pl-2''>Ne, nepracuji.</span><b>No, I''m not.</b></p>', 25, '2026-07-17 09:42:43.807261+00', NULL),
	(26, 'přítomný čas průběhový - otázky s tázacím zájmenem', '<p><b>Přítomný čas průběhový - otázky s tázacím zájmenem</b> se tvoří pomocí inverze pomocného slovesa ''to be'' a podmětu, následovanou příčestím přítomného času (-ing form) hlavního slovesa a tázacím zájmenem.</p><br /><p class=''pl-2''><b>to be + subject + verb-ing + question word?</b></p><p><span class=''inline-block w-36 pl-2''>Co děláš?</span><b>What are you doing?</b></p><br /><p class=''pl-2''><b>to be + not + subject + verb-ing + question word?</b></p><p><span class=''inline-block w-36 pl-2''>Co neděláš?</span><b>What aren''t you doing?</b></p>', 26, '2026-07-17 09:42:43.807261+00', NULL),
	(27, 'minulý čas - sloveso to be', '<p><b>Minulý čas - sloveso to be</b> se v angličtině tvoří pomocí tvarů ''was'' pro první a třetí osobu jednotného čísla a ''were'' pro druhou osobu jednotného čísla a všechny osoby množného čísla. Záporné tvary jsou ''wasn''t'' a ''weren''t''. Otázky se tvoří inverzí.</p><br /><p><span class=''inline-block w-36 pl-2''>Já byl.</span><b>I was.</b></p><p><span class=''inline-block w-36 pl-2''>Ty jsi byl.</span><b>You were.</b></p><p><span class=''inline-block w-36 pl-2''>On byl.</span><b>He was.</b></p><p><span class=''inline-block w-36 pl-2''>Ona byla.</span><b>She was.</b></p><p><span class=''inline-block w-36 pl-2''>Ono bylo.</span><b>It was.</b></p><p><span class=''inline-block w-36 pl-2''>My jsme byli.</span><b>We were.</b></p><p><span class=''inline-block w-36 pl-2''>Vy jste byli.</span><b>You were.</b></p><p><span class=''inline-block w-36 pl-2''>Oni byli.</span><b>They were.</b></p>', 27, '2026-07-17 09:42:43.807261+00', NULL),
	(28, 'minulý čas prostý', '<p><b>Minulý čas prostý</b> (past simple) se v angličtině tvoří přidáním koncovky -ed k pravidelným slovesům. Nepravidelná slovesa mají své vlastní tvary, které je třeba se naučit. Záporné věty se tvoří pomocí pomocného slovesa ''did'' a záporky ''not'', následovaného základním tvarem slovesa. Otázky se tvoří inverzí pomocného slovesa ''did'' a podmětu.</p><br /><p><span class=''inline-block w-36 pl-2''>Já pracoval.</span><b>I worked.</b></p><p><span class=''inline-block w-36 pl-2''>Ty jsi pracoval.</span><b>You worked.</b></p><p><span class=''inline-block w-36 pl-2''>On pracoval.</span><b>He worked.</b></p><p><span class=''inline-block w-36 pl-2''>Ona pracovala.</span><b>She worked.</b></p><p><span class=''inline-block w-36 pl-2''>Ono pracovalo.</span><b>It worked.</b></p><p><span class=''inline-block w-36 pl-2''>My jsme pracovali.</span><b>We worked.</b></p><p><span class=''inline-block w-36 pl-2''>Vy jste pracovali.</span><b>You worked.</b></p><p><span class=''inline-block w-36 pl-2''>Oni pracovali.</span><b>They worked.</b></p>', 28, '2026-07-17 09:42:43.807261+00', NULL),
	(29, 'minulý čas - otázky s tázacím zájmenem', '<p><b>Minulý čas - otázky s tázacím zájmenem</b> se tvoří pomocí inverze pomocného slovesa ''did'' a podmětu, následovanou základním tvarem slovesa a tázacím zájmenem.</p><br /><p class=''pl-2''><b>Did + subject + verb + question word?</b></p><p><span class=''inline-block w-36 pl-2''>Co jsi dělal?</span><b>What did you do?</b></p><br /><p class=''pl-2''><b>Did + not + subject + verb + question word?</b></p><p><span class=''inline-block w-36 pl-2''>Co jsi nedělal?</span><b>What didn''t you do?</b></p>', 29, '2026-07-17 09:42:43.807261+00', NULL);


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
	(2, 'být - zápor', NULL, 1, 2, '2026-07-17 09:10:00.865519+00', NULL),
	(3, 'být - otázky ano/ne', NULL, 1, 3, '2026-07-17 09:10:00.865519+00', NULL),
	(4, 'být - otázky s tázacím zájmenem', NULL, 1, 4, '2026-07-17 09:10:00.865519+00', NULL),
	(5, 'množné číslo', NULL, 1, 5, '2026-07-17 09:10:00.865519+00', NULL),
	(6, 'přivlastňování', NULL, 1, 6, '2026-07-17 09:10:00.865519+00', NULL),
	(7, 'členy', NULL, 1, 7, '2026-07-17 09:10:00.865519+00', NULL),
	(8, 'čísla', NULL, 1, 8, '2026-07-17 09:10:00.865519+00', NULL),
	(9, 'čas a datumy', NULL, 1, 9, '2026-07-17 09:10:00.865519+00', NULL),
	(10, 'předložky čas in, on, at', NULL, 1, 10, '2026-07-17 09:10:00.865519+00', NULL),
	(11, 'předložky místa, in, on, at', NULL, 1, 11, '2026-07-17 09:10:00.865519+00', NULL),
	(12, 'přítomný čas prostý', NULL, 1, 12, '2026-07-17 09:10:00.865519+00', NULL),
	(13, 'přítomný čas prostý - zápor', NULL, 1, 13, '2026-07-17 09:10:00.865519+00', NULL),
	(14, 'pravidlo jednoho záporu', NULL, 1, 14, '2026-07-17 09:10:00.865519+00', NULL),
	(15, 'zvratná zájmena', NULL, 1, 15, '2026-07-17 09:10:00.865519+00', NULL),
	(16, 'zájmena v předmětu', NULL, 1, 16, '2026-07-17 09:10:00.865519+00', NULL),
	(1, 'být', NULL, 1, 1, '2026-07-17 09:10:00.865519+00', NULL);


--
-- Data for Name: blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."blocks" ("id", "name", "note", "lesson_id", "grammar_chunk_id", "sort_order", "updated_at", "deleted_at", "show_in_topics", "is_practice_block") VALUES
	(2, 'být - základní tvary', NULL, 1, 1, 2, '2026-07-17 09:44:00.993319+00', NULL, false, true),
	(3, 'být - zkrácené tvary', NULL, 1, 1, 3, '2026-07-17 09:44:25.8369+00', NULL, false, true),
	(4, 'být - věty s přídavnýmí jmény #1', NULL, 1, 2, 4, '2026-07-17 09:44:56.249945+00', NULL, false, true),
	(5, 'být - věty s přídavnými jmény #2', NULL, 1, 2, 5, '2026-07-17 09:45:31.889596+00', NULL, false, true),
	(6, 'být - věty s přídavnými jmény #3', NULL, 1, 2, 6, '2026-07-17 09:46:10.209435+00', NULL, false, true),
	(7, 'slovíčka', NULL, 1, NULL, 7, '2026-07-17 09:57:54.738876+00', NULL, false, true),
	(1, 'osobní zájmena', NULL, 1, NULL, 1, '2026-07-15 08:53:02.826619+00', NULL, true, true);


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notes" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 'short', 'Přídavné jméno "short" se v angličtině používá označení malé (nevysoké) postavy.', 1, '2026-07-15 08:28:28.144793+00', NULL);


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."items" ("id", "czech", "english", "pronunciation", "audio", "note_id", "sort_order", "block_id", "updated_at", "deleted_at") VALUES
	(1, 'já', 'I', 'ˈaɪ', 'i.opus', NULL, 1000, 1, '2026-07-17 10:00:53.066753+00', NULL),
	(2, 'ty', 'you', 'jˈuː', 'you.opus', NULL, 1001, 1, '2026-07-17 10:00:53.066753+00', NULL),
	(3, 'on', 'he', 'hˈiː', 'he.opus', NULL, 1002, 1, '2026-07-17 10:00:53.066753+00', NULL),
	(4, 'ona', 'she', 'ʃˈiː', 'she.opus', NULL, 1003, 1, '2026-07-17 10:00:53.066753+00', NULL),
	(5, 'ono', 'it', 'ˈɪt', 'it.opus', NULL, 1004, 1, '2026-07-17 10:00:53.066753+00', NULL),
	(6, 'my', 'we', 'wˈiː', 'we.opus', NULL, 1005, 1, '2026-07-17 10:00:53.066753+00', NULL),
	(7, 'vy', 'you', 'jˈuː', 'you.opus', NULL, 1006, 1, '2026-07-17 10:00:53.066753+00', NULL),
	(8, 'oni', 'they', 'ðˈeɪ', 'they.opus', NULL, 1007, 1, '2026-07-17 10:00:53.066753+00', NULL),
	(9, 'angličtina', 'English', 'ˈɪŋɡlɪʃ', 'english.opus', NULL, 1008, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(10, 'čeština', 'Czech', 'tʃˈɛk', 'czech.opus', NULL, 1009, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(11, 'být', 'be', 'bˈiː', 'be.opus', NULL, 1010, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(12, 'ano', 'yes', 'jˈɛs', 'yes.opus', NULL, 1011, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(13, 'ne', 'no', 'nˈoʊ', 'no.opus', NULL, 1012, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(14, 'šťastný', 'happy', 'hˈæpi', 'happy.opus', NULL, 1013, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(15, 'smutný', 'sad', 'sˈæd', 'sad.opus', NULL, 1014, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(16, 'velký', 'big', 'bˈɪɡ', 'big.opus', NULL, 1015, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(17, 'malý', 'small', 'smˈɔːl', 'small.opus', NULL, 1016, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(18, 'mladý', 'young', 'jˈʌŋ', 'young.opus', NULL, 1017, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(19, 'starý', 'old', 'ˈoʊld', 'old.opus', NULL, 1018, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(20, 'vysoký', 'tall', 'tˈɔːl', 'tall.opus', NULL, 1019, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(21, 'krátký', 'short', 'ʃˈɔːɹt', 'short.opus', 1, 1020, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(22, 'unavený', 'tired', 'tˈaɪɚd', 'tired.opus', NULL, 1021, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(23, 'hladový', 'hungry', 'hˈʌŋɡɹi', 'hungry.opus', NULL, 1022, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(24, 'přátelský', 'friendly', 'fɹˈɛndli', 'friendly.opus', NULL, 1023, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(25, 'naštvaný', 'angry', 'ˈæŋɡɹi', 'angry.opus', NULL, 1024, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(26, 'dobrý', 'good', 'ɡˈʊd', 'good.opus', NULL, 1025, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(27, 'krásný', 'beautiful', 'bjˈuːɾifəl', 'beautiful.opus', NULL, 1026, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(28, 'ošklivý', 'ugly', 'ˈʌɡli', 'ugly.opus', NULL, 1027, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(29, 'silný', 'strong', 'stɹˈɔŋ', 'strong.opus', NULL, 1028, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(30, 'slabý', 'weak', 'wˈiːk', 'weak.opus', NULL, 1029, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(31, 'rychlý', 'fast', 'fˈæst', 'fast.opus', NULL, 1030, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(32, 'pomalý', 'slow', 'slˈoʊ', 'slow.opus', NULL, 1031, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(33, 'bohatý', 'rich', 'ɹˈɪtʃ', 'rich.opus', NULL, 1032, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(34, 'chudý', 'poor', 'pˈʊɹ', 'poor.opus', NULL, 1033, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(35, 'čistý', 'clean', 'klˈiːn', 'clean.opus', NULL, 1034, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(36, 'špinavý', 'dirty', 'dˈɜːɾi', 'dirty.opus', NULL, 1035, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(37, 'horký', 'hot', 'hˈɑːt', 'hot.opus', NULL, 1036, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(38, 'studený', 'cold', 'kˈoʊld', 'cold.opus', NULL, 1037, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(39, 'snadný', 'easy', 'ˈiːzi', 'easy.opus', NULL, 1038, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(40, 'obtížný', 'difficult', 'dˈɪfɪkəlt', 'difficult.opus', NULL, 1039, 7, '2026-07-17 10:00:53.066753+00', NULL),
	(41, 'já jsem', 'I am', 'aɪˈæm', 'i_am.opus', NULL, 1040, 2, '2026-07-17 10:00:53.066753+00', NULL),
	(42, 'ty jsi', 'you are', 'juː ˈɑːɹ', 'you_are.opus', NULL, 1041, 2, '2026-07-17 10:00:53.066753+00', NULL),
	(43, 'on je', 'he is', 'hiː ˈɪz', 'he_is.opus', NULL, 1042, 2, '2026-07-17 10:00:53.066753+00', NULL),
	(44, 'ona je', 'she is', 'ʃiː ˈɪz', 'she_is.opus', NULL, 1043, 2, '2026-07-17 10:00:53.066753+00', NULL),
	(45, 'to je', 'it is', 'ɪɾ ˈɪz', 'it_is.opus', NULL, 1044, 2, '2026-07-17 10:00:53.066753+00', NULL),
	(46, 'my jsme', 'we are', 'wiː ˈɑːɹ', 'we_are.opus', NULL, 1045, 2, '2026-07-17 10:00:53.066753+00', NULL),
	(47, 'vy jste', 'you are', 'juː ˈɑːɹ', 'you_are.opus', NULL, 1046, 2, '2026-07-17 10:00:53.066753+00', NULL),
	(48, 'oni jsou', 'they are', 'ðeɪ ˈɑːɹ', 'they_are.opus', NULL, 1047, 2, '2026-07-17 10:00:53.066753+00', NULL),
	(49, 'já jsem (zk.)', 'I''m', 'ˈaɪm', 'im.opus', NULL, 1048, 3, '2026-07-17 10:00:53.066753+00', NULL),
	(50, 'ty jsi (zk.)', 'you''re', 'jˈʊɹ', 'youre.opus', NULL, 1049, 3, '2026-07-17 10:00:53.066753+00', NULL),
	(51, 'on je (zk.)', 'he''s', 'hˈiːz', 'hes.opus', NULL, 1050, 3, '2026-07-17 10:00:53.066753+00', NULL),
	(52, 'ona je (zk.)', 'she''s', 'ʃˈiːz', 'shes.opus', NULL, 1051, 3, '2026-07-17 10:00:53.066753+00', NULL),
	(53, 'to je (zk.)', 'it''s', 'ˈɪts', 'its.opus', NULL, 1052, 3, '2026-07-17 10:00:53.066753+00', NULL),
	(54, 'my jsme (zk.)', 'we''re', 'wˈɪɹ', 'were.opus', NULL, 1053, 3, '2026-07-17 10:00:53.066753+00', NULL),
	(55, 'vy jste (zk.)', 'you''re', 'jˈʊɹ', 'youre.opus', NULL, 1054, 3, '2026-07-17 10:00:53.066753+00', NULL),
	(56, 'oni jsou (zk.)', 'they''re', 'ðeɪˈɚ', 'theyre.opus', NULL, 1055, 3, '2026-07-17 10:00:53.066753+00', NULL),
	(57, 'Jsem šťastný.', 'I''m happy.', 'aɪm hˈæpi', 'im_happy.opus', NULL, 1056, 4, '2026-07-17 10:00:53.066753+00', NULL),
	(58, 'Jsi smutný.', 'You''re sad.', 'jʊɹ sˈæd', 'youre_sad.opus', NULL, 1057, 4, '2026-07-17 10:00:53.066753+00', NULL),
	(59, 'Je vysoký.', 'He''s tall.', 'hiːz tˈɔːl', 'hes_tall.opus', NULL, 1058, 4, '2026-07-17 10:00:53.066753+00', NULL),
	(60, 'Je malá.', 'She''s short.', 'ʃiːz ʃˈɔːɹt', 'shes_short.opus', 1, 1059, 4, '2026-07-17 10:00:53.066753+00', NULL),
	(61, 'Je to malé.', 'It''s small.', 'ɪts smˈɔːl', 'its_small.opus', NULL, 1060, 4, '2026-07-17 10:00:53.066753+00', NULL),
	(62, 'Jsme bohatí.', 'We''re rich.', 'wɪɹ ɹˈɪtʃ', 'were_rich.opus', NULL, 1061, 4, '2026-07-17 10:00:53.066753+00', NULL),
	(63, 'Jste mladí.', 'You''re young.', 'jʊɹ jˈʌŋ', 'youre_young.opus', NULL, 1062, 4, '2026-07-17 10:00:53.066753+00', NULL),
	(64, 'Jsou staří.', 'They''re old.', 'ðeɪɚɹ ˈoʊld', 'theyre_old.opus', NULL, 1063, 4, '2026-07-17 10:00:53.066753+00', NULL),
	(65, 'Jsem hladový.', 'I''m hungry.', 'aɪm hˈʌŋɡɹi', 'im_hungry.opus', NULL, 1064, 5, '2026-07-17 10:00:53.066753+00', NULL),
	(66, 'Jsi unavená.', 'You''re tired.', 'jʊɹ tˈaɪɚd', 'youre_tired.opus', NULL, 1065, 5, '2026-07-17 10:00:53.066753+00', NULL),
	(67, 'Je přátelský.', 'He''s friendly.', 'hiːz fɹˈɛndli', 'hes_friendly.opus', NULL, 1066, 5, '2026-07-17 10:00:53.066753+00', NULL),
	(68, 'Je jí zima.', 'She''s cold.', 'ʃiːz kˈoʊld', 'shes_cold.opus', NULL, 1067, 5, '2026-07-17 10:00:53.066753+00', NULL),
	(69, 'Je to jednoduché.', 'It''s easy.', 'ɪts ˈiːzi', 'its_easy.opus', NULL, 1068, 5, '2026-07-17 10:00:53.066753+00', NULL),
	(70, 'Jsme naštvaní.', 'We''re angry.', 'wɪɹ ˈæŋɡɹi', 'were_angry.opus', NULL, 1069, 5, '2026-07-17 10:00:53.066753+00', NULL),
	(71, 'Jste oškliví.', 'You''re ugly.', 'jʊɹ ˈʌɡli', 'youre_ugly.opus', NULL, 1070, 5, '2026-07-17 10:00:53.066753+00', NULL),
	(72, 'Jsou rychlí.', 'They''re fast.', 'ðeɪɚ fˈæst', 'theyre_fast.opus', NULL, 1071, 5, '2026-07-17 10:00:53.066753+00', NULL),
	(73, 'Jsem chudý.', 'I''m poor.', 'aɪm pˈʊɹ', 'im_poor.opus', NULL, 1072, 6, '2026-07-17 10:00:53.066753+00', NULL),
	(74, 'Jsi krásná.', 'You''re beautiful.', 'jʊɹ bjˈuːɾifəl', 'youre_beautiful.opus', NULL, 1073, 6, '2026-07-17 10:00:53.066753+00', NULL),
	(75, 'Je pomalý.', 'He''s slow.', 'hiːz slˈoʊ', 'hes_slow.opus', NULL, 1074, 6, '2026-07-17 10:00:53.066753+00', NULL),
	(76, 'Je špinavá.', 'She''s dirty.', 'ʃiːz dˈɜːɾi', 'shes_dirty.opus', NULL, 1075, 6, '2026-07-17 10:00:53.066753+00', NULL),
	(77, 'Je to čisté.', 'It''s clean.', 'ɪts klˈiːn', 'its_clean.opus', NULL, 1076, 6, '2026-07-17 10:00:53.066753+00', NULL),
	(78, 'Jsme slabí.', 'We''re weak.', 'wɪɹ wˈiːk', 'were_weak.opus', NULL, 1077, 6, '2026-07-17 10:00:53.066753+00', NULL),
	(79, 'Jste silní.', 'You''re strong.', 'jʊɹ stɹˈɔŋ', 'youre_strong.opus', NULL, 1078, 6, '2026-07-17 10:00:53.066753+00', NULL),
	(80, 'Jsou dobří.', 'They''re good.', 'ðeɪɚ ɡˈʊd', 'theyre_good.opus', NULL, 1079, 6, '2026-07-17 10:00:53.066753+00', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "history_enabled", "created_at", "deleted_at") VALUES
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', false, '2026-07-12 14:30:09.044811+00', NULL);


--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_blocks" ("block_id", "user_id", "progress", "started_at", "updated_at", "next_at", "mastered_at") VALUES
	(2, 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 1, '2026-07-17 10:04:12.057+00', '2026-07-17 10:04:38.539+00', NULL, '2026-07-17 10:04:38.539+00'),
	(3, 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 1, '2026-07-17 10:04:41.248+00', '2026-07-17 10:06:10.978+00', NULL, '2026-07-17 10:06:10.978+00'),
	(4, 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 1, '2026-07-17 10:06:12.439+00', '2026-07-17 12:03:43.919169+00', NULL, '2026-07-17 10:17:43.019+00'),
	(5, 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 1, '2026-07-17 10:17:48.425+00', '2026-07-17 11:30:32.576+00', NULL, '2026-07-17 11:30:32.576+00'),
	(6, 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 1, '2026-07-17 11:30:33.727+00', '2026-07-17 11:32:50.04+00', NULL, '2026-07-17 11:32:50.04+00');


--
-- Data for Name: user_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_items" ("user_id", "item_id", "progress", "started_at", "updated_at", "next_at", "mastered_at") VALUES
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 17, 4, '2026-07-17 10:03:03.17+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:39:14.48+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 24, 4, '2026-07-17 10:03:36.058+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:33:21.48+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 28, 4, '2026-07-17 10:03:36.058+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:27:31.48+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 33, 4, '2026-07-17 10:03:49.787+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:40:30.48+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 36, 4, '2026-07-17 10:04:02.026+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:29:09.48+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 10, 4, '2026-07-17 10:02:49.794+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:25:28.184+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 11, 4, '2026-07-17 10:02:49.794+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:34:08.184+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 14, 4, '2026-07-17 10:03:03.17+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:26:24.184+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 25, 4, '2026-07-17 10:03:36.058+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:35:41.184+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 40, 4, '2026-07-17 10:04:12.051+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:33:51.184+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 9, 4, '2026-07-17 10:02:49.794+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:27:09.079+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 18, 4, '2026-07-17 10:03:03.17+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:19:14.079+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 19, 4, '2026-07-17 10:03:19.017+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:33:49.079+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 29, 4, '2026-07-17 10:03:49.787+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:20:11.079+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 31, 4, '2026-07-17 10:03:49.787+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:19:42.079+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 12, 4, '2026-07-17 10:02:49.794+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:18:25.879+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 16, 4, '2026-07-17 10:03:03.17+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:37:37.88+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 26, 4, '2026-07-17 10:03:36.058+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:22:29.88+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 37, 4, '2026-07-17 10:04:02.026+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:28:52.88+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 39, 4, '2026-07-17 10:04:12.051+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:36:25.88+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 20, 5, '2026-07-17 10:03:19.017+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 15:26:19.009+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 22, 5, '2026-07-17 10:03:19.017+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 15:01:02.009+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 23, 5, '2026-07-17 10:03:19.017+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 16:04:14.009+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 34, 5, '2026-07-17 10:04:02.026+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 15:08:56.009+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 35, 5, '2026-07-17 10:04:02.026+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 15:58:21.009+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 13, 5, '2026-07-17 10:02:49.794+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 15:09:51.439+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 15, 5, '2026-07-17 10:03:03.17+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 15:01:05.439+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 21, 4, '2026-07-17 10:03:19.017+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:24:33.439+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 30, 4, '2026-07-17 10:03:49.787+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 12:41:00.439+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 38, 5, '2026-07-17 10:04:02.026+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 14:49:56.439+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 41, 5, '2026-07-17 10:04:38.539+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:09:10.122+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 42, 5, '2026-07-17 10:04:38.539+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:36:58.122+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 43, 5, '2026-07-17 10:04:38.539+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:21:15.122+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 44, 5, '2026-07-17 10:04:38.539+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:14:23.122+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 46, 5, '2026-07-17 10:04:38.539+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:39:55.122+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 48, 5, '2026-07-17 10:04:38.539+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:40:59.226+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 49, 5, '2026-07-17 10:06:10.978+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:23:52.226+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 50, 5, '2026-07-17 10:06:10.978+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:46:35.226+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 51, 5, '2026-07-17 10:06:10.978+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:41:25.226+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 52, 5, '2026-07-17 10:06:10.978+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:44:33.226+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 53, 5, '2026-07-17 10:06:10.978+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:50:30.162+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 54, 5, '2026-07-17 10:06:10.978+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:01:07.162+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 56, 5, '2026-07-17 10:06:10.978+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:38:30.162+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 58, 5, '2026-07-17 10:17:43.019+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:45:21.162+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 59, 5, '2026-07-17 10:17:43.019+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:49:39.162+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 60, 5, '2026-07-17 10:17:43.019+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:52:57.385+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 61, 5, '2026-07-17 10:17:43.019+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:01:10.385+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 62, 5, '2026-07-17 10:17:43.019+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:52:44.386+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 63, 5, '2026-07-17 10:17:43.019+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:46:22.386+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 64, 5, '2026-07-17 10:17:43.019+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 16:24:58.386+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 73, 3, '2026-07-17 11:32:50.04+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 12:19:07.987+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 74, 3, '2026-07-17 11:32:50.04+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 12:19:09.987+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 75, 3, '2026-07-17 11:32:50.04+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 12:19:15.987+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 76, 3, '2026-07-17 11:32:50.04+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 12:21:25.987+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 77, 3, '2026-07-17 11:32:50.04+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 12:21:28.987+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 78, 3, '2026-07-17 11:32:50.04+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 12:23:36.802+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 79, 3, '2026-07-17 11:32:50.04+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 12:24:34.802+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 27, 5, '2026-07-17 10:03:36.058+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:37:13.739+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 32, 5, '2026-07-17 10:03:49.787+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 15:24:35.739+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 45, 5, '2026-07-17 10:04:38.539+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 15:39:57.747+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 47, 5, '2026-07-17 10:04:38.539+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 15:04:35.747+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 55, 5, '2026-07-17 10:06:10.978+00', '2026-07-17 12:03:43.969984+00', '2026-07-17 15:55:40.747+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 57, 5, '2026-07-17 10:17:43.019+00', '2026-07-17 11:33:01.747+00', '2026-07-17 15:30:08.747+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 65, 4, '2026-07-17 11:30:32.576+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 13:04:37.53+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 66, 4, '2026-07-17 11:30:32.576+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 12:54:05.53+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 67, 4, '2026-07-17 11:30:32.576+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 13:15:25.53+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 68, 4, '2026-07-17 11:30:32.576+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 13:04:20.53+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 69, 4, '2026-07-17 11:30:32.576+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 13:07:04.53+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 70, 4, '2026-07-17 11:30:32.576+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 13:15:21.802+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 71, 4, '2026-07-17 11:30:32.576+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 13:16:19.802+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 72, 4, '2026-07-17 11:30:32.576+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 13:06:55.802+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 80, 3, '2026-07-17 11:32:50.04+00', '2026-07-17 12:11:12.395171+00', '2026-07-17 12:28:08.802+00', NULL);


--
-- Data for Name: user_items_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_scores" ("user_id", "date", "item_count", "updated_at", "deleted_at") VALUES
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-17', 320, '2026-07-17 12:11:12.382196+00', NULL);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('audio-files', 'audio-files', NULL, '2026-07-12 13:15:51.632054+00', '2026-07-12 13:15:51.632054+00', false, false, 52428800, NULL, NULL, 'STANDARD'),
	('audio-archive', 'audio-archive', NULL, '2026-07-12 13:15:51.632054+00', '2026-07-12 13:15:51.632054+00', false, false, 52428800, NULL, NULL, 'STANDARD');


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
	('48702d1b-974b-4e9c-a8ea-1e89597975b0', 'audio-archive', 'audio_part_1.zip', NULL, '2026-07-17 10:02:13.876716+00', '2026-07-17 10:02:13.876716+00', '2026-07-17 10:02:13.876716+00', '{"eTag": "\"76cdf8f66f039bb49223f6ddde0d01ea-1\"", "size": 239902, "mimetype": "application/zip", "cacheControl": "max-age=3600", "lastModified": "2026-07-17T10:02:14.000Z", "contentLength": 239902, "httpStatusCode": 200}', 'b467da1e-6c32-42da-8458-2a9e756f4d2e', NULL, NULL);


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

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 41, true);


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

SELECT pg_catalog.setval('"public"."grammar_chunks_id_seq"', 29, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."items_id_seq"', 80, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."lessons_id_seq"', 16, true);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."levels_id_seq"', 1, false);


--
-- Name: notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."notes_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict lRIcbPxf4n3WI2d1YYHkFzswgVQwGe4YBJeIQTEoSdKXnAFzoz7nlg55dc6bXkH

RESET ALL;
