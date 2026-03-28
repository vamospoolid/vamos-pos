import { EventEmitter } from 'events';

/**
 * Global Event Bus untuk komunikasi antar modul tanpa dependency sirkular.
 */
class EventBus extends EventEmitter {}

export const eventBus = new EventBus();
