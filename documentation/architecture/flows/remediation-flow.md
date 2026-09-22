# Remediación mediante pull requests

La remediación es una operación opcional, separada del scoring. Un check fallido puede ofrecer una receta determinista revisada en Scorecards. El catálogo solicita su ejecución en el repositorio central; la Action propone el cambio en una **rama nueva y un PR del servicio**. Nunca escribe en la rama predeterminada, hace merge ni transforma un resultado `fail` en `pass` por haber abierto un PR.

**Política explícita:** `action/config/remediation.json` prepara únicamente el [piloto acotado](#piloto-acotado-test-repo-minimal), con digest y allowlists fijados. La propuesta no activa main antes de su integración autorizada; instalar scoring no autoriza otros destinos. No publica imágenes ni verifica protecciones externas por sí misma.

## Diagramas mantenidos

Los HTML son autocontenidos; descargarlos y abrirlos localmente si el visor de GitHub no los representa. Los JSON adyacentes son las fuentes editables.

El contenido es español; los controles fijos del visor y su `html lang` usan el fallback inglés de Archify.

- [Componentes y límites de confianza](../diagrams/remediation/components.html) · [fuente](../diagrams/remediation/components.json)
- [Secuencia de solicitud y publicación](../diagrams/remediation/sequence.html) · [fuente](../diagrams/remediation/sequence.json)
- [Estados y terminación sin PR](../diagrams/remediation/lifecycle.html) · [fuente](../diagrams/remediation/lifecycle.json)

## Autoridades

| Dato o recurso                       | Autoridad                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| Código, receta, metadatos y política | Checkout revisado del repositorio central, no archivos del servicio           |
| Identidad y permisos del solicitante | `github.actor` y `github.triggering_actor`; ambos en la allowlist del destino |
| Revisión del servicio                | SHA actual de su rama predeterminada consultada en GitHub                     |
| Revisión de la suite                 | HEAD real del checkout central y SHA actual de su rama predeterminada         |
| Estado visible del check             | Última evaluación de scoring publicada en `catalog`                           |
| Capacidad anunciada                  | Metadatos validados proyectados en resultados; no autorización                |
| Escritura de rama y PR               | `SCORECARDS_WORKFLOW_TOKEN`, sólo en el proceso host confiable                |
| Corrección del árbol                 | Contenedor sin red, credenciales ni `.git`                                    |

El navegador, `catalog`, el árbol del servicio y todos los inputs del dispatch son no confiables. Ni `all-checks.json` ni un descriptor visible permiten seleccionar comandos o ampliar permisos. El `GITHUB_TOKEN` central tiene `contents: read`; **no** obtiene permiso sobre otro repositorio por llamar a un reusable workflow. Este diseño ejecuta el workflow central directamente; no finge contexto ni credenciales locales del servicio.

## Contrato del check

`checks/<check_id>/metadata.json` puede añadir:

```json
{
  "remediation": {
    "version": 1,
    "label": "Proponer badge de Scorecards",
    "timeout": 30,
    "allowed_paths": ["README.md", "README.rst", "README.txt", "README"]
  }
}
```

El directorio debe contener exactamente una receta regular, marcada como ejecutable, `remediate.sh`, `remediate.py` o `remediate.js`. La versión, etiqueta, timeout y lista de rutas se validan antes de anunciar o ejecutar la capacidad. No se aceptan enlaces simbólicos, rutas absolutas, escapes, comodines, `.git` ni workflows del servicio como archivos editables. Los límites generales y del sandbox viven en `action/config/remediation.json`.

El piloto `09-scorecard-badge` sólo añade el badge a un README regular existente y no ambiguo. No crea documentación inventada, no instala dependencias y no ejecuta scripts del servicio. Usa la identidad central y del servicio proporcionadas por el executor, no una URL enviada por el usuario. Repetir la receta no duplica el badge. La receta devuelve `not_applicable` si no encuentra un README elegible; el executor rechaza antes los árboles con symlinks como `invalid_diff`.

La receta devuelve `0` cuando termina, `3` cuando no es aplicable y otro código ante un fallo. El executor ejecuta el check antes y después: un check ya satisfecho no genera PR; una exclusión no se remedia; un fallo de infraestructura no se interpreta como un problema reparable. Tras la receta se requiere un diff permitido y que el check pase.

## Evaluación y compatibilidad

Cada resultado puede incluir `checks[].remediation = {version: 1, label}` y:

```typescript
interface EvaluationSource {
  service_repository: string;
  service_sha: string;
  suite_repository: string;
  suite_sha: string;
  run_id: string;
  run_attempt: number;
}
```

`service_sha` y `suite_sha` provienen de los checkouts reales, no de inferir la suite a partir de `GITHUB_SHA` del servicio. Un productor sin procedencia completa omite `evaluation`; aunque anuncie un descriptor, el catálogo mantiene el resultado en modo de sólo lectura. Los resultados antiguos siguen siendo legibles. Cambiar un SHA o un descriptor es significativo para publicar resultados; variar únicamente el run no obliga a un commit diario.

Las plantillas de scoring separan los checkouts del servicio y la plataforma; `service-workspace` impide evaluar accidentalmente el código central como parte del servicio. Tanto el instalador reutilizable como la instalación solicitada desde el catálogo sustituyen el repositorio central de la misma plantilla por el destino configurado. No se instala un segundo workflow de remediación en cada destino.

## Solicitud y correlación

El botón aparece únicamente para `fail` con descriptor v1 y procedencia con repositorios y SHAs válidos. Los estados `pass`, `excluded`, `error` y `skipped`, así como los resultados antiguos, no ofrecen ejecución. La sesión sin PAT abre Settings; un 401 invalida el token en ambos almacenes de autenticación. 403 y 404 no se presentan como éxito o ausencia de receta.

El dispatch a `.github/workflows/remediate-check.yml` envía sólo seis strings: `org`, `repo`, `check_id`, `service_sha`, `suite_sha`, `request_id`. El cliente consulta la rama predeterminada central; no presupone `main`. `request_id` es un UUID de correlación, no un permiso ni una clave durable de idempotencia.

La receta recibe `SERVICE_REPOSITORY` con las mayúsculas de `org/repo` conservadas desde el catálogo, porque las rutas de badges distinguen mayúsculas. La autorización, concurrencia y comparación de repositorios siguen usando la identidad normalizada.

La API común acepta las respuestas documentadas 200 y 204. En 200, el recibo requiere `workflow_run_id`, `run_url` y `html_url`; no admite el alias `run_id`. El identificador se comprueba contra el workflow y el título esperado. En 204, se consultan ejecuciones de ese workflow con `event=workflow_dispatch` y el título exacto `remediation:<request_id>`, acotadas por tiempo y paginación. Nunca se atribuye el último run observado a la solicitud. Las URLs admiten las mayúsculas canónicas de GitHub sólo en owner/repository; el origen, endpoint e identificador siguen siendo exactos. Si falla el transporte o la decodificación durante esa búsqueda posterior, la solicitud sigue aceptada pero sin enlace no verificado. Una respuesta ambigua o un timeout no provoca redispatch automático.

El catálogo enlaza la ejecución exacta; la ejecución ofrece su resumen y artefacto JSON. Una búsqueda opcional y acotada puede añadir el enlace de un PR atribuible por repositorio, base, prefijo del check, marcador y autor de la política central verificada. Puede ser un PR reutilizado de una ejecución anterior; no requiere el prefijo del run actual. Si se alcanza el límite de páginas sin agotar los resultados, no se atribuye ningún PR. Si no está disponible o falla esa búsqueda, se conservan el recibo aceptado y el enlace del run, cuyo resumen permite consultar el PR o el resultado. La API de runs no expone outputs arbitrarios del workflow ni el contenido del resumen. El navegador no descarga ZIPs para fingir ese contrato. Sólo se muestran enlaces de GitHub validados; el acceso a destinos privados continúa sujeto al token del usuario.

## Ejecución central

1. El job `validate` sólo se ejecuta desde la rama predeterminada central; hace checkout por `github.sha`, sin persistir credenciales.
2. `validate` comprueba formato, política, ambos actores y revisión central utilizando el token de lectura. Normaliza la clave de concurrencia; todavía no necesita el escritor del destino.
3. El job de remediación usa concurrencia por repositorio normalizado/check y `cancel-in-progress: false`. GitHub puede reemplazar un run pendiente: no se promete FIFO ni exactamente una ejecución.
4. `prepare` repite la autorización, verifica la identidad de `/user`, consulta la rama/SHA del destino y detecta PRs existentes antes de modificar archivos.
5. Materializa el árbol Git evaluado del servicio sin transformaciones de atributos de exportación (`export-subst` y `export-ignore`), `.git`, submódulos ni credenciales. El contenedor recibe código central de sólo lectura y un workspace desechable. Usa imagen por digest, usuario no root, red deshabilitada, raíz de sólo lectura, capacidades eliminadas y límites de tiempo/memoria/CPU/procesos/logs.
6. El host valida el diff: rutas explícitamente permitidas, archivos regulares, modos aceptados y límite de tamaño. El contenedor no puede escribir `prepared.json`, la política ni los metadatos Git del escritor.
7. `publish` vuelve a comprobar base y SHA y busca PRs existentes dentro del bloqueo. Si el servicio cambió, no hace rebase ni continúa silenciosamente. Construye el índice Git con los blobs exactos validados y sus modos originales, sin checkout ni conversiones de `working-tree-encoding` o filtros clean.
8. Crea `scorecards-remediation/<check_id>/<run_id>-<run_attempt>`, comprueba que no existe y publica únicamente `HEAD:refs/heads/<rama>`, sin force, borrado ni escritura a default. Después crea un PR con `head` y `base` explícitos.

Los destinos de clone y push se derivan exclusivamente del repositorio GitHub validado, sin override de remoto. Las pruebas redirigen esa URL a repositorios bare locales mediante configuración Git aislada del harness; no habilitan remotos alternativos en producción.

Los PRs reutilizables deben coincidir en repositorio (sin distinguir mayúsculas), base, prefijo de head del check, autor esperado y marcador exacto:

```html
<!-- scorecards-remediation:v1 check_id=09-scorecard-badge -->
```

Más de uno es ambiguo: no se elige arbitrariamente. Un PR abierto se devuelve sin sobrescribirlo; los cerrados no se reabren y sus ramas no se resetean. Si se publica la rama pero falla la creación del PR, queda para diagnóstico: no existe fallback de escritura directa. Ante una respuesta incierta de creación, se reconcilia por head/base antes de declarar el fallo, sin repetir ciegamente una escritura.

## Resultados operativos

`remediation-result.json` identifica versión, solicitud, repositorio/check, SHAs, digest de runtime, run/attempt/URL, estado y, cuando corresponden, rama candidata y PR. El resumen muestra estado, enlaces/rama disponibles y fase del fallo de publicación. Una rama indicada en `pr_failed` no demuestra que el push llegara a completarse. El artefacto se conserva cuando el proceso llega a producirlo; una cancelación abrupta puede no dejar resultado.

| Estado                                                           | Significado                                                                |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `pr_created`, `existing_pr`                                      | Propuesta disponible; el scoring sigue sin cambios                         |
| `no_diff`, `not_applicable`, `already_satisfied`, `not_eligible` | Terminación sin propuesta ni push vacío                                    |
| `stale_service`, `stale_suite`                                   | Reevaluar contra las revisiones actuales antes de solicitar otra ejecución |
| `unauthorized`, `ambiguous_existing_pr`                          | La política o la identificación del PR impide continuar                    |
| `check_failed_to_run`, `execution_failed`, `invalid_diff`        | No hay una corrección validada para publicar                               |
| `pr_failed`                                                      | Falló push/creación/reconciliación; revisar fase y posible rama retenida   |

Abrir o cerrar un PR no actualiza el score. Sólo una nueva evaluación después de una decisión humana publica el resultado correspondiente. No existe una base de trabajos adicional en `catalog`.

## Publicación del runtime

`publish-remediation-runtime.yml` sólo admite `workflow_dispatch`, sin inputs, en
`feddericovonwernich/scorecards:main`. Hace checkout del SHA del evento, no de código
de forks ni de una revisión elegida mediante input. **No ejecutarlo hasta revisar
e integrar su cambio mediante PR con aprobación del captain.** El filtro de rama
no demuestra revisión: proteger main y autorizar su integración siguen siendo
prerrequisitos externos. Abrir el PR no publica nada.

Construye el [runtime compartido](../../reference/action-reference.md#runtime-build),
ejecuta el smoke real y publica exclusivamente
`ghcr.io/feddericovonwernich/scorecards-remediation-runtime:<SHA completo>`.
Usa sólo `GITHUB_TOKEN` efímero con `contents: read` y `packages: write`; no requiere
PAT ni secrets nuevos. Las Actions externas están fijadas por commit. La etiqueta
OCI `org.opencontainers.image.source` enlaza el repositorio y `revision` registra
el SHA. El artefacto `remediation-runtime-evidence` conserva fuente, hashes de
entradas, build, versiones instaladas, smoke, manifest remoto y referencia por digest.
El digest se consulta al registro después del push y se descarga/verifica contra
el SHA; un ID o RepoDigest local no sustituye esa comprobación.

Según [GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry),
un paquete nuevo es privado por defecto. El token del workflow lo enlaza al
repositorio; si ya existía sin enlace/permisos heredados, el owner debe comprobar
«Manage Actions access» para **este repositorio**, sin ampliar permisos de cuenta.
Un push denegado no se resuelve añadiendo un PAT o borrando el paquete.

El executor actual no inicia sesión en GHCR: necesita descarga anónima. El workflow
comprueba el manifest con configuración Docker vacía después de publicar; si falla,
conserva el recibo de publicación pero **no está listo para activar**. El owner debe
revisar explícitamente la visibilidad pública del paquete, o tramitar otro diseño
de acceso por PR. Este workflow no cambia visibilidad ni permisos. Verificar además
un pull anónimo por digest desde el runner antes de configurar `runtime_image`.
No se afirma un bloqueo de permisos concreto antes de intentar el workflow revisado:
el inventario autenticado previo devolvió 403, no prueba ausencia del paquete.

Sólo después de publicación y acceso comprobados, llevar la referencia de
`runtime-image.txt` a una revisión de política independiente. Ningún paso activa,
despacha remediación ni integra el PR resultante automáticamente.

## Activación: prerrequisitos externos obligatorios

En una instalación nueva o un fork, antes de configurar secretos o habilitar
workflows, establecer `enabled: false` y retirar los destinos heredados de
`action/config/remediation.json`. La autorización del piloto no se transfiere
a otra plataforma.

1. Revisar y desplegar lectores tolerantes, productores con procedencia, código central y workflow. **Todavía mantener `enabled: false`.**
2. Revisar/publicar por separado el runtime con entradas fijadas y evidencia según [publicación del runtime](#publicación-del-runtime), verificar acceso remoto y configurar `runtime_image` por digest inmutable. Entradas fijadas, artefacto inmutable y reproducibilidad bit a bit son garantías distintas; no se afirma la última.
3. Identificar el titular de `SCORECARDS_WORKFLOW_TOKEN` sin revelar su valor. El executor exige coincidencia con `publisher_login`; no usa `SCORECARDS_CATALOG_TOKEN` como fallback.
4. Verificar reglas efectivas de la rama predeterminada en cada destino: revisión humana requerida, sin escritura directa ni bypass para ese titular, sin auto-merge del bot. La excepción de aprobaciones formales del [piloto acotado](#piloto-acotado-test-repo-minimal) no se extiende a otros destinos. Registrar la evidencia y fecha en `protection_evidence`. Este campo no sustituye la revisión de reglas ni garantiza que nunca cambien.
5. Añadir sólo el destino piloto y `09-scorecard-badge` a `targets`, con `actors`, `publisher_login` y `protection_evidence`. Aprobar expresamente la activación y cambiar `enabled` en una revisión protegida.
6. Ejecutar el piloto autorizado, revisar el diff/PR y comprobar que default permanece intacta. Ampliar destinos/checks sólo tras revisión de cada receta y sus límites.

Un PAT con `contents: write` **no es un token “sólo PR”** ni una restricción por rama. La separación del sandbox y el refspec reducen el riesgo de ejecución, pero la garantía externa contra un escritor comprometido depende de reglas sin bypass y de proteger el código/workflow central y sus secretos. Si no puede verificarse esa condición, no activar.

### Piloto acotado: test-repo-minimal

La política preparada habilita exclusivamente `feddericovonwernich/test-repo-minimal`,
check `09-scorecard-badge`, actor y publicador `feddericovonwernich`. No autoriza
otros repositorios ni checks. `enabled: true` en la rama de propuesta no cambia
main: **No integrar esta política hasta que el productor esté listo,
los checks estén verdes y exista autoridad explícita para integrar.**

Evidencia disponible:

- Runtime fijado en `action/config/remediation.json`, publicado desde
  `b73a323e91fb537220e91e8b5b3481dd249dd873` en
  [el run de publicación](https://github.com/feddericovonwernich/scorecards/actions/runs/35658198735).
  El recibo confirma manifest y pull anónimos, revisión de fuente y smoke de
  la imagen descargada. No demuestra reproducibilidad bit a bit ni el piloto.
- [Pages desplegado](https://github.com/feddericovonwernich/scorecards/actions/runs/35666405366):
  el recibo de operación compara los 19 archivos servidos con el artefacto,
  sin diferencias. Esto prueba publicación del catálogo, no elegibilidad.
- Rotación de credenciales registrada el 2026-09-22T23:10:06.161Z: `/user` con
  los tokens nuevos identifica `feddericovonwernich`; provisión y lecturas
  verificadas. Los consumidores todavía no han ejercitado escrituras reales.
  La política no amplía permisos ni convierte el token en una credencial aislada
  por repositorio.
- Lectura API de protección clásica de ambas `main` (central y destino),
  2026-09-22T23:21:34Z: PR obligatorio, `required_approving_review_count=0`,
  code-owner/last-push approval desactivados, admins sujetos, force/delete
  desactivados; sin cambios de reglas. `required_status_checks=null`:
  checks verdes son requisito operativo de integración, no una lista impuesta
  por GitHub.

Captain request32 autoriza que el owner revise y mergee con su cuenta tras
checks verdes, sin bot/revisor adicional ni aprobación independiente formal.
No se afirma una aprobación humana ya realizada. La receta nunca mergea;
PR-only sigue siendo obligatorio y no se autoriza bypass.

Después de integrar la política central final y el productor actualizado,
generar una evaluación nueva cuya `suite_sha` sea ese SHA central final;
una evaluación anterior no es evidencia de preparación. Sólo después, en la
operación autorizada, verificar **botón real → run atribuible → PR del badge**,
diff acotado y default intacta. Preparar esta política no ejecuta workflows
ni demuestra esas escrituras: el piloto sigue sin prueba end-to-end.

## Rollback

Deshabilitar primero la política o el workflow y retirar elegibilidad; después retirar el botón/descriptores si procede. Deshabilitar nuevos dispatches no cancela necesariamente ejecuciones ya iniciadas: decidir su cancelación explícitamente. No borrar ramas ni cerrar/mergear PRs existentes automáticamente. Conservar resumen/artefactos para diagnóstico. El scoring de sólo lectura continúa disponible.

## Ubicación del código

La política de cada `targets["owner/repo"]` contiene únicamente `check_ids: string[]`, `actors: string[]`, `publisher_login: string` y `protection_evidence: string`. Una política aún deshabilitada puede preconfigurar targets y digest para revisión sin autorizar ejecuciones.

- Política y validación: `action/config/remediation.json`, `action/lib/remediation.sh`.
- Executor: `action/utils/run-remediation.sh`; wrapper: `action/remediate/action.yml`.
- Orquestación: `.github/workflows/remediate-check.yml`.
- Piloto: `checks/09-scorecard-badge/`.
- Catálogo: API GitHub común, `ServiceModal` y `ChecksTab` en `docs/src/`.

Véanse también [tokens](../../reference/token-requirements.md), [desarrollo de checks](../../guides/check-development-guide.md) y [scoring](scoring-flow.md).
