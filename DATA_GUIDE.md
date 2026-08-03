# Průvodce tvorbou dat

Tento dokument popisuje strukturu jazykových dat a postup jejich importu do databáze.

## Tabulky

Jednotlivé tabulky jsou řazeny dle pořadí importu:

`levels` - CEFR kategorie, A1 až C2, neměnné
`lesson` - každá lekce vysvětluje pouze jeden drobný gramatický jev
`

## Hierarchie výuky

### `levels`

Nejvyšší úroveň osnovy, například A1 nebo A2.

- `name` je povinný a globálně unikátní.
- `sort_order` začíná od 1 a je globálně unikátní.
- `note` je volitelný doprovodný obsah.

### `lessons`

Lekce vždy patří právě do jednoho levelu.

- `level_id` musí odkazovat na existující `levels.id`.
- `name` je globálně unikátní.
- `sort_order` začíná od 1 a je unikátní v rámci jednoho `level_id`.
- Při přesunu lekce do jiného levelu zkontrolujte nové pořadí i pořadí jejích položek v celé osnově.

### `items`

Jednotlivé dvojice čeština–angličtina. Jedna položka je zdrojem pro procvičování, témata, gramatické příklady i výslovnostní skupiny.

- `czech`, `english`, `lesson_id`, `is_vocabulary` a `sort_order` jsou povinné.
- `sort_order` je celé číslo od 0 a musí být unikátní v rámci `lesson_id`. Určuje pořadí položek v lekci a spolu s pořadím levelu a lekce také pořadí v procvičování.
- `pronunciation` obsahuje výslovnost anglického textu. Používejte v celém datasetu stejnou IPA konvenci.
- `audio` obsahuje přesný název odpovídajícího `.opus` souboru. Soubor musí být součástí audio distribuce; při změně nahrávky je vhodné změnit i název kvůli cache klientů.
- `block_id` určuje tematický nebo výukový blok položky. Může být `NULL`, pokud položka do žádného bloku nepatří.
- `grammar_chunk_id` říká, jakou gramatickou nápovědu lze u položky otevřít. Neurčuje, zda se položka zobrazí jako příklad v gramatickém přehledu.
- `note_id` připojuje doplňující poznámku k položce.
- `is_vocabulary = true` označuje slovní zásobu. Výslovnostní procvičování lze uživateli zapnout jen pro slovní zásobu s neprázdným `audio`.
- Zdrojová CSV lze připravovat přes `scripts/prepare_words.py`; podrobný postup je v `scripts/README.md`.

## Bloky a témata

### `blocks`

Blok seskupuje položky pro téma a/nebo počáteční výukový krok.

- `name` je povinný a globálně unikátní.
- `sort_order` je volitelný, ale neprázdná hodnota začíná od 1 a je globálně unikátní. Bloky bez pořadí aplikace řadí až za uspořádané bloky.
- `show_in_topics` určuje, zda se blok může zobrazovat v přehledu témat.
- `is_removed_from_practice` vyřadí položky bloku z hlavního procvičování. Takový blok může dál sloužit jako přehledové téma.
- `requires_initial_training` vynutí úvodní výukový průchod před pokračováním v osnově. Nesmí být současně `true` s `is_removed_from_practice`.
- `grammar_chunk_id` připojuje gramatiku vysvětlovanou v úvodním tréninku bloku. Samotný obsah tabulky gramatických příkladů tím definován není.
- Každý blok s počátečním tréninkem musí mít smysluplnou sadu položek přes `items.block_id`; úvodní obrazovka představí všechny položky tohoto bloku.

### `user_blocks`

Uživatelský stav bloků. Nevytvářejte jej jako obsahový seed.

- Primární klíč tvoří `(block_id, user_id)`.
- `started_at` eviduje první započetí bloku. Reset postupu jej nemaže.
- Řádky spravuje aplikace a synchronizační RPC; ruční zásah je pouze servisní operace pro konkrétního uživatele.

## Gramatika

### `grammar_groups`

Vyšší celek přehledu gramatiky, například slovesný čas.

- `name` a `sort_order` jsou povinné a globálně unikátní; pořadí začíná od 1.
- `note` je úvod k celé skupině. Udržujte jej stručný a obecný, detaily patří do chunků.
- Skupina se v přehledu zpřístupní podle započatých položek navázaných na její chunky.

### `grammar_chunks`

Jedna konkrétní gramatická část nebo samostatné pravidlo.

- `name` a `sort_order` jsou povinné a globálně unikátní; pořadí začíná od 1.
- `grammar_group_id` je volitelný. S hodnotou patří chunk do skupiny, s `NULL` funguje jako samostatná položka přehledu.
- `note` obsahuje vysvětlení. HTML musí být jednoduché, sémantické a bezpečné; aplikace jej před vykreslením sanitizuje.
- Zpřístupnění chunku vychází z `items.grammar_chunk_id`, zatímco zobrazované příklady určuje výhradně `grammar_chunk_examples`.

### `grammar_chunk_examples`

Explicitní, seřazený výběr položek zobrazovaných pod gramatickým chunkem.

- Primární klíč je `(grammar_chunk_id, item_id)`: stejnou položku lze v jednom chunku uvést jen jednou, ale může být příkladem více chunků.
- `sort_order` začíná od 1 a je unikátní v rámci `grammar_chunk_id`.
- Zařazujte pouze základní příklady, které dohromady dávají dostatečný kontext pravidla. Není nutné ani žádoucí automaticky zahrnout všechny položky s odpovídajícím `items.grammar_chunk_id`.
- Příklad musí mít správné `czech`, `english`, `pronunciation` a `audio`, protože řádek je v přehledu přehratelný.
- Příklady se v gramatickém přehledu i na kartě nápovědy zobrazují všechny; nejde o uživatelský stav ani o seznam odvozený z `started_at`.

## Poznámky

### `notes`

Znovupoužitelný doplňující obsah odkazovaný z `items.note_id`.

- `name` je povinný a globálně unikátní, `note` je povinný obsah.
- `sort_order` je volitelný; neprázdná hodnota začíná od 1 a je globálně unikátní.
- Jednu poznámku lze připojit k více položkám. Nevytvářejte duplicitní poznámky jen kvůli jinému itemu.
- Pokud obsahuje HTML, držte se podporované jednoduché struktury a ověřte vzhled v obou barevných režimech a na úzké obrazovce.

## Výslovnost

### `pronunciation_groups`

Pojmenovaná skupina pro porovnání nebo procvičení výslovnosti.

- `name` a `sort_order` jsou povinné a globálně unikátní; pořadí začíná od 1.
- `note` vysvětluje společný zvuk nebo kontrast skupiny.
- Skupina má být pedagogicky soudržná. Počet členů není uložen zde, ale vzniká přes vazební tabulku.

### `pronunciation_group_items`

Explicitní uspořádání položek ve výslovnostní skupině.

- Primární klíč je `(pronunciation_group_id, item_id)`.
- `sort_order` začíná od 1 a je unikátní v rámci skupiny.
- Zařazujte položky s anglickou výslovností a funkčním audiem; bez audia nelze řádek smysluplně přehrát.
- Pořadí volte tak, aby vedle sebe byly nejlépe porovnatelné kontrasty, ne automaticky podle ID položek.

## Uživatelská a provozní data

### `users`

Profil navázaný 1:1 na `auth.users`; vytváří jej databázový trigger. `history_enabled` řídí ukládání historie. Ručně nevkládejte uživatele bez odpovídajícího účtu v `auth.users`.

### `user_items`

Aktuální stav procvičování položky pro uživatele. Primární klíč je `(user_id, item_id)`.

- Hodnoty postupu, termíny dalšího opakování a mastery spravuje aplikace.
- `started_at` znamená, že uživatel položku někdy započal. Reset nastaví postup a plánování znovu, ale původní `started_at` zachová.
- `has_pronunciation_practice` smí být aktivní jen pro slovní zásobu s audiem; server tuto podmínku při synchronizaci znovu ověřuje.
- Produkční řádky neupravujte ručně, pokud nejde o cílenou opravu stavu konkrétního uživatele.

### `user_items_history`

Volitelná historie výsledků procvičování. Jeden záznam popisuje `direction` (`czToEn`, `enToCz`, případně starší `legacy`) a `outcome` (`correct`, `incorrect`, `skip`, případně `legacy`) v konkrétním čase. Data zapisuje synchronizační vrstva pouze podle nastavení uživatele.

### `user_scores`

Denní agregace počtu procvičených položek. Primární klíč je `(user_id, date)`, `item_count` nesmí být záporný. Jde o odvozený uživatelský stav, ne o ručně spravovaný katalog.

### `private.settings`

Interní konfigurační hodnoty ve formátu JSONB.

- `key` je globálně unikátní a má být stabilní.
- Hodnota musí zachovat typ a strukturu očekávanou funkcemi, které klíč čtou.
- Tabulka není obsahový katalog a není určena klientskému přímému zápisu. Změny dělejte přes zkontrolovaný seed nebo migraci.

## Doporučený postup změny katalogu

1. Připravte změnu nad aktuálním schématem a rozhodněte, zda jde o nový insert, update, přeřazení, nebo soft delete.
2. Pro položky připravte a zkontrolujte český a anglický text, IPA, audio, lekci, pořadí a všechny volitelné vazby.
3. Vložte nejprve nadřazené řádky a potom závislé řádky; vazební tabulky až nakonec.
4. Zkontrolujte duplicity jmen, kolize `sort_order`, chybějící cizí klíče a soubory uvedené v `items.audio`.
5. Promítněte produkční změnu do příslušných seedů, pokud má přežít lokální `supabase db reset`.
6. Proveďte plnou synchronizaci testovacího uživatele a ověřte pořadí, odemykání, přehrání audia, nápovědu i reset.
