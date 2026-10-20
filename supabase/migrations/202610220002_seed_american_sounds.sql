BEGIN;

WITH american_sounds(name, note, sort_order) AS (
  VALUES
    ('m', 'Zavřete rty a nechte hlas znít nosem. Rty zůstávají spojené.', 1),
    ('n', 'Špička jazyka se dotkne dásní za horními zuby; hlas zní nosem.', 2),
    ('ŋ', 'Zadní část jazyka se dotkne měkkého patra. Jde o nosovou hlásku jako na konci slova sing.', 3),
    ('p', 'Neznělá závěrová hláska. V angličtině bývá na začátku přízvučné slabiky výrazněji aspirovaná než v češtině.', 4),
    ('b', 'Znělá závěrová hláska; hlasivky vibrují.', 5),
    ('t', 'Neznělá závěrová hláska. V americké angličtině bývá přízvučné na začátku slabiky aspirované; mezi samohláskami může znít jako rychlé ɾ.', 6),
    ('d', 'Znělá závěrová hláska; hlasivky vibrují.', 7),
    ('k', 'Neznělá závěrová hláska. V angličtině bývá na začátku přízvučné slabiky výrazněji aspirovaná než v češtině.', 8),
    ('ɡ', 'Znělá závěrová hláska; hlasivky vibrují.', 9),
    ('f', 'Horní zuby se lehce dotknou dolního rtu; vzduch proudí bez hlasu.', 10),
    ('v', 'Poloha jako u f, ale hlasivky vibrují.', 11),
    ('θ', 'Špičku jazyka dejte lehce mezi zuby. Vzduch proudí bez hlasu.', 12),
    ('ð', 'Stejná poloha jazyka jako u θ, ale hlasivky vibrují.', 13),
    ('s', 'Úzkou štěrbinou mezi jazykem a dásněmi proudí vzduch bez hlasu.', 14),
    ('z', 'Poloha jako u s, ale hlasivky vibrují.', 15),
    ('ʃ', 'Zaokrouhlete rty a posuňte jazyk dozadu jako při českém š; hláska je neznělá.', 16),
    ('ʒ', 'Poloha jako u ʃ, ale hlasivky vibrují; podobá se ž.', 17),
    ('tʃ', 'Jedna neznělá hláska: začíná závěrem jazyka a plynule přechází do ʃ, jako české č.', 18),
    ('dʒ', 'Jedna znělá hláska: začíná závěrem jazyka a plynule přechází do ʒ, jako české dž.', 19),
    ('h', 'Lehký neznělý výdech před samohláskou; v angličtině nejde o české ch.', 20),
    ('w', 'Zaokrouhlete rty a plynule přejděte k samohlásce; horní zuby se nedotýkají dolního rtu.', 21),
    ('j', 'Krátký skluz jazyka k tvrdému patru, podobný českému j ve slově jo.', 22),
    ('ɹ', 'Americké r bez kmitání. Jazyk se zvedne nebo stáhne dozadu, ale nedotýká se patra.', 23),
    ('l', 'Špička jazyka se dotkne dásní za horními zuby a vzduch proudí po stranách jazyka.', 24),
    ('ɾ', 'Krátký dotyk špičky jazyka za horními zuby. V americké angličtině často nahrazuje t nebo d mezi samohláskami.', 25),
    ('i', 'Vysoká přední samohláska s úsměvem; jako v sheep. V mnoha přepisech ji značí iː.', 26),
    ('ɪ', 'Krátká, uvolněnější a o něco otevřenější samohláska než i; jako v ship.', 27),
    ('ɛ', 'Přední otevřenější samohláska jako v bed.', 28),
    ('æ', 'Velmi otevřená přední samohláska jako v bad; čelist je níž než u ɛ.', 29),
    ('u', 'Vysoká zadní samohláska se zaokrouhlenými rty jako v goose. V mnoha přepisech ji značí uː.', 30),
    ('ʊ', 'Krátká, uvolněnější samohláska než u; jako v foot.', 31),
    ('ɑ', 'Otevřená zadní nezaokrouhlená samohláska jako v father nebo lot v přízvuku s cot–caught merger.', 32),
    ('ɔ', 'Otevřenější zaokrouhlená samohláska jako v thought v přízvuku bez cot–caught merger; v mnoha přepisech ɔː.', 33),
    ('ʌ', 'Krátká středová samohláska jako v cup; není to české čisté a.', 34),
    ('ə', 'Neutrální, uvolněná samohláska v nepřízvučných slabikách, například v about.', 35),
    ('ɝ', 'Přízvučná americká samohláska s r zabarvením jako v bird.', 36),
    ('ɚ', 'Nepřízvučná americká samohláska s r zabarvením jako v teacher.', 37),
    ('eɪ', 'Dvojhláska jako v day: začíná u e a plynule klouže k ɪ.', 38),
    ('aɪ', 'Dvojhláska jako v my: začíná otevřeně a plynule klouže k ɪ.', 39),
    ('ɔɪ', 'Dvojhláska jako v boy: začíná u ɔ a plynule klouže k ɪ.', 40),
    ('aʊ', 'Dvojhláska jako v now: začíná otevřeně a plynule klouže k ʊ.', 41),
    ('oʊ', 'Dvojhláska jako v go: začíná u o a plynule klouže k ʊ.', 42)
)
INSERT INTO public.groups(type, name, note, sort_order)
SELECT 'sound', sound.name, sound.note, sound.sort_order
FROM american_sounds sound
WHERE NOT EXISTS (
  SELECT 1
  FROM public.groups existing
  WHERE existing.type = 'sound' AND existing.name = sound.name AND existing.deleted_at IS NULL
);

COMMIT;
