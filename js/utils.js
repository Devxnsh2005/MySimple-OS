// Utility functions for the OS simulator

class Logger {
    static log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        
        switch (type) {
            case 'success':
                console.log(`%c${logEntry}`, 'color: #4CAF50');
                break;
            case 'warning':
                console.warn(`%c${logEntry}`, 'color: #FF9800');
                break;
            case 'error':
                console.error(`%c${logEntry}`, 'color: #F44336');
                break;
            default:
                console.log(`%c${logEntry}`, 'color: #2196F3');
        }
        
        return logEntry;
    }
}

class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}

class Utils {
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static createElement(tag, className, innerHTML) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }
    
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    static sanitizeInput(input) {
        return input.replace(/[<>&"']/g, function(match) {
            switch (match) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                case "'": return '&#x27;';
                default: return match;
            }
        });
    }
}

// Global event bus for inter-component communication
window.OSEventBus = new EventEmitter();

// Global logger
window.OSLogger = Logger;

// Export utilities
window.OSUtils = Utils;
