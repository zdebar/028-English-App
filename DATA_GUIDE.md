# Průvodce datovým modelem a přípravou obsahu

Tento dokument popisuje aktuální databázový model. Datové tabulky jsou definované v **supabase/schemas/00_tables.sql**; lokální IndexedDB schéma je v **frontend/src/database/models/app-db.ts**.

## Základní principy

- Lekce a jejich položky tvoří výukový plán: **levels → lessons → items**.
- Témata, gramatika, zvukové skupiny a výslovnostní kontrasty používají společný model **groups**, **group_items** a **group_relations**.
- Synchronizace je průběžná podle časových značek jednotlivých tabulek. Plný sync režim se nepoužívá.
- **deleted_at** je tombstone pro sdílený obsah. Uživatelské záznamy se nemažou soft-delete způsobem; při odstranění účtu se smažou.
- Příprava CSV a audia v **scripts/** sama obsah do Supabase neimportuje.

## Tabulky sdíleného obsahu

| Tabulka | Účel |
| --- | --- |
| levels | Seřazené úrovně kurzu. |
| lessons | Lekce přiřazené k úrovni; volitelné group_id propojuje lekci s gramatickým kontextem. |
| items | Česko-anglické položky lekcí, jejich pořadí, výslovnost, audio a volitelná poznámka. |
| notes | HTML poznámky přiřazované přes items.note_id. |
| groups | Skupiny typu topic, grammar, sound nebo pronunciation. |
| group_items | Seřazené příklady propojené se skupinou. |
| group_relations | Hierarchie, gramatický detail nebo kontrast výslovnosti. |

Platné vztahy jsou omezené databázovou validací: grammar → grammar používá hierarchy/detail, topic → topic používá hierarchy a pronunciation → sound používá contrast. Zvukové skupiny mají sound_class a sound_category.

## Uživatelská data

| Tabulka | Účel |
| --- | --- |
| users | Lokální záznam účtu navázaný na Supabase Auth. |
| user_items | Postup a plán opakování uživatele pro položky. |
| user_lessons | Historie zahájení lekcí podle času. |

Postup v user_items je oddělený pro směr čeština → angličtina a angličtina → čeština. Reset postupu aktualizuje uživatelský záznam; odstranění účtu maže jeho uživatelská data.

## IndexedDB

Frontend používá místní tabulky levels, lessons, notes, groups, group_items, group_relations, user_items, user_lessons, audio_records, audio_metadata a metadata.

Není zde samostatná tabulka items: model UserItem obsahuje potřebná data položky spolu s uživatelským postupem. Tabulka metadata uchovává sync kurzory. Audio Bloby a metadata audio archivů zůstávají mimo centrální správu aplikačních dat.

## Příprava CSV

Příkazy pro přípravu položek a zvuku jsou popsané v [scripts/README.md](scripts/README.md). Skripty pracují s mezisoubory v **scripts/data/prepare/**, zpracují CSV a připraví audio. Neprovádějí import do databáze.

Při úpravě obsahu zachovej aktuální pole položky, jejich vazbu na lekci a pořadí. Zařazení do témat, gramatických skupin, zvuků a výslovnostních skupin patří do skupinového modelu; nepoužívej historické sloupce block_id, topic_id ani grammar_chunk_id.

Seed SQL pro lokální reset je v **supabase/seeds/** a jeho pořadí určuje **supabase/config.toml**. Staré názvy tabulek mohou zůstat v historických migracích, Dexie upgradu nebo jednorázovém legacy importu; nepatří do nových datových změn.
