

declare module "column-resizer" {
    export default class ColumnResizer{
        constructor(table: HTMLTableElement, props: {      
            liveDrag: boolean,
            minWidth: number,
            gripInnerHtml: string,
            onResize: (e:Event) => void,
        })

        onResize():void;
        destroy():void;
    }
}

declare module "react-keyboard-event-handler" {
    import React from "react";
    export const KeyboardEventHandler: JSX.Element<{
        handleFocusableElements: boolean;
        handleKeys?: string[];
        onKeyEvent: { (key: string, e: React.KeyboardEvent): void };
    }>;
    export default KeyboardEventHandler;
}