# Copia de seguridad de WordPress

Guía para hacer backups completos de tu sitio WordPress (archivos + base de datos).

---

## Opción 1: Plugin All-in-One WP Migration (la más sencilla)

### Instalación

1. Entra a **wp-admin** → **Plugins** → **Añadir nuevo**
2. Busca **All-in-One WP Migration**
3. **Instalar** → **Activar**

### Crear backup

1. **Plugins** → **All-in-One WP Migration** → **Exportar**
2. Elige **Exportar a** → **Archivo**
3. Espera a que termine (puede tardar varios minutos)
4. Se descargará un archivo `.wpress` (contiene todo: BD + archivos)

### Restaurar (si lo necesitas)

1. **All-in-One WP Migration** → **Importar**
2. **Importar desde** → **Archivo**
3. Selecciona el archivo `.wpress`
4. Confirma (sobrescribirá el sitio actual)

### Límite de tamaño

La versión gratuita limita a **512 MB**. Si tu sitio es más grande:

- Usa **Duplicator** (sin límite en la versión gratuita)
- O la **versión de pago** de All-in-One WP Migration

---

## Opción 2: Plugin Duplicator

### Instalación

1. **Plugins** → **Añadir nuevo**
2. Busca **Duplicator**
3. **Instalar** → **Activar**

### Crear backup

1. **Duplicator** → **Packages** → **Create New**
2. Nombre del paquete (ej: backup-2025-03)
3. **Next** → espera a que termine
4. **Download** → descarga dos archivos:
   - `backup-2025-03_archive.zip` (archivos + BD)
   - `backup-2025-03_installer.php` (instalador para restaurar)

### Restaurar

1. Sube por SFTP los dos archivos a la raíz del sitio
2. Visita `https://tudominio.com/backup-2025-03_installer.php`
3. Sigue el asistente
4. **Elimina** el instalador y el archivo .zip cuando termines (seguridad)

---

## Opción 3: Backup manual completo (sin plugin)

### Parte 1: Base de datos

1. **GoDaddy** → **Managed WordPress** → **Administrar todo**
2. **Herramientas** → **phpMyAdmin** (o **Detalles de la base de datos** → **Abrir phpMyAdmin**)
3. Selecciona la base de datos de tu sitio (nombre tipo `wp_xxxxx`)
4. Pestaña **Exportar** / **Export**
5. **Método de exportación:**
   - **Quick (Rápido):** opciones mínimas, suficiente para la mayoría de backups
   - **Custom (Personalizado):** todas las opciones (tablas concretas, compresión, etc.)
6. Formato: **SQL**
7. **Continuar** / **Go** → se descarga un archivo `.sql`

### Parte 2: Archivos por SFTP

1. Conecta con **FileZilla** (o similar):
   - Host: 9dd.884.myftpupload.com (o el que te dé GoDaddy)
   - Usuario y contraseña SFTP
   - Puerto: 22, Protocolo: SFTP

2. En el servidor, descarga estas carpetas/archivos a tu PC:

| Qué descargar | Ubicación en el servidor |
|---------------|--------------------------|
| wp-content | /wp-content/ (toda la carpeta) |
| wp-config.php | /wp-config.php |
| .htaccess | /.htaccess (si existe) |

**No hace falta** descargar wp-admin ni wp-includes (se pueden reinstalar con WordPress).

### Parte 3: Guardar el backup

Crea una carpeta en tu PC, por ejemplo:

```
backup-wordpress-2025-03/
├── database.sql
├── wp-config.php
├── .htaccess
└── wp-content/
    ├── plugins/
    ├── themes/
    ├── uploads/
    └── ...
```

---

## Dónde guardar los backups

- **Disco externo** o carpeta local que hagas copia regularmente
- **Google Drive, Dropbox, OneDrive** (sube el .wpress, .zip o la carpeta)
- **No** los dejes solo en el servidor (si el servidor falla, pierdes todo)

---

## Frecuencia recomendada

| Situación | Frecuencia |
|-----------|-------------|
| Sitio con cambios frecuentes | Semanal |
| Antes de actualizar WordPress, temas o plugins | Siempre |
| Antes de migrar o cambiar dominio | Siempre |
| Sitio estable con pocos cambios | Mensual |

---

## ¿Cuál es la más rápida?

**All-in-One WP Migration** — Un clic, un archivo, listo. La más rápida si tu sitio es menor a 512 MB.

| Método | Velocidad | Cuándo elegirla |
|--------|-----------|-----------------|
| All-in-One WP Migration | Más rápida | Sitio menor a 512 MB |
| Duplicator | Rápida | Sitio mayor a 512 MB |
| Manual | Más lenta | Sin plugins, control total |

---

## Resumen rápido

| Método | Ventaja | Desventaja |
|--------|---------|------------|
| All-in-One WP Migration | Muy fácil, un solo archivo | Límite 512 MB (gratis) |
| Duplicator | Sin límite de tamaño (gratis) | Dos archivos, un poco más de pasos |
| Manual (phpMyAdmin + SFTP) | Sin plugins, control total | Más pasos, más técnico |
