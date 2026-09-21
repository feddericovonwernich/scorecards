# Remediación mediante pull requests

La remediación es una operación opcional, separada del scoring. Un check fallido puede ofrecer una receta determinista revisada en Scorecards. El catálogo solicita su ejecución en el repositorio central; la Action propone el cambio en una **rama nueva y un PR del servicio**. Nunca escribe en la rama predeterminada, hace merge ni transforma un resultado `fail` en `pass` por haber abierto un PR.

**Deshabilitada de fábrica:** `action/config/remediation.json` contiene `enabled: false`, `runtime_image: null` y `targets: {}`. Incorporar este código no activa destinos, publica imágenes ni verifica protecciones externas. Activar requiere completar los prerrequisitos de este documento mediante un cambio revisado.

## Diagramas mantenidos

Los HTML son autocontenidos; descargarlos y abrirlos localmente si el visor de GitHub no los representa. Los JSON adyacentes son las fuentes editables.

El contenido es español; los controles fijos del visor y su `html lang` usan el fallback inglés de Archify.

- [Componentes y límites de confianza](../diagrams/remediation/components.html) · [fuente](../diagrams/remediation/components.json)
- [Secuencia de solicitud y publicación](../diagrams/remediation/sequence.html) · [fuente](../diagrams/remediation/sequence.json)
- [Estados y terminación sin PR](../diagrams/remediation/lifecycle.html) · [fuente](../diagrams/remediation/lifecycle.json)

## Autoridades

| Dato o recurso | Autoridad |
| --- | --- |
| Código, receta, metadatos y política | Checkout revisado del repositorio central, no archivos del servicio |
| Identidad y permisos del solicitante | `github.actor` y `github.triggering_actor`; ambos en la allowlist del destino |
| Revisión del servicio | SHA actual de su rama predeterminada consultada en GitHub |
| Revisión de la suite | HEAD real del checkout central y SHA actual de su rama predeterminada |
| Estado visible del check | Última evaluación de scoring publicada en `catalog` |
| Capacidad anunciada | Metadatos validados proyectados en resultados; no autorización |
| Escritura de rama y PR | `SCORECARDS_WORKFLOW_TOKEN`, sólo en el proceso host confiable |
| Corrección del árbol | Contenedor sin red, credenciales ni `.git` |

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

Las plantillas de scoring separan los checkouts del servicio y la plataforma; `service-workspace` impide evaluar accidentalmente el código central como parte del servicio. No se instala un segundo workflow de remediación en cada destino.

## Solicitud y correlación

El botón aparece únicamente para `fail` con descriptor v1 y procedencia con repositorios y SHAs válidos. Los estados `pass`, `excluded`, `error` y `skipped`, así como los resultados antiguos, no ofrecen ejecución. La sesión sin PAT abre Settings; un 401 invalida el token en ambos almacenes de autenticación. 403 y 404 no se presentan como éxito o ausencia de receta.

El dispatch a `.github/workflows/remediate-check.yml` envía sólo seis strings: `org`, `repo`, `check_id`, `service_sha`, `suite_sha`, `request_id`. El cliente consulta la rama predeterminada central; no presupone `main`. `request_id` es un UUID de correlación, no un permiso ni una clave durable de idempotencia.

La API común acepta las respuestas documentadas 200 y 204. Un identificador devuelto se comprueba contra el workflow y el título esperado. Sin identificador, se consultan ejecuciones de ese workflow con `event=workflow_dispatch` y el título exacto `remediation:<request_id>`, acotadas por tiempo y paginación. Nunca se atribuye el último run observado a la solicitud. Una respuesta ambigua o un timeout no provoca redispatch automático.

El catálogo enlaza la ejecución exacta; la ejecución ofrece su resumen y artefacto JSON. La API de runs no expone outputs arbitrarios del workflow ni el contenido del resumen. El navegador no descarga ZIPs para fingir ese contrato. Sólo se muestran enlaces de GitHub validados; el acceso a destinos privados continúa sujeto al token del usuario.

## Ejecución central

1. El workflow sólo arranca desde la rama predeterminada central; checkout por `github.sha`, sin persistir credenciales.
2. `validate` comprueba formato, política, ambos actores y revisión central utilizando el token de lectura. Normaliza la clave de concurrencia; todavía no necesita el escritor del destino.
3. El job de remediación usa concurrencia por repositorio normalizado/check y `cancel-in-progress: false`. GitHub puede reemplazar un run pendiente: no se promete FIFO ni exactamente una ejecución.
4. `prepare` repite la autorización, verifica la identidad de `/user`, consulta la rama/SHA del destino y detecta PRs existentes antes de modificar archivos.
5. Exporta el árbol del servicio sin `.git`, submódulos ni credenciales. El contenedor recibe código central de sólo lectura y un workspace desechable. Usa imagen por digest, usuario no root, red deshabilitada, raíz de sólo lectura, capacidades eliminadas y límites de tiempo/memoria/CPU/procesos/logs.
6. El host valida el diff: rutas explícitamente permitidas, archivos regulares, modos aceptados y límite de tamaño. El contenedor no puede escribir `prepared.json`, la política ni los metadatos Git del escritor.
7. `publish` vuelve a comprobar base y SHA y busca PRs existentes dentro del bloqueo. Si el servicio cambió, no hace rebase ni continúa silenciosamente.
8. Crea `scorecards-remediation/<check_id>/<run_id>-<run_attempt>`, comprueba que no existe y publica únicamente `HEAD:refs/heads/<rama>`, sin force, borrado ni escritura a default. Después crea un PR con `head` y `base` explícitos.

Los PRs reutilizables deben coincidir en repositorio, base, prefijo de head, autor esperado y marcador exacto:

```html
<!-- scorecards-remediation:v1 check_id=09-scorecard-badge -->
```

Más de uno es ambiguo: no se elige arbitrariamente. Un PR abierto se devuelve sin sobrescribirlo; los cerrados no se reabren y sus ramas no se resetean. Si se publica la rama pero falla la creación del PR, queda para diagnóstico: no existe fallback de escritura directa. Ante una respuesta incierta de creación, se reconcilia por head/base antes de declarar el fallo, sin repetir ciegamente una escritura.

## Resultados operativos

`remediation-result.json` identifica versión, solicitud, repositorio/check, SHAs, digest de runtime, run/attempt/URL, estado y, cuando corresponden, rama candidata y PR. El resumen muestra estado, enlaces/rama disponibles y fase del fallo de publicación. Una rama indicada en `pr_failed` no demuestra que el push llegara a completarse. El artefacto se conserva cuando el proceso llega a producirlo; una cancelación abrupta puede no dejar resultado.

| Estado | Significado |
| --- | --- |
| `pr_created`, `existing_pr` | Propuesta disponible; el scoring sigue sin cambios |
| `no_diff`, `not_applicable`, `already_satisfied`, `not_eligible` | Terminación sin propuesta ni push vacío |
| `stale_service`, `stale_suite` | Reevaluar contra las revisiones actuales antes de solicitar otra ejecución |
| `unauthorized`, `ambiguous_existing_pr` | La política o la identificación del PR impide continuar |
| `check_failed_to_run`, `execution_failed`, `invalid_diff` | No hay una corrección validada para publicar |
| `pr_failed` | Falló push/creación/reconciliación; revisar fase y posible rama retenida |

Abrir o cerrar un PR no actualiza el score. Sólo una nueva evaluación después de una decisión humana publica el resultado correspondiente. No existe una base de trabajos adicional en `catalog`.

## Activación: prerrequisitos externos obligatorios

1. Revisar y desplegar lectores tolerantes, productores con procedencia, código central y workflow. **Todavía mantener `enabled: false`.**
2. Revisar/publicar por separado una imagen reproducible de runtime, obtener su digest inmutable y configurar `runtime_image`. La imagen de scoring construida con tags móviles no constituye evidencia de reproducibilidad.
3. Identificar el titular de `SCORECARDS_WORKFLOW_TOKEN` sin revelar su valor. El executor exige coincidencia con `publisher_login`; no usa `SCORECARDS_CATALOG_TOKEN` como fallback.
4. Verificar reglas efectivas de la rama predeterminada en cada destino: revisión humana requerida, sin escritura directa ni bypass para ese titular, sin auto-merge del bot. Registrar la evidencia y fecha en `protection_evidence`. Este campo no sustituye la revisión de reglas ni garantiza que nunca cambien.
5. Añadir sólo el destino piloto y `09-scorecard-badge` a `targets`, con `actors`, `publisher_login` y `protection_evidence`. Aprobar expresamente la activación y cambiar `enabled` en una revisión protegida.
6. Ejecutar el piloto autorizado, revisar el diff/PR y comprobar que default permanece intacta. Ampliar destinos/checks sólo tras revisión de cada receta y sus límites.

Un PAT con `contents: write` **no es un token “sólo PR”** ni una restricción por rama. La separación del sandbox y el refspec reducen el riesgo de ejecución, pero la garantía externa contra un escritor comprometido depende de reglas sin bypass y de proteger el código/workflow central y sus secretos. Si no puede verificarse esa condición, no activar.

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
