# SHC | ROOM 1 — HaxBall Headless Host

Proyecto Node.js preparado para GitHub y Render.

## Archivos
- `index.js`: código de la sala.
- `package.json`: dependencias y comando de inicio.
- `.gitignore`: evita subir secretos y archivos locales.
- `.env.example`: plantilla de la variable de entorno (sin token real).

## Subir a GitHub
Sube el contenido de esta carpeta al repositorio, no hace falta subir el ZIP dentro del repositorio.

## Desplegar en Render
1. Crea un servicio **Background Worker** conectado al repositorio.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. En **Environment Variables**, añade `HAXBALL_TOKEN` y pega allí tu token de HaxBall.

No escribas el token en `index.js`, `.env.example` ni en archivos que subas a GitHub. Si el token ya se compartió públicamente, regénéralo.

La sala se configura como privada (`public: false`) y se llama `SHC | ROOM 1`.


## Solución del error `HBInit is not a function`
El arranque usa `require("haxball.js").default` y espera a que `HaxballJS()` inicialice el entorno antes de crear la sala. Si ya existe un repositorio en GitHub, reemplaza allí `index.js` por esta versión y haz commit; Render hará un nuevo deploy.
