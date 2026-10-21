# DESIGN — « Cahier de parcours »

Direction artistique et design system de la refonte. Source de vérité des tokens :
[`app/globals.css`](app/globals.css) ; composants : [`app/components/ui`](app/components/ui),
[`app/components/site`](app/components/site), [`app/components/edit`](app/components/edit).

## 1. Intention

Le site sert surtout à **des lycéens qui cherchent leur voie** et à **des anciens qui racontent la
leur**. Le point commun de tous ses membres : ils ont tenu un cahier au lycée Victor Hugo de Besançon.
L'identité part de là, plutôt que d'un gabarit SaaS (dégradés bleu-violet, verre dépoli, émojis) :

| Référence | Traduction graphique |
|---|---|
| **Le cahier Seyès** (grands carreaux, marge rouge) | Fond `bg-seyes` des en-têtes de page, trait rouge de marge sur l'onglet actif et les listes |
| **Le stylo-plume bleu** | Couleur d'action unique `--blue` (#2343c7) : boutons, liens, focus |
| **Le stylo rouge du professeur** | Accent rare `--red` : nouveautés, annotations, danger, puces |
| **Le surligneur** | `--highlight` (#ffe45c) : un mot clé par titre, correspondances de recherche, état « brouillon » |
| **Victor Hugo, dessinateur à l'encre** | Sections sombres `bg-wash` en « lavis » (bleu nuit et halos d'encre) : héros visiteur, pied de page, barre d'admin |
| **Le tampon de l'association** | Monogramme « VH » incliné, qui se redresse au survol ; boutons avec une « tranche » d'encre qui s'écrase au clic |

Le résultat doit évoquer un carnet de bord éditorial, chaleureux et lisible, jamais scolaire au premier
degré : la réglure est discrète (opacité 8–22 %), la typographie fait le travail.

## 2. Typographie

| Rôle | Police | Réglages |
|---|---|---|
| Titres, chiffres, citations | **Fraunces** (variable, axes `opsz` et `WONK`, sous-ensemble latin) | 650, `opsz 96–144` ; italique « wonky » pour les accents (`font-display-tight`). L'axe `SOFT` a été retiré : +52 Ko préchargés pour un effet à peine visible |
| Texte et interface | **Atkinson Hyperlegible Next** | 400/600/700, 17 px de base, interligne 1,6 ; conçue pour la lisibilité (malvoyance, dyslexie) |
| Annotations manuscrites | **Caveat** 600 | Décoratif uniquement (`font-hand`), jamais porteur d'information seul, non préchargée |

Échelle (fluide, `clamp`) : display `2.5→4.5rem` · h1 `2→3.25rem` · h2 `1.5→2.25rem` · h3 `1.25rem` ·
corps `1.0625rem` · petit `0.875rem` · légende `0.8125rem`. `text-wrap: balance` sur les titres,
`pretty` sur les paragraphes. Longueur de ligne des textes longs ≤ 68 caractères (`max-w-prose`).

## 3. Couleurs (tokens)

Chaque couleur est une variable CSS redéfinie en mode sombre ; les classes Tailwind (`bg-paper`,
`text-ink`, `bg-blue`…) sont branchées dessus via `@theme inline`.

| Token | Clair | Sombre | Usage | Contraste (texte) |
|---|---|---|---|---|
| `--paper` | `#f8f5ef` | `#12141f` | Fond de page | — |
| `--paper-raised` | `#fffdf9` | `#1a1d2b` | Cartes, champs, menus | — |
| `--paper-sunken` | `#f0ebe1` | `#0d0f17` | Zones en creux, survols | — |
| `--ink` | `#1a1d2e` | `#eee9df` | Texte principal | 15,3:1 / 15,2:1 |
| `--ink-soft` | `#464b5e` | `#c9c5bb` | Texte secondaire | 8,0:1 / 10,6:1 |
| `--ink-muted` | `#5f6475` | `#a19fa8` | Méta-données, aides | 5,4:1 (4,96:1 sur `paper-sunken`) / 7,0:1 |
| `--line` / `--line-strong` | `#e4dccd` / `#8c8676` | `#2c3042` / `#6a6f86` | Séparateurs / bordures de champs | bordure de champ 3,6:1 / 3,4:1 (≥ 3:1) |
| `--blue` | `#2343c7` | `#93a6ff` | Actions, liens, focus | 7,2:1 sur papier ; texte du bouton 7,8:1 / 8,3:1 |
| `--red` | `#c8342b` | `#ff8b7b` | Accents, erreurs, danger | 4,9:1 / 8,1:1 ; texte du bouton 5,3:1 / 8,1:1 ; badges rouges en `--red-strong` |
| `--highlight` | `#ffe45c` | `#f5d547` | Surligneur, brouillon | encre sur jaune 13,1:1 / 12,7:1 |
| `--success` / `--warning` | `#1e7a4c` / `#8a5300` | `#6fd3a0` / `#ffc266` | États | 4,9:1 et 5,8:1 sur papier ; ≥ 4,6:1 sur leur fond teinté |
| `--wash` | `#141729` | `#0b0d17` | Sections « lavis » | texte `--on-wash` 15,5:1, secondaire 10,6:1 |

Ratios calculés avec la formule WCAG 2 (script dans REPORT.md). Règles : une seule couleur d'action (bleu) ; le rouge ne sert jamais de bouton principal hors
suppression ; le jaune n'est jamais du texte (fond uniquement).

## 4. Espacements, grille, rayons, ombres

- **Espacements** : base 4 px (échelle Tailwind) ; rythme vertical calé sur la réglure : 8 / 16 / 24 / 32 / 48 / 64 / 96 px.
- **Grille** : conteneur `container-page` (72 rem, gouttières `clamp(1rem, 4vw, 2rem)`), 12 colonnes en desktop, 1 colonne en mobile ; cartes en `grid` auto (1 → 2 → 3 colonnes).
- **Rayons** : `--radius-xs` 4 · `sm` 8 (boutons, champs) · `md` 12 (cartes, menus) · `lg` 20 (blocs, dialogues) · `full` (pastilles, avatars).
- **Ombres** : `--shadow-sm` (cartes au repos), `--shadow-md` (survol, menus), `--shadow-lg` (dialogues, barre d'admin) ; boutons pleins : ombre dure `0 3px 0 var(--blue-strong)`.

## 5. Iconographie

`lucide-react`, trait 2 px, tailles 16 / 20 / 24. Plus aucun émoji dans l'interface : chaque matière a
son icône (`SUBJECT_ICONS` : Σ maths, atome physique, fiole chimie, ADN biologie…), les cartes de
contenu choisissent dans un jeu fermé de 20 icônes (`ICON_NAMES`). Icônes décoratives en
`aria-hidden`, icônes seules accompagnées d'un `aria-label`.

## 6. Mouvement

| Interaction | Effet | Durée |
|---|---|---|
| Apparition des sections | `rise-in` (opacité + 12 px), décalage 80 ms par bloc | 520 ms `--ease-out` |
| Onglet actif | trait rouge qui « s'écrit » de gauche à droite (`ink-draw`) | 700 ms |
| Bouton plein | s'enfonce de 2 px au clic (la tranche d'encre s'écrase) | 150 ms |
| Carte | soulèvement + bordure bleue au survol | 200 ms |
| Monogramme | se redresse au survol (`--ease-spring`) | 300 ms |
| Navigation entre pages | `@view-transition { navigation: auto }` (fondu natif) | navigateur |

`prefers-reduced-motion: reduce` : toutes les animations et transitions sont ramenées à ~0 ms et les
fondus de navigation désactivés (règles en fin de `globals.css`).

## 7. Composants et états

| Composant | Fichier | Variantes | États couverts |
|---|---|---|---|
| Button / ButtonLink | `ui/Button.tsx` | primary, secondary, ghost, danger, highlight, on-wash · sm/md/lg | hover, active (enfoncé), focus (anneau 2 px + décalage), disabled, **loading** (spinner + libellé, `aria-busy`) |
| Field + Input/Textarea/Select | `ui/Field.tsx` | — | libellé associé, aide, **erreur en direct** (`aria-invalid`, `aria-describedby`, région `aria-live`), **succès**, requis, désactivé |
| Checkbox, Switch | `ui/Field.tsx` | — | coché, focus, désactivé ; `role="switch"` + `aria-checked` |
| CharCount | `ui/Field.tsx` | — | neutre, proche de la limite, dépassé |
| Badge | `ui/Badge.tsx` | neutral, blue, red, green, amber, highlight, outline | — |
| Alert | `ui/Alert.tsx` | info, success, warning, error | erreur annoncée (`role="alert"`) |
| EmptyState | `ui/EmptyState.tsx` | — | **vide** avec piste d'action |
| Spinner, Skeleton | `ui/Spinner.tsx` | — | **chargement** |
| Dialog, ConfirmProvider/useConfirm | `ui/Dialog.tsx` | sm/md/lg ; confirmation simple ou « tapez SUPPRIMER » | `<dialog>` natif : piège à focus, Échap, retour du focus |
| Avatar | `ui/Avatar.tsx` | xs→xl | photo (point focal, flou de chargement) ou initiales teintées |
| Picture | `ui/Picture.tsx` | fill / dimensions | flou LQIP, point focal, `alt` obligatoire |
| Header, NavLinks, MobileNav, UserMenu | `site/` | visiteur / membre / admin | page courante (`aria-current` + trait rouge), menu clavier (Échap), menu mobile en `<dialog>` |
| Footer | `site/Footer.tsx` | — | contenus éditables (Réglages du site) |
| ThemeToggle | `site/ThemeToggle.tsx` | auto → clair → sombre | sans flash (script inline avant rendu) |
| Toasts | `sonner` stylé dans `layout.tsx` | succès, erreur | **succès / erreur** non bloquants |
| Édition sur place | `edit/` | texte, texte riche, image, lien, icône, liste | contour pointillé au survol, plein au focus ; brouillon / enregistrement / publié / erreur dans la barre d'admin |

États de page systématiques : **chargement** (`loading.tsx` en squelette sobre, boutons en
chargement), **vide** (EmptyState avec action), **erreur** (`error.tsx`, Alert en ligne, toasts),
**succès** (toast + mise à jour en place).

## 8. Formulaires

- Validation **en direct** à la sortie du champ puis à chaque frappe une fois le champ touché ; mêmes
  schémas Zod côté client et serveur (`lib/validations.ts`), erreurs serveur renvoyées avec le champ
  fautif et réaffichées dessous.
- Mot de passe : liste de règles cochées au fil de la frappe (`lib/password-rules.ts`), bouton
  afficher/masquer.
- Messages utiles (« Indiquez l'adresse de votre profil LinkedIn (linkedin.com/in/…) ») plutôt que « Champ invalide ».
- Compteurs de caractères là où une limite existe ; alerte avant de quitter un formulaire modifié.

## 9. Responsive (mobile d'abord)

Points de rupture Tailwind : `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. La navigation passe en menu
`<dialog>` sous `lg` ; les filtres de l'annuaire deviennent des panneaux montants (bottom sheet) sous
`sm` ; cibles tactiles ≥ 44 px ; aucune largeur fixe au-delà de l'écran (vérifié à 320 px).

## 10. Mode sombre

Automatique (`prefers-color-scheme`) ou forcé par l'utilisateur (`data-theme` sur `<html>`, mémorisé
dans `localStorage`). Le papier devient « nuit d'encre », l'encre devient crème, le bleu s'éclaircit
(`#93a6ff`) pour garder 7:1. Les sections « lavis » restent sombres dans les deux modes.

## 11. Accessibilité (WCAG 2.2 AA)

Contrastes ci-dessus ; lien d'évitement « Aller au contenu » ; un seul `<h1>` par page ; landmarks
(`header`, `nav` nommées, `main#contenu`, `footer`) ; focus toujours visible (anneau bleu 2 px,
décalage 3 px) ; menus et dialogues utilisables au clavier ; images avec `alt` (vide si décoratives),
alerte « texte alternatif manquant » en mode édition ; `lang="fr"` ; zoom 200 % sans perte.
