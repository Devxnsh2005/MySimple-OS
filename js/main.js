// Main application controller for SimpleOS

class SimpleOS {
    constructor() {
        this.isBooted = false;
        this.components = {
            bootloader: null,
            memoryManager: null,
            processScheduler: null,
            fileSystem: null,
            shell: null
        };
        
        this.initialize();
    }
    
    initialize() {
        OSLogger.log('Initializing SimpleOS...', 'info');
        
        // Set up global event listeners
        this.setupGlobalEventListeners();
        
        // Wait for boot completion
        OSEventBus.on('bootComplete', (data) => {
            this.onBootComplete(data);
        });
        
        // Set up window management
        this.setupWindowManagement();
        
        OSLogger.log('SimpleOS initialized', 'success');
    }
    
    onBootComplete(bootData) {
        this.isBooted = true;
        OSLogger.log(`Boot completed in ${bootData.bootTime}ms`, 'success');
        
        // Register components
        this.components.bootloader = window.bootloader;
        this.components.memoryManager = window.memoryManager;
        this.components.processScheduler = window.processScheduler;
        this.components.fileSystem = window.fileSystem;
        this.components.shell = window.shell;
        
        // Start system monitoring
        this.startSystemMonitoring();
        
        // Show welcome notification
        this.showNotification('SimpleOS has started successfully!', 'success');
    }
    
    setupGlobalEventListeners() {
        // Handle component events
        OSEventBus.on('memoryAllocated', (data) => {
            this.onMemoryEvent('allocated', data);
        });
        
        OSEventBus.on('memoryDeallocated', (data) => {
            this.onMemoryEvent('deallocated', data);
        });
        
        OSEventBus.on('processCreated', (data) => {
            this.onProcessEvent('created', data);
        });
        
        OSEventBus.on('processKilled', (data) => {
            this.onProcessEvent('killed', data);
        });
        
        OSEventBus.on('fileCreated', (data) => {
            this.onFileSystemEvent('file_created', data);
        });
        
        OSEventBus.on('directoryCreated', (data) => {
            this.onFileSystemEvent('directory_created', data);
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }
    
    setupWindowManagement() {
        // Make windows draggable
        const windows = document.querySelectorAll('.window');
        windows.forEach(window => {
            this.makeDraggable(window);
            this.setupWindowControls(window);
        });
        
        // Handle start menu
        const startButton = document.getElementById('start-menu-btn');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.toggleStartMenu();
            });
        }
    }
    
    makeDraggable(windowElement) {
        const header = windowElement.querySelector('.window-header');
        if (!header) return;
        
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(window.getComputedStyle(windowElement).left);
            startTop = parseInt(window.getComputedStyle(windowElement).top);
            
            windowElement.style.zIndex = this.getNextZIndex();
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            windowElement.style.left = (startLeft + deltaX) + 'px';
            windowElement.style.top = (startTop + deltaY) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    setupWindowControls(windowElement) {
        const controls = windowElement.querySelectorAll('.window-btn');
        
        controls.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (btn.classList.contains('close')) {
                    this.closeWindow(windowElement);
                } else if (btn.classList.contains('minimize')) {
                    this.minimizeWindow(windowElement);
                } else if (btn.classList.contains('maximize')) {
                    this.maximizeWindow(windowElement);
                }
            });
        });
    }
    
    closeWindow(windowElement) {
        windowElement.style.display = 'none';
        OSLogger.log(`Window closed: ${windowElement.id}`, 'info');
    }
    
    minimizeWindow(windowElement) {
        windowElement.style.display = 'none';
        OSLogger.log(`Window minimized: ${windowElement.id}`, 'info');
    }
    
    maximizeWindow(windowElement) {
        const isMaximized = windowElement.classList.contains('maximized');
        
        if (isMaximized) {
            // Restore
            windowElement.classList.remove('maximized');
            windowElement.style.width = windowElement.dataset.originalWidth || '400px';
            windowElement.style.height = windowElement.dataset.originalHeight || '300px';
            windowElement.style.top = windowElement.dataset.originalTop || '50px';
            windowElement.style.left = windowElement.dataset.originalLeft || '50px';
        } else {
            // Maximize
            windowElement.dataset.originalWidth = windowElement.style.width;
            windowElement.dataset.originalHeight = windowElement.style.height;
            windowElement.dataset.originalTop = windowElement.style.top;
            windowElement.dataset.originalLeft = windowElement.style.left;
            
            windowElement.classList.add('maximized');
            windowElement.style.width = '100%';
            windowElement.style.height = 'calc(100vh - 40px)';
            windowElement.style.top = '0';
            windowElement.style.left = '0';
        }
        
        OSLogger.log(`Window ${isMaximized ? 'restored' : 'maximized'}: ${windowElement.id}`, 'info');
    }
    
    getNextZIndex() {
        const windows = document.querySelectorAll('.window');
        let maxZ = 100;
        
        windows.forEach(window => {
            const z = parseInt(window.style.zIndex) || 100;
            if (z > maxZ) maxZ = z;
        });
        
        return maxZ + 1;
    }
    
    startSystemMonitoring() {
        // Monitor system performance every 5 seconds
        setInterval(() => {
            this.updateSystemMetrics();
        }, 5000);
        
        // Check for low memory conditions
        setInterval(() => {
            this.checkSystemHealth();
        }, 10000);
    }
    
    updateSystemMetrics() {
        if (!this.isBooted) return;
        
        const metrics = {
            memory: {
                used: this.components.memoryManager?.getUsedMemory() || 0,
                total: this.components.memoryManager?.getTotalMemory() || 1024,
                free: this.components.memoryManager?.getFreeMemory() || 1024
            },
            processes: {
                running: this.components.processScheduler?.processes.size || 0,
                stats: this.components.processScheduler?.getStatistics() || {}
            },
            uptime: Math.floor((Date.now() - (this.components.bootloader?.startTime || Date.now())) / 1000)
        };
        
        // Emit metrics update event
        OSEventBus.emit('systemMetricsUpdated', metrics);
    }
    
    checkSystemHealth() {
        if (!this.isBooted) return;
        
        // Check memory usage
        if (this.components.memoryManager) {
            const memoryUsage = (this.components.memoryManager.getUsedMemory() / 
                               this.components.memoryManager.getTotalMemory()) * 100;
            
            if (memoryUsage > 90) {
                this.showNotification('Warning: Memory usage is above 90%', 'warning');
                OSLogger.log('High memory usage detected', 'warning');
            }
        }
        
        // Check process count
        if (this.components.processScheduler) {
            const processCount = this.components.processScheduler.processes.size;
            
            if (processCount > 20) {
                this.showNotification('Warning: High number of processes running', 'warning');
                OSLogger.log('High process count detected', 'warning');
            }
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl+Alt+T - Open terminal
        if (e.ctrlKey && e.altKey && e.key === 't') {
            e.preventDefault();
            this.showWindow('terminal-window');
        }
        
        // Ctrl+Alt+M - Open memory manager
        if (e.ctrlKey && e.altKey && e.key === 'm') {
            e.preventDefault();
            this.showWindow('memory-window');
        }
        
        // Ctrl+Alt+P - Open process scheduler
        if (e.ctrlKey && e.altKey && e.key === 'p') {
            e.preventDefault();
            this.showWindow('scheduler-window');
        }
        
        // Ctrl+Alt+F - Open file system
        if (e.ctrlKey && e.altKey && e.key === 'f') {
            e.preventDefault();
            this.showWindow('filesystem-window');
        }
        
        // Alt+F4 - Close active window
        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            const activeWindow = document.querySelector('.window:not([style*="display: none"])');
            if (activeWindow) {
                this.closeWindow(activeWindow);
            }
        }
    }
    
    showWindow(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            window.style.display = 'block';
            window.style.zIndex = this.getNextZIndex();
            OSLogger.log(`Window opened: ${windowId}`, 'info');
        }
    }
    
    handleWindowResize() {
        // Ensure windows stay within viewport
        const windows = document.querySelectorAll('.window');
        windows.forEach(window => {
            const rect = window.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            if (rect.right > viewportWidth) {
                window.style.left = (viewportWidth - rect.width) + 'px';
            }
            if (rect.bottom > viewportHeight) {
                window.style.top = (viewportHeight - rect.height - 40) + 'px'; // 40px for taskbar
            }
        });
    }
    
    toggleStartMenu() {
        // Simple start menu implementation
        const existingMenu = document.getElementById('start-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const menu = document.createElement('div');
        menu.id = 'start-menu';
        menu.className = 'start-menu';
        menu.innerHTML = `
            <div class="menu-item" onclick="simpleOS.showWindow('terminal-window')">
                <i class="fas fa-terminal"></i> Terminal
            </div>
            <div class="menu-item" onclick="simpleOS.showWindow('memory-window')">
                <i class="fas fa-memory"></i> Memory Manager
            </div>
            <div class="menu-item" onclick="simpleOS.showWindow('scheduler-window')">
                <i class="fas fa-cogs"></i> Process Scheduler
            </div>
            <div class="menu-item" onclick="simpleOS.showWindow('filesystem-window')">
                <i class="fas fa-folder"></i> File System
            </div>
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="simpleOS.shutdown()">
                <i class="fas fa-power-off"></i> Shutdown
            </div>
        `;
        
        // Position menu above start button
        const startButton = document.getElementById('start-menu-btn');
        const buttonRect = startButton.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.bottom = '40px';
        menu.style.left = '0px';
        menu.style.background = 'hsl(var(--secondary-bg))';
        menu.style.border = '1px solid hsl(var(--border-color))';
        menu.style.borderRadius = '5px';
        menu.style.padding = '0.5rem 0';
        menu.style.minWidth = '200px';
        menu.style.zIndex = '10000';
        
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== startButton) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
    
    shutdown() {
        if (confirm('Are you sure you want to shutdown SimpleOS?')) {
            OSLogger.log('System shutdown initiated', 'info');
            
            // Stop all components
            if (this.components.processScheduler) {
                this.components.processScheduler.stopScheduler();
            }
            
            // Show shutdown screen
            document.body.innerHTML = `
                <div class="shutdown-screen">
                    <h1><i class="fas fa-power-off"></i> SimpleOS</h1>
                    <p>System shutdown complete</p>
                    <p>It is now safe to close this window</p>
                </div>
            `;
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'info'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            background: hsl(var(--secondary-bg));
            border: 1px solid hsl(var(--border-color));
            border-radius: 5px;
            padding: 1rem;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 300px;
            box-shadow: 0 5px 20px hsl(0 0% 0% / 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Event handlers
    onMemoryEvent(action, data) {
        OSLogger.log(`Memory ${action}: ${data.sizeInMB || 0}MB for ${data.processName || 'unknown'}`, 'info');
    }
    
    onProcessEvent(action, data) {
        OSLogger.log(`Process ${action}: ${data.name} (PID: ${data.pid})`, 'info');
    }
    
    onFileSystemEvent(action, data) {
        OSLogger.log(`File system ${action}: ${data.path}`, 'info');
    }
}

// Initialize SimpleOS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.simpleOS = new SimpleOS();
});

// Add CSS for dynamic elements
const style = document.createElement('style');
style.textContent = `
.start-menu .menu-item {
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background 0.2s;
}

.start-menu .menu-item:hover {
    background: hsl(var(--accent-bg));
}

.start-menu .menu-separator {
    height: 1px;
    background: hsl(var(--border-color));
    margin: 0.5rem 0;
}

.shutdown-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: hsl(var(--primary-bg));
    color: hsl(var(--text-primary));
    text-align: center;
}

.shutdown-screen h1 {
    font-size: 3rem;
    margin-bottom: 2rem;
    color: hsl(var(--accent-color));
}

.notification {
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.notification button {
    background: none;
    border: none;
    color: hsl(var(--text-secondary));
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0;
    margin-left: auto;
}

.notification.success {
    border-left: 4px solid hsl(var(--success-color));
}

.notification.warning {
    border-left: 4px solid hsl(var(--warning-color));
}

.notification.error {
    border-left: 4px solid hsl(var(--error-color));
}

.window.maximized {
    position: fixed !important;
}

.taskbar-process {
    background: hsl(var(--accent-bg));
    border: 1px solid hsl(var(--border-color));
    color: hsl(var(--text-primary));
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.2s;
}

.taskbar-process:hover {
    background: hsl(var(--accent-color));
}

.process-state.running {
    color: hsl(var(--success-color));
}

.process-state.ready {
    color: hsl(var(--warning-color));
}

.process-state.terminated {
    color: hsl(var(--error-color));
}

.cpu-box.running {
    background: hsl(var(--success-color) / 0.2);
    border-color: hsl(var(--success-color));
}

.cpu-box.idle {
    background: hsl(var(--border-color));
}

.queue-empty {
    color: hsl(var(--text-secondary));
    font-style: italic;
    text-align: center;
    padding: 1rem;
}

.file-item.empty {
    color: hsl(var(--text-secondary));
    font-style: italic;
}
`;

document.head.appendChild(style);
