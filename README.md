# Copa na żywo

Zakładka-skrypt (bookmarklet) dla trenerów Copacabany na XXII Mistrzostwa Polski BJJ (MartialMatch, wydarzenie 1012).

Uruchomiona na stronie martialmatch.com pokazuje zawodników Copacabany na żywo: godzinę i matę najbliższej walki, liczbę walk przed zawodnikiem, rywala i dotychczasowe wyniki. Dane są pobierane z MartialMatch w chwili użycia – repozytorium nie zawiera żadnych danych zawodników.

Kod zakładki:

```
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/Suchert/copa-live@main/copa-live.min.js?t='+Date.now();document.body.appendChild(s)})()
```

- `copa-live.js` – kod źródłowy
- `copa-live.min.js` – wersja zminifikowana, ładowana przez zakładkę
