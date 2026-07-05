// Memory Management System for SimpleOS

class MemoryManager {
    constructor() {
        this.totalMemory = 1024; // 1GB in MB
        this.blockSize = 4; // 4MB per block
        this.totalBlocks = this.totalMemory / this.blockSize; // 256 blocks
        this.memoryBlocks = new Array(this.totalBlocks).fill(0); // 0 = free, 1 = allocated, 2 = system
        this.allocatedProcesses = new Map();
        this.nextPID = 1;
        
        // Reserve some blocks for system use
        this.reserveSystemMemory();
        this.initializeVisualization();
        this.setupEventListeners();
        
        OSLogger.log(`Memory manager initialized: ${this.totalMemory}MB total`, 'success');
    }
    
    reserveSystemMemory() {
        // Reserve first 16 blocks (64MB) for system
        for (let i = 0; i < 16; i++) {
            this.memoryBlocks[i] = 2; // System reserved
        }
    }
    
    initializeVisualization() {
        const memoryGrid = document.getElementById('memory-visualization');
        if (!memoryGrid) return;
        
        memoryGrid.innerHTML = '';
        
        for (let i = 0; i < this.totalBlocks; i++) {
            const block = document.createElement('div');
            block.className = 'memory-block';
            block.dataset.blockId = i;
            block.title = `Block ${i}: ${this.getBlockStatus(i)}`;
            this.updateBlockVisualization(block, i);
            memoryGrid.appendChild(block);
        }
        
        this.updateMemoryStats();
    }
    
    updateBlockVisualization(blockElement, blockId) {
        const status = this.memoryBlocks[blockId];
        blockElement.className = 'memory-block';
        
        switch (status) {
            case 0:
                blockElement.classList.add('free');
                break;
            case 1:
                blockElement.classList.add('allocated');
                break;
            case 2:
                blockElement.classList.add('system');
                break;
        }
        
        blockElement.title = `Block ${blockId}: ${this.getBlockStatus(blockId)}`;
    }
    
    getBlockStatus(blockId) {
        switch (this.memoryBlocks[blockId]) {
            case 0: return 'Free';
            case 1: return 'Allocated';
            case 2: return 'System Reserved';
            default: return 'Unknown';
        }
    }
    
    allocateMemory(sizeInMB, processName = null) {
        const blocksNeeded = Math.ceil(sizeInMB / this.blockSize);
        const startBlock = this.findContiguousBlocks(blocksNeeded);
        
        if (startBlock === -1) {
            OSLogger.log(`Memory allocation failed: Not enough contiguous space for ${sizeInMB}MB`, 'error');
            return null;
        }
        
        // Allocate the blocks
        for (let i = startBlock; i < startBlock + blocksNeeded; i++) {
            this.memoryBlocks[i] = 1;
        }
        
        const allocationId = this.nextPID++;
        const allocation = {
            id: allocationId,
            startBlock: startBlock,
            blocksUsed: blocksNeeded,
            sizeInMB: sizeInMB,
            processName: processName || `Process_${allocationId}`,
            timestamp: new Date()
        };
        
        this.allocatedProcesses.set(allocationId, allocation);
        
        OSLogger.log(`Memory allocated: ${sizeInMB}MB (${blocksNeeded} blocks) for ${allocation.processName}`, 'success');
        
        this.updateVisualization();
        OSEventBus.emit('memoryAllocated', allocation);
        
        return allocationId;
    }
    
    deallocateMemory(allocationId) {
        const allocation = this.allocatedProcesses.get(allocationId);
        if (!allocation) {
            OSLogger.log(`Deallocation failed: Invalid allocation ID ${allocationId}`, 'error');
            return false;
        }
        
        // Free the blocks
        for (let i = allocation.startBlock; i < allocation.startBlock + allocation.blocksUsed; i++) {
            this.memoryBlocks[i] = 0;
        }
        
        this.allocatedProcesses.delete(allocationId);
        
        OSLogger.log(`Memory deallocated: ${allocation.sizeInMB}MB from ${allocation.processName}`, 'info');
        
        this.updateVisualization();
        OSEventBus.emit('memoryDeallocated', allocation);
        
        return true;
    }
    
    findContiguousBlocks(blocksNeeded) {
        for (let i = 16; i <= this.totalBlocks - blocksNeeded; i++) { // Start after system reserved area
            let found = true;
            for (let j = i; j < i + blocksNeeded; j++) {
                if (this.memoryBlocks[j] !== 0) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return i;
            }
        }
        return -1; // No contiguous space found
    }
    
    garbageCollect() {
        OSLogger.log('Starting garbage collection...', 'info');
        
        // Simulate garbage collection by compacting memory
        const allocations = Array.from(this.allocatedProcesses.values());
        
        // Clear all non-system blocks
        for (let i = 16; i < this.totalBlocks; i++) {
            if (this.memoryBlocks[i] !== 2) {
                this.memoryBlocks[i] = 0;
            }
        }
        
        // Reallocate all processes contiguously
        let currentBlock = 16;
        for (const allocation of allocations) {
            allocation.startBlock = currentBlock;
            for (let i = 0; i < allocation.blocksUsed; i++) {
                this.memoryBlocks[currentBlock + i] = 1;
            }
            currentBlock += allocation.blocksUsed;
        }
        
        this.updateVisualization();
        OSLogger.log('Garbage collection completed', 'success');
        OSEventBus.emit('garbageCollectionCompleted', { allocations: allocations.length });
    }
    
    updateVisualization() {
        const memoryGrid = document.getElementById('memory-visualization');
        if (!memoryGrid) return;
        
        const blocks = memoryGrid.children;
        for (let i = 0; i < blocks.length; i++) {
            this.updateBlockVisualization(blocks[i], i);
        }
        
        this.updateMemoryStats();
    }
    
    updateMemoryStats() {
        const usedBlocks = this.memoryBlocks.filter(block => block === 1).length;
        const systemBlocks = this.memoryBlocks.filter(block => block === 2).length;
        const freeBlocks = this.memoryBlocks.filter(block => block === 0).length;
        
        const usedMemory = usedBlocks * this.blockSize;
        const systemMemory = systemBlocks * this.blockSize;
        const freeMemory = freeBlocks * this.blockSize;
        
        // Calculate fragmentation
        const fragmentation = this.calculateFragmentation();
        
        // Update UI
        document.getElementById('total-memory').textContent = `${this.totalMemory} MB`;
        document.getElementById('used-memory').textContent = `${usedMemory} MB`;
        document.getElementById('free-memory').textContent = `${freeMemory} MB`;
        document.getElementById('fragmentation').textContent = `${fragmentation}%`;
        
        // Update taskbar memory usage
        const memoryUsage = document.getElementById('memory-usage');
        if (memoryUsage) {
            memoryUsage.textContent = `Memory: ${usedMemory + systemMemory}MB/${this.totalMemory}MB`;
        }
    }
    
    calculateFragmentation() {
        let freeSegments = 0;
        let inFreeSegment = false;
        
        for (let i = 16; i < this.totalBlocks; i++) { // Skip system area
            if (this.memoryBlocks[i] === 0) {
                if (!inFreeSegment) {
                    freeSegments++;
                    inFreeSegment = true;
                }
            } else {
                inFreeSegment = false;
            }
        }
        
        const totalFreeBlocks = this.memoryBlocks.slice(16).filter(block => block === 0).length;
        if (totalFreeBlocks === 0) return 0;
        
        return Math.round((freeSegments / totalFreeBlocks) * 100);
    }
    
    setupEventListeners() {
        document.getElementById('allocate-btn')?.addEventListener('click', () => {
            const size = OSUtils.randomInt(8, 64); // Random size between 8MB and 64MB
            this.allocateMemory(size, `Process_${this.nextPID}`);
        });
        
        document.getElementById('deallocate-btn')?.addEventListener('click', () => {
            const allocations = Array.from(this.allocatedProcesses.keys());
            if (allocations.length > 0) {
                const randomId = allocations[Math.floor(Math.random() * allocations.length)];
                this.deallocateMemory(randomId);
            }
        });
        
        document.getElementById('garbage-collect-btn')?.addEventListener('click', () => {
            this.garbageCollect();
        });
    }
    
    // Public methods for other components
    getUsedMemory() {
        const usedBlocks = this.memoryBlocks.filter(block => block === 1).length;
        const systemBlocks = this.memoryBlocks.filter(block => block === 2).length;
        return (usedBlocks + systemBlocks) * this.blockSize;
    }
    
    getTotalMemory() {
        return this.totalMemory;
    }
    
    getFreeMemory() {
        const freeBlocks = this.memoryBlocks.filter(block => block === 0).length;
        return freeBlocks * this.blockSize;
    }
    
    getAllocations() {
        return Array.from(this.allocatedProcesses.values());
    }
}

// Initialize memory manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.memoryManager = new MemoryManager();
});
