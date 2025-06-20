/**
 * Event Bus for Component Communication
 * Decouples components using publish/subscribe pattern
 */

class EventBus {
    constructor() {
        this.events = {};
        this.debugMode = false;
    }

    /**
     * Subscribe to an event
     */
    on(event, callback, context = null) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push({
            callback,
            context
        });

        if (this.debugMode) {
            console.log(`📡 EventBus: Subscribed to '${event}'`);
        }
    }

    /**
     * Emit an event
     */
    emit(event, data = null) {
        if (this.events[event]) {
            this.events[event].forEach(({ callback, context }) => {
                try {
                    if (context) {
                        callback.call(context, data);
                    } else {
                        callback(data);
                    }
                } catch (error) {
                    console.error(`❌ EventBus error in '${event}' handler:`, error);
                }
            });

            if (this.debugMode) {
                console.log(`📡 EventBus: Emitted '${event}' to ${this.events[event].length} listeners`);
            }
        }
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(
                listener => listener.callback !== callback
            );
        }
    }

    /**
     * Enable/disable debug logging
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`📡 EventBus debug mode: ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get event statistics
     */
    getStats() {
        const stats = {};
        Object.keys(this.events).forEach(event => {
            stats[event] = this.events[event].length;
        });
        return stats;
    }
}

// Create global event bus
window.eventBus = new EventBus();