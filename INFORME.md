# Informe del Laboratorio 6.1

## Despliegue de una aplicación web estática con CI/CD

**Estudiante:** Christian Ángel Ávila Serrano 
**Asignatura:** COM610  
**Laboratorio:** 6.1  
**Repositorio:** https://github.com/meta-mari/lab6-1-mi-sitio-cicd  
**URL pública del sitio:** https://d2v7ej7sgkgclr.cloudfront.net/  

---

## 1. Introducción

En esta práctica se desarrolló y desplegó una aplicación web estática utilizando un flujo de integración y despliegue continuo, conocido como CI/CD.

El objetivo principal fue automatizar la publicación de un sitio web estático en Amazon Web Services, usando GitHub como repositorio de código fuente, GitHub Actions como herramienta de automatización, Amazon S3 como almacenamiento del sitio y Amazon CloudFront como red de distribución de contenido.

La práctica permitió comprender cómo un cambio realizado en el código fuente puede publicarse automáticamente en la nube mediante un pipeline de despliegue.

---

## 2. Descripción del sitio web

El sitio desarrollado es una página web estática simple creada con HTML, CSS y JavaScript.

La página incluye:

- Una sección principal de presentación.
- Estilos personalizados mediante CSS.
- Una pequeña interacción con JavaScript.
- Estructura organizada en carpetas para separar HTML, CSS y JavaScript.

La estructura general del proyecto fue la siguiente:

```text
lab6-1-mi-sitio-cicd/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .gitignore
├── README.md
└── INFORME.md
```

---

## 3. Tecnologías utilizadas

Para la realización de la práctica se utilizaron las siguientes tecnologías y servicios:

- **Fedora KDE 44 Wayland x86-64** como sistema operativo de trabajo.
- **Git** para el control de versiones.
- **GitHub** para alojar el repositorio del proyecto.
- **GitHub Actions** para automatizar el despliegue.
- **Amazon S3** para almacenar los archivos estáticos del sitio web.
- **Amazon CloudFront** para distribuir el sitio mediante HTTPS.
- **IAM** para gestionar permisos de acceso a AWS desde GitHub Actions.
- **HTML, CSS y JavaScript** para construir el sitio web.

---

## 4. Repositorio GitHub

El código fuente del proyecto fue subido al siguiente repositorio de GitHub:

```text
https://github.com/meta-mari/lab6-1-mi-sitio-cicd
```

En el repositorio se incluyeron los archivos principales del sitio, el archivo de configuración del workflow y la documentación de la práctica.

El repositorio contiene el código fuente de la aplicación web estática y el pipeline de CI/CD definido mediante GitHub Actions.

---

## 5. Configuración del bucket S3

Se creó un bucket en Amazon S3 para almacenar los archivos estáticos del sitio web.

Datos principales del bucket:

```text
Nombre del bucket: mi-sitio-cicd-metamari-2026
Región: sa-east-1
Región AWS: South America (São Paulo)
```

Durante la configuración inicial se habilitó el alojamiento de sitio web estático en S3 para verificar que los archivos HTML, CSS y JavaScript fueran servidos correctamente desde AWS.

La configuración de hosting estático utilizó:

```text
Index document: index.html
Error document: index.html
```

El endpoint de S3 utilizado para la verificación fue:

```text
http://mi-sitio-cicd-metamari-2026.s3-website-sa-east-1.amazonaws.com
```

Posteriormente, para mejorar la seguridad, el acceso público directo al bucket fue reemplazado por acceso mediante CloudFront con Origin Access Control.

---

## 6. Configuración de IAM

Para que GitHub Actions pudiera subir archivos al bucket S3, se creó un usuario IAM llamado:

```text
github-actions-s3-deploy
```

Este usuario fue configurado con credenciales de acceso programático.

Se asignó una política con permisos necesarios para desplegar el sitio:

- `s3:ListBucket` sobre el bucket.
- `s3:GetObject` sobre los objetos del bucket.
- `s3:PutObject` sobre los objetos del bucket.
- `s3:DeleteObject` sobre los objetos del bucket.
- `cloudfront:CreateInvalidation` para invalidar la caché de CloudFront.

Estos permisos permiten que el workflow sincronice los archivos del repositorio con S3 y actualice el contenido servido por CloudFront.

---

## 7. Secrets y variables en GitHub

En GitHub se configuraron secrets y variables para evitar escribir credenciales directamente en el código fuente.

Los secrets configurados fueron:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

Las variables configuradas fueron:

```text
AWS_REGION = sa-east-1
AWS_S3_BUCKET = mi-sitio-cicd-metamari-2026
AWS_CLOUDFRONT_DISTRIBUTION_ID = ECOZ1UGTN3RUR
```

De esta manera, el workflow puede conectarse a AWS de forma segura sin exponer las credenciales en el repositorio.

---

## 8. Configuración del workflow de GitHub Actions

Se creó un workflow dentro de la ruta:

```text
.github/workflows/deploy.yml
```

El workflow se ejecuta automáticamente cuando se realiza un `push` a la rama `main`.

Nombre del workflow:

```text
Deploy Static Site to S3
```

El workflow realiza los siguientes pasos:

1. Descarga el código fuente del repositorio.
2. Configura las credenciales de AWS usando los secrets de GitHub.
3. Sincroniza los archivos del sitio web con el bucket S3.
4. Excluye archivos que no deben publicarse, como `.git`, `.github`, `README.md`, `INFORME.md` y `.gitignore`.
5. Invalida la caché de CloudFront para que los cambios se reflejen en la URL pública.

Contenido principal del workflow:

```yaml
name: Deploy Static Site to S3

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout del codigo
        uses: actions/checkout@v4

      - name: Configurar credenciales de AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ vars.AWS_REGION }}

      - name: Sincronizar archivos con S3
        run: |
          aws s3 sync . s3://${{ vars.AWS_S3_BUCKET }} \
            --delete \
            --exclude ".git/*" \
            --exclude ".github/*" \
            --exclude "README.md" \
            --exclude "INFORME.md" \
            --exclude ".gitignore"

      - name: Invalidar cache de CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ vars.AWS_CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

---

## 9. Error encontrado durante el despliegue

Durante la ejecución inicial del workflow se presentó un error de permisos en AWS.

El error fue el siguiente:

```text
fatal error: An error occurred (AccessDenied) when calling the ListObjectsV2 operation:
User: arn:aws:iam::202264954577:user/github-actions-s3-deploy is not authorized to perform:
s3:ListBucket on resource: "arn:aws:s3:::mi-sitio-cicd-metamari-2026"
because no identity-based policy allows the s3:ListBucket action
```

Este error ocurrió porque el usuario IAM utilizado por GitHub Actions no tenía permiso para listar el contenido del bucket S3.

Para solucionar el problema, se actualizó la política del usuario IAM agregando el permiso:

```text
s3:ListBucket
```

sobre el recurso:

```text
arn:aws:s3:::mi-sitio-cicd-metamari-2026
```

Después de corregir la política, el workflow pudo continuar con la sincronización de archivos hacia S3.

---

## 10. Configuración de CloudFront

Se creó una distribución de Amazon CloudFront para servir el sitio web mediante HTTPS y mejorar la distribución del contenido.

Datos de la distribución:

```text
Distribution name: mi-sitio-cicd-metamari-cloudfront
Distribution ID: ECOZ1UGTN3RUR
Origen: mi-sitio-cicd-metamari-2026.s3.sa-east-1.amazonaws.com
Default root object: index.html
WAF: No habilitado
```

Se seleccionó el origen de tipo Amazon S3 y se configuró el acceso privado al bucket mediante CloudFront.

También se configuró el objeto raíz por defecto:

```text
index.html
```

De esta forma, cuando un usuario accede a la URL de CloudFront, se carga automáticamente la página principal del sitio.

La URL pública generada por CloudFront fue:

```text
https://d2v7ej7sgkgclr.cloudfront.net/
```

---

## 11. Configuración de Origin Access Control

Para evitar que el bucket S3 quedara expuesto públicamente de forma permanente, se configuró CloudFront con acceso privado al bucket mediante Origin Access Control.

La política final del bucket permite que CloudFront lea los objetos del bucket únicamente cuando la solicitud proviene de la distribución configurada.

La política utilizada fue similar a la siguiente:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mi-sitio-cicd-metamari-2026/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::202264954577:distribution/ECOZ1UGTN3RUR"
        }
      }
    }
  ]
}
```

Con esta configuración, el acceso recomendado al sitio es mediante CloudFront y no directamente mediante el bucket S3.

---

## 12. URL pública del sitio

La URL principal del sitio desplegado es la URL generada por CloudFront:

```text
https://d2v7ej7sgkgclr.cloudfront.net/
```

También se utilizó el endpoint de S3 para la verificación inicial del sitio:

```text
http://mi-sitio-cicd-metamari-2026.s3-website-sa-east-1.amazonaws.com
```

---

## 13. Prueba del despliegue continuo

Para comprobar el funcionamiento del despliegue continuo, se realizó un cambio en el archivo `index.html` y se subió al repositorio mediante Git.

El flujo realizado fue:

```bash
git add .
git commit -m "feat: actualiza contenido visible del sitio"
git push origin main
```

Después del `push`, GitHub Actions ejecutó automáticamente el workflow de despliegue.

El pipeline sincronizó los archivos actualizados con S3 y posteriormente invalidó la caché de CloudFront para que el cambio estuviera disponible en la URL pública.

---

## 14. Resultado final

El resultado final fue un sitio web estático publicado en AWS, con despliegue automático desde GitHub.

Cada vez que se realiza un cambio en la rama `main`, GitHub Actions ejecuta el pipeline y actualiza el contenido en S3. Luego se invalida la caché de CloudFront para que los usuarios puedan ver la versión más reciente del sitio.

El sitio quedó disponible mediante una URL pública HTTPS proporcionada por CloudFront:

```text
https://d2v7ej7sgkgclr.cloudfront.net/
```

---

## 15. Conclusiones

La práctica permitió comprender el proceso completo de despliegue de una aplicación web estática utilizando servicios en la nube.

Se logró configurar un flujo CI/CD en el que GitHub Actions automatiza la publicación del sitio en Amazon S3. También se configuró Amazon CloudFront para servir el contenido mediante HTTPS y mejorar la distribución del sitio.

Durante el proceso se presentó un error de permisos relacionado con `s3:ListBucket`, el cual fue resuelto actualizando la política del usuario IAM. Esto permitió comprender la importancia de asignar correctamente los permisos mínimos necesarios para que un servicio pueda interactuar con AWS.

Finalmente, se comprobó que el despliegue continuo reduce el trabajo manual, evita errores repetitivos y facilita la publicación de cambios en una aplicación web estática.

---

## 16. Enlaces finales

```text
Repositorio GitHub:
https://github.com/meta-mari/lab6-1-mi-sitio-cicd

Sitio en CloudFront:
https://d2v7ej7sgkgclr.cloudfront.net/

Endpoint S3 de verificación:
http://mi-sitio-cicd-metamari-2026.s3-website-sa-east-1.amazonaws.com
```