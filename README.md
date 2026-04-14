# Doubly Linked List (ChainBuffer)

se usa una doubly linked list llamada `ChainBuffer` para manejar la cola de reproducción. Cada nodo conoce el elemento anterior y el siguiente, así que movernos hacia adelante o hacia atrás es directo.

Eso es útil para una cola de música porque muchas acciones cambian el primer, el último o un elemento intermedio de la lista. En vez de reconstruir todo el arreglo cada vez, `ChainBuffer` permite insertar, quitar o mover canciones de forma más natural para este caso.

## Dónde se usa

La implementación está en [src/ds/ChainBuffer.ts](src/ds/ChainBuffer.ts#L1).

En la cola de reproducción, `queueSlice` convierte la lista actual a un `ChainBuffer` cuando necesita hacer cambios mutables y luego vuelve a exportarla como arreglo: [src/store/queueSlice.ts](src/store/queueSlice.ts#L1).

Las operaciones que más se benefician de esto son `playNext` y `playPrevious`, porque avanzan o retroceden en la cola, y también acciones como `addToQueue`, `playNextInQueue`, `insertIntoQueue`, `removeFromQueue` y `toggleShuffle`, que modifican el orden de las canciones.

Para las listas de reproducción aplicamos un patrón análogo: el orden de la lista se gestiona mediante un motor de orden interno (la implementación `ChainBuffer`) que se utiliza temporalmente para aplicar mutaciones complejas sin reconstruir el arreglo completo.

La lógica relacionada se encuentra en la capa de estado: ver [src/store/playlistSlice.ts](src/store/playlistSlice.ts#L1) y la abstracción de orden en [src/store/playlistOrder.ts](src/store/playlistOrder.ts#L1).
