// Process Scheduler for SimpleOS

class Process {
    constructor(name, priority = 1, burstTime = null) {
        this.pid = ProcessScheduler.nextPID++;
        this.name = name;
        this.state = 'ready'; // ready, running, waiting, terminated
        this.priority = priority;
        this.burstTime = burstTime || OSUtils.randomInt(1, 10);
        this.remainingTime = this.burstTime;
        this.cpuTime = 0;
        this.createdAt = Date.now();
        this.memoryAllocation = null;
        
        // Allocate memory for the process
        if (window.memoryManager) {
            const memorySize = OSUtils.randomInt(16, 128); // 16MB to 128MB
            this.memoryAllocation = window.memoryManager.allocateMemory(memorySize, this.name);
        }
    }
    
    execute(timeSlice = 1) {
        if (this.state !== 'running') return false;
        
        const executionTime = Math.min(timeSlice, this.remainingTime);
        this.remainingTime -= executionTime;
        this.cpuTime += executionTime;
        
        if (this.remainingTime <= 0) {
            this.state = 'terminated';
            // Deallocate memory when process terminates
            if (window.memoryManager && this.memoryAllocation) {
                window.memoryManager.deallocateMemory(this.memoryAllocation);
            }
        } else {
            this.state = 'ready';
        }
        
        return true;
    }
    
    getInfo() {
        return {
            pid: this.pid,
            name: this.name,
            state: this.state,
            priority: this.priority,
            cpuTime: this.cpuTime,
            remainingTime: this.remainingTime,
            memoryAllocation: this.memoryAllocation
        };
    }
}

class ProcessScheduler {
    constructor() {
        this.processes = new Map();
        this.readyQueue = [];
        this.currentProcess = null;
        this.algorithm = 'roundrobin';
        this.timeSlice = 2; // Time quantum for round robin
        this.isRunning = false;
        this.statistics = {
            processesCreated: 0,
            processesCompleted: 0,
            totalCpuTime: 0,
            contextSwitches: 0
        };
        
        this.initializeUI();
        this.setupEventListeners();
        this.startScheduler();
        
        OSLogger.log('Process scheduler initialized', 'success');
    }
    
    static nextPID = 1;
    
    createProcess(name = null, priority = 1) {
        const processName = name || `Process_${ProcessScheduler.nextPID}`;
        const process = new Process(processName, priority);
        
        this.processes.set(process.pid, process);
        this.readyQueue.push(process);
        this.statistics.processesCreated++;
        
        OSLogger.log(`Process created: ${process.name} (PID: ${process.pid})`, 'success');
        
        this.updateUI();
        OSEventBus.emit('processCreated', process.getInfo());
        
        return process;
    }
    
    killProcess(pid) {
        const process = this.processes.get(pid);
        if (!process) {
            OSLogger.log(`Cannot kill process: PID ${pid} not found`, 'error');
            return false;
        }
        
        // Remove from ready queue
        this.readyQueue = this.readyQueue.filter(p => p.pid !== pid);
        
        // If it's the current process, stop it
        if (this.currentProcess && this.currentProcess.pid === pid) {
            this.currentProcess = null;
        }
        
        // Deallocate memory
        if (window.memoryManager && process.memoryAllocation) {
            window.memoryManager.deallocateMemory(process.memoryAllocation);
        }
        
        process.state = 'terminated';
        this.processes.delete(pid);
        
        OSLogger.log(`Process killed: ${process.name} (PID: ${pid})`, 'info');
        
        this.updateUI();
        OSEventBus.emit('processKilled', process.getInfo());
        
        return true;
    }
    
    setSchedulingAlgorithm(algorithm) {
        this.algorithm = algorithm;
        OSLogger.log(`Scheduling algorithm changed to: ${algorithm}`, 'info');
        
        // Resort ready queue based on new algorithm
        this.sortReadyQueue();
        this.updateUI();
    }
    
    sortReadyQueue() {
        switch (this.algorithm) {
            case 'fcfs': // First Come First Serve
                this.readyQueue.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'sjf': // Shortest Job First
                this.readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);
                break;
            case 'priority':
                this.readyQueue.sort((a, b) => b.priority - a.priority);
                break;
            case 'roundrobin':
            default:
                // Round robin doesn't need special sorting
                break;
        }
    }
    
    schedule() {
        if (!this.isRunning) return;
        
        // If current process is done or doesn't exist, get next process
        if (!this.currentProcess || this.currentProcess.state === 'terminated') {
            this.currentProcess = this.getNextProcess();
            if (this.currentProcess) {
                this.currentProcess.state = 'running';
                this.statistics.contextSwitches++;
            }
        }
        
        // Execute current process
        if (this.currentProcess) {
            const wasRunning = this.currentProcess.execute(this.timeSlice);
            this.statistics.totalCpuTime += Math.min(this.timeSlice, this.currentProcess.burstTime);
            
            if (this.currentProcess.state === 'terminated') {
                this.statistics.processesCompleted++;
                OSLogger.log(`Process completed: ${this.currentProcess.name}`, 'success');
                this.currentProcess = null;
            } else if (this.algorithm === 'roundrobin' && this.currentProcess.state === 'ready') {
                // Time slice expired, move to back of queue
                this.readyQueue.push(this.currentProcess);
                this.currentProcess = null;
            }
        }
        
        this.updateUI();
    }
    
    getNextProcess() {
        this.sortReadyQueue();
        return this.readyQueue.shift() || null;
    }
    
    startScheduler() {
        this.isRunning = true;
        this.schedulerInterval = setInterval(() => {
            this.schedule();
        }, 1000); // Execute every second for demonstration
        
        OSLogger.log('Scheduler started', 'info');
    }
    
    stopScheduler() {
        this.isRunning = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
        }
        
        OSLogger.log('Scheduler stopped', 'info');
    }
    
    initializeUI() {
        // Create some initial processes for demonstration
        this.createProcess('System Init', 5);
        this.createProcess('Memory Manager', 4);
        this.createProcess('Shell', 3);
    }
    
    setupEventListeners() {
        document.getElementById('create-process-btn')?.addEventListener('click', () => {
            const priority = OSUtils.randomInt(1, 5);
            this.createProcess(null, priority);
        });
        
        document.getElementById('kill-process-btn')?.addEventListener('click', () => {
            const processes = Array.from(this.processes.keys());
            if (processes.length > 0) {
                const randomPid = processes[Math.floor(Math.random() * processes.length)];
                this.killProcess(randomPid);
            }
        });
        
        document.getElementById('scheduler-algorithm')?.addEventListener('change', (e) => {
            this.setSchedulingAlgorithm(e.target.value);
        });
    }
    
    updateUI() {
        this.updateProcessTable();
        this.updateReadyQueue();
        this.updateCPUStatus();
        this.updateTaskbar();
    }
    
    updateProcessTable() {
        const tableBody = document.getElementById('process-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        for (const process of this.processes.values()) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${process.pid}</td>
                <td>${process.name}</td>
                <td><span class="process-state ${process.state}">${process.state}</span></td>
                <td>${process.priority}</td>
                <td>${process.cpuTime}s</td>
            `;
            tableBody.appendChild(row);
        }
    }
    
    updateReadyQueue() {
        const queueElement = document.getElementById('ready-queue');
        if (!queueElement) return;
        
        queueElement.innerHTML = '';
        
        this.readyQueue.forEach(process => {
            const processElement = document.createElement('div');
            processElement.className = 'process-item';
            processElement.textContent = `${process.name} (${process.pid})`;
            queueElement.appendChild(processElement);
        });
        
        if (this.readyQueue.length === 0) {
            queueElement.innerHTML = '<div class="queue-empty">No processes in queue</div>';
        }
    }
    
    updateCPUStatus() {
        const cpuElement = document.getElementById('cpu-current');
        if (!cpuElement) return;
        
        if (this.currentProcess) {
            cpuElement.innerHTML = `
                <strong>${this.currentProcess.name}</strong><br>
                PID: ${this.currentProcess.pid}<br>
                Time: ${this.currentProcess.cpuTime}s
            `;
            cpuElement.className = 'cpu-box running';
        } else {
            cpuElement.innerHTML = 'Idle';
            cpuElement.className = 'cpu-box idle';
        }
    }
    
    updateTaskbar() {
        const runningProcesses = document.getElementById('running-processes');
        if (!runningProcesses) return;
        
        runningProcesses.innerHTML = '';
        
        const activeProcesses = Array.from(this.processes.values())
            .filter(p => p.state === 'running' || p.state === 'ready')
            .slice(0, 5); // Show max 5 processes in taskbar
        
        activeProcesses.forEach(process => {
            const processBtn = document.createElement('button');
            processBtn.className = 'taskbar-process';
            processBtn.textContent = process.name;
            processBtn.title = `${process.name} (PID: ${process.pid}) - ${process.state}`;
            runningProcesses.appendChild(processBtn);
        });
    }
    
    getStatistics() {
        return {
            ...this.statistics,
            averageWaitTime: this.calculateAverageWaitTime(),
            cpuUtilization: this.calculateCPUUtilization(),
            throughput: this.calculateThroughput()
        };
    }
    
    calculateAverageWaitTime() {
        if (this.statistics.processesCompleted === 0) return 0;
        // Simplified calculation
        return this.statistics.totalCpuTime / this.statistics.processesCompleted;
    }
    
    calculateCPUUtilization() {
        const uptime = (Date.now() - (this.startTime || Date.now())) / 1000;
        return uptime > 0 ? Math.min(100, (this.statistics.totalCpuTime / uptime) * 100) : 0;
    }
    
    calculateThroughput() {
        const uptime = (Date.now() - (this.startTime || Date.now())) / 1000;
        return uptime > 0 ? this.statistics.processesCompleted / uptime : 0;
    }
}

// Initialize scheduler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.processScheduler = new ProcessScheduler();
    window.processScheduler.startTime = Date.now();
});
