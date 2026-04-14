import { useDroppable } from "@dnd-kit/core";

interface QueueDropIndicatorProps {
    index: number;
    isLast?: boolean;
}

export function QueueDropIndicator({ index, isLast = false, activeDragType }: QueueDropIndicatorProps & { activeDragType?: string | null }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `queue-insert-${index}`,
        data: {
            type: "queue-insert",
            index,
        },
    });
    const showActive = isOver && activeDragType === "queue-track";

    return (
        <li
            ref={setNodeRef}
            className={`queue-drop-indicator ${showActive ? "queue-drop-indicator--active" : ""} ${isLast ? "queue-drop-indicator--last" : ""}`}
            aria-hidden
        />
    );
}
