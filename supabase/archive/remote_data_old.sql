SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict PjVJlNBrcyek0WX8Kl3kWwJj1IageFS95dROoCmZb7bfSTIIPkdJ5cQuPalVVdm

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
-- Data for Name: grammar_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grammar_groups" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 'být', NULL, 1, '2026-08-02 11:52:08.709621+00', NULL),
	(2, 'být - zápor', NULL, 2, '2026-08-02 11:52:25.818226+00', NULL);


--
-- Data for Name: grammar_chunks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grammar_chunks" ("id", "name", "note", "sort_order", "updated_at", "deleted_at", "grammar_group_id") VALUES
	(1, 'být - základní tvary', '<p>Sloveso <b>být</b> je v angličtině nepravidelné a má různé tvary podle osoby a času.</p>', 1, '2026-08-04 08:58:00.643565+00', NULL, 1),
	(2, 'být - zkrácené tvary', '<p>V mluveném jazyce se běžně používají zkrácené tvary slovesa být:</p>', 2, '2026-08-04 08:58:09.936332+00', NULL, 1),
	(3, 'být - zápor', '<p>V angličtině se zápor tvoří pomocí pomocného slovesa <b>not</b>, které se přidává za sloveso.</p><br /><p>', 3, '2026-08-04 08:58:19.055966+00', NULL, 2),
	(4, 'být - zkrácený zápor', '<p>V mluveném jazyce se běžně používají zkrácené záporné tvary:</p>', 4, '2026-08-04 08:58:33.430954+00', NULL, 2);


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
	(8, 'být - zkrácený zápor', NULL, 4, NULL, '2026-08-02 12:50:38.243399+00', NULL, false, false, true);


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
	(2, 'Základní slovní zásoba - 2', NULL, 1, 2, '2026-08-04 07:40:06.857157+00', NULL);


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notes" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 'short', 'Přídavné jméno "short" se v angličtině používá označení malé (nevysoké) postavy.', 1, '2026-08-02 12:52:28.700954+00', NULL),
	(3, 'zájmeno "I"', 'Zájmeno "I" se v angličtině vždy píše velkým písmenem.', 3, '2026-08-02 12:52:28.700954+00', NULL),
	(4, 'jazyk', 'V angličtině se se pro jazyk v puse používá výraz "tongue", pro jazyk ve smyslu řeč "language".', 4, '2026-08-02 13:00:22.591051+00', NULL),
	(2, 'I''m cold', 'Správný překlad výrazu "I''m cold" není doslovné "Jsem studený", ale "Je mi zima". Obdobně pro ostatní osoby.', 2, '2026-08-02 13:00:58.002468+00', NULL);


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."items" ("id", "czech", "english", "pronunciation", "audio", "note_id", "sort_order", "block_id", "updated_at", "deleted_at", "lesson_id", "grammar_chunk_id", "is_vocabulary") VALUES
	(1, 'ahoj', 'hello', 'həlˈoʊ', 'hello.opus', NULL, 1000, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(2, 'čau', 'hi', 'hˈaɪ', 'hi.opus', NULL, 1001, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(3, 'dobrý', 'good', 'ɡˈʊd', 'good.opus', NULL, 1002, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(4, 'ráno', 'morning', 'mˈɔːɹnɪŋ', 'morning.opus', NULL, 1003, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(5, 'odpoledne', 'afternoon', 'ˌæftɚnˈuːn', 'afternoon.opus', NULL, 1004, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(6, 'večer', 'evening', 'ˈiːvnɪŋ', 'evening.opus', NULL, 1005, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(7, 'noc', 'night', 'nˈaɪt', 'night.opus', NULL, 1006, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(8, 'den', 'day', 'dˈeɪ', 'day.opus', NULL, 1007, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(9, 'nashledanou', 'goodbye', 'ɡʊdbˈaɪ', 'goodbye.opus', NULL, 1008, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(10, 'dobré ráno', 'good morning', 'ɡˈʊd mˈɔːɹnɪŋ', 'good_morning.opus', NULL, 1009, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(11, 'dobrý večer', 'good evening', 'ɡˈʊd ˈiːvnɪŋ', 'good_evening.opus', NULL, 1010, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(12, 'dobrou noc', 'good night', 'ɡˈʊd nˈaɪt', 'good_night.opus', NULL, 1011, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(13, 'prosím', 'please', 'plˈiːz', 'please.opus', NULL, 1012, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(14, 'děkuji', 'thank you', 'θˈæŋk juː', 'thank_you.opus', NULL, 1013, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(15, 'omlouvám se', 'sorry', 'sˈɑːɹi', 'sorry.opus', NULL, 1014, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(16, 'promiňte', 'excuse me', 'ɛkskjˈuːs mˌiː', 'excuse_me.opus', NULL, 1015, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(17, 'ano', 'yes', 'jˈɛs', 'yes.opus', NULL, 1016, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(18, 'ne', 'no', 'nˈoʊ', 'no.opus', NULL, 1017, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(19, 'možná', 'maybe', 'mˈeɪbiː', 'maybe.opus', NULL, 1018, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(20, 'pondělí', 'Monday', 'mˈʌndeɪ', 'monday.opus', NULL, 1019, 1, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(21, 'úterý', 'Tuesday', 'tˈuːzdeɪ', 'tuesday.opus', NULL, 1020, 1, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(22, 'středa', 'Wednesday', 'wˈɛnzdeɪ', 'wednesday.opus', NULL, 1021, 1, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(23, 'čtvrtek', 'Thursday', 'θˈɜːzdeɪ', 'thursday.opus', NULL, 1022, 1, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(24, 'pátek', 'Friday', 'fɹˈaɪdeɪ', 'friday.opus', NULL, 1023, 1, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(25, 'sobota', 'Saturday', 'sˈæɾɚdˌeɪ', 'saturday.opus', NULL, 1024, 1, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(26, 'neděle', 'Sunday', 'sˈʌndeɪ', 'sunday.opus', NULL, 1025, 1, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(27, 'jedna', 'one', 'wˈʌn', 'one.opus', NULL, 1026, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(28, 'dva', 'two', 'tˈuː', 'two.opus', NULL, 1027, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(29, 'tři', 'three', 'θɹˈiː', 'three.opus', NULL, 1028, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(30, 'čtyři', 'four', 'fˈɔːɹ', 'four.opus', NULL, 1029, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(31, 'pět', 'five', 'fˈaɪv', 'five.opus', NULL, 1030, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(32, 'šest', 'six', 'sˈɪks', 'six.opus', NULL, 1031, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(33, 'sedm', 'seven', 'sˈɛvən', 'seven.opus', NULL, 1032, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(34, 'osm', 'eight', 'ˈeɪt', 'eight.opus', NULL, 1033, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(35, 'devět', 'nine', 'nˈaɪn', 'nine.opus', NULL, 1034, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(36, 'deset', 'ten', 'tˈɛn', 'ten.opus', NULL, 1035, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(37, 'jedenáct', 'eleven', 'ᵻlˈɛvən', 'eleven.opus', NULL, 1036, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(38, 'dvanáct', 'twelve', 'twˈɛlv', 'twelve.opus', NULL, 1037, 2, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(39, 'sto', 'hundred', 'hˈʌndɹɪd', 'hundred.opus', NULL, 1038, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(40, 'tisíc', 'thousand', 'θˈaʊzənd', 'thousand.opus', NULL, 1039, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(41, 'milion', 'million', 'mˈɪliən', 'million.opus', NULL, 1040, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(42, 'miliarda', 'billion', 'bˈɪliən', 'billion.opus', NULL, 1041, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(43, 'matka', 'mother', 'mˈʌðɚ', 'mother.opus', NULL, 1042, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(44, 'otec', 'father', 'fˈɑːðɚ', 'father.opus', NULL, 1043, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(45, 'bratr', 'brother', 'bɹˈʌðɚ', 'brother.opus', NULL, 1044, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(46, 'sestra', 'sister', 'sˈɪstɚ', 'sister.opus', NULL, 1045, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(47, 'syn', 'son', 'sˈʌn', 'son.opus', NULL, 1046, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(48, 'dcera', 'daughter', 'dˈɔːɾɚ', 'daughter.opus', NULL, 1047, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(49, 'rodiče', 'parents', 'pˈɛɹənts', 'parents.opus', NULL, 1048, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(50, 'strýc', 'uncle', 'ˈʌŋkəl', 'uncle.opus', NULL, 1049, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(51, 'teta', 'aunt', 'ˈænt', 'aunt.opus', NULL, 1050, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(52, 'bratranec', 'cousin', 'kˈʌzən', 'cousin.opus', NULL, 1051, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(53, 'sestřenice', 'cousin', 'kˈʌzən', 'cousin.opus', NULL, 1052, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(54, 'babička', 'grandmother', 'ɡɹˈændmʌðɚ', 'grandmother.opus', NULL, 1053, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(55, 'dědeček', 'grandfather', 'ɡɹˈændfɑːðɚ', 'grandfather.opus', NULL, 1054, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(56, 'máma', 'mum', 'mˈʌm', 'mum.opus', NULL, 1055, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(57, 'táta', 'dad', 'dˈæd', 'dad.opus', NULL, 1056, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(58, 'babi', 'grandma', 'ɡɹˈændmɑː', 'grandma.opus', NULL, 1057, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(59, 'děda', 'grandpa', 'ɡɹˈændpɑː', 'grandpa.opus', NULL, 1058, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(60, 'červená', 'red', 'ɹˈɛd', 'red.opus', NULL, 1059, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(61, 'modrá', 'blue', 'blˈuː', 'blue.opus', NULL, 1060, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(62, 'zelená', 'green', 'ɡɹˈiːn', 'green.opus', NULL, 1061, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(63, 'žlutá', 'yellow', 'jˈɛloʊ', 'yellow.opus', NULL, 1062, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(64, 'černá', 'black', 'blˈæk', 'black.opus', NULL, 1063, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(65, 'bílá', 'white', 'wˈaɪt', 'white.opus', NULL, 1064, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(66, 'hnědá', 'brown', 'bɹˈaʊn', 'brown.opus', NULL, 1065, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(67, 'růžová', 'pink', 'pˈɪŋk', 'pink.opus', NULL, 1066, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(68, 'oranžová', 'orange', 'ˈɔɹɪndʒ', 'orange.opus', NULL, 1067, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(69, 'fialová', 'purple', 'pˈɜːpəl', 'purple.opus', NULL, 1068, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(70, 'šedá', 'grey', 'ɡɹˈeɪ', 'grey.opus', NULL, 1069, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(71, 'zlatá', 'gold', 'ɡˈoʊld', 'gold.opus', NULL, 1070, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(72, 'stříbrná', 'silver', 'sˈɪlvɚ', 'silver.opus', NULL, 1071, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(73, 'jíst', 'eat', 'ˈiːt', 'eat.opus', NULL, 1072, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(74, 'pít', 'drink', 'dɹˈɪŋk', 'drink.opus', NULL, 1073, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(75, 'jít', 'go', 'ɡˈoʊ', 'go.opus', NULL, 1074, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(76, 'přijít', 'come', 'kˈʌm', 'come.opus', NULL, 1075, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(77, 'hrát', 'play', 'plˈeɪ', 'play.opus', NULL, 1076, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(78, 'číst', 'read', 'ɹˈiːd', 'read.opus', NULL, 1077, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(79, 'psát', 'write', 'ɹˈaɪt', 'write.opus', NULL, 1078, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(80, 'běžet', 'run', 'ɹˈʌn', 'run.opus', NULL, 1079, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(81, 'chodit', 'walk', 'wˈɔːk', 'walk.opus', NULL, 1080, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(82, 'mluvit', 'talk', 'tˈɔːk', 'talk.opus', NULL, 1081, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(83, 'spát', 'sleep', 'slˈiːp', 'sleep.opus', NULL, 1082, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(84, 'pracovat', 'work', 'wˈɜːk', 'work.opus', NULL, 1083, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(85, 'sedět', 'sit', 'sˈɪt', 'sit.opus', NULL, 1084, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(86, 'stát', 'stand', 'stˈænd', 'stand.opus', NULL, 1085, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(87, 'otevřít', 'open', 'ˈoʊpən', 'open.opus', NULL, 1086, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(88, 'zavřít', 'close', 'klˈoʊs', 'close.opus', NULL, 1087, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(89, 'koupit', 'buy', 'bˈaɪ', 'buy.opus', NULL, 1088, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(90, 'prodat', 'sell', 'sˈɛl', 'sell.opus', NULL, 1089, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(91, 'vařit', 'cook', 'kˈʊk', 'cook.opus', NULL, 1090, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(92, 'týden', 'week', 'wˈiːk', 'week.opus', NULL, 1091, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(93, 'měsíc (kalendářní)', 'month', 'mˈʌnθ', 'month.opus', NULL, 1092, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(94, 'rok', 'year', 'jˈɪɹ', 'year.opus', NULL, 1093, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(95, 'dnes', 'today', 'tədˈeɪ', 'today.opus', NULL, 1094, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(96, 'zítra', 'tomorrow', 'təmˈɑːɹoʊ', 'tomorrow.opus', NULL, 1095, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(97, 'včera', 'yesterday', 'jˈɛstɚdˌeɪ', 'yesterday.opus', NULL, 1096, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(98, 'hodina', 'hour', 'ˈaʊɚ', 'hour.opus', NULL, 1097, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(99, 'minuta', 'minute', 'mˈɪnɪt', 'minute.opus', NULL, 1098, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(100, 'sekunda', 'second', 'sˈɛkənd', 'second.opus', NULL, 1099, NULL, '2026-08-03 12:06:41.388422+00', NULL, 1, NULL, true),
	(101, 'kniha', 'book', 'bˈʊk', 'book.opus', NULL, 2000, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(102, 'pero (psací)', 'pen', 'pˈɛn', 'pen.opus', NULL, 2001, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(103, 'stůl', 'table', 'tˈeɪbəl', 'table.opus', NULL, 2002, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(104, 'židle', 'chair', 'tʃˈɛɹ', 'chair.opus', NULL, 2003, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(105, 'škola', 'school', 'skˈuːl', 'school.opus', NULL, 2004, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(106, 'učitel', 'teacher', 'tˈiːtʃɚ', 'teacher.opus', NULL, 2005, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(107, 'žák', 'pupil', 'pjˈuːpəl', 'pupil.opus', NULL, 2006, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(108, 'taška', 'bag', 'bˈæɡ', 'bag.opus', NULL, 2007, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(109, 'dům', 'house', 'hˈaʊs', 'house.opus', NULL, 2008, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(110, 'auto', 'car', 'kˈɑːɹ', 'car.opus', NULL, 2009, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(111, 'telefon', 'phone', 'fˈoʊn', 'phone.opus', NULL, 2010, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(112, 'postel', 'bed', 'bˈɛd', 'bed.opus', NULL, 2011, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(113, 'počítač', 'computer', 'kəmpjˈuːɾɚ', 'computer.opus', NULL, 2012, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(114, 'hodiny (přístroj)', 'clock', 'klˈɑːk', 'clock.opus', NULL, 2013, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(115, 'horký', 'hot', 'hˈɑːt', 'hot.opus', NULL, 2014, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(116, 'studený', 'cold', 'kˈoʊld', 'cold.opus', NULL, 2015, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(117, 'velký', 'big', 'bˈɪɡ', 'big.opus', NULL, 2016, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(118, 'malý', 'small', 'smˈɔːl', 'small.opus', NULL, 2017, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(119, 'šťastný', 'happy', 'hˈæpi', 'happy.opus', NULL, 2018, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(120, 'smutný', 'sad', 'sˈæd', 'sad.opus', NULL, 2019, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(121, 'špatný', 'bad', 'bˈæd', 'bad.opus', NULL, 2020, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(122, 'rychlý', 'fast', 'fˈæst', 'fast.opus', NULL, 2021, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(123, 'pomalý', 'slow', 'slˈoʊ', 'slow.opus', NULL, 2022, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(124, 'vysoký', 'tall', 'tˈɔːl', 'tall.opus', NULL, 2023, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(125, 'krátký', 'short', 'ʃˈɔːɹt', 'short.opus', 1, 2024, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(126, 'světlý', 'light', 'lˈaɪt', 'light.opus', NULL, 2025, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(127, 'tmavý', 'dark', 'dˈɑːɹk', 'dark.opus', NULL, 2026, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(128, 'mladý', 'young', 'jˈʌŋ', 'young.opus', NULL, 2027, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(129, 'starý', 'old', 'ˈoʊld', 'old.opus', NULL, 2028, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(130, 'snadný', 'easy', 'ˈiːzi', 'easy.opus', NULL, 2029, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(131, 'těžký', 'hard', 'hˈɑːɹd', 'hard.opus', NULL, 2030, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(132, 'blízko', 'near', 'nˈɪɹ', 'near.opus', NULL, 2031, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(133, 'daleko', 'far', 'fˈɑːɹ', 'far.opus', NULL, 2032, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(134, 'hlava', 'head', 'hˈɛd', 'head.opus', NULL, 2033, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(135, 'vlasy', 'hair', 'hˈɛɹ', 'hair.opus', NULL, 2034, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(136, 'oko', 'eye', 'ˈaɪ', 'eye.opus', NULL, 2035, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(137, 'ucho', 'ear', 'ˈɪɹ', 'ear.opus', NULL, 2036, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(138, 'nos', 'nose', 'nˈoʊz', 'nose.opus', NULL, 2037, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(139, 'ústa', 'mouth', 'mˈaʊθ', 'mouth.opus', NULL, 2038, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(140, 'zuby', 'teeth', 'tˈiːθ', 'teeth.opus', NULL, 2039, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(141, 'jazyk', 'tongue', 'tˈʌŋ', 'tongue.opus', 4, 2040, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(142, 'krk', 'neck', 'nˈɛk', 'neck.opus', NULL, 2041, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(143, 'ruka', 'hand', 'hˈænd', 'hand.opus', NULL, 2042, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(144, 'paže', 'arm', 'ˈɑːɹm', 'arm.opus', NULL, 2043, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(145, 'noha', 'leg', 'lˈɛɡ', 'leg.opus', NULL, 2044, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(146, 'chodidlo', 'foot', 'fˈʊt', 'foot.opus', NULL, 2045, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(147, 'prst', 'finger', 'fˈɪŋɡɚ', 'finger.opus', NULL, 2046, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(148, 'prst u nohy', 'toe', 'tˈoʊ', 'toe.opus', NULL, 2047, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(149, 'břicho', 'stomach', 'stˈʌmək', 'stomach.opus', NULL, 2048, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(150, 'záda', 'back', 'bˈæk', 'back.opus', NULL, 2049, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(151, 'chleba', 'bread', 'bɹˈɛd', 'bread.opus', NULL, 2050, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(152, 'rýže', 'rice', 'ɹˈaɪs', 'rice.opus', NULL, 2051, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(153, 'voda', 'water', 'wˈɔːɾɚ', 'water.opus', NULL, 2052, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(154, 'mléko', 'milk', 'mˈɪlk', 'milk.opus', NULL, 2053, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(155, 'jablko', 'apple', 'ˈæpəl', 'apple.opus', NULL, 2054, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(156, 'banán', 'banana', 'bɐnˈænə', 'banana.opus', NULL, 2055, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(157, 'pomeranč', 'orange', 'ˈɔɹɪndʒ', 'orange.opus', NULL, 2056, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(158, 'mango', 'mango', 'mˈæŋɡoʊ', 'mango.opus', NULL, 2057, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(159, 'maso', 'meat', 'mˈiːt', 'meat.opus', NULL, 2058, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(160, 'ryba', 'fish', 'fˈɪʃ', 'fish.opus', NULL, 2059, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(161, 'vejce', 'egg', 'ˈɛɡ', 'egg.opus', NULL, 2060, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(162, 'sýr', 'cheese', 'tʃˈiːz', 'cheese.opus', NULL, 2061, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(163, 'polévka', 'soup', 'sˈuːp', 'soup.opus', NULL, 2062, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(164, 'čaj', 'tea', 'tˈiː', 'tea.opus', NULL, 2063, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(165, 'káva', 'coffee', 'kˈɔfi', 'coffee.opus', NULL, 2064, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(166, 'džus', 'juice', 'dʒˈuːs', 'juice.opus', NULL, 2065, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(167, 'cukr', 'sugar', 'ʃˈʊɡɚ', 'sugar.opus', NULL, 2066, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(168, 'sůl', 'salt', 'sˈɔlt', 'salt.opus', NULL, 2067, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(169, 'slunce', 'sun', 'sˈʌn', 'sun.opus', NULL, 2068, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(170, 'déšť', 'rain', 'ɹˈeɪn', 'rain.opus', NULL, 2069, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(171, 'mrak', 'cloud', 'klˈaʊd', 'cloud.opus', NULL, 2070, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(172, 'sníh', 'snow', 'snˈoʊ', 'snow.opus', NULL, 2071, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(173, 'vítr', 'wind', 'wˈɪnd', 'wind.opus', NULL, 2072, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(174, 'bouře', 'storm', 'stˈɔːɹm', 'storm.opus', NULL, 2073, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(175, 'teplý', 'warm', 'wˈɔːɹm', 'warm.opus', NULL, 2074, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(176, 'léto', 'summer', 'sˈʌmɚ', 'summer.opus', NULL, 2075, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(177, 'zima', 'winter', 'wˈɪntɚ', 'winter.opus', NULL, 2076, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(178, 'jaro', 'spring', 'spɹˈɪŋ', 'spring.opus', NULL, 2077, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(179, 'podzim', 'autumn', 'ˈɔːɾʌm', 'autumn.opus', NULL, 2078, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(180, 'domov', 'home', 'hˈoʊm', 'home.opus', NULL, 2079, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(181, 'park', 'park', 'pˈɑːɹk', 'park.opus', NULL, 2080, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(182, 'nemocnice', 'hospital', 'hˈɑːspɪɾəl', 'hospital.opus', NULL, 2081, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(183, 'obchod', 'shop', 'ʃˈɑːp', 'shop.opus', NULL, 2082, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(184, 'trh', 'market', 'mˈɑːɹkɪt', 'market.opus', NULL, 2083, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(185, 'kancelář', 'office', 'ˈɑːfɪs', 'office.opus', NULL, 2084, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(186, 'banka', 'bank', 'bˈæŋk', 'bank.opus', NULL, 2085, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(187, 'restaurace', 'restaurant', 'ɹˈɛstɹɑːnt', 'restaurant.opus', NULL, 2086, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(188, 'nádraží', 'station', 'stˈeɪʃən', 'station.opus', NULL, 2087, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(189, 'letiště', 'airport', 'ˈɛɹpɔːɹt', 'airport.opus', NULL, 2088, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(190, 'ulice', 'street', 'stɹˈiːt', 'street.opus', NULL, 2089, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(191, 'město', 'city', 'sˈɪɾi', 'city.opus', NULL, 2090, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(192, 'vesnice', 'village', 'vˈɪlɪdʒ', 'village.opus', NULL, 2091, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(193, 'země', 'country', 'kˈʌntɹi', 'country.opus', NULL, 2092, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(194, 'košile', 'shirt', 'ʃˈɜːt', 'shirt.opus', NULL, 2093, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(195, 'tričko', 't-shirt', 'tˈiːʃˈɜːt', 'tshirt.opus', NULL, 2094, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(196, 'kalhoty', 'trousers', 'tɹˈaʊsɚz', 'trousers.opus', NULL, 2095, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(197, 'sukně', 'skirt', 'skˈɜːt', 'skirt.opus', NULL, 2096, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(198, 'boty', 'shoes', 'ʃˈuːz', 'shoes.opus', NULL, 2097, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(199, 'ponožky', 'socks', 'sˈɑːks', 'socks.opus', NULL, 2098, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(200, 'klobouk', 'hat', 'hˈæt', 'hat.opus', NULL, 2099, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(201, 'kabát', 'coat', 'kˈoʊt', 'coat.opus', NULL, 2100, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(202, 'bunda', 'jacket', 'dʒˈækɪt', 'jacket.opus', NULL, 2101, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(203, 'svetr', 'sweater', 'swˈɛɾɚ', 'sweater.opus', NULL, 2102, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(204, 'rukavice', 'gloves', 'ɡlˈʌvz', 'gloves.opus', NULL, 2103, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(205, 'šála', 'scarf', 'skˈɑːɹf', 'scarf.opus', NULL, 2104, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(206, 'pes', 'dog', 'dˈɑːɡ', 'dog.opus', NULL, 2105, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(207, 'kočka', 'cat', 'kˈæt', 'cat.opus', NULL, 2106, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(208, 'kráva', 'cow', 'kˈaʊ', 'cow.opus', NULL, 2107, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(209, 'koza', 'goat', 'ɡˈoʊt', 'goat.opus', NULL, 2108, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(210, 'kůň', 'horse', 'hˈɔːɹs', 'horse.opus', NULL, 2109, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(211, 'ovce', 'sheep', 'ʃˈiːp', 'sheep.opus', NULL, 2110, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(212, 'kuře', 'chicken', 'tʃˈɪkɪn', 'chicken.opus', NULL, 2111, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(213, 'pták', 'bird', 'bˈɜːd', 'bird.opus', NULL, 2112, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(214, 'kachna', 'duck', 'dˈʌk', 'duck.opus', NULL, 2113, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(215, 'lev', 'lion', 'lˈaɪən', 'lion.opus', NULL, 2114, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(216, 'tygr', 'tiger', 'tˈaɪɡɚ', 'tiger.opus', NULL, 2115, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(217, 'slon', 'elephant', 'ˈɛlɪfənt', 'elephant.opus', NULL, 2116, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(218, 'opice', 'monkey', 'mˈʌŋki', 'monkey.opus', NULL, 2117, NULL, '2026-08-03 12:13:42.446278+00', NULL, 2, NULL, true),
	(219, 'já', 'I', 'ˈaɪ', 'i.opus', 3, 3000, 3, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(220, 'ty', 'you', 'jˈuː', 'you.opus', NULL, 3001, 3, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(221, 'on', 'he', 'hˈiː', 'he.opus', NULL, 3002, 3, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(222, 'ona', 'she', 'ʃˈiː', 'she.opus', NULL, 3003, 3, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(223, 'ono', 'it', 'ˈɪt', 'it.opus', NULL, 3004, 3, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(224, 'my', 'we', 'wˈiː', 'we.opus', NULL, 3005, 3, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(225, 'vy', 'you', 'jˈuː', 'you.opus', NULL, 3006, 3, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(226, 'oni', 'they', 'ðˈeɪ', 'they.opus', NULL, 3007, 3, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(227, 'já jsem', 'I am', 'aɪˈæm', 'i_am.opus', NULL, 3008, 4, '2026-08-04 08:08:49.104+00', NULL, 3, 1, false),
	(228, 'ty jsi', 'you are', 'juː ˈɑːɹ', 'you_are.opus', NULL, 3009, 4, '2026-08-04 08:08:49.104+00', NULL, 3, 1, false),
	(229, 'on je', 'he is', 'hiː ˈɪz', 'he_is.opus', NULL, 3010, 4, '2026-08-04 08:08:49.104+00', NULL, 3, 1, false),
	(230, 'ona je', 'she is', 'ʃiː ˈɪz', 'she_is.opus', NULL, 3011, 4, '2026-08-04 08:08:49.104+00', NULL, 3, 1, false),
	(231, 'to je', 'it is', 'ɪɾ ˈɪz', 'it_is.opus', NULL, 3012, 4, '2026-08-04 08:08:49.104+00', NULL, 3, 1, false),
	(232, 'my jsme', 'we are', 'wiː ˈɑːɹ', 'we_are.opus', NULL, 3013, 4, '2026-08-04 08:08:49.104+00', NULL, 3, 1, false),
	(233, 'vy jste', 'you are', 'juː ˈɑːɹ', 'you_are.opus', NULL, 3014, 4, '2026-08-04 08:08:49.104+00', NULL, 3, 1, false),
	(234, 'oni jsou', 'they are', 'ðeɪ ˈɑːɹ', 'they_are.opus', NULL, 3015, 4, '2026-08-04 08:08:49.104+00', NULL, 3, 1, false),
	(235, 'angličtina', 'English', 'ˈɪŋɡlɪʃ', 'english.opus', NULL, 3016, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(236, 'čeština', 'Czech', 'tʃˈɛk', 'czech.opus', NULL, 3017, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(237, 'být', 'be', 'bˈiː', 'be.opus', NULL, 3018, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(238, 'unavený', 'tired', 'tˈaɪɚd', 'tired.opus', NULL, 3019, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(239, 'hladový', 'hungry', 'hˈʌŋɡɹi', 'hungry.opus', NULL, 3020, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(240, 'kamarád', 'friend', 'fɹˈɛnd', 'friend.opus', NULL, 3021, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(241, 'přátelský', 'friendly', 'fɹˈɛndli', 'friendly.opus', NULL, 3022, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(242, 'naštvaný', 'angry', 'ˈæŋɡɹi', 'angry.opus', NULL, 3023, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(243, 'já jsem (zk.)', 'I''m', 'ˈaɪm', 'im.opus', NULL, 3024, 5, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(244, 'ty jsi (zk.)', 'you''re', 'jˈʊɹ', 'youre.opus', NULL, 3025, 5, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(245, 'on je (zk.)', 'he''s', 'hˈiːz', 'hes.opus', NULL, 3026, 5, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(246, 'ona je (zk.)', 'she''s', 'ʃˈiːz', 'shes.opus', NULL, 3027, 5, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(247, 'to je (zk.)', 'it''s', 'ˈɪts', 'its.opus', NULL, 3028, 5, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(248, 'my jsme (zk.)', 'we''re', 'wˈɪɹ', 'were.opus', NULL, 3029, 5, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(249, 'vy jste (zk.)', 'you''re', 'jˈʊɹ', 'youre.opus', NULL, 3030, 5, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(250, 'oni jsou (zk.)', 'they''re', 'ðeɪˈɚ', 'theyre.opus', NULL, 3031, 5, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(251, 'krásný', 'beautiful', 'bjˈuːɾifəl', 'beautiful.opus', NULL, 3032, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(252, 'ošklivý', 'ugly', 'ˈʌɡli', 'ugly.opus', NULL, 3033, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(253, 'silný', 'strong', 'stɹˈɔŋ', 'strong.opus', NULL, 3034, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(254, 'slabý', 'weak', 'wˈiːk', 'weak.opus', NULL, 3035, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(255, 'bohatý', 'rich', 'ɹˈɪtʃ', 'rich.opus', NULL, 3036, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(256, 'chudý', 'poor', 'pˈʊɹ', 'poor.opus', NULL, 3037, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(257, 'čistý', 'clean', 'klˈiːn', 'clean.opus', NULL, 3038, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(258, 'špinavý', 'dirty', 'dˈɜːɾi', 'dirty.opus', NULL, 3039, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(259, 'Já jsem šťastný.', 'I''m happy.', 'aɪm hˈæpi', 'im_happy.opus', NULL, 3040, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(260, 'Ty jsi smutný.', 'You''re sad.', 'jʊɹ sˈæd', 'youre_sad.opus', NULL, 3041, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(261, 'On je vysoký.', 'He''s tall.', 'hiːz tˈɔːl', 'hes_tall.opus', NULL, 3042, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(262, 'Ona je malá.', 'She''s small.', 'ʃiːz smˈɔːl', 'shes_small.opus', NULL, 3043, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(263, 'To je malé.', 'It''s small.', 'ɪts smˈɔːl', 'its_small.opus', NULL, 3044, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(264, 'My jsme bohatí.', 'We''re rich.', 'wɪɹ ɹˈɪtʃ', 'were_rich.opus', NULL, 3045, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(265, 'Vy jste mladí.', 'You''re young.', 'jʊɹ jˈʌŋ', 'youre_young.opus', NULL, 3046, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(266, 'Oni jsou staří.', 'They''re old.', 'ðeɪɚɹ ˈoʊld', 'theyre_old.opus', NULL, 3047, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(267, 'zde', 'here', 'hˈɪɹ', 'here.opus', NULL, 3048, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(268, 'tam', 'there', 'ðˈɛɹ', 'there.opus', NULL, 3049, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(269, 'dítě', 'child', 'tʃˈaɪld', 'child.opus', NULL, 3050, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(270, 'muž', 'man', 'mˈæn', 'man.opus', NULL, 3051, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(271, 'žena', 'woman', 'wˈʊmən', 'woman.opus', NULL, 3052, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(272, 'jídlo', 'food', 'fˈuːd', 'food.opus', NULL, 3053, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(273, 'pití', 'drink', 'dɹˈɪŋk', 'drink.opus', NULL, 3054, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(274, 'měsíc (na nebi)', 'moon', 'mˈuːn', 'moon.opus', NULL, 3055, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(275, 'Já jsem hladový.', 'I''m hungry.', 'aɪm hˈʌŋɡɹi', 'im_hungry.opus', NULL, 3056, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(276, 'Ty jsi unavená.', 'You''re tired.', 'jʊɹ tˈaɪɚd', 'youre_tired.opus', NULL, 3057, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(277, 'On je přátelský.', 'He''s friendly.', 'hiːz fɹˈɛndli', 'hes_friendly.opus', NULL, 3058, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(278, 'Je jí zima.', 'She''s cold.', 'ʃiːz kˈoʊld', 'shes_cold.opus', 2, 3059, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(279, 'To je jednoduché.', 'It''s easy.', 'ɪts ˈiːzi', 'its_easy.opus', NULL, 3060, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(280, 'My jsme naštvaní.', 'We''re angry.', 'wɪɹ ˈæŋɡɹi', 'were_angry.opus', NULL, 3061, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(281, 'Vy jste oškliví.', 'You''re ugly.', 'jʊɹ ˈʌɡli', 'youre_ugly.opus', NULL, 3062, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(282, 'Oni jsou rychlí.', 'They''re fast.', 'ðeɪɚ fˈæst', 'theyre_fast.opus', NULL, 3063, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(283, 'obtížný', 'difficult', 'dˈɪfɪkəlt', 'difficult.opus', NULL, 3064, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(284, 'po', 'after', 'ˈæftɚ', 'after.opus', NULL, 3065, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(285, 'poledne', 'noon', 'nˈuːn', 'noon.opus', NULL, 3066, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(286, 'kdo', 'who', 'hˈuː', 'who.opus', NULL, 3067, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(287, 'co', 'what', 'wˈʌt', 'what.opus', NULL, 3068, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(288, 'kde', 'where', 'wˈɛɹ', 'where.opus', NULL, 3069, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(289, 'proč', 'why', 'wˈaɪ', 'why.opus', NULL, 3070, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(290, 'jak', 'how', 'hˈaʊ', 'how.opus', NULL, 3071, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, NULL, true),
	(291, 'Já jsem chudý.', 'I''m poor.', 'aɪm pˈʊɹ', 'im_poor.opus', NULL, 3072, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(292, 'Ty jsi krásná.', 'You''re beautiful.', 'jʊɹ bjˈuːɾifəl', 'youre_beautiful.opus', NULL, 3073, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(293, 'On je pomalý.', 'He''s slow.', 'hiːz slˈoʊ', 'hes_slow.opus', NULL, 3074, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(294, 'Ona je špinavá.', 'She''s dirty.', 'ʃiːz dˈɜːɾi', 'shes_dirty.opus', NULL, 3075, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(295, 'To je čisté.', 'It''s clean.', 'ɪts klˈiːn', 'its_clean.opus', NULL, 3076, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(296, 'My jsme slabí.', 'We''re weak.', 'wɪɹ wˈiːk', 'were_weak.opus', NULL, 3077, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(297, 'Vy jste silní.', 'You''re strong.', 'jʊɹ stɹˈɔŋ', 'youre_strong.opus', NULL, 3078, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(298, 'Oni jsou dobří.', 'They''re good.', 'ðeɪɚ ɡˈʊd', 'theyre_good.opus', NULL, 3079, NULL, '2026-08-04 08:08:49.104+00', NULL, 3, 2, false),
	(299, 'leden', 'January', 'dʒˈænjuːˌɛɹi', 'january.opus', NULL, 4000, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(300, 'únor', 'February', 'fˈɛbɹuːˌɛɹi', 'february.opus', NULL, 4001, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(301, 'březen', 'March', 'mˈɑːɹtʃ', 'march.opus', NULL, 4002, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(302, 'duben', 'April', 'ˈeɪpɹəl', 'april.opus', NULL, 4003, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(303, 'květen', 'May', 'mˈeɪ', 'may.opus', NULL, 4004, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(304, 'červen', 'June', 'dʒˈuːn', 'june.opus', NULL, 4005, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(305, 'červenec', 'July', 'dʒuːlˈaɪ', 'july.opus', NULL, 4006, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(306, 'srpen', 'August', 'ˈɔːɡəst', 'august.opus', NULL, 4007, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(307, 'září', 'September', 'sɛptˈɛmbɚ', 'september.opus', NULL, 4008, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(308, 'říjen', 'October', 'ɑːktˈoʊbɚ', 'october.opus', NULL, 4009, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(309, 'listopad', 'November', 'noʊvˈɛmbɚ', 'november.opus', NULL, 4010, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(310, 'prosinec', 'December', 'dᵻsˈɛmbɚ', 'december.opus', NULL, 4011, 6, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(311, 'já nejsem', 'I am not', 'aɪɐm nˈɑːt', 'i_am_not.opus', NULL, 4012, 7, '2026-08-04 08:08:58.645697+00', NULL, 4, 3, false),
	(312, 'ty nejsi', 'you are not', 'juː ɑːɹ nˈɑːt', 'you_are_not.opus', NULL, 4013, 7, '2026-08-04 08:08:58.645697+00', NULL, 4, 3, false),
	(313, 'on není', 'he is not', 'hiː ɪz nˈɑːt', 'he_is_not.opus', NULL, 4014, 7, '2026-08-04 08:08:58.645697+00', NULL, 4, 3, false),
	(314, 'ona není', 'she is not', 'ʃiː ɪz nˈɑːt', 'she_is_not.opus', NULL, 4015, 7, '2026-08-04 08:08:58.645697+00', NULL, 4, 3, false),
	(315, 'to není', 'it is not', 'ɪɾ ɪz nˈɑːt', 'it_is_not.opus', NULL, 4016, 7, '2026-08-04 08:08:58.645697+00', NULL, 4, 3, false),
	(316, 'my nejsme', 'we are not', 'wiː ɑːɹ nˈɑːt', 'we_are_not.opus', NULL, 4017, 7, '2026-08-04 08:08:58.645697+00', NULL, 4, 3, false),
	(317, 'vy nejste', 'you are not', 'juː ɑːɹ nˈɑːt', 'you_are_not.opus', NULL, 4018, 7, '2026-08-04 08:08:58.645697+00', NULL, 4, 3, false),
	(318, 'oni nejsou', 'they are not', 'ðeɪ ɑːɹ nˈɑːt', 'they_are_not.opus', NULL, 4019, 7, '2026-08-04 08:08:58.645697+00', NULL, 4, 3, false),
	(319, 'mít', 'have', 'hˈæv', 'have.opus', NULL, 4020, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(320, 'číslo', 'number', 'nˈʌmbɚ', 'number.opus', NULL, 4021, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(321, 'bochník', 'loaf', 'lˈoʊf', 'loaf.opus', NULL, 4022, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(322, 'šálek', 'cup', 'kˈʌp', 'cup.opus', NULL, 4023, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(323, 'já nejsem (zk.)', 'I''m not', 'aɪm nˈɑːt', 'im_not.opus', NULL, 4024, 8, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(324, 'ty nejsi (zk.)', 'you aren''t', 'juː ˈɑːɹnt', 'you_arent.opus', NULL, 4025, 8, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(325, 'on není (zk.)', 'he isn''t', 'hiː ˈɪzənt', 'he_isnt.opus', NULL, 4026, 8, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(326, 'ona není (zk.)', 'she isn''t', 'ʃiː ˈɪzənt', 'she_isnt.opus', NULL, 4027, 8, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(327, 'to není (zk.)', 'it isn''t', 'ɪɾ ˈɪzənt', 'it_isnt.opus', NULL, 4028, 8, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(328, 'my nejsme (zk.)', 'we aren''t', 'wiː ˈɑːɹnt', 'we_arent.opus', NULL, 4029, 8, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(329, 'vy nejste (zk.)', 'you aren''t', 'juː ˈɑːɹnt', 'you_arent.opus', NULL, 4030, 8, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(330, 'oni nejsou (zk.)', 'they aren''t', 'ðeɪ ˈɑːɹnt', 'they_arent.opus', NULL, 4031, 8, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(331, 'sklenice', 'glass', 'ɡlˈæs', 'glass.opus', NULL, 4032, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(332, 'myš', 'mouse', 'mˈaʊs', 'mouse.opus', NULL, 4033, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(333, 'dopis', 'letter', 'lˈɛɾɚ', 'letter.opus', NULL, 4034, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(334, 'věc', 'thing', 'θˈɪŋ', 'thing.opus', NULL, 4035, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(335, 'žádný', 'none', 'nˈʌn', 'none.opus', NULL, 4036, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(336, 'nic', 'nothing', 'nˈʌθɪŋ', 'nothing.opus', NULL, 4037, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(337, 'nějaký', 'some', 'sˈʌm', 'some.opus', NULL, 4038, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(338, 'něco', 'something', 'sˈʌmθɪŋ', 'something.opus', NULL, 4039, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(339, 'Já nejsem šťastný.', 'I''m not happy.', 'aɪm nˌɑːt hˈæpi', 'im_not_happy.opus', NULL, 4040, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(340, 'Ty nejsi smutný.', 'You aren''t sad.', 'juː ˌɑːɹnt sˈæd', 'you_arent_sad.opus', NULL, 4041, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(341, 'On není velký.', 'He isn''t big.', 'hiː ˌɪzənt bˈɪɡ', 'he_isnt_big.opus', NULL, 4042, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(342, 'Ona není malá.', 'She isn''t small.', 'ʃiː ˌɪzənt smˈɔːl', 'she_isnt_small.opus', NULL, 4043, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(343, 'Není to špatné.', 'It isn''t bad.', 'ɪɾ ˌɪzənt bˈæd', 'it_isnt_bad.opus', NULL, 4044, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(344, 'My nejsme mladí.', 'We aren''t young.', 'wiː ˌɑːɹnt jˈʌŋ', 'we_arent_young.opus', NULL, 4045, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(345, 'Vy nejste staří.', 'You aren''t old.', 'juː ˌɑːɹnt ˈoʊld', 'you_arent_old.opus', NULL, 4046, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(346, 'Oni nejsou vysocí.', 'They aren''t tall.', 'ðeɪ ˌɑːɹnt tˈɔːl', 'they_arent_tall.opus', NULL, 4047, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(347, 'jakýkoliv', 'any', 'ˈɛni', 'any.opus', NULL, 4048, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(348, 'cokoliv', 'anything', 'ˈɛnɪθˌɪŋ', 'anything.opus', NULL, 4049, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(349, 'který', 'which', 'wˈɪtʃ', 'which.opus', NULL, 4050, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(350, 'čí', 'whose', 'hˈuːz', 'whose.opus', NULL, 4051, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(351, 'z', 'from', 'fɹˈʌm', 'from.opus', NULL, 4052, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(352, 'jméno', 'name', 'nˈeɪm', 'name.opus', NULL, 4053, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(353, 'špatně', 'wrong', 'ɹˈɔŋ', 'wrong.opus', NULL, 4054, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(354, 'čas', 'time', 'tˈaɪm', 'time.opus', NULL, 4055, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(355, 'Já nejsem hladový.', 'I''m not hungry.', 'aɪm nˌɑːt hˈʌŋɡɹi', 'im_not_hungry.opus', NULL, 4056, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(356, 'Ty nejsi unavená.', 'You aren''t tired.', 'juː ˌɑːɹnt tˈaɪɚd', 'you_arent_tired.opus', NULL, 4057, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(357, 'On není přátelský.', 'He isn''t friendly.', 'hiː ˌɪzənt fɹˈɛndli', 'he_isnt_friendly.opus', NULL, 4058, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(358, 'Ona není naštvaná.', 'She isn''t angry.', 'ʃiː ˌɪzənt ˈæŋɡɹi', 'she_isnt_angry.opus', NULL, 4059, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(359, 'To není dobré.', 'It isn''t good.', 'ɪɾ ˌɪzənt ɡˈʊd', 'it_isnt_good.opus', NULL, 4060, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(360, 'Není nám zima.', 'We aren''t cold.', 'wiː ˌɑːɹnt kˈoʊld', 'we_arent_cold.opus', 2, 4061, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(361, 'Vy nejste oškliví.', 'You aren''t ugly.', 'juː ˌɑːɹnt ˈʌɡli', 'you_arent_ugly.opus', NULL, 4062, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(362, 'Oni nejsou krásní.', 'They aren''t beautiful.', 'ðeɪ ˌɑːɹnt bjˈuːɾifəl', 'they_arent_beautiful.opus', NULL, 4063, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(363, 'toto', 'this', 'ðˈɪs', 'this.opus', NULL, 4064, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(364, 'tamto', 'that', 'ðˈæt', 'that.opus', NULL, 4065, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(365, 'tyto', 'these', 'ðˈiːz', 'these.opus', NULL, 4066, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(366, 'ti', 'those', 'ðˈoʊz', 'those.opus', NULL, 4067, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(367, 'student', 'student', 'stˈuːdənt', 'student.opus', NULL, 4068, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(368, 'žít', 'live', 'lˈaɪv', 'live.opus', NULL, 4069, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(369, 'vzduch', 'air', 'ˈɛɹ', 'air.opus', NULL, 4070, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(370, 'sklad', 'store', 'stˈɔːɹ', 'store.opus', NULL, 4071, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, NULL, true),
	(371, 'Já nejsem slabý.', 'I''m not weak.', 'aɪm nˌɑːt wˈiːk', 'im_not_weak.opus', NULL, 4072, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(372, 'Ty nejsi silný.', 'You aren''t strong.', 'juː ˌɑːɹnt stɹˈɔŋ', 'you_arent_strong.opus', NULL, 4073, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(373, 'On není špinavý.', 'He isn''t dirty.', 'hiː ˌɪzənt dˈɜːɾi', 'he_isnt_dirty.opus', NULL, 4074, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(374, 'Ona není čistá.', 'She isn''t clean.', 'ʃiː ˌɪzənt klˈiːn', 'she_isnt_clean.opus', NULL, 4075, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(375, 'Není to snadné.', 'It isn''t easy.', 'ɪɾ ˌɪzənt ˈiːzi', 'it_isnt_easy.opus', NULL, 4076, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(376, 'My nejsme chudí.', 'We aren''t poor.', 'wiː ˌɑːɹnt pˈʊɹ', 'we_arent_poor.opus', NULL, 4077, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(377, 'Vy nejste bohatí.', 'You aren''t rich.', 'juː ˌɑːɹnt ɹˈɪtʃ', 'you_arent_rich.opus', NULL, 4078, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false),
	(378, 'Oni nejsou pomalí.', 'They aren''t slow.', 'ðeɪ ˌɑːɹnt slˈoʊ', 'they_arent_slow.opus', NULL, 4079, NULL, '2026-08-04 08:08:58.645697+00', NULL, 4, 4, false);


--
-- Data for Name: grammar_chunk_examples; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."grammar_chunk_examples" ("grammar_chunk_id", "item_id", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 227, 1, '2026-08-04 08:17:52.772132+00', NULL),
	(1, 228, 2, '2026-08-04 08:17:52.772132+00', NULL),
	(1, 229, 3, '2026-08-04 08:17:52.772132+00', NULL),
	(1, 230, 4, '2026-08-04 08:17:52.772132+00', NULL),
	(1, 231, 5, '2026-08-04 08:17:52.772132+00', NULL),
	(1, 232, 6, '2026-08-04 08:17:52.772132+00', NULL),
	(1, 233, 7, '2026-08-04 08:17:52.772132+00', NULL),
	(1, 234, 8, '2026-08-04 08:17:52.772132+00', NULL),
	(2, 243, 1, '2026-08-04 08:20:01.970488+00', NULL),
	(2, 244, 2, '2026-08-04 08:20:01.970488+00', NULL),
	(2, 245, 3, '2026-08-04 08:20:01.970488+00', NULL),
	(2, 246, 4, '2026-08-04 08:20:01.970488+00', NULL),
	(2, 247, 5, '2026-08-04 08:20:01.970488+00', NULL),
	(2, 248, 6, '2026-08-04 08:20:01.970488+00', NULL),
	(2, 249, 7, '2026-08-04 08:20:01.970488+00', NULL),
	(2, 250, 8, '2026-08-04 08:20:01.970488+00', NULL),
	(3, 311, 1, '2026-08-04 08:20:40.72366+00', NULL),
	(3, 312, 2, '2026-08-04 08:20:40.72366+00', NULL),
	(3, 313, 3, '2026-08-04 08:20:40.72366+00', NULL),
	(3, 314, 4, '2026-08-04 08:20:40.72366+00', NULL),
	(3, 315, 5, '2026-08-04 08:20:40.72366+00', NULL),
	(3, 316, 6, '2026-08-04 08:20:40.72366+00', NULL),
	(3, 317, 7, '2026-08-04 08:20:40.72366+00', NULL),
	(3, 318, 8, '2026-08-04 08:20:40.72366+00', NULL),
	(4, 323, 1, '2026-08-04 08:20:56.57051+00', NULL),
	(4, 324, 2, '2026-08-04 08:20:56.57051+00', NULL),
	(4, 325, 3, '2026-08-04 08:20:56.57051+00', NULL),
	(4, 326, 4, '2026-08-04 08:20:56.57051+00', NULL),
	(4, 327, 5, '2026-08-04 08:20:56.57051+00', NULL),
	(4, 328, 6, '2026-08-04 08:20:56.57051+00', NULL),
	(4, 329, 7, '2026-08-04 08:20:56.57051+00', NULL),
	(4, 330, 8, '2026-08-04 08:20:56.57051+00', NULL);


--
-- Data for Name: pronunciation_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pronunciation_groups" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 'æ | ɛ', NULL, 1, '2026-08-04 08:22:29.882513+00', NULL);


--
-- Data for Name: pronunciation_group_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pronunciation_group_items" ("pronunciation_group_id", "item_id", "sort_order", "updated_at", "deleted_at", "contrast_set") VALUES
	(1, 112, 1, '2026-08-04 08:23:28.400894+00', NULL, 1),
	(1, 121, 2, '2026-08-04 08:23:40.72639+00', NULL, 1);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "history_enabled", "created_at", "deleted_at", "updated_at") VALUES
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', false, '2026-07-12 14:30:09.044811+00', NULL, '2026-07-18 08:26:58.266187+00');


--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_blocks" ("block_id", "user_id", "started_at", "updated_at") VALUES
	(4, 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-08-04 09:01:59.724+00', '2026-08-04 09:01:59.724+00'),
	(5, 'cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-08-04 09:12:45.574+00', '2026-08-04 09:12:45.574+00');


--
-- Data for Name: user_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_items" ("user_id", "item_id", "started_at", "updated_at", "progress_cz_to_en", "progress_en_to_cz", "next_at_cz_to_en", "next_at_en_to_cz", "mastered_at_cz_to_en", "mastered_at_en_to_cz", "has_pronunciation_practice") VALUES
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 151, '2026-07-29 17:36:57.34+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 04:12:46.84+00', '2026-08-08 17:51:07.694+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 243, '2026-08-04 09:12:45.574+00', '2026-08-04 09:12:45.574+00', 2, 2, '2026-08-04 09:30:31.576+00', '2026-08-04 09:27:34.576+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 122, '2026-07-29 17:17:49.346+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 21:02:05.416+00', '2026-08-08 10:37:34.966+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 244, '2026-08-04 09:12:45.574+00', '2026-08-04 09:12:45.574+00', 2, 2, '2026-08-04 09:29:21.576+00', '2026-08-04 09:29:05.576+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 246, '2026-08-04 09:12:45.574+00', '2026-08-04 09:12:45.574+00', 2, 2, '2026-08-04 09:27:14.576+00', '2026-08-04 09:29:26.576+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 248, '2026-08-04 09:12:45.574+00', '2026-08-04 09:12:45.574+00', 2, 2, '2026-08-04 09:26:45.576+00', '2026-08-04 09:27:08.576+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 249, '2026-08-04 09:12:45.574+00', '2026-08-04 09:12:45.574+00', 2, 2, '2026-08-04 09:27:35.576+00', '2026-08-04 09:29:26.576+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 128, '2026-07-29 17:17:59.401+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 16:41:24.977+00', '2026-08-08 15:07:19.318+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 250, '2026-08-04 09:12:45.574+00', '2026-08-04 09:12:45.574+00', 2, 2, '2026-08-04 09:29:26.576+00', '2026-08-04 09:29:17.576+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 235, '2026-08-04 09:03:24.506+00', '2026-08-04 09:18:42.259+00', 2, 2, '2026-08-04 09:36:19.259+00', '2026-08-04 09:34:14.947+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 236, '2026-08-04 09:03:25.402+00', '2026-08-04 09:18:45.059+00', 2, 2, '2026-08-04 09:35:22.059+00', '2026-08-04 09:33:57.842+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 194, '2026-08-03 18:17:30.955+00', '2026-08-04 09:31:37.781798+00', 4, 5, '2026-08-04 13:04:24.145+00', '2026-08-05 05:26:42.036+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 229, '2026-08-04 09:01:59.724+00', '2026-08-04 09:19:13.579+00', 3, 3, '2026-08-04 10:22:19.579+00', '2026-08-04 10:10:11.266+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 230, '2026-08-04 09:01:59.724+00', '2026-08-04 09:19:17.947+00', 3, 3, '2026-08-04 10:11:58.947+00', '2026-08-04 10:20:15.339+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 233, '2026-08-04 09:01:59.724+00', '2026-08-04 09:19:19.955+00', 3, 3, '2026-08-04 10:22:50.955+00', '2026-08-04 10:26:28.811+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 232, '2026-08-04 09:01:59.724+00', '2026-08-04 09:19:20.891+00', 3, 3, '2026-08-04 10:13:22.891+00', '2026-08-04 10:27:15.619+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 231, '2026-08-04 09:01:59.724+00', '2026-08-04 09:22:13.051+00', 3, 3, '2026-08-04 10:28:59.739+00', '2026-08-04 10:33:03.051+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 242, '2026-08-04 09:03:38.514+00', '2026-08-04 09:22:13.948+00', 2, 2, '2026-08-04 09:32:58.523+00', '2026-08-04 09:37:51.948+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 237, '2026-08-04 09:03:26.298+00', '2026-08-04 09:22:15.428+00', 2, 2, '2026-08-04 09:35:22.483+00', '2026-08-04 09:38:25.428+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 240, '2026-08-04 09:03:36.002+00', '2026-08-04 09:22:16.564+00', 2, 2, '2026-08-04 09:31:03.619+00', '2026-08-04 09:37:33.564+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 239, '2026-08-04 09:03:28.882+00', '2026-08-04 09:25:44.163+00', 2, 2, '2026-08-04 09:32:17.035+00', '2026-08-04 09:38:27.163+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 238, '2026-08-04 09:03:27.53+00', '2026-08-04 09:25:44.971+00', 2, 2, '2026-08-04 09:31:13.907+00', '2026-08-04 09:38:49.971+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 241, '2026-08-04 09:03:37.218+00', '2026-08-04 09:25:46.899+00', 2, 2, '2026-08-04 09:34:01.355+00', '2026-08-04 09:38:44.899+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 234, '2026-08-04 09:01:59.724+00', '2026-08-04 09:25:49.355+00', 3, 3, '2026-08-04 10:31:59.355+00', '2026-08-04 10:17:44.211+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 66, '2026-07-29 16:53:20.367+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 11:17:09.777+00', '2026-08-08 17:42:00.758+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 227, '2026-08-04 09:01:59.724+00', '2026-08-04 09:25:50.179+00', 3, 3, '2026-08-04 10:37:24.179+00', '2026-08-04 10:12:33.867+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 228, '2026-08-04 09:01:59.724+00', '2026-08-04 09:25:51.028+00', 3, 3, '2026-08-04 10:19:55.028+00', '2026-08-04 10:19:02.163+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 247, '2026-08-04 09:12:45.574+00', '2026-08-04 09:25:51.979+00', 3, 2, '2026-08-04 10:37:19.98+00', '2026-08-04 09:28:22.576+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 245, '2026-08-04 09:12:45.574+00', '2026-08-04 09:25:52.763+00', 3, 2, '2026-08-04 10:21:59.764+00', '2026-08-04 09:28:24.576+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 214, '2026-08-03 18:18:25.292+00', '2026-08-04 09:31:37.781798+00', 4, 5, '2026-08-04 12:03:11.073+00', '2026-08-05 10:47:24.22+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 251, '2026-08-04 09:25:53.612+00', '2026-08-04 09:25:59.995+00', 1, 1, '2026-08-04 09:28:15.612+00', '2026-08-04 09:27:58.996+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 252, '2026-08-04 09:25:54.499+00', '2026-08-04 09:26:00.836+00', 1, 1, '2026-08-04 09:27:38.499+00', '2026-08-04 09:27:52.836+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 253, '2026-08-04 09:25:55.475+00', '2026-08-04 09:26:01.716+00', 1, 1, '2026-08-04 09:27:46.475+00', '2026-08-04 09:28:22.716+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 254, '2026-08-04 09:25:56.828+00', '2026-08-04 09:26:02.508+00', 1, 1, '2026-08-04 09:27:49.828+00', '2026-08-04 09:28:21.508+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 255, '2026-08-04 09:25:57.763+00', '2026-08-04 09:26:09.204+00', 1, 1, '2026-08-04 09:27:43.764+00', '2026-08-04 09:28:28.204+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 256, '2026-08-04 09:26:03.731+00', '2026-08-04 09:26:09.988+00', 1, 1, '2026-08-04 09:28:06.731+00', '2026-08-04 09:28:30.988+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 203, '2026-07-30 06:11:46.017+00', '2026-08-03 14:16:57.225109+00', 5, 6, '2026-08-04 16:36:57.528+00', '2026-08-05 09:23:14.025+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 211, '2026-07-30 06:12:31.737+00', '2026-08-03 14:16:57.225109+00', 5, 6, '2026-08-04 17:04:55.464+00', '2026-08-05 21:42:10.024+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 1, '2026-08-03 12:26:45.737+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 23:02:46.081+00', '2026-08-04 18:45:05.717+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 111, '2026-07-29 17:17:23.609+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 21:30:27.577+00', '2026-08-07 10:55:33.312+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 142, '2026-07-29 17:36:32.147+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 06:46:47.953+00', '2026-08-07 09:28:39.816+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 2, '2026-08-03 12:26:46.825+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 14:53:50.761+00', '2026-08-04 16:13:36.689+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 5, '2026-08-03 12:26:50.529+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 16:17:52.026+00', '2026-08-04 13:47:58.949+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 47, '2026-07-29 16:52:17.127+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 16:41:44.553+00', '2026-08-08 05:13:03.92+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 6, '2026-08-03 12:27:01.504+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 19:45:22.465+00', '2026-08-04 22:18:23.773+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 7, '2026-08-03 12:27:02.393+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 23:08:21.09+00', '2026-08-04 21:05:27.537+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 8, '2026-08-03 12:27:03.416+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 21:16:40.609+00', '2026-08-04 22:14:03.685+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 156, '2026-07-29 17:37:07.243+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 19:45:09.912+00', '2026-08-07 01:57:44.001+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 10, '2026-08-03 12:27:05.824+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-05 00:12:43.402+00', '2026-08-04 18:52:23.13+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 80, '2026-07-29 16:53:49.663+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 17:32:10.848+00', '2026-08-06 18:57:46.432+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 15, '2026-08-03 12:27:20.377+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 17:38:24.93+00', '2026-08-04 16:53:55.933+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 16, '2026-08-03 12:27:37.352+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 22:33:05.193+00', '2026-08-04 23:07:54.313+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 121, '2026-07-29 17:17:48.513+00', '2026-08-04 08:58:40.656981+00', 6, 7, '2026-08-05 08:50:53.553+00', '2026-08-08 01:37:46.864+00', NULL, NULL, true),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 127, '2026-07-29 17:17:58.634+00', '2026-08-04 08:58:40.656981+00', 6, 7, '2026-08-05 04:29:39.953+00', '2026-08-08 12:02:36.352+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 97, '2026-07-29 17:16:50.81+00', '2026-08-04 08:58:40.656981+00', 6, 7, '2026-08-05 21:45:03.977+00', '2026-08-08 20:37:23.336+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 200, '2026-08-03 18:17:43.219+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 12:31:14.785+00', '2026-08-04 09:49:37.095+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 201, '2026-08-03 18:17:44.275+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 12:58:23.697+00', '2026-08-04 10:16:12.343+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 95, '2026-08-03 14:55:48.164+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 10:31:19.593+00', '2026-08-05 03:51:40.983+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 85, '2026-08-03 14:53:07.876+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:33:47.521+00', '2026-08-05 08:41:13.494+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 96, '2026-08-03 14:55:49.46+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 11:01:26.481+00', '2026-08-05 04:00:52.71+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 205, '2026-08-03 18:17:54.588+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 12:34:05.417+00', '2026-08-04 10:28:53.335+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 204, '2026-08-03 18:17:46.315+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 12:41:54.041+00', '2026-08-04 10:25:33.39+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 209, '2026-08-03 18:17:57.66+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 13:36:42.913+00', '2026-08-04 09:34:38.526+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 86, '2026-08-03 14:53:09.196+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 09:38:59.969+00', '2026-08-05 05:24:59.983+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 210, '2026-08-03 18:18:06.076+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 12:56:09.441+00', '2026-08-04 10:03:22.039+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 92, '2026-08-03 14:55:38.692+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 12:39:39.129+00', '2026-08-05 02:24:30.646+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 197, '2026-08-03 18:17:34.292+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 13:23:01.002+00', '2026-08-04 10:45:07.856+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 212, '2026-08-03 18:18:07.1+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 13:23:09.914+00', '2026-08-04 09:58:03.599+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 196, '2026-08-03 18:17:33.139+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 13:29:46.545+00', '2026-08-04 09:27:40.199+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 202, '2026-08-03 18:17:45.283+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 12:12:38.625+00', '2026-08-04 10:10:53.318+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 90, '2026-08-03 14:55:29.716+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 12:02:43.721+00', '2026-08-05 04:47:19.871+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 102, '2026-08-03 14:55:52.124+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:43:20.226+00', '2026-08-05 08:44:42.526+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 257, '2026-08-04 09:26:04.555+00', '2026-08-04 09:26:10.788+00', 1, 1, '2026-08-04 09:27:47.555+00', '2026-08-04 09:28:32.788+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 4, '2026-08-03 12:26:48.96+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 20:16:51.932+00', '2026-08-04 17:58:46.769+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 258, '2026-08-04 09:26:05.411+00', '2026-08-04 09:26:11.78+00', 1, 1, '2026-08-04 09:28:10.411+00', '2026-08-04 09:28:08.78+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 9, '2026-08-03 12:27:04.673+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 16:49:19.003+00', '2026-08-04 17:29:56.925+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 259, '2026-08-04 09:26:06.684+00', '2026-08-04 09:26:12.811+00', 1, 1, '2026-08-04 09:28:16.684+00', '2026-08-04 09:28:10.811+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 260, '2026-08-04 09:26:07.907+00', '2026-08-04 09:26:24.38+00', 1, 1, '2026-08-04 09:28:19.907+00', '2026-08-04 09:28:11.38+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 208, '2026-07-30 06:12:21.905+00', '2026-08-03 14:16:57.225109+00', 6, 6, '2026-08-05 16:19:40.552+00', '2026-08-05 03:45:38.104+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 261, '2026-08-04 09:26:14.771+00', '2026-08-04 09:26:25.444+00', 1, 1, '2026-08-04 09:27:57.772+00', '2026-08-04 09:28:24.444+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 216, '2026-07-30 06:12:42.545+00', '2026-08-03 14:16:57.225109+00', 6, 6, '2026-08-05 20:25:17.441+00', '2026-08-05 11:01:25.536+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 159, '2026-07-30 05:23:19.631+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 09:46:44.185+00', '2026-08-06 22:09:49.897+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 71, '2026-07-29 16:53:32.559+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 17:03:17.817+00', '2026-08-07 11:16:10.824+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 64, '2026-07-29 16:53:12.535+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 21:21:56.201+00', '2026-08-07 09:53:17.63+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 262, '2026-08-04 09:26:16.891+00', '2026-08-04 09:26:26.98+00', 1, 1, '2026-08-04 09:28:00.891+00', '2026-08-04 09:28:45.98+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 263, '2026-08-04 09:26:18.963+00', '2026-08-04 09:26:28.419+00', 1, 1, '2026-08-04 09:27:57.963+00', '2026-08-04 09:28:10.419+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 264, '2026-08-04 09:26:20.923+00', '2026-08-04 09:26:29.891+00', 1, 1, '2026-08-04 09:28:00.923+00', '2026-08-04 09:28:37.891+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 269, '2026-08-04 09:26:35.251+00', '2026-08-04 09:26:35.251+00', 1, 0, '2026-08-04 09:28:12.251+00', '2026-08-04 09:26:35.251+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 270, '2026-08-04 09:26:36.683+00', '2026-08-04 09:26:36.683+00', 1, 0, '2026-08-04 09:28:19.683+00', '2026-08-04 09:26:36.683+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 265, '2026-08-04 09:26:22.091+00', '2026-08-04 09:26:39.771+00', 1, 1, '2026-08-04 09:28:24.091+00', '2026-08-04 09:28:16.771+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 17, '2026-08-03 12:27:38.873+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 21:23:05.145+00', '2026-08-04 13:29:32.868+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 266, '2026-08-04 09:26:31.923+00', '2026-08-04 09:26:40.747+00', 1, 1, '2026-08-04 09:28:21.924+00', '2026-08-04 09:28:46.747+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 59, '2026-07-29 16:53:00.599+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 07:11:23.609+00', '2026-08-07 22:24:21.755+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 89, '2026-07-29 17:16:29.233+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 19:41:49.465+00', '2026-08-06 19:47:32.748+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 267, '2026-08-04 09:26:33.003+00', '2026-08-04 09:26:41.683+00', 1, 1, '2026-08-04 09:28:50.003+00', '2026-08-04 09:29:00.683+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 19, '2026-08-03 12:27:41.953+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 22:06:35.843+00', '2026-08-04 22:27:18.273+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 20, '2026-08-03 12:27:43.593+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 18:05:07.193+00', '2026-08-04 15:56:26.503+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 21, '2026-08-03 12:28:41.112+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 20:56:52.306+00', '2026-08-04 17:19:52.837+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 22, '2026-08-03 12:28:43.752+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 14:41:30.848+00', '2026-08-04 23:10:58.377+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 23, '2026-08-03 12:28:47.264+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 21:05:38.883+00', '2026-08-04 23:26:28.05+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 25, '2026-08-03 12:29:11.145+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 21:21:35.69+00', '2026-08-04 20:06:04.821+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 268, '2026-08-04 09:26:34.035+00', '2026-08-04 09:31:27.108+00', 1, 1, '2026-08-04 09:28:52.036+00', '2026-08-04 09:33:48.108+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 26, '2026-08-03 12:31:45.16+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-05 01:51:05.145+00', '2026-08-04 23:03:22.395+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 27, '2026-08-03 12:31:46.184+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 16:58:42.857+00', '2026-08-04 19:54:33.472+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 28, '2026-08-03 12:31:47.153+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 17:12:12.473+00', '2026-08-04 16:52:36.153+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 29, '2026-08-03 12:31:48.104+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 23:58:21.106+00', '2026-08-04 16:40:05.137+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 31, '2026-08-03 12:31:56.769+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 20:22:29.953+00', '2026-08-05 01:38:54.314+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 32, '2026-08-03 12:31:57.736+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-05 01:31:39.506+00', '2026-08-04 20:28:41.816+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 33, '2026-08-03 12:31:58.776+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 21:52:04.58+00', '2026-08-04 21:37:44.505+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 34, '2026-08-03 12:32:00.16+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 18:46:00.961+00', '2026-08-04 15:55:00.72+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 36, '2026-08-03 12:37:27.224+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 23:08:17.65+00', '2026-08-04 19:33:58.329+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 37, '2026-08-03 12:37:28.783+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 23:35:40.649+00', '2026-08-04 18:14:39.929+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 41, '2026-08-03 12:37:44.088+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 16:01:44.728+00', '2026-08-04 15:05:02.388+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 42, '2026-08-03 13:02:53.564+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 18:14:53.578+00', '2026-08-05 01:01:57.682+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 46, '2026-08-03 13:03:54.659+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 21:12:08.529+00', '2026-08-04 17:52:28.079+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 108, '2026-07-29 17:17:15.689+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 11:37:05.233+00', '2026-08-07 20:31:56.19+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 49, '2026-07-29 16:52:19.527+00', '2026-08-03 14:16:57.225109+00', 6, 7, '2026-08-05 14:30:00.161+00', '2026-08-07 13:38:55.124+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 53, '2026-08-03 13:04:21.252+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-05 00:18:18.033+00', '2026-08-04 19:54:19.426+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 153, '2026-07-29 17:36:59.675+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 17:30:31.624+00', '2026-08-07 13:08:10.2+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 158, '2026-07-29 17:37:08.844+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 07:10:33.753+00', '2026-08-08 04:56:15.326+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 73, '2026-07-29 16:53:35.271+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 13:37:03.872+00', '2026-08-08 00:38:27.319+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 100, '2026-07-29 17:16:54.746+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 08:19:00.945+00', '2026-08-08 12:43:33.367+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 81, '2026-07-29 16:53:55.495+00', '2026-08-04 07:14:34.06184+00', 6, 7, '2026-08-05 17:02:10.736+00', '2026-08-07 14:01:49.143+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 54, '2026-08-03 13:04:22.947+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 21:31:51.385+00', '2026-08-04 18:52:45.779+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 55, '2026-08-03 13:04:24.932+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 19:34:36.546+00', '2026-08-04 23:59:14.994+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 106, '2026-07-29 17:17:13.857+00', '2026-08-04 08:58:40.656981+00', 6, 7, '2026-08-05 09:19:07.769+00', '2026-08-07 21:12:04.305+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 183, '2026-07-30 05:34:31.999+00', '2026-08-04 08:58:40.656981+00', 6, 7, '2026-08-05 14:59:12.072+00', '2026-08-08 07:35:03.984+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 163, '2026-07-30 05:23:23.679+00', '2026-08-04 08:58:40.656981+00', 6, 7, '2026-08-05 03:43:25.896+00', '2026-08-07 17:33:54.672+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 185, '2026-08-03 18:16:31.58+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 11:52:13.441+00', '2026-08-05 11:46:06.883+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 170, '2026-08-03 16:15:46.602+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:41:56.48+00', '2026-08-05 11:27:24.842+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 3, '2026-08-03 12:26:47.808+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 17:47:07.827+00', '2026-08-04 17:22:56.961+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 11, '2026-08-03 12:27:15.321+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-05 01:07:48.026+00', '2026-08-04 18:03:16.944+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 12, '2026-08-03 12:27:16.593+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 22:41:00.418+00', '2026-08-04 16:05:53.532+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 13, '2026-08-03 12:27:18.312+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 22:54:42.154+00', '2026-08-04 18:56:51.28+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 14, '2026-08-03 12:27:19.329+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 19:35:01.802+00', '2026-08-04 18:32:00.184+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 18, '2026-08-03 12:27:40.105+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 20:15:56.154+00', '2026-08-04 16:26:52.337+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 24, '2026-08-03 12:28:48.769+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 23:13:35.921+00', '2026-08-04 21:24:57.681+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 30, '2026-08-03 12:31:49.057+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 19:00:56.082+00', '2026-08-04 18:20:43.771+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 35, '2026-08-03 12:32:01.64+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 23:52:46.754+00', '2026-08-04 23:35:58.681+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 38, '2026-08-03 12:37:30.375+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 21:32:26.418+00', '2026-08-04 13:42:40.692+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 39, '2026-08-03 12:37:32+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 18:48:55.314+00', '2026-08-04 19:35:15.1+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 40, '2026-08-03 12:37:33.744+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 20:46:11.53+00', '2026-08-04 17:57:48.945+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 56, '2026-07-29 16:52:57.263+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 19:43:41.824+00', '2026-08-07 19:46:51.27+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 57, '2026-08-03 13:04:32.667+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 16:58:55.985+00', '2026-08-04 19:35:20.21+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 79, '2026-07-29 16:53:47.991+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 21:39:03.233+00', '2026-08-07 18:51:17.069+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 87, '2026-07-29 17:16:26.777+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 10:12:55.2+00', '2026-08-07 20:35:56.152+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 99, '2026-07-29 17:16:53.641+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 20:57:35.081+00', '2026-08-07 21:02:30.25+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 101, '2026-07-29 17:17:02.553+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 20:57:10.337+00', '2026-08-07 00:28:23.24+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 109, '2026-07-29 17:17:16.769+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 05:28:53.529+00', '2026-08-07 20:54:37.908+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 117, '2026-07-29 17:17:37.801+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 05:17:27.864+00', '2026-08-08 07:47:06.558+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 182, '2026-08-03 18:16:22.676+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:26:54.921+00', '2026-08-05 02:27:45.594+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 178, '2026-08-03 18:16:11.276+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:07:07.522+00', '2026-08-05 08:06:10.922+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 44, '2026-08-03 13:03:51.524+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:36:53.353+00', '2026-08-04 19:31:17.818+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 179, '2026-08-03 18:16:19.563+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:23:33.169+00', '2026-08-05 02:56:41.746+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 51, '2026-08-03 13:04:07.757+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:27:42.042+00', '2026-08-04 22:43:01.866+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 45, '2026-08-03 13:03:53.364+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:31:45.801+00', '2026-08-04 20:07:47.682+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 63, '2026-08-03 13:38:08.106+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:36:05.681+00', '2026-08-04 17:53:23.042+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 74, '2026-08-03 13:38:30.363+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:36:01.545+00', '2026-08-04 18:41:29.386+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 67, '2026-08-03 13:38:12.074+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 04:07:47.609+00', '2026-08-04 18:47:17.066+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 72, '2026-08-03 13:38:27.347+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 11:19:07.841+00', '2026-08-04 22:31:00.146+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 65, '2026-08-03 13:38:10.378+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:17:58.201+00', '2026-08-04 22:51:55.298+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 78, '2026-08-03 13:38:44.714+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 13:11:31.393+00', '2026-08-04 18:27:57.954+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 61, '2026-08-03 13:38:05.835+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 10:07:30.041+00', '2026-08-04 16:56:37.802+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 82, '2026-08-03 13:38:46.915+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:38:27.897+00', '2026-08-04 20:13:05.626+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 77, '2026-08-03 13:38:43.219+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:55:07.577+00', '2026-08-04 21:34:19.282+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 69, '2026-08-03 13:38:22.059+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 12:23:37.817+00', '2026-08-04 17:10:26.595+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 60, '2026-08-03 13:38:04.85+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 10:49:56.337+00', '2026-08-04 19:44:36.161+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 76, '2026-08-03 13:38:41.819+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 13:18:25.185+00', '2026-08-05 00:23:39.05+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 75, '2026-08-03 13:38:40.666+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 09:59:06.145+00', '2026-08-04 21:37:06.21+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 62, '2026-08-03 13:38:06.986+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:49:45.817+00', '2026-08-04 22:17:33.154+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 68, '2026-08-03 13:38:20.77+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:44:12.561+00', '2026-08-04 15:33:43.647+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 165, '2026-08-03 16:15:15.33+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 08:39:17.193+00', '2026-08-05 11:38:57.002+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 114, '2026-08-03 15:33:54.503+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 09:39:52.969+00', '2026-08-05 03:54:09.911+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 115, '2026-08-03 15:33:55.454+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 12:52:55.018+00', '2026-08-05 08:15:27.807+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 104, '2026-08-03 15:33:39.271+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:50:49.649+00', '2026-08-05 01:27:10.87+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 118, '2026-08-03 15:34:04.527+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 11:36:30.417+00', '2026-08-05 02:22:41.078+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 221, '2026-08-04 08:56:56.705+00', '2026-08-04 09:31:37.781798+00', 3, 3, '2026-08-04 10:08:13.707+00', '2026-08-04 10:09:19.979+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 226, '2026-08-04 08:57:23.761+00', '2026-08-04 09:31:37.781798+00', 3, 3, '2026-08-04 10:18:14.603+00', '2026-08-04 10:08:22.195+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 224, '2026-08-04 08:57:07.362+00', '2026-08-04 09:31:37.781798+00', 3, 3, '2026-08-04 10:13:32.435+00', '2026-08-04 10:11:21.06+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 222, '2026-08-04 08:56:58.874+00', '2026-08-04 09:31:37.781798+00', 3, 3, '2026-08-04 10:25:25.979+00', '2026-08-04 10:15:44.355+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 220, '2026-08-04 08:56:55.801+00', '2026-08-04 09:31:37.781798+00', 3, 3, '2026-08-04 10:20:45.019+00', '2026-08-04 10:22:05.644+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 225, '2026-08-04 08:57:22.826+00', '2026-08-04 09:31:37.781798+00', 3, 3, '2026-08-04 10:25:36.179+00', '2026-08-04 10:13:46.699+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 169, '2026-08-03 16:15:45.674+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 11:59:15.681+00', '2026-08-05 08:55:34.263+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 43, '2026-08-03 13:03:50.04+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 11:14:34.937+00', '2026-08-04 14:59:08.168+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 48, '2026-08-03 13:04:05.179+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:44:53.865+00', '2026-08-04 16:44:10.193+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 52, '2026-08-03 13:04:11.693+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 04:44:06.809+00', '2026-08-04 17:59:43.697+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 116, '2026-08-03 15:33:56.447+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 04:21:05.641+00', '2026-08-05 01:27:26.102+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 91, '2026-08-03 14:55:37.644+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 12:56:19.833+00', '2026-08-05 09:29:48.671+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 176, '2026-08-03 18:16:08.972+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:42:58.449+00', '2026-08-05 08:03:27.282+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 113, '2026-08-03 15:33:53.527+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 08:13:23.945+00', '2026-08-05 07:26:18.966+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 94, '2026-08-03 14:55:40.764+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:33:50.921+00', '2026-08-05 01:31:10.559+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 84, '2026-08-03 14:53:06.221+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:18:49.201+00', '2026-08-05 05:51:16.839+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 88, '2026-08-03 14:55:28.244+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 04:51:13.657+00', '2026-08-05 03:33:07.91+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 93, '2026-08-03 14:55:39.828+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:07:49.945+00', '2026-08-05 02:31:29.719+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 103, '2026-08-03 14:55:53.405+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:08:46.898+00', '2026-08-05 03:04:02.006+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 98, '2026-08-03 14:55:50.644+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:51:14.641+00', '2026-08-05 05:10:44.87+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 83, '2026-08-03 14:53:05.141+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 08:53:51.561+00', '2026-08-05 07:08:32.471+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 70, '2026-08-03 13:38:23.643+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:31:48.505+00', '2026-08-04 22:33:35.687+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 125, '2026-08-03 15:34:07.791+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 11:42:55.425+00', '2026-08-05 08:40:45.766+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 134, '2026-08-03 15:34:20.631+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:57:48.297+00', '2026-08-05 01:19:57.311+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 139, '2026-08-03 15:34:34.359+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 10:11:40.009+00', '2026-08-05 05:09:47.967+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 133, '2026-08-03 15:34:19.679+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 11:57:46.929+00', '2026-08-05 04:08:31.99+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 155, '2026-08-03 16:05:13.539+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 04:04:12.713+00', '2026-08-05 08:05:24.601+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 137, '2026-08-03 15:34:31.695+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 10:05:13.562+00', '2026-08-05 04:35:16.431+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 131, '2026-08-03 15:34:17.311+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 12:18:22.649+00', '2026-08-05 03:47:21.166+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 141, '2026-08-03 15:34:47.752+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 13:35:44.501+00', '2026-08-05 03:59:57.062+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 119, '2026-08-03 15:34:05.559+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:04:13.513+00', '2026-08-05 08:51:19.23+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 149, '2026-08-03 15:35:02.527+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:42:33.21+00', '2026-08-05 02:55:46.423+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 110, '2026-08-03 15:33:43.791+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 12:08:22.77+00', '2026-08-05 09:18:38.846+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 186, '2026-08-03 18:16:32.668+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 09:17:11.385+00', '2026-08-05 11:09:10.498+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 135, '2026-08-03 15:34:28.832+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 08:55:47.513+00', '2026-08-05 07:21:57.223+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 123, '2026-08-03 15:34:06.703+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 10:23:10.329+00', '2026-08-05 01:32:26.958+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 129, '2026-08-03 15:34:16.454+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 13:44:02.202+00', '2026-08-05 02:16:05.071+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 105, '2026-08-03 15:33:42.295+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:39:11.106+00', '2026-08-05 02:27:23.911+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 152, '2026-08-03 15:35:07.327+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:14:39.961+00', '2026-08-05 04:56:40.439+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 145, '2026-08-03 15:34:51.975+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:36:22.802+00', '2026-08-05 07:38:26.607+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 160, '2026-08-03 16:05:16.347+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 08:48:18.306+00', '2026-08-05 04:18:51.783+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 143, '2026-08-03 15:34:49.679+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:48:09.17+00', '2026-08-05 08:05:49.006+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 148, '2026-08-03 15:35:00.879+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 12:23:58.106+00', '2026-08-05 06:10:39.695+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 144, '2026-08-03 15:34:50.822+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 13:43:06.785+00', '2026-08-05 02:06:31.918+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 140, '2026-08-03 15:34:37.519+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 08:10:04.818+00', '2026-08-05 06:44:32.863+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 174, '2026-08-03 16:15:49.641+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:10:59.681+00', '2026-08-05 02:51:06.994+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 154, '2026-08-03 15:35:08.455+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 12:51:37.642+00', '2026-08-05 04:28:11.527+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 147, '2026-08-03 15:34:53.183+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 08:38:21.577+00', '2026-08-05 06:24:44.15+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 126, '2026-08-03 15:34:08.767+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 11:17:05.625+00', '2026-08-05 03:31:35.951+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 112, '2026-08-03 15:33:51.991+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 11:36:18.922+00', '2026-08-05 04:11:25.302+00', NULL, NULL, true),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 124, '2026-07-29 17:17:50.937+00', '2026-08-04 08:58:40.656981+00', 6, 7, '2026-08-05 17:56:08.44+00', '2026-08-08 18:46:08.548+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 107, '2026-07-29 17:17:14.834+00', '2026-08-04 08:58:40.656981+00', 6, 7, '2026-08-05 07:38:43.449+00', '2026-08-09 04:05:27.601+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 223, '2026-08-04 08:57:06.529+00', '2026-08-04 09:31:37.781798+00', 3, 3, '2026-08-04 10:22:02.547+00', '2026-08-04 10:32:48.812+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 219, '2026-08-04 08:56:53.977+00', '2026-08-04 09:31:37.781798+00', 3, 3, '2026-08-04 10:22:29.595+00', '2026-08-04 10:17:38.947+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 58, '2026-08-03 13:04:34.868+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 19:15:32.282+00', '2026-08-05 06:02:55.768+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 120, '2026-07-29 17:17:42.249+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 20:27:19.265+00', '2026-08-08 09:23:23.528+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 130, '2026-07-29 17:18:01.042+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 19:04:09.177+00', '2026-08-06 20:48:05.782+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 136, '2026-07-29 17:36:13.355+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 03:15:01.465+00', '2026-08-07 19:03:57.471+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 146, '2026-07-29 17:36:46.307+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 17:31:16.96+00', '2026-08-07 19:11:43.338+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 168, '2026-07-30 05:23:37.063+00', '2026-08-04 05:54:05.757639+00', 6, 7, '2026-08-05 19:13:26.736+00', '2026-08-06 21:21:07.91+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 177, '2026-08-03 18:16:10.099+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:39:59.208+00', '2026-08-05 10:57:34.681+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 184, '2026-08-03 18:16:23.828+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 11:56:13.921+00', '2026-08-05 05:49:04.216+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 191, '2026-08-03 18:16:47.483+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:58:40.569+00', '2026-08-05 10:36:31.441+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 181, '2026-08-03 18:16:21.732+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 13:05:58.025+00', '2026-08-05 05:04:03.137+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 173, '2026-08-03 16:15:48.858+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:11:19.833+00', '2026-08-05 07:57:32.793+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 195, '2026-08-03 18:17:31.972+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:34:25.841+00', '2026-08-05 05:30:19.864+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 192, '2026-08-03 18:16:48.443+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:56:14.145+00', '2026-08-05 08:15:15.408+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 206, '2026-08-03 18:17:55.595+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 12:55:15.057+00', '2026-08-04 10:21:38.102+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 180, '2026-08-03 18:16:20.715+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:06:39.761+00', '2026-08-05 08:11:56.984+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 193, '2026-08-03 18:16:49.339+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:08:25.921+00', '2026-08-05 10:51:54.544+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 218, '2026-08-03 18:18:30.844+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 13:22:46.049+00', '2026-08-04 10:20:07.959+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 198, '2026-08-03 18:17:35.315+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 12:08:25.273+00', '2026-08-05 10:56:48.905+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 215, '2026-08-03 18:18:27.683+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 13:18:45.969+00', '2026-08-04 10:03:21.583+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 207, '2026-08-03 18:17:56.691+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 13:03:24.177+00', '2026-08-04 10:01:25.254+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 175, '2026-08-03 18:16:07.836+00', '2026-08-04 08:58:40.656981+00', 4, 5, '2026-08-04 13:16:34.401+00', '2026-08-05 07:04:36.697+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 213, '2026-08-03 18:18:08.131+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 13:25:02.562+00', '2026-08-04 10:18:23.686+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 217, '2026-08-03 18:18:29.483+00', '2026-08-04 08:58:40.656981+00', 4, 4, '2026-08-04 12:23:11.561+00', '2026-08-04 09:40:06.502+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 157, '2026-08-03 16:05:14.907+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:16:52.937+00', '2026-08-05 12:23:41.344+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 161, '2026-08-03 16:05:17.387+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:40:51.753+00', '2026-08-05 10:00:53.472+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 138, '2026-08-03 15:34:32.679+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 05:44:41.457+00', '2026-08-05 06:41:06.87+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 172, '2026-08-03 16:15:48.122+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 13:14:25.377+00', '2026-08-05 09:59:43.033+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 132, '2026-08-03 15:34:18.502+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:32:50.018+00', '2026-08-05 07:08:23.918+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 187, '2026-08-03 18:16:35.772+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:28:10.898+00', '2026-08-05 06:55:02.768+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 150, '2026-08-03 15:35:04.103+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 08:26:45.713+00', '2026-08-05 02:40:53.75+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 162, '2026-08-03 16:05:18.459+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:20:33.513+00', '2026-08-05 06:10:28.52+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 50, '2026-08-03 13:04:06.243+00', '2026-08-04 05:54:05.757639+00', 5, 5, '2026-08-04 18:01:21.226+00', '2026-08-05 00:33:28.602+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 199, '2026-08-03 18:17:42.235+00', '2026-08-04 08:58:40.656981+00', 5, 4, '2026-08-05 05:12:18.802+00', '2026-08-04 10:21:51.374+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 171, '2026-08-03 16:15:47.361+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 06:50:39.418+00', '2026-08-05 08:19:42.919+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 189, '2026-08-03 18:16:38.532+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 10:09:54.69+00', '2026-08-05 05:57:04.232+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 188, '2026-08-03 18:16:37.187+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:06:53.562+00', '2026-08-05 06:26:33.079+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 166, '2026-08-03 16:15:16.274+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 09:25:02.905+00', '2026-08-05 13:01:37.496+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 164, '2026-08-03 16:15:14.05+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:52:11.674+00', '2026-08-05 05:51:00.017+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 190, '2026-08-03 18:16:46.548+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 04:17:46.657+00', '2026-08-05 04:18:10.369+00', NULL, NULL, false),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', 167, '2026-08-03 16:15:44.913+00', '2026-08-04 08:58:40.656981+00', 5, 5, '2026-08-05 07:47:57.881+00', '2026-08-05 04:06:35.002+00', NULL, NULL, false);


--
-- Data for Name: user_items_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_scores" ("user_id", "date", "item_count", "updated_at", "deleted_at") VALUES
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-17', 320, '2026-07-17 12:11:12.382196+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-18', 427, '2026-07-19 03:35:59.63127+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-19', 1241, '2026-07-20 04:02:33.286872+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-20', 1531, '2026-07-21 03:13:49.038471+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-21', 400, '2026-07-21 10:04:12.234+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-25', 1432, '2026-07-26 08:06:22.749182+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-26', 1244, '2026-07-27 03:41:09.173942+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-27', 1921, '2026-07-28 03:19:05.360342+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-28', 947, '2026-07-28 13:23:42.051509+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-29', 1203, '2026-07-31 05:00:16.857565+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-30', 704, '2026-07-31 05:00:16.857565+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-07-31', 568, '2026-08-01 10:47:30.063311+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-08-02', 204, '2026-08-02 09:05:51.208729+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-08-01', 354, '2026-08-03 12:24:02.987293+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-08-03', 1560, '2026-08-04 05:54:05.586879+00', NULL),
	('cebbd69b-2580-43c5-ad4a-1a14a6a5fa18', '2026-08-04', 415, '2026-08-04 09:31:37.770498+00', NULL);


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

-- \unrestrict PjVJlNBrcyek0WX8Kl3kWwJj1IageFS95dROoCmZb7bfSTIIPkdJ5cQuPalVVdm

RESET ALL;
