# Farvel, skærm

Bog af Simon Moe, skrevet direkte på sitet: https://farvelskaerm.web.app

Alle kan læse. Log ind med Google (simmoe@gmail.com), så kan titel, kapitler og tekst rettes direkte på siden. Ændringer gemmes automatisk i Firestore.

## Redigering

- Klik i teksten og skriv
- Værktøjslinjen øverst til højre: brødtekst, afsnitsoverskrift, citat, fed, kursiv, lister
- ⌘⌥3 afsnitsoverskrift · ⌘⌥0 brødtekst · ⌘⌥9 citat · ⌘B fed · ⌘I kursiv
- Indsat tekst bliver ren tekst; tomme linjer bliver nye afsnit
- Under hver kapiteltitel: flyt op, flyt ned, slet. Nederst: nyt kapitel
- Indholdsfortegnelsen bygges af kapiteltitler og afsnitsoverskrifter

## Teknik

- SvelteKit 3, Svelte 5, Vite 8, Tailwind 4, adapter-static (SPA)
- Firebase 13, projekt `p5-firebase-eebc1` (delt med andre sites)
- Firestore: `farvelskaerm_book/meta` (titel, undertitel, forfatter, indledning) og `farvelskaerm_chapters/{id}` (`order`, `title`, `html`)
- Hosting-site `farvelskaerm`

```bash
npm install
npm run dev      # http://localhost:5181
npm run deploy   # build + firebase hosting (kræver at HEAD er pushet)
```

## Firestore-regler

Rulesettet er delt med andre sites. Hent live (`npm run rules:fetch`), flet blokken nedenfor ind, og deploy kun den flettede fil.

```
match /farvelskaerm_book/{doc} {
  allow read: if true;
  allow write: if request.auth != null
    && request.auth.token.email == 'simmoe@gmail.com'
    && request.auth.token.email_verified == true;
}
match /farvelskaerm_chapters/{doc} {
  allow read: if true;
  allow write: if request.auth != null
    && request.auth.token.email == 'simmoe@gmail.com'
    && request.auth.token.email_verified == true;
}
```
