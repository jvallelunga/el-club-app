# El Club

La app del club: el club organiza sus torneos y, más adelante, su día a día. Las funcionalidades son las mismas para todos los clubes; cada uno personaliza su marca.

## Sedes y predios

**Sede**:
Un lugar físico del club, con nombre, dirección y ubicación.

**Instalación**:
Algo de una sede que el club usa y nombra, por ejemplo «Cancha 1» o «Pileta». Siempre es de un tipo de instalación.

**Tipo de instalación**:
La clase de una instalación (cancha de rugby, pileta, quincho…), igual para todos los clubes. Define la forma 3D y qué medidas se pueden configurar. «Otra» es un tipo más, con forma de bloque genérico.
_Avoid_: tipo propio, tipo del club

**Predio**:
La representación 3D de una sede: el área del predio más todo lo ubicado en ella. Una sede tiene a lo sumo un predio.
_Avoid_: mapa, plano

**Área del predio**:
El polígono, marcado sobre el mapa satelital, que delimita el predio.

**Origen del predio**:
El punto (latitud y longitud) desde el que se ubica todo el predio. Arranca en la ubicación de la sede, pero es propio del predio.

**Elemento de referencia**:
Algo ubicado en el predio que no es una instalación: árbol, camino, valla, piedra, bebedero.
_Avoid_: referencia (a secas)

**Leyenda**:
La lista numerada que acompaña el predio 3D y explica qué es cada número.
_Avoid_: referencias

**Predio armado**:
Un predio con área y al menos una instalación ubicada. Solo un predio armado se muestra en el club.
