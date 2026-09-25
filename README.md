# Price Monitor — frontend

Interfejs aplikacji do monitorowania cen produktów. Pozwala wyszukiwać produkty, przeglądać historię cen, ustawiać alerty i odbierać powiadomienia. Korzysta z backendu z osobnego repozytorium [**Price Monitor**](https://github.com/jakubstraszak99-sudo/Price-Monitor).

## Funkcjonalności

- Lista produktów z wyszukiwaniem, sortowaniem i paginacją.
- Dodawanie produktu do monitorowania na podstawie linku do sklepu.
- Szczegóły produktu, wykres historii cen oraz cena minimalna i maksymalna.
- Lista własnych alertów: edycja ceny docelowej, włączanie, wyłączanie i usuwanie.
- Rejestracja, logowanie, weryfikacja e-mail oraz odzyskiwanie hasła.
- Menu ustawień: przełącznik alertów e-mail i modal zmiany hasła.
- Powiadomienia pod dzwonkiem, odczyt i usuwanie pojedynczo lub zbiorczo, aktualizacje przez WebSocket.
- Informacja o usunięciu monitorowanego produktu, którego strona już nie istnieje.
- Wersje językowe polska i angielska, z zapamiętywaniem wybranego języka.

Logowanie przez Google nie jest częścią obecnej wersji.

## Technologie i wymagania

| Element | Wersja / zastosowanie |
| --- | --- |
| Angular | 22.1, komponenty standalone, signals i lazy loading widoków |
| TypeScript | 6.0 |
| RxJS | 7.8 |
| ngx-translate | 18, tłumaczenia JSON |
| STOMP | Połączenie WebSocket z backendem |
| OpenAPI Generator | Generowanie klienta HTTP i modeli TypeScript |

Do lokalnej pracy można użyć **Node.js 24.20.0** oraz **npm 11.19.0**; wersja npm jest wskazana w `package.json`. Zainstalowany Angular CLI deklaruje obsługę Node `^22.22.3 || ^24.15.0 || >=26.0.0`. Dokładne wersje zależności zapisuje `package-lock.json`.

Generator klienta API wymaga Javy dostępnej w `PATH`; można używać tego samego JDK 25 co dla backendu. Do pełnego działania aplikacji potrzebny jest uruchomiony backend z PostgreSQL, Redis, Kafką, przeglądarką dla scrapera i skonfigurowaną pocztą.

## Szybki start

W katalogu repozytorium:

```bash
npm ci
npm run generate-api
npm start
```

Otwórz `http://localhost:4200`. Serwer developerski domyślnie używa konfiguracji `development` i automatycznie przeładowuje aplikację po zmianie plików.

**Generowanie API jest wymagane po świeżym sklonowaniu repozytorium.** Katalog `src/app/api-client` jest ignorowany przez Git, poza plikiem reguł generatora. Bez wygenerowanych plików kompilacja zgłosi brak importów. Do generowania z dołączonego `api-docs.yaml` backend nie musi być uruchomiony; pierwsze użycie generatora może wymagać pobrania pliku JAR z sieci.

Przed korzystaniem z konta i produktów uruchom backend pod `http://localhost:8080`. Zarejestruj konto i otwórz otrzymany link weryfikacyjny. Sam frontend nie wysyła e-maili ani nie pobiera danych ze sklepów.

## Konfiguracja połączenia

| Plik | Zastosowanie |
| --- | --- |
| [environment.development.ts](src/environments/environment.development.ts) | Używany przez `npm start` i build developerski |
| [environment.ts](src/environments/environment.ts) | Używany przez domyślny build produkcyjny |
| [angular.json](angular.json) | Konfiguracje budowania, zamiana plików środowiska i limity rozmiaru |

`apiUrl` jest adresem bazowym backendu, bez końcowego `/` i bez dopisanego `/api/v1`. Trafia do klienta REST i służy do wyliczenia adresu WebSocket: `http` zmienia się w `ws`, a `https` w `wss`, z końcówką `/ws`.

Po stronie backendu `PM_CLIENT_URL` (ustawienie `app.client-url`) musi odpowiadać adresowi frontendu. Lokalnie trzymaj się `localhost` dla obu aplikacji. Zmiana na `127.0.0.1`, inny protokół lub inną domenę wymaga odpowiednich ustawień pochodzenia i ciasteczek.

## Klient API i synchronizacja kontraktu

Źródłem modeli i metod HTTP jest [api-docs.yaml](api-docs.yaml). Aby pobrać aktualny kontrakt z działającego backendu i odtworzyć klienta:

```bash
curl --fail http://localhost:8080/v3/api-docs.yaml -o api-docs.yaml
npm run generate-api
```

Polecenie `curl` zastępuje lokalny kontrakt — pobieraj go z backendu odpowiadającego rozwijanej wersji frontendu. Zmianę `api-docs.yaml` zapisuj razem z kodem, który jej używa. Wersję generatora ustala `openapitools.json` (obecnie 7.25.0).

Nie wprowadzaj trwałych poprawek ręcznie w `src/app/api-client`: zostaną nadpisane. Reguły pomijania plików są w `src/app/api-client/.openapi-generator-ignore`. Jeżeli generator zgłosi brak wskazanego w skrypcie głównego `.openapi-generator-ignore`, można uruchomić go bezpośrednio z istniejącym plikiem:

```bash
npm exec -- openapi-generator-cli generate -i api-docs.yaml -g typescript-angular -o src/app/api-client --ignore-file-override=src/app/api-client/.openapi-generator-ignore --additional-properties=fileNaming=kebab-case,providedIn=root
```

## Widoki i komunikacja z backendem

| Adres | Widok |
| --- | --- |
| `/` | Przekierowanie do `/home` |
| `/home` | Lista produktów |
| `/my-alerts` | Alerty zalogowanego użytkownika; chronione przez guard |
| `/verify?token=...` | Weryfikacja konta z linku e-mail |
| `/reset-password?token=...` | Ustawienie nowego hasła z linku e-mail |

Logowanie, rejestracja, odzyskiwanie hasła, zmiana hasła, dodawanie produktu i szczegóły produktu są obsługiwane przez modale. Powiadomienia i ustawienia rozwijają się z paska nawigacji.

Backend przechowuje tokeny w ciasteczkach `HttpOnly`. Interceptor dołącza `withCredentials`; frontend nie odczytuje tokenów i nie przechowuje ich w `localStorage`. Przy starcie aplikacji `SessionService` próbuje odświeżyć sesję i pobrać użytkownika. Brak aktywnej sesji oznacza tryb niezalogowany; odpowiedź 401 przy początkowym odświeżaniu może być wtedy oczekiwana. Obecny interceptor nie ponawia automatycznie dowolnego żądania po 401.

Powiadomienia na żywo korzystają z `/user/queue/notifications`. Powiadomienie o usuniętym produkcie ma `product: null` i zachowaną nazwę w `productName`, dlatego jego odczyt nie otwiera szczegółów usuniętego produktu.

## Praca nad kodem

| Katalog | Zawartość |
| --- | --- |
| `src/app/components` | Widoki, formularze, modale i wspólne komponenty UI |
| `src/app/services` | Sesja, modale, powiadomienia, język i WebSocket |
| `src/app/api-client` | Wygenerowany klient API; nieedytowany ręcznie |
| `src/app/utils` | Paginacja list, walidacja formularzy i obsługa pól cenowych |
| `src/app/shared` | Wspólne typy, kody błędów i adresy tras |
| `src/app/guards` | Ochrona tras |
| `src/assets/langs` | Tłumaczenia `pl.json` i `en.json` |
| `src/environments` | Adres API i ustawienia środowiska |
| `src/styles.css` | Style globalne |

Dodając tekst widoczny dla użytkownika, uzupełnij oba pliki tłumaczeń. W formularzach korzystaj ze wspólnych funkcji w `utils`, a dla kolejnych list z `createPagedList`, które obsługuje m.in. paginację oraz anulowanie nieaktualnych zapytań.

## Polecenia

| Polecenie | Działanie |
| --- | --- |
| `npm ci` | Instalacja zależności zgodnie z lockfile |
| `npm start` | Serwer developerski na porcie 4200 |
| `npm run generate-api` | Generowanie klienta z lokalnego kontraktu |
| `npm run build` | Build produkcyjny |
| `npm run build -- --configuration development` | Build developerski |

Przed oddaniem zmian zbuduj aplikację i sprawdź scenariusze, których dotyczą: formularz i błędy walidacji, wyszukiwanie i paginację, zapis ustawień albo pojawienie się powiadomienia. Zmiany integracji sprawdzaj z odpowiadającą im wersją backendu.

## Build i hosting

```bash
npm run build
```

Pliki do hostowania znajdują się w `dist/price-monitor-web/browser`. Produkcyjny `environment.ts` korzysta z bieżącej domeny, a API i WebSocket obsługuje reverse proxy. Build produkcyjny włącza optymalizację i wyłącza mapy źródłowe.

Gotowy przykład HTTPS i proxy: [deploy/nginx.conf.example](deploy/nginx.conf.example).

1. Przygotuj domenę i certyfikat TLS.
2. Skopiuj zawartość `dist/price-monitor-web/browser/` do `/srv/price-monitor-web/browser/` albo zmień `root` w konfiguracji.
3. Zastąp `monitor.example.com` swoją domeną i ustaw ścieżki certyfikatu. Jeśli backend ma inny adres, zmień oba wpisy `proxy_pass`.
4. Umieść konfigurację w katalogu stron Nginx, w kontekście `http`. Sprawdź ją przez `nginx -t` i przeładuj usługę zgodnie z konfiguracją serwera.
5. Uruchom backend z `PM_PROFILE=prod` oraz `PM_CLIENT_URL=https://twoja-domena`. Domyślnie backend nasłuchuje na `127.0.0.1:8080`.

Proxy zachowuje ścieżki API, przekazuje WebSocket przez `/ws`, przekierowuje HTTP na HTTPS i obsługuje trasy Angulara. Ciasteczka backendu w profilu `prod` mają flagę `Secure`, dlatego ten wariant wymaga HTTPS. Przykład zakłada Nginx i backend na jednym serwerze; kontenery wymagają zmiany adresu upstream.

Hosting statyczny musi przekierowywać nieznane ścieżki aplikacji do `index.html`, aby bezpośrednie wejście na `/my-alerts`, `/verify` i `/reset-password` działało. Przykład reguły Nginx dla plików frontendu:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Dołączony przykład Nginx zawiera osobne reguły dla API i WebSocket. Backend musi dopuszczać docelowe pochodzenie frontendu oraz mieć odpowiednią konfigurację ciasteczek. Przy HTTPS frontend wymaga API po HTTPS i połączenia WSS; adres HTTP zostałby zablokowany jako mixed content. Obecne ciasteczka backendu mają `SameSite=Strict`, co należy uwzględnić przy rozmieszczeniu aplikacji na domenach.

Style odwołują się do Google Fonts. Build produkcyjny pobiera fonty przy optymalizacji, więc potrzebuje dostępu do `fonts.googleapis.com` i powiązanych zasobów. Nie umieszczaj sekretów w plikach środowiska frontendu — są częścią publicznego JavaScriptu.

## Typowe problemy

| Objaw | Co sprawdzić |
| --- | --- |
| Brak modułu `api-client` lub modelu API | Wykonaj `npm run generate-api`; po zmianie backendu odśwież kontrakt |
| Generator nie startuje | `java -version`, `PATH`/`JAVA_HOME`, dostęp do sieci przy pobieraniu generatora |
| Błąd wersji Node | Użyj wersji zgodnej z wymaganiami Angular CLI |
| CORS, brak sesji lub HTTP 401 | Uruchomienie backendu, `apiUrl`, `PM_CLIENT_URL`, weryfikację konta i ciasteczka |
| Brak powiadomień na żywo | Sesję użytkownika, połączenie `/ws` i obsługę WebSocket przez proxy |
| Nowe powiadomienie nie ma nazwy produktu | Zgodność backendu, `api-docs.yaml` i wygenerowanego pola `productName` |
| Bezpośredni link do podstrony daje 404 | Konfigurację przekierowania hostingu do `index.html` |
| Build nie pobiera fontów | Dostęp sieciowy, DNS i komunikat o inlinowaniu Google Fonts |
| Ostrzeżenia o CSS lub STOMP podczas builda | Obecny CSS listy alertów przekracza próg ostrzegawczy 4 kB; STOMP zgłasza ostrzeżenie CommonJS. Same ostrzeżenia nie oznaczają nieudanego builda |

### Ochrona CSRF

Backend wymaga nagłówka `X-XSRF-TOKEN` zgodnego z ciasteczkiem `XSRF-TOKEN` dla żądań POST, PUT, PATCH i DELETE, także przed zalogowaniem. Publiczny `GET /api/v1/auth/csrf` inicjalizuje ciasteczko; odpowiedzi nie należy buforować. Angular pobiera je automatycznie, jeśli go brakuje, i dodaje nagłówek tylko do API aplikacji. Po zalogowaniu, weryfikacji konta i wylogowaniu backend wymienia token.

Ciasteczko CSRF jest celowo dostępne dla JavaScript; ciasteczka JWT pozostają HttpOnly. W produkcji mają flagę Secure. Frontend i API powinny działać pod wspólną domeną przez reverse proxy; lokalnie używaj `localhost` dla obu aplikacji (nie mieszaj z `127.0.0.1`). Klienci inni niż przeglądarka również muszą zachowywać ciasteczka i przesyłać nagłówek CSRF.
