# Průvodce tvorbou dat

Tento dokument popisuje strukturu jazykových dat a postup jejich importu do databáze.

## Zásady

Všechny datové tabulky obsahuje columm deleted_at. Pokud chcete smazat datový řádek, nastavte delete_at na aktuální čas. Během synchronizace dojde k vymazání i ve IndexedDB frontendu.

## Přehled tabulek

Jednotlivé tabulky jsou řazeny dle pořadí importu:

`lessons` - každá lekce vysvětluje pouze jeden drobný gramatický jev
`grammar_groups` - větší skupiny gramatiky, sdružují grammar_chunks, v Přehledu gramatiky se zobrazují celé grammar_groups
`grammar_chunks` - malé sousto gramatiky,
`blocks` - sdružuje položky do výukových bloků
`notes` - doplňující poznámky k položkám; např. vysvětlení použití daného slovíčka v angličtině
`items` - jednotlivé položky učení; slovíčka, věty
`grammar_chunks_examples` - typické položky pro dané grammar_chunks, např. všechny osoby slovesa be
`pronunciation_groups` - sdružuje položky s podobnou výslovnosti, např. bad, bed
`pronunciation_groups_items` - spojovací tabulka

Tabulky, které nevyžadují jazyková data:

`levels` - CEFR kategorie, A1 až C2
`user` - seznam uživatelů
`user_blocks` - spojovací tabulka, zaznamenává odemčení bloků položek
`user_items` - spojovací tabulka, zaznamenává pokrok procvičování položek
`user_items_history` - zaznamenává historii procvičování položek, jen u user s explicitně povolenou funkcí
`user_scores` - zaznamenává počet procvičování v jednotlivé dny, čistě počet opakováí


## Tabulky

### `lessons`

- `name` - unikátní název lekce
- `note` - nepovinná poznámka
- `sort_order` - unikátní vrámci levels, vyžadovaný

### `grammar_groups`

- `name` a `sort_order` - povinné a globálně unikátní
- `note` - nepovinné, úvod k celé skupině

### `grammar_chunks`

- `name` je povinný a unikátní v rámci `grammar_group_id`
- `sort_order` je povinný, začíná od 1 a je unikátní v rámci `grammar_group_id`
- `note` - nepovinné, obsahuje vysvětlení
- `grammar_group_id` - povinné, připojuje chunk ke skupině zobrazované v Přehledu gramatiky
- Přehled gramatiky zobrazí skupinu po zahájení alespoň jednoho jejího chunku a uvnitř skupiny ukáže pouze zahájené chunky.

### `blocks`

- `name` - povinný, globálně unikátní.
- `sort_order` - nepovinný, neprázdná hodnota začíná od 1 a je globálně unikátní. Bloky bez pořadí aplikace řadí až za uspořádané bloky.
- `show_in_topics` - určuje, zda se blok může zobrazovat v přehledu témat, true pro bloky slovíček, false pro gramatické bloky
- `is_removed_from_practice` - vyřadí položky bloku z hlavního procvičování, např. pro výslovnost hlásek
- `requires_initial_training` - vynutí úvodní výukový průchod před pokračováním v osnově. Nesmí být současně `true` s `is_removed_from_practice`.
- `grammar_chunk_id`  - připojuje gramatiku vysvětlovanou v úvodním tréninku bloku. Samotný obsah tabulky gramatických příkladů tím definován není. not null pro gramatické bloky
- Každý blok s počátečním tréninkem musí mít smysluplnou sadu položek přes `items.block_id`; úvodní obrazovka představí všechny položky tohoto bloku.

### `notes`

Znovupoužitelný doplňující obsah odkazovaný z `items.note_id`.

- `name` - povinný a globálně unikátní
- `note` - povinný, obsahuje poznámk
- `sort_order` - nepovinný; neprázdná hodnota začíná od 1 a je globálně unikátní.
- Jednu poznámku lze připojit k více položkám. Nevytvářejte duplicitní poznámky jen kvůli jinému itemu.

### `items`

Jednotlivé dvojice čeština–angličtina. Jedna položka je zdrojem pro procvičování, témata, gramatické příklady i výslovnostní skupiny.

- `czech`, `english`, `lesson_id`, `is_vocabulary` a `sort_order` jsou povinné.
- `sort_order` - celé číslo od 0, unikátní v rámci `lesson_id`. Určuje pořadí položek v lekci a spolu s pořadím levelu a lekce také pořadí v procvičování.
- `pronunciation` - nepovinné, výslovnost anglického textu
- `audio` - obsahuje přesný název odpovídajícího `.opus` souboru. Soubor musí být součástí audio distribuce; při změně nahrávky je vhodné změnit i název kvůli cache klientů. Běžně název souboru má obsahovat datetimestamp např. goodbye_20260802T132147Z.opus
- `block_id` - nepovinný
- `grammar_chunk_id` - nepovinný, pouze pro zobrazení kontextové grammatiky, neurčuje zobrazení položky v grammatickém přehledu
- `note_id` - nepovinný, připojuje doplňující poznámku k položce
- `is_vocabulary = true` - rozlišuje slovíčka od gramatických vět, slovíčka se objeví v přehledu slovíček

- Zdrojová CSV lze připravovat přes `scripts/prepare_words.py` ; podrobný postup je v `scripts/README.md`.

### `grammar_chunk_examples`

Explicitní, seřazený výběr položek zobrazovaných pod gramatickým chunkem.

- Primární klíč je `(grammar_chunk_id, item_id)`: stejnou položku lze v jednom chunku uvést jen jednou, ale může být příkladem více chunků.
- `sort_order` začíná od 1 a je unikátní v rámci `grammar_chunk_id`.
- Zařazujte pouze základní příklady, které dohromady dávají dostatečný kontext pravidla. Není nutné ani žádoucí automaticky zahrnout všechny položky s odpovídajícím `items.grammar_chunk_id`.
- Příklad musí mít správné `czech`, `english`, `pronunciation` a `audio`, protože řádek je v přehledu přehratelný.
- Příklady se v gramatickém přehledu i na kartě nápovědy zobrazují všechny; nejde o uživatelský stav ani o seznam odvozený z `started_at`.

### `pronunciation_groups`

Pojmenovaná skupina pro porovnání nebo procvičení výslovnosti.

- `name` a `sort_order` jsou povinné a globálně unikátní; pořadí začíná od 1.
- `note` vysvětluje společný zvuk nebo kontrast skupiny.
- Skupina má být pedagogicky soudržná. Počet členů není uložen zde, ale vzniká přes vazební tabulku.

### `pronunciation_group_items`

Explicitní uspořádání položek ve výslovnostní skupině.

- Primární klíč je `(pronunciation_group_id, item_id)`.
- `contrast_set` je číslo kontrastní podskupiny v rámci jedné skupiny. Stejné číslo přiřaďte položkám, které musí být započaté společně, například `mat`–`met`.
- `contrast_set = NULL` znamená dosud nezařazenou katalogovou položku. Taková položka skupinu neodemkne a v přehledu ani detailu se nezobrazí.
- Skupina se odemkne po kompletním započetí alespoň jedné podskupiny; aplikace následně zobrazuje pouze položky z kompletních podskupin.
- `sort_order` začíná od 1 a je unikátní v rámci skupiny.
- Zařazujte položky s anglickou výslovností a funkčním audiem; bez audia nelze řádek smysluplně přehrát.
- Pořadí volte tak, aby vedle sebe byly nejlépe porovnatelné kontrasty, ne automaticky podle ID položek.

### `user_blocks`

Uživatelský stav bloků. Nevytvářejte jej jako obsahový seed.

- Primární klíč tvoří `(block_id, user_id)`.
- `started_at` eviduje první započetí bloku. Reset postupu jej nemaže.
- Řádky spravuje aplikace a synchronizační RPC; ruční zásah je pouze servisní operace pro konkrétního uživatele.
