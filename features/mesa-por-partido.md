# Mesa por partido, con acceso único

Octavo ítem del paso 1. Todavía no implementado.

## Objetivo

El admin entrega un QR o un link para que un responsable opere un solo partido desde el celular, sin ser admin. Ese acceso vence al cerrar el partido.

## Alcance

- Se crea desde el celular del admin, en la ficha del partido: QR, link, copiar y WhatsApp.
- Hay un solo acceso vigente por partido. Crear otro vence el anterior. El admin también puede revocarlo a mano.
- Vence al cerrar el partido (`finalizado`, `wo` o `no_jugado`).
- El responsable entra sin cuenta de Clerk y ve solo ese partido.
- El admin, con su sesión, sigue operando todos los partidos.

## Criterios de aceptación

- Un acceso sirve para un solo partido y deja de andar cuando ese partido se cierra o el admin lo revoca.
- El admin no pierde el control de la mesa.
- Hay mocks aprobados por Jerónimo antes de tocar el código.
- Si cambia el modelo, la migración idempotente y el DER van en el mismo commit.

## Decisiones

- El responsable de mesa no es admin: entra solo con el link de ese partido, sin cuenta de Clerk (15/11/2026).
- Jerónimo es el único admin (15/11/2026).

## Abierto

- Si el responsable de mesa puede cerrar el partido (y en ese momento se le vence el acceso) queda para confirmar al implementar este ítem. La recomendación es que sí pueda cerrarlo.
