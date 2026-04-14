# Doubly Linked List (ChainBuffer)

Resumen

- En este proyecto se utiliza una estructura de lista doblemente enlazada llamada `ChainBuffer` para operaciones de cola y manipulación eficiente de la lista de reproducción.

Implementación en este repo

- La implementación está en [src/ds/ChainBuffer.ts](src/ds/ChainBuffer.ts#L1).
  - Tipos clave: `ChainCell<T>` (nodo con `item`, `before`, `after`).
  - Métodos principales: `addStart`, `addEnd`, `addAt`, `takeStart`, `takeEnd`, `takeAt`, `detachCell`, `exportItems`, `loadItems`, `readStart`, `readEnd`, `getCount`, `isEmpty`.

Dónde se utiliza en la aplicación

- El slice de la cola (`queueSlice`) convierte la cola actual en un `ChainBuffer` cuando necesita hacer operaciones mutables y luego exporta el resultado como arreglo: [src/store/queueSlice.ts](src/store/queueSlice.ts#L1).
  - Ejemplos de uso en `queueSlice`: `playNext`, `playPrevious`, `addToQueue`, `playNextInQueue`, `insertIntoQueue`, `removeFromQueue`, `toggleShuffle`.
  - Ventaja práctica: muchas de estas operaciones hacen inserciones o eliminaciones al inicio/fin, o requieren remover un elemento en una posición concreta — operaciones donde `ChainBuffer` es adecuado.

Referencias en el código

- Implementación `ChainBuffer`: [src/ds/ChainBuffer.ts](src/ds/ChainBuffer.ts#L1)
- Implementación `Deque` (array + head): [src/ds/Deque.ts](src/ds/Deque.ts#L1)
- Uso en el slice de cola: [src/store/queueSlice.ts](src/store/queueSlice.ts#L1)
