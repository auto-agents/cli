# dev CLI Tool : generate doc

## events flow

make a `mermaid` flow diagram that shows:
- any class that **emits** an event with the event characteristics
- any class that **handle** an event
- indicates on the links the properties
- incicates on the links if it is `emit` or `on`

regarding any class defined in the project folder `cli/source`.
- events are emitted using the syntax `emit(eventName,eventData)`
- events are handled using the syntax `on(event,eventHandlerFunction)`

save the diagram in the file: `cli/doc/generated/events-flow.md`.

use the direction `LR`.
draw events and class names using color `black`

