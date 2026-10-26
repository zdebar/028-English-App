# eSpeak NG: IPA pro americkou angličtinu (`en-us`)

**Ověřeno dne:** 2026-10-26  
**Ověřená lokální verze:** eSpeak NG 1.52.0  
**Použitý příkaz:** `espeak-ng -q --ipa -v en-us <slovo>`

## Jak eSpeak tvoří přepis

Příprava slov v projektu předává anglický text do eSpeak NG s hlasem `en-us`
a přepínačem `--ipa`. eSpeak vybere výslovnost podle svého anglického slovníku
a pravidel pro převod písmen na hlásky a zapíše ji pomocí IPA znaků v Unicode.
Přepis obsahuje zvolenou výslovnost konkrétního slova, nikoli jen seznam jeho
základních fonémů.

Holé `--ipa` používá standardní IPA výstup. eSpeak NG také nabízí varianty
`--ipa=1`, `--ipa=2` a `--ipa=3`, které mění způsob oddělení nebo spojení
víceznakových hlásek. Příznak `-q` potlačí zvukový výstup; textový přepis
zůstává na standardním výstupu.

Hlas `en-us` je v dokumentaci eSpeak NG označen jako **General American**.
Anglické samohlásky jsou popsány pomocí lexikálních sad Johna Wellse. Ty
pojmenovávají skupiny slov se stejným typem samohlásky, například KIT (*sit*),
FLEECE (*see*) nebo NURSE (*bird*).

Zdroje: [transkripční režimy eSpeak NG](https://github.com/espeak-ng/espeak-ng/blob/master/docs/phonemes.md),
[dokumentace anglických přízvuků a samohláskových sad](https://github.com/espeak-ng/espeak-ng/blob/master/docs/languages/gmw/en.md),
[definice fonémů pro americkou angličtinu](https://github.com/espeak-ng/espeak-ng/blob/master/phsource/ph_english_us)
a [pravidla anglického slovníku](https://github.com/espeak-ng/espeak-ng/blob/master/docs/dictionary.md).

## Hlavní souhlásky

Základní souhláskové fonémy General American lze zapsat takto:

| Skupina | IPA |
| --- | --- |
| Závěrové | `p b t d k ɡ` |
| Afrikáty | `tʃ dʒ` |
| Frikativy | `f v θ ð s z ʃ ʒ h` |
| Nazály | `m n ŋ` |
| Aproximanty a likvidy | `l ɹ j w` |

To je **24 základních souhláskových fonémů**. Výslovnost /t/ se v některých
pozicích mění na krátký alveolární flap `ɾ`, například v *city* nebo *water*.
Je to kontextová výslovnostní varianta, ne další základní souhláskový foném.
Pravidla eSpeak NG pro americkou angličtinu ji zapisují přímo jako `ɾ`.

## Samohláskové sady

V následujícím přehledu jsou IPA podoby doložené dokumentací General American
a běžné příklady:

| Lexikální sada | Příklad | IPA v dokumentaci GenAm |
| --- | --- | --- |
| KIT | *sit* | `ɪ` |
| DRESS | *bed* | `ɛ` |
| TRAP | *bad* | `æ` |
| LOT | *hot* | `ɑ` |
| STRUT | *cup* | `ʌ` |
| FOOT | *book* | `ʊ` |
| FLEECE | *see* | `i` |
| PALM | *father* | `ɑ` |
| THOUGHT | *thought* | `ɔ` |
| GOOSE | *food* | `u` |
| NURSE / BIRD | *bird* | `ɝ` |
| LETTER | *teacher* | `ɚ` |
| COMMA | *about* | `ə` |
| FACE | *day* | `eɪ` |
| PRICE | *my* | `aɪ` |
| CHOICE | *boy* | `ɔɪ` |
| MOUTH | *now* | `aʊ` |
| GOAT | *go* | `oʊ` |

Samohláskový systém se může lišit podle mluvčího a regionu. Například /ɔ/ ve
slovech jako *thought* splývá u mluvčích s *cot–caught merger* s /ɑ/.

## Značky a další hlásky ve výstupu

| Znak | Význam | Ukázka z lokální verze 1.52.0 |
| --- | --- | --- |
| `ˈ` | Hlavní přízvuk následující slabiky | *see* → `sˈiː` |
| `ˌ` | Vedlejší přízvuk | Může se objevit u víceslabičných slov |
| `ː` | Délka samohlásky | *food* → `fˈuːd` |
| `ɾ` | Krátký flap místo /t/ v některých pozicích | *city* → `sˈɪɾi` |
| `ɚ` | Nepřízvučná r-zabarvená samohláska | *teacher* → `tˈiːtʃɚ` |
| `ɐ` | Redukovaná samohláska | *about* → `ɐbˈaʊt` |
| `ʔ` | Ráz, tedy glotální závěr | *button* → `bˈʌʔn̩` |
| `◌̩` | Značka slabičné souhlásky | *button* → koncové `n̩` |

Při přímém ověření lokální verze 1.52.0 vyšly například tyto přepisy:

| Slovo | Výstup `--ipa -v en-us` |
| --- | --- |
| *see* | `sˈiː` |
| *chair* | `tʃˈɛɹ` |
| *water* | `wˈɔːɾɚ` |
| *about* | `ɐbˈaʊt` |
| *button* | `bˈʌʔn̩` |

Přesný výstup závisí na verzi eSpeak NG a jejím slovníku. Verze 1.52.0
například pro *bird* vrací `bˈɜːd`. Pro ověření konkrétní instalace spusťte
`espeak-ng --version` a následně příkaz uvedený výše.

## Použití v projektu

Funkce `fill_pronunciation_espeak_ng` v `scripts/utils/pronunciation.py`
spouští eSpeak NG s argumenty `-q --ipa -v en-us`, odstraní čárky ze vstupu
a uloží oříznutý text standardního výstupu do sloupce `pronunciation`.
Příprava slov používá tuto funkci v `scripts/prepare_words.py`.

Ověřený příkaz v PowerShellu:

```powershell
& 'C:\Program Files\eSpeak NG\espeak-ng.exe' -q --ipa -v en-us water
```

Projekt verzi eSpeak NG v Python závislostech neuzamyká. Uvedené datum a
konkrétní ukázky proto popisují lokální verzi ověřenou dne 2026-10-26.
