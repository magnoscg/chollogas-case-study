# Asset provenance

The public CholloGas visuals are first-party product captures and compositions.
No AI-generated product pixels, fictional interface elements or stock phone
mockups are used. All six files were reviewed for private account data and are
locked below by dimensions and SHA-256 digest.

## `assets/product-overview.png`

- **Origin:** existing first-party CholloGas overview supplied with this case
  study. It combines the product identity with an authentic iOS app capture.
- **Purpose:** uncropped 1200×630 overview used as the source of the repository
  social preview.
- **Dimensions:** 1200×630 pixels.
- **Privacy:** station names, locations and fuel prices originate from public
  source data. The reviewed image contains no account, tracking identifier or
  private user data.
- **Temporal boundary:** visible prices are a product snapshot, not a guarantee
  of a current real-world price.
- **SHA-256:** `bba1137c60bcb093a5c010e78cd07e561498ff9e1aac617350f5c02595e21066`.

## `assets/social-preview.png`

- **Origin:** deterministic center crop and resize of `product-overview.png` by
  Óscar Cantón. No copy, UI or product claim was added or regenerated.
- **Purpose:** 1280×640 GitHub social preview and bilingual README cover.
- **Dimensions:** 1280×640 pixels.
- **Language boundary:** this is a Spanish-language product snapshot. Source
  labels were not translated or regenerated for the English README.
- **Product boundary:** “Precios oficiales MITECO · sin cuentas · sin
  tracking” reflects the product architecture described in the case study; the
  displayed station price remains a dated capture.
- **SHA-256:** `fb541e1d0cf7c2835b2512cf073306b9fc79efe57185ccdb33e33c9c99ba63be`.

## `assets/price-history.webp`

- **Origin:** first-party iPhone capture exported from the shipping CholloGas
  interface by Óscar Cantón; no generated or reconstructed UI.
- **Purpose:** demonstrates price-change history and vehicle-aware cost
  estimates described in decision 4.1.
- **Dimensions:** 736×1600 pixels.
- **Privacy:** the reviewed capture contains public station data and no account,
  tracking identifier or private user data.
- **Temporal boundary:** prices and chart values are a dated product snapshot,
  not a current-price claim.
- **SHA-256:** `863b1e5ed9c9d5e906da329abef81652f0d6f8081b63c0866fc3fe143e30adc9`.

## `assets/station-list.webp`

- **Origin:** first-party iPhone capture exported from the shipping CholloGas
  interface by Óscar Cantón; no generated or reconstructed UI.
- **Purpose:** shows the real station list and its savings-oriented ranking.
- **Dimensions:** 736×1600 pixels.
- **Privacy:** visible stations and prices are public source data; the reviewed
  capture contains no account or private user identifier.
- **Temporal boundary:** rankings and prices represent the capture time only.
- **SHA-256:** `b4b3df9ebc256f575be27bf312b022a1f0807f551fc42b5f7cbb17dded0f7f62`.

## `assets/price-map.webp`

- **Origin:** first-party iPhone capture exported from the shipping CholloGas
  interface by Óscar Cantón; no generated or reconstructed UI.
- **Purpose:** shows price-aware map markers and station clustering in the real
  product.
- **Dimensions:** 736×1600 pixels.
- **Privacy:** the map contains public geographic and station data, with no
  account, tracking identifier or private user data in the reviewed capture.
- **Temporal boundary:** marker prices are a dated snapshot.
- **SHA-256:** `62026070ea8e6da556107fc7826e901963c69831d032cfaf2256c2ee21743b1d`.

## `assets/route-stop.webp`

- **Origin:** first-party iPhone capture exported from the shipping CholloGas
  interface by Óscar Cantón; no generated or reconstructed UI.
- **Purpose:** demonstrates an explained route result with one recommended fuel
  stop and remaining-range context.
- **Dimensions:** 736×1600 pixels.
- **Privacy:** the route is a product demonstration over public map and station
  data; the reviewed capture contains no account or private user identifier.
- **Temporal boundary:** route and price results are illustrative of that
  capture, not a current recommendation.
- **SHA-256:** `18309d95517b76d96019b49ce4abe6ec5d834bb0ae70fedb6a8e9cda436ab1a4`.

All six files are protected product and identity assets under
[LICENSE.md](LICENSE.md).

## GitHub application

After `magnoscg/chollogas-case-study` exists, its default branch is public and
the settings gate is approved, upload `assets/social-preview.png` from
**Settings → General → Social preview**. That remote settings change is
intentionally separate from repository creation and publication.
