# Asset provenance

The public CholloGas visuals are first-party product captures and compositions.
No AI-generated product pixels, fictional interface elements or stock phone
mockups are used. All nine files were reviewed for private account data and are
locked below by dimensions and SHA-256 digest.

## `assets/product-overview.png`

- **Origin:** deterministic AppKit composition by Óscar Cantón using an
  authentic current CholloGas station-list capture, the shipping app icon and
  the exact reviewed OgamLabs SVG. The simple device frame is drawn locally;
  no stock mockup or generated interface is used.
- **Source digests:** station-list capture
  `b38d709ec22bcde470cadd266168aad6cc3f4d29edbc8458ed932ae7310161eb`,
  app icon
  `16eedd31dca088f4ea2e2c71ca9b974d4e6e81d72fd19d85812e8bd6177f3fdf`
  and OgamLabs signature
  `564f0fedc9cb597c3d5dfcd7bc712b016e383097dd68d9857b3b3aeefb207753`.
- **Purpose:** 1200×630 recruiter-facing overview that presents CholloGas as
  the product and OgamLabs as the studio that builds and operates it.
- **Dimensions:** 1200×630 pixels.
- **Privacy:** station names, locations and fuel prices originate from public
  source data. The reviewed image contains no account, tracking identifier or
  private user data.
- **Temporal boundary:** visible prices are a product snapshot, not a guarantee
  of a current real-world price.
- **SHA-256:** `3e9b14ba4d8135f5cbff7d29f6fd74e868768bc70bcacca98db8a8dc8d66a840`.

## `assets/social-preview.png`

- **Origin:** direct 1280×640 export from the same deterministic composition and
  reviewed sources as `product-overview.png`; it is not an independently
  generated or repainted interface.
- **Purpose:** 1280×640 GitHub social preview and bilingual README cover.
- **Dimensions:** 1280×640 pixels.
- **Language boundary:** the embedded interface remains a Spanish-language
  product snapshot. Source labels were not translated or regenerated for the
  English README.
- **Product boundary:** It is not a claim of zero analytics. CholloGas has no
  advertising or cross-app tracking and uses TelemetryDeck for the
  privacy-preserving product telemetry described in the case study. The
  displayed station price remains a dated capture.
- **SHA-256:** `d175169f0df5e1cb9b6605f1f114af27594c41beb4751152c26e35f11deeb4d0`.

## `assets/ogamlabs-signature.svg`

- **Origin:** exact first-party export from OgamLabs brand kit `1.0.0`, variant
  `logo_ogamlabs_horizontal_full-color_light_20260803.svg`. The logo geometry,
  colors and outlined wordmark are unchanged.
- **Presentation adaptation:** a white `#FFFFFF` panel with the brand kit's
  reviewed `32 px` corner radius is embedded behind the original artwork so
  the light-background variant remains legible in GitHub dark mode. Only the
  accessible title and description were adjusted to describe that panel.
- **Purpose:** quiet studio signature in the bilingual repository footer and
  source artwork for the two raster covers.
- **Intrinsic dimensions:** 1024×320 pixels with a matching `viewBox`.
- **Brand boundary:** CholloGas remains the primary product identity. The mark
  is used on a light neutral background at a legible size with its required
  clear space; it is not recolored, stretched or combined into a new mark.
- **SHA-256:** `7e3f7eb423c9d5a4add06ec6eff00b32fe60ee9f697151b824cd7f83b1b6ce7a`.

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

## `assets/route-range.webp`

- **Origin:** first-party iPhone capture from the shipping CholloGas route
  flow, exported by Óscar Cantón with no generated or reconstructed UI.
- **Transformation:** resized from 1206×2622 to 736×1600 pixels with `cwebp`
  quality 88, method 6 and sharp YUV conversion.
- **Source SHA-256:**
  `c0a973681b2b958c410438eaa002337a86f6ded65fe8e0c923421ccc1e776365`.
- **Purpose:** demonstrates the explicit vehicle-range input that grounds the
  route decision in the user's current tank state.
- **Dimensions:** 736×1600 pixels.
- **Privacy:** the reviewed capture contains vehicle configuration only and no
  account, location, tracking identifier or private user data.
- **SHA-256:** `3b999eba4c88176aa54005df584161b039befb42f42ec4fc3d9e134472a77150`.

## `assets/route-deficit.webp`

- **Origin:** first-party iPhone capture from the shipping CholloGas route
  flow, exported by Óscar Cantón with no generated or reconstructed UI.
- **Transformation:** resized from 1206×2622 to 736×1600 pixels with `cwebp`
  quality 88, method 6 and sharp YUV conversion.
- **Source SHA-256:**
  `b70c5ff18e44b838ee34fc41ecd1bd73d9a2d4888c0b167f0889ac3b8eebc6b7`.
- **Purpose:** makes the distance-versus-range deficit explicit and shows the
  product's explained recommendation before the stop is added.
- **Dimensions:** 736×1600 pixels.
- **Privacy:** route, station and price information are product demonstrations
  over public data; no account or private user identifier is visible.
- **Temporal boundary:** the route and station price are a dated snapshot, not
  a current recommendation.
- **SHA-256:** `b412274bd34d494bb4b3fe7b3f4b50673effa9f32f3bea5411948bf06a3df207`.

Third-party fuel-station marks, map imagery and labels, and official-data
content visible inside these captures remain the property of their respective
owners. They appear only as authentic product context; this repository claims
no ownership of those elements.

The first-party composition, CholloGas identity and original product interface
are protected under [LICENSE.md](LICENSE.md) to the extent those rights belong
to Óscar Cantón / OgamLabs.

## GitHub application

After `magnoscg/chollogas-case-study` exists, its default branch is public and
the settings gate is approved, upload `assets/social-preview.png` from
**Settings → General → Social preview**. That remote settings change is
intentionally separate from repository creation and publication.
