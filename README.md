# Copa na żywo

Zakładka-skrypt (bookmarklet) dla trenerów Copacabany na XXII Mistrzostwa Polski BJJ (MartialMatch, wydarzenie 1012).

Uruchomiona na stronie martialmatch.com pokazuje zawodników Copacabany na żywo: godzinę i matę najbliższej walki, liczbę walk przed zawodnikiem, rywala i dotychczasowe wyniki. Dane są pobierane z MartialMatch w chwili użycia – repozytorium nie zawiera żadnych danych zawodników.

Kod zakładki:

```
javascript:(function(){var d=document,v='09ef020865f3d424ebd962a1eb4477e4f4b82b7b',u='/copa-live.min.js',s=d.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Suchert/copa-live@'+v+u;s.onerror=function(){var t=d.createElement('script');t.src='https://rawcdn.githack.com/Suchert/copa-live/'+v+u;d.body.appendChild(t)};d.body.appendChild(s)})()
```

- `copa-live.js` – kod źródłowy
- `copa-live.min.js` – wersja zminifikowana, ładowana przez zakładkę (jsDelivr, zapasowo rawcdn.githack.com; zakładka wskazuje konkretny, przetestowany commit)

Najbliższe walki pochodzą z kolejki walk MartialMatch (tylko walki nierozegrane), a wyniki i miejsca z drabinek – pobieranych oszczędnie ze względu na limit zapytań serwisu.
