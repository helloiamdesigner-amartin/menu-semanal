# Herbora Sales App

**Herramienta comercial de catálogo y generación de pedidos para Herbora.**

App web progresiva (PWA) instalable en iPhone, Android, iPad y tablets. Funciona sin conexión. Compatible con GitHub Pages.

---

## Actualización del catálogo

> ⚠️ **Regla de oro:** para cualquier cambio de catálogo, solo es necesario modificar archivos en la carpeta `data/`. Nunca es necesario tocar HTML, CSS ni JavaScript.

### Proceso para actualizar el catálogo

**Paso 1 — Preparar el nuevo `products.json`**

El archivo debe tener esta estructura mínima:

```json
{
  "metadata": {
    "version": "2026-07-01",
    "updatedAt": "2026-07-01T10:00:00Z",
    "totalProducts": 162
  },
  "products": [
    {
      "id": "H23101",
      "ref": "H23101",
      "ean13": "8426494231010",
      "name": "Bi Complex",
      "brand": "Actifens",
      "line": "Defensas",
      "presentation": "20 viales bebibles de 10 ml",
      "format": "Viales",
      "dosage": ["1 al día"],
      "badges": ["TOP CONSUMO", "TOP VOLUMEN"],
      "status": "active",
      "image": "https://www.herbora.es/imagen.jpg",
      "images": [],
      "properties": "...",
      "indications": "...",
      "main_ingredients": "...",
      "usage": "...",
      "benefits": "",
      "warnings": "..."
    }
  ]
}
```

**Paso 2 — Actualizar `catalog-version.json`**

Cambiar la fecha de versión:

```json
{
  "version": "2026-07-01",
  "updatedAt": "2026-07-01T10:00:00Z",
  "productsFile": "products.json",
  "changelog": "Julio 2026 — 2 productos nuevos añadidos"
}
```

**Paso 3 — Subir los archivos a GitHub**

Sustituir en el repositorio:
- `data/products.json`
- `data/catalog-version.json`

GitHub Pages publica los cambios en aproximadamente 30 segundos.

**Paso 4 — Verificación automática**

La próxima vez que un usuario abra la app con conexión:
- La app detecta la nueva versión comparando `catalog-version.json`
- Descarga el nuevo `products.json`
- Actualiza la base de datos local
- Muestra el aviso: *"Catálogo actualizado ✓"*
- Los favoritos, historial y pedidos del usuario se mantienen intactos

---

## Campo `status` de producto

Cada producto admite un campo `status` que controla su visibilidad:

| Valor | Catálogo | Búsqueda | Pedido nuevo | Historial antiguo |
|---|---|---|---|---|
| `active` | ✅ | ✅ | ✅ | ✅ |
| `discontinued` | ❌ | ❌ | ❌ | ✅ con etiqueta "Descatalogado" |
| `hidden` | ❌ | ❌ | ❌ | ✅ sin etiqueta |
| `draft` | ❌ | ❌ | ❌ | ❌ |
| *(sin campo)* | ✅ | ✅ | ✅ | ✅ |

**Para descatalogar un producto:** cambiar `"status": "active"` a `"status": "discontinued"`. El producto desaparece del catálogo pero sigue visible en pedidos históricos con la etiqueta "Descatalogado".

**Para añadir un producto nuevo:** añadir un nuevo objeto en el array `products` con `"status": "active"`. La app genera automáticamente su tarjeta, ficha, filtros y búsqueda.

---

## Imágenes de producto

Cada producto acepta dos campos de imagen:

```json
{
  "image": "https://www.herbora.es/ruta/imagen.jpg",
  "images": [
    "https://www.herbora.es/ruta/imagen.jpg",
    "https://www.herbora.es/ruta/imagen-2.jpg"
  ]
}
```

- Si `image` está relleno, se usa como imagen principal.
- Si `images` tiene elementos, se usa `images[0]` como principal.
- Si no hay imagen, la app muestra un placeholder elegante automáticamente.
- La app nunca se rompe por ausencia de imagen.

---

## Marcas, líneas y filtros dinámicos

La app no tiene ninguna lista hardcodeada de marcas, líneas, categorías ni filtros.

Todo se genera dinámicamente a partir de los campos `brand` y `line` de cada producto en `products.json`.

Si se añade una marca nueva en el JSON, aparece automáticamente en:
- Filtros del catálogo
- Chips de marca
- Dashboard
- Búsqueda

No es necesario modificar ningún archivo de código.

---

## Estructura de archivos

```
herbora-sales-app/
├── index.html                  # SPA shell — no modificar
├── manifest.json               # Configuración PWA — no modificar
├── service-worker.js           # Caché offline — no modificar
├── data/
│   ├── products.json           # ← ÚNICO ARCHIVO PARA ACTUALIZAR CATÁLOGO
│   └── catalog-version.json    # ← ACTUALIZAR JUNTO CON products.json
├── assets/
│   ├── icons/                  # Iconos PWA (192, 512, maskable)
│   ├── images/
│   │   └── placeholder-product.svg
│   └── logo/
│       └── herbora-logo.svg
├── css/
│   ├── main.css
│   ├── components.css
│   ├── screens.css
│   └── animations.css
└── js/                         # Código de la app — no modificar para cambios de catálogo
    ├── app.js
    ├── data/
    ├── router/
    ├── views/
    ├── components/
    └── utils/
```

---

## Despliegue en GitHub Pages

1. Crear repositorio en GitHub (público o privado con Pages activo)
2. Subir todos los archivos del proyecto al repositorio
3. En el repositorio: **Settings → Pages → Source: Deploy from a branch → main → / (root)**
4. La app estará disponible en `https://usuario.github.io/nombre-repositorio/`

Para usar un dominio propio:
- En **Settings → Pages → Custom domain**: introducir el dominio
- Añadir registro CNAME en el DNS apuntando a `usuario.github.io`

---

## Accesos de usuario

- **Comercial:** botón "Soy comercial" → contraseña `Herbora1981`
- **Consumidor / cliente profesional:** botón "Soy cliente / consumidor" → acceso directo sin contraseña

Ambos modos permiten generar resúmenes de pedido y compartirlos.

---

## Compartición de pedidos

Los resúmenes de pedido se pueden compartir mediante:
- **WhatsApp** — enlace directo `wa.me`
- **Email** — enlace `mailto:`
- **Copiar texto** — portapapeles del dispositivo
- **PDF** — impresión / guardar como PDF desde el navegador

---

## Requisitos técnicos

- No requiere servidor ni backend
- Compatible con GitHub Pages (hosting gratuito)
- Funciona offline una vez instalada
- Compatible con iPhone, Android, iPad y tablets Android
- Instalable como app desde el navegador (PWA)
- Sin dependencias externas de JavaScript (excepto fuente Inter de Google Fonts)

---

*Herbora Sales App — v1.0 — Catálogo junio 2026*
