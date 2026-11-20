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
Cualquier cosa ubicada en el predio: una instalación de la sede o un elemento de referencia. Tiene posición en metros desde el origen del predio, rotación y medidas según su tipo; un camino o una valla, en vez de posición y rotación, tiene sus puntos.

**Instalación sin ubicar**:
Una instalación de la sede que todavía no está en el predio. Al quitarla del predio vuelve a estar sin ubicar, pero sigue en la sede.

**Elemento de referencia**:
Algo ubicado en el predio que no es una instalación: árbol, piedra, bebedero, gradas, tribuna, camino o valla. Su tipo vive en código y define su forma 3D y sus medidas. Puede tener un nombre propio opcional, que lo vuelve punto de referencia u homenaje («El ombú», «Gradas Tito»).
_Avoid_: referencia (a secas)

**Gradas**:
Elemento de referencia: escalones descubiertos, con largo, ancho y alto. La cantidad de escalones sale del alto.

**Tribuna**:
Elemento de referencia: gradas con techo, con las mismas medidas. No es una instalación.

**Camino**:
Elemento de referencia que se dibuja punto a punto: una franja sobre el pasto, con su ancho. Guarda sus puntos en metros desde el origen del predio, en vez de posición y rotación.

**Valla**:
Elemento de referencia que se dibuja punto a punto, como el camino: un cerco con su alto.
_Avoid_: cerco, alambrado

**Leyenda**:
La lista numerada que acompaña el predio 3D y explica qué es cada número. Un elemento del predio entra o no en la leyenda; lo que entra lleva un número según el orden de la leyenda, y lo demás es decorado.
_Avoid_: referencias

**Descripción** (de un elemento del predio):
Texto corto, de hasta 280 caracteres y sin formato, que se ve en la leyenda y al tocar el número en el 3D. No son las notas internas de la instalación.

**Predio armado**:
Un predio con área y al menos una instalación ubicada. Solo un predio armado se muestra en el club.

## Deportes

**Deporte**:
Lo que se juega en un club, con nombre, ícono y descripción; por ejemplo «Rugby masculino». Lo crea el Super Admin y cada club elige los suyos.

**Catálogo de deportes**:
Todos los deportes que creó el Super Admin. Es el mismo para todos los clubes.
_Avoid_: lista de deportes, tipos de deporte

**Deportes del club**:
Los deportes del catálogo que eligió un club. Los elige su Admin: sumar un deporte lo agrega al club y quitarlo lo saca (con confirmación). Si el Super Admin borra del catálogo un deporte que el club tenía, el club lo sigue viendo, marcado como borrado, y no lo puede volver a sumar.
_Avoid_: deportes habilitados, deportes activos

**Condición**:
Lo que tiene que cumplir un socio para anotarse, por ejemplo en un deporte: chequeos unidos por Y (todos) u O (alguno), con como máximo un subnivel, un grupo de chequeos con su propio Y/O. Sin chequeos, puede anotarse cualquier socio. Se lee en texto: «Masculino y 16 años o más». Es la misma para deportes, clubes y categorías.
_Avoid_: requisito, regla, filtro

**Condición del club**:
La condición que un club le suma a un deporte que eligió, por ejemplo «6 años o más» en un deporte que dice «hasta 12 años». La carga su Admin. Solo agrega chequeos: hay que cumplir la del deporte y la del club, así que no puede aflojar la del Super Admin. Sin chequeos, el club no suma nada. Quitar el deporte del club la borra.
_Avoid_: condición propia, condición local

**Condición efectiva**:
Todo lo que tiene que cumplir un socio para anotarse en un deporte de un club: la condición del deporte y la del club (y, con las categorías, la de la categoría). Se lee «Hasta 12 años, y además 6 años o más».

**Chequeo**:
Una pregunta de una condición sobre un dato del socio: el sexo, la edad que cumple en el año (año actual menos año de nacimiento) o el año de nacimiento. La edad y el año llevan desde, hasta o los dos.

**Deporte borrado**:
Un deporte que el Super Admin sacó del catálogo. No desaparece (soft delete): queda en «Ver borrados», ya no se edita y los clubes no lo pueden elegir.
