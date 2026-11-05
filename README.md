# Copa na żywo

Zakładka-skrypt (bookmarklet) dla trenerów Copacabany na XXII Mistrzostwa Polski BJJ (MartialMatch, wydarzenie 1012).

Uruchomiona na stronie martialmatch.com pokazuje zawodników Copacabany na żywo: godzinę i matę najbliższej walki, liczbę walk przed zawodnikiem, rywala i dotychczasowe wyniki. Dane są pobierane z MartialMatch w chwili użycia – repozytorium nie zawiera żadnych danych zawodników.

Kod zakładki:

```
javascript:(function(){var d=document,u='/copa-live.min.js?t='+Date.now(),s=d.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Suchert/copa-live@main'+u;s.onerror=function(){var t=d.createElement('script');t.src='https://raw.githack.com/Suchert/copa-live/main'+u;d.body.appendChild(t)};d.body.appendChild(s)})()
```

- `copa-live.js` – kod źródłowy
- `copa-live.min.js` – wersja zminifikowana, ładowana przez zakładkę (jsDelivr, zapasowo raw.githack.com)

Najbliższe walki pochodzą z kolejki walk MartialMatch (tylko walki nierozegrane), a wyniki i miejsca z drabinek – pobieranych oszczędnie ze względu na limit zapytań serwisu.
