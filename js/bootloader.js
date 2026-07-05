// Bootloader simulation for SimpleOS

class Bootloader {
    constructor() {
        this.bootSteps = [
            { message: "Initializing bootloader...", delay: 500, type: 'info' },
            { message: "Loading BIOS...", delay: 300, type: 'info' },
            { message: "Checking hardware components...", delay: 400, type: 'info' },
            { message: "CPU: Intel x64 Compatible - OK", delay: 200, type: 'success' },
            { message: "RAM: 1024MB detected - OK", delay: 200, type: 'success' },
            { message: "Storage: 500GB available - OK", delay: 200, type: 'success' },
            { message: "Initializing memory management unit...", delay: 600, type: 'info' },
            { message: "Setting up interrupt vectors...", delay: 400, type: 'info' },
            { message: "Loading kernel from disk...", delay: 800, type: 'info' },
            { message: "Kernel loaded successfully", delay: 300, type: 'success' },
            { message: "Starting process scheduler...", delay: 500, type: 'info' },
            { message: "Mounting file system...", delay: 400, type: 'info' },
            { message: "File system mounted at /", delay: 200, type: 'success' },
            { message: "Initializing device drivers...", delay: 600, type: 'info' },
            { message: "Starting shell interface...", delay: 300, type: 'info' },
            { message: "SimpleOS ready!", delay: 500, type: 'success' }
        ];
        
        this.currentStep = 0;
        this.progressElement = document.getElementById('boot-progress-fill');
        this.statusElement = document.getElementById('boot-status');
        this.logElement = document.getElementById('boot-log');
    }
    
    async start() {
        OSLogger.log("Starting bootloader sequence", 'info');
        
        for (let i = 0; i < this.bootSteps.length; i++) {
            const step = this.bootSteps[i];
            
            // Update progress bar
            const progress = ((i + 1) / this.bootSteps.length) * 100;
            this.progressElement.style.width = `${progress}%`;
            
            // Update status
            this.statusElement.textContent = step.message;
            
            // Add to boot log
            this.addLogEntry(step.message, step.type);
            
            // Simulate processing time
            await OSUtils.sleep(step.delay);
            
            // Random chance of warnings during boot
            if (Math.random() < 0.1 && step.type === 'info') {
                const warnings = [
                    "Warning: Thermal throttling detected",
                    "Warning: Non-critical hardware error",
                    "Warning: Deprecated driver loaded"
                ];
                const warning = warnings[Math.floor(Math.random() * warnings.length)];
                this.addLogEntry(warning, 'warning');
                await OSUtils.sleep(200);
            }
        }
        
        // Final completion message
        this.statusElement.textContent = "Boot complete - Starting desktop environment...";
        await OSUtils.sleep(1000);
        
        // Transition to desktop
        this.completeBootProcess();
    }
    
    addLogEntry(message, type) {
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logEntry.className = type;
        
        this.logElement.appendChild(logEntry);
        this.logElement.scrollTop = this.logElement.scrollHeight;
        
        OSLogger.log(message, type);
    }
    
    completeBootProcess() {
        OSLogger.log("Boot process completed successfully", 'success');
        
        // Use setTimeout to ensure smooth transition
        setTimeout(() => {
            // Hide boot screen and show desktop
            const bootScreen = document.getElementById('boot-screen');
            const desktop = document.getElementById('os-desktop');
            
            if (bootScreen && desktop) {
                bootScreen.classList.remove('active');
                desktop.classList.add('active');
                
                OSLogger.log("Desktop transition completed", 'success');
            }
            
            // Emit boot complete event
            OSEventBus.emit('bootComplete', {
                timestamp: new Date(),
                bootTime: Date.now() - this.startTime
            });
            
            // Initialize desktop components
            this.initializeDesktop();
        }, 500);
    }
    
    initializeDesktop() {
        // Start the clock
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        
        // Initialize system info
        this.updateSystemInfo();
        setInterval(() => this.updateSystemInfo(), 5000);
        
        // Show welcome message in terminal
        setTimeout(() => {
            if (window.shell) {
                window.shell.addOutput("Welcome to SimpleOS!");
                window.shell.addOutput("Type 'help' to see available commands.");
                window.shell.addOutput("");
            }
        }, 500);
    }
    
    updateClock() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = new Date().toLocaleTimeString();
        }
    }
    
    updateSystemInfo() {
        const memoryElement = document.getElementById('memory-usage');
        if (memoryElement && window.memoryManager) {
            const used = window.memoryManager.getUsedMemory();
            const total = window.memoryManager.getTotalMemory();
            memoryElement.textContent = `Memory: ${used}MB/${total}MB`;
        }
    }
    
    // Simulate hardware checks
    checkHardware() {
        const components = [
            { name: "CPU", status: "OK", details: "Intel x64 Compatible @ 2.4GHz" },
            { name: "RAM", status: "OK", details: "1024MB DDR4" },
            { name: "Storage", status: "OK", details: "500GB SSD" },
            { name: "Graphics", status: "OK", details: "Integrated Graphics" },
            { name: "Network", status: "OK", details: "Ethernet Controller" }
        ];
        
        return components;
    }
    
    // Simulate kernel loading
    loadKernel() {
        const kernelModules = [
            "core.sys",
            "memory.sys", 
            "scheduler.sys",
            "filesystem.sys",
            "drivers.sys",
            "shell.sys"
        ];
        
        return kernelModules;
    }
}

// Initialize bootloader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const bootloader = new Bootloader();
    bootloader.startTime = Date.now();
    
    // Start boot process after a short delay
    setTimeout(() => {
        bootloader.start();
    }, 1000);
    
    // Make bootloader globally available
    window.bootloader = bootloader;
});
