# Textures d'usure des cartes

Sources des textures de `static/cartes/usure/`, gardées hors de `static/` pour ne pas être servies
ni copiées dans l'image Docker. Pour les régénérer (après avoir changé une source ou un réglage) :

    node textures-sources/usure/preparer.cjs textures-sources/usure static/cartes/usure

| Fichier produit | Source | Rôle |
|---|---|---|
| `rayures-fines.webp` | `Metal003_1K-JPG_Roughness.jpg` (ambientCG, CC0) | rayures fines et courbes, visibles dans le reflet |
| `rayures-frottement.webp` | `Metal056A_1K-JPG_Roughness.jpg` (ambientCG, CC0) | frottement serré des cartes très usées |
| `poussiere.webp` | `SurfaceImperfections013_1K-JPG_Opacity.jpg` (ambientCG, CC0) | poussière et petites saletés |
| `crasse.webp` | `decrepit_wallpaper_diff_1k.jpg` (Poly Haven, CC0) | crasse diffuse |
| `tache-cafe.webp` | `StainCoffee.png` (source à vérifier) | auréole de café sur quelques cartes très abîmées |
| `carton.webp` | `Cardboard002_1K-JPG_Color.jpg` (ambientCG, CC0) | grain du carton au verso |

Chaque texture produite est blanche (ou brune) sur fond transparent : son opacité suit l'intensité
du défaut, ce qui permet de la poser sur n'importe quelle carte et de doser l'usure en CSS.
Les plis et les déchirures ne viennent pas de textures : ils sont dessinés par `cardDamage()`
(`src/lib/cards/patterns.ts`) et texturés par des filtres SVG dans `WearMarks.svelte`.
