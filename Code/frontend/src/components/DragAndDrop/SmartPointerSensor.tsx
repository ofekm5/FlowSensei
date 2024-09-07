import type { PointerEvent } from "react";
import { PointerSensor } from "@dnd-kit/core";

/**
 * An extended "PointerSensor" that prevent some
 * interactive html element(button, input, textarea, select, option...) from dragging
 */
export class SmartPointerSensor extends PointerSensor {
    static activators = [
        {
            eventName: "onPointerDown" as any,
            handler: ({ nativeEvent: event }: PointerEvent) => {
                return shouldHandleEvent(event.target as HTMLElement);
            },
        },
    ];
}

function shouldHandleEvent(element: HTMLElement | null) {
    return  Boolean(element && element.dataset && element.dataset.yesDnd);
  }