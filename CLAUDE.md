# Viking Fitness — Referencia del proyecto

## Stack
- HTML/CSS/JS estático (sin build tools ni framework)
- Desplegado en **Vercel** con auto-deploy desde GitHub (`main`)
- Repo: `samuelhogarola-ship-it/Viking-Fitness`
- Vercel project ID: `prj_adc07VMzdq8eVHsBvAyw8KcwFY4o`

## Estructura de archivos
```
index.html          — Landing page principal
app.html            — App de registro (entrenos, comida, peso, rango)
assets/
  css/styles.css    — Todo el CSS (variables, layout, componentes)
  img/
    hero.jpg        — Hero background: salón vikingo con gym y guerrero (1536x1024)
    about.jpg       — Foto "Sobre mí": composición de 3 fotos con costuras CSS (1920x1080)
    logo.png        — Logo oficial: escudo + hachas + barra (fondo transparente via Pillow)
    logo.svg        — Logo SVG antiguo (no se usa, pendiente de eliminar)
    hero-hall.svg   — Hero SVG antiguo (no se usa, pendiente de eliminar)
  js/
    main.js         — Lógica de la landing (portal, scroll, acordeones, formulario)
    app.js          — Lógica de la app (entrenos, comida, peso, XP/rango, localStorage)
    audio.js        — YouTube IFrame API: música ambiental (video ID: tG7fk_DUz5g)
    i18n.js         — Sistema i18n con 4 idiomas (es/en/fi/no)
```

## Diseño y marca
- **Filosofía:** La fuerza es una capacidad, no una estética. Entrenar para que el cuerpo funcione 40 años
- **Pilares:** Fuerza, Movilidad, Resistencia, Salud metabólica, Composición corporal
- **Tono:** Guerrero histórico, no RPG/videojuego. Raíces nórdicas europeas reales
- **Fonts:** Cinzel (display), Inter (body)
- **Paleta CSS:** `--void` (#0a0c0f), `--gold` (#b8923c), `--bone` (#ece8e0), `--ash` (#a5adb5)

## Secciones de index.html
1. **Portal** — Pantalla de entrada con logo + runas girando, botones sonido/silencio
2. **Hero** — Foto `hero.jpg` (gym vikingo), texto "Bienvenidos al Valhalla", scrim gradiente
3. **Tu camino** — Acordeón con Entrenamientos (4 bloques + fases) y Nutrición (patrón nórdico)
4. **Ciencia** — 6 artículos con enlaces a papers reales (Bone, Diabetologia, etc.)
5. **La App** — Showcase con mockup de teléfono (datos ficticios)
6. **Planes** — 3 planes sin precios ("Consultar"): Berserker, Cazador, Titán
7. **Testimonios** — 3 testimonios (Marcos/Madrid, Emma/Helsinki, Lars/Oslo)
8. **FAQ** — 5 preguntas frecuentes en acordeón
9. **Sobre mí** — Foto `about.jpg` con gradientes CSS para ocultar costuras + texto histórico
10. **Contacto** — Formulario con nombre, email, objetivo, plan, mensaje
11. **Footer** — Links, runas, idiomas

## 3 Planes de entrenamiento
| Plan | Enfoque |
|------|---------|
| **Berserker** | Explosividad pura: powerlifting y potencia (el más elegido) |
| **Cazador** | Resistencia y durabilidad: fuerza-resistencia, cardio, remo |
| **Titán** | Hipertrofia muscular: volumen, densidad, venosidad |

## Audio
- YouTube IFrame API, video `tG7fk_DUz5g`
- Mute = `player.pauseVideo()` (NO `player.mute()`)
- Iframe oculto (1px, opacity 0)

## i18n
- 4 idiomas: ES (default), EN, FI, NO
- Atributos: `data-i18n` (texto), `data-i18n-html` (innerHTML)
- Selector en nav con banderas emoji

## CSS notable
- Hero: `align-items: flex-end`, scrim gradiente de abajo, `object-position: 50% 65%`
- About photo: gradientes `::after` para ocultar costuras verticales (42%) y horizontales (46%)
- Logo PNG: fondo transparente real (Pillow), sin `mix-blend-mode`
- Portal: runas girando con SVG `textPath` + `@keyframes spin`

## App (app.html)
- Todo en localStorage (no server)
- Tabs: Panel, Entreno, Comida, Progreso
- Sistema de rango/XP: Thrall → Karl → Berserker → Jarl → Einherjar
- Presets de ejercicios rápidos, base de alimentos nórdicos

## Deployment
- Push a `main` → Vercel auto-deploy
- **IMPORTANTE:** Deployment Protection debe estar en OFF para acceso público
  (Settings > Deployment Protection > Vercel Authentication: Off)

## Archivos obsoletos (se pueden eliminar)
- `assets/img/logo.svg` — Reemplazado por `logo.png`
- `assets/img/hero-hall.svg` — Reemplazado por `hero.jpg`
