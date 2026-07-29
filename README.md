# Viking Fitness

Web y app de seguimiento para un método de entrenamiento de fuerza explosiva y nutrición nórdica.
Sitio estático: HTML + CSS + JavaScript sin dependencias ni build.

## Arrancar

```bash
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`. Hace falta servirlo por HTTP (no `file://`) porque el idioma y la app usan `localStorage`.

## Estructura

```
index.html          Landing: portal, hero, método, entreno, nutrición, ciencia, planes, FAQ, contacto
app.html            App del clan: panel, entreno, comida, progreso
assets/css/         Sistema visual completo
assets/js/i18n.js   Diccionarios ES · EN · FI · NO + motor de traducción
assets/js/audio.js  Ambiente del Valhalla sintetizado con Web Audio (sin archivos de audio)
assets/js/main.js   Interacción de la landing
assets/js/app.js    Lógica de la app + base de alimentos nórdicos
assets/img/logo.svg Dos hachas cruzadas y una barra en el suelo
```

## Idiomas

Español por defecto, con inglés, finés y noruego. El idioma se detecta del navegador
y se guarda en `localStorage` (`vf_lang`). Se traduce vía atributos `data-i18n`,
`data-i18n-html` y `data-i18n-ph`; para añadir texto nuevo basta con añadir la clave
a los cuatro diccionarios de `i18n.js`.

## Sonido

Todo el ambiente se genera en tiempo real con la Web Audio API: tambor de marco,
drone grave, viento, cuernos y un coro tipo gregoriano con formantes vocálicos.
No se descarga ningún archivo de audio.

Solo arranca tras un gesto del usuario (requisito de los navegadores): el botón
"Entrar con tambores" del portal, o el icono de altavoz del menú. La preferencia de
silencio se guarda en `localStorage` (`vf_muted`) y el icono muestra una barra roja
cuando está apagado.

## La app

Los datos se guardan solo en el navegador, en `localStorage` bajo la clave `vf_saga_v1`.
No hay backend ni se envía nada a ningún servidor. El botón "Borrar todos mis datos"
de la pestaña Progreso lo limpia todo.

Registra series (ejercicio, series, reps, kilos → volumen), comidas (con base de
alimentos nórdicos por 100 g), y peso corporal con gráfico de tendencia. Calcula
racha, XP y rango: Thrall → Karl → Berserker → Jarl → Einherjar.

## Fundamentación científica

Las referencias de la sección "Ciencia" enlazan a las fuentes originales:

- Entrenamiento de potencia y densidad mineral ósea en mujeres posmenopáusicas — *Journal of Applied Physiology* (2005)
- Entrenamiento de resistencia a alta velocidad y DMO en adultos mayores — revisión sistemática en *Bone*
- Ejercicio explosivo y remodelado óseo — *Turkish Journal of Biochemistry*
- Patrón dietético nórdico y desenlaces cardiometabólicos — revisión sistemática y metaanálisis en *Diabetologia* (2022)
- Avena y cebada: microbiota e inflamación — revisión sistemática de ensayos controlados aleatorizados

La sección incluye un aviso de que se trata de un servicio de entrenamiento y
educación nutricional, no de tratamiento médico.

## Pendiente para producción

- Conectar el formulario de contacto a un backend o servicio de formularios (ahora solo muestra confirmación).
- Sustituir precios, testimonios y la cifra de "guerreros entrenados" por datos reales.
- Añadir aviso legal, política de privacidad y cookies.
- Sincronizar la app con un backend si se quiere acceso multidispositivo.
