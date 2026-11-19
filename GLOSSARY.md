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

**Elemento del predio**:
Cualquier cosa ubicada en el predio: una instalación de la sede o un elemento de referencia. Tiene posición en metros desde el origen del predio, rotación y medidas según su tipo.

**Instalación sin ubicar**:
Una instalación de la sede que todavía no está en el predio. Al quitarla del predio vuelve a estar sin ubicar, pero sigue en la sede.

**Elemento de referencia**:
Algo ubicado en el predio que no es una instalación: árbol, camino, valla, piedra, bebedero.
_Avoid_: referencia (a secas)

**Leyenda**:
La lista numerada que acompaña el predio 3D y explica qué es cada número. Un elemento del predio entra o no en la leyenda; lo que entra lleva un número según el orden de la leyenda, y lo demás es decorado.
_Avoid_: referencias

**Descripción** (de un elemento del predio):
Texto corto, de hasta 280 caracteres y sin formato, que se ve en la leyenda y al tocar el número en el 3D. No son las notas internas de la instalación.

**Predio armado**:
Un predio con área y al menos una instalación ubicada. Solo un predio armado se muestra en el club.
