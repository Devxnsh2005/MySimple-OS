// Shell Interface for SimpleOS

class Shell {
    constructor() {
        this.commands = new Map();
        this.history = [];
        this.historyIndex = -1;
        this.currentDirectory = '/';
        this.userName = 'user';
        this.hostName = 'simpleos';
        
        this.initializeCommands();
        this.setupEventListeners();
        this.setupTerminal();
        
        OSLogger.log('Shell interface initialized', 'success');
    }
    
    initializeCommands() {
        // Basic file system commands
        this.commands.set('ls', {
            description: 'List directory contents',
            usage: 'ls [options]',
            execute: (args) => this.cmdList(args)
        });
        
        this.commands.set('cd', {
            description: 'Change directory',
            usage: 'cd [directory]',
            execute: (args) => this.cmdChangeDirectory(args)
        });
        
        this.commands.set('pwd', {
            description: 'Print working directory',
            usage: 'pwd',
            execute: (args) => this.cmdPrintWorkingDirectory(args)
        });
        
        this.commands.set('cat', {
            description: 'Display file contents',
            usage: 'cat [filename]',
            execute: (args) => this.cmdCat(args)
        });
        
        this.commands.set('mkdir', {
            description: 'Create directory',
            usage: 'mkdir [directory_name]',
            execute: (args) => this.cmdMakeDirectory(args)
        });
        
        this.commands.set('rm', {
            description: 'Remove file or directory',
            usage: 'rm [filename]',
            execute: (args) => this.cmdRemove(args)
        });
        
        this.commands.set('touch', {
            description: 'Create empty file',
            usage: 'touch [filename]',
            execute: (args) => this.cmdTouch(args)
        });
        
        this.commands.set('echo', {
            description: 'Display text',
            usage: 'echo [text]',
            execute: (args) => this.cmdEcho(args)
        });
        
        // System commands
        this.commands.set('ps', {
            description: 'List running processes',
            usage: 'ps',
            execute: (args) => this.cmdProcessList(args)
        });
        
        this.commands.set('kill', {
            description: 'Terminate process',
            usage: 'kill [pid]',
            execute: (args) => this.cmdKill(args)
        });
        
        this.commands.set('mem', {
            description: 'Display memory usage',
            usage: 'mem',
            execute: (args) => this.cmdMemory(args)
        });
        
        this.commands.set('top', {
            description: 'Display system information',
            usage: 'top',
            execute: (args) => this.cmdTop(args)
        });
        
        // Utility commands
        this.commands.set('help', {
            description: 'Show available commands',
            usage: 'help [command]',
            execute: (args) => this.cmdHelp(args)
        });
        
        this.commands.set('clear', {
            description: 'Clear terminal screen',
            usage: 'clear',
            execute: (args) => this.cmdClear(args)
        });
        
        this.commands.set('history', {
            description: 'Show command history',
            usage: 'history',
            execute: (args) => this.cmdHistory(args)
        });
        
        this.commands.set('date', {
            description: 'Display current date and time',
            usage: 'date',
            execute: (args) => this.cmdDate(args)
        });
        
        this.commands.set('uptime', {
            description: 'Show system uptime',
            usage: 'uptime',
            execute: (args) => this.cmdUptime(args)
        });
        
        this.commands.set('whoami', {
            description: 'Display current user',
            usage: 'whoami',
            execute: (args) => this.cmdWhoami(args)
        });
        
        // Fun commands
        this.commands.set('fortune', {
            description: 'Display a random quote',
            usage: 'fortune',
            execute: (args) => this.cmdFortune(args)
        });
    }
    
    setupEventListeners() {
        const input = document.getElementById('terminal-input');
        if (!input) return;
        
        input.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    this.executeCommand(input.value.trim());
                    input.value = '';
                    this.historyIndex = -1;
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateHistory(-1, input);
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateHistory(1, input);
                    break;
                    
                case 'Tab':
                    e.preventDefault();
                    this.autoComplete(input);
                    break;
            }
        });
    }
    
    setupTerminal() {
        this.startTime = Date.now();
        this.addOutput('SimpleOS Shell v1.0');
        this.addOutput('Type "help" for available commands.');
        this.addOutput('');
    }
    
    executeCommand(commandLine) {
        if (!commandLine) return;
        
        // Add command to history
        this.history.push(commandLine);
        if (this.history.length > 100) {
            this.history.shift();
        }
        
        // Display command in terminal
        this.addCommandLine(commandLine);
        
        // Parse command and arguments
        const parts = commandLine.split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Execute command
        if (this.commands.has(command)) {
            try {
                const result = this.commands.get(command).execute(args);
                if (result) {
                    this.addOutput(result);
                }
            } catch (error) {
                this.addOutput(`Error: ${error.message}`, 'error');
                OSLogger.log(`Shell command error: ${error.message}`, 'error');
            }
        } else {
            this.addOutput(`Command not found: ${command}`, 'error');
        }
        
        this.addOutput('');
    }
    
    addCommandLine(command) {
        const output = document.getElementById('terminal-output');
        if (!output) return;
        
        const commandLine = document.createElement('div');
        commandLine.className = 'command-line';
        commandLine.innerHTML = `<span class="prompt">${this.getPrompt()}</span>${OSUtils.sanitizeInput(command)}`;
        
        output.appendChild(commandLine);
        output.scrollTop = output.scrollHeight;
    }
    
    addOutput(text, type = 'normal') {
        const output = document.getElementById('terminal-output');
        if (!output) return;
        
        const outputLine = document.createElement('div');
        outputLine.className = `command-output ${type}`;
        outputLine.textContent = text;
        
        output.appendChild(outputLine);
        output.scrollTop = output.scrollHeight;
    }
    
    getPrompt() {
        const path = window.fileSystem ? window.fileSystem.getCurrentPath() : '/';
        const shortPath = path === '/' ? '/' : path.split('/').pop();
        return `${this.userName}@${this.hostName}:${shortPath}$ `;
    }
    
    navigateHistory(direction, input) {
        if (this.history.length === 0) return;
        
        if (direction === -1) { // Up arrow
            if (this.historyIndex === -1) {
                this.historyIndex = this.history.length - 1;
            } else if (this.historyIndex > 0) {
                this.historyIndex--;
            }
        } else { // Down arrow
            if (this.historyIndex === -1) return;
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
            } else {
                this.historyIndex = -1;
                input.value = '';
                return;
            }
        }
        
        input.value = this.history[this.historyIndex];
    }
    
    autoComplete(input) {
        const value = input.value;
        const matches = Array.from(this.commands.keys()).filter(cmd => 
            cmd.startsWith(value.toLowerCase())
        );
        
        if (matches.length === 1) {
            input.value = matches[0] + ' ';
        } else if (matches.length > 1) {
            this.addOutput(`Available completions: ${matches.join(', ')}`);
        }
    }
    
    // Command implementations
    cmdList(args) {
        if (!window.fileSystem) return 'File system not available';
        
        const items = window.fileSystem.listDirectory();
        if (items.length === 0) {
            return 'Directory is empty';
        }
        
        let output = '';
        items.forEach(item => {
            const type = item.type === 'directory' ? 'd' : '-';
            const size = item.size.toString().padStart(8);
            const date = item.modified.toLocaleDateString();
            const name = item.type === 'directory' ? `${item.name}/` : item.name;
            
            output += `${type}${item.permissions} ${size} ${date} ${name}\n`;
        });
        
        return output.trim();
    }
    
    cmdChangeDirectory(args) {
        if (!window.fileSystem) return 'File system not available';
        
        const path = args[0] || '/';
        const success = window.fileSystem.changeDirectory(path);
        
        if (!success) {
            return `cd: ${path}: No such file or directory`;
        }
        
        return '';
    }
    
    cmdPrintWorkingDirectory(args) {
        if (!window.fileSystem) return '/';
        return window.fileSystem.getCurrentPath();
    }
    
    cmdCat(args) {
        if (!window.fileSystem) return 'File system not available';
        if (args.length === 0) return 'Usage: cat [filename]';
        
        const content = window.fileSystem.readFile(args[0]);
        if (content === null) {
            return `cat: ${args[0]}: No such file or directory`;
        }
        
        return content;
    }
    
    cmdMakeDirectory(args) {
        if (!window.fileSystem) return 'File system not available';
        if (args.length === 0) return 'Usage: mkdir [directory_name]';
        
        const success = window.fileSystem.createDirectory(args[0]);
        if (!success) {
            return `mkdir: cannot create directory '${args[0]}': File exists`;
        }
        
        return '';
    }
    
    cmdRemove(args) {
        if (!window.fileSystem) return 'File system not available';
        if (args.length === 0) return 'Usage: rm [filename]';
        
        const success = window.fileSystem.deleteItem(args[0]);
        if (!success) {
            return `rm: cannot remove '${args[0]}': No such file or directory`;
        }
        
        return '';
    }
    
    cmdTouch(args) {
        if (!window.fileSystem) return 'File system not available';
        if (args.length === 0) return 'Usage: touch [filename]';
        
        const success = window.fileSystem.createFile(args[0], '');
        if (!success) {
            return `touch: cannot create '${args[0]}': File exists`;
        }
        
        return '';
    }
    
    cmdEcho(args) {
        return args.join(' ');
    }
    
    cmdProcessList(args) {
        if (!window.processScheduler) return 'Process scheduler not available';
        
        const processes = window.processScheduler.processes;
        let output = 'PID  NAME              STATE     CPU_TIME\n';
        output += '---  ----              -----     --------\n';
        
        for (const process of processes.values()) {
            const pid = process.pid.toString().padEnd(4);
            const name = process.name.padEnd(17);
            const state = process.state.padEnd(9);
            const cpuTime = `${process.cpuTime}s`;
            
            output += `${pid} ${name} ${state} ${cpuTime}\n`;
        }
        
        return output.trim();
    }
    
    cmdKill(args) {
        if (!window.processScheduler) return 'Process scheduler not available';
        if (args.length === 0) return 'Usage: kill [pid]';
        
        const pid = parseInt(args[0]);
        if (isNaN(pid)) return 'Invalid PID';
        
        const success = window.processScheduler.killProcess(pid);
        if (!success) {
            return `kill: (${pid}) - No such process`;
        }
        
        return `Process ${pid} terminated`;
    }
    
    cmdMemory(args) {
        if (!window.memoryManager) return 'Memory manager not available';
        
        const used = window.memoryManager.getUsedMemory();
        const total = window.memoryManager.getTotalMemory();
        const free = window.memoryManager.getFreeMemory();
        const usedPercent = ((used / total) * 100).toFixed(1);
        
        let output = 'Memory Usage:\n';
        output += `Total:  ${total} MB\n`;
        output += `Used:   ${used} MB (${usedPercent}%)\n`;
        output += `Free:   ${free} MB\n`;
        
        return output;
    }
    
    cmdTop(args) {
        let output = 'SimpleOS System Information\n';
        output += '===========================\n\n';
        
        // Uptime
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        output += `Uptime: ${OSUtils.formatTime(uptime)}\n`;
        
        // Memory
        if (window.memoryManager) {
            const used = window.memoryManager.getUsedMemory();
            const total = window.memoryManager.getTotalMemory();
            output += `Memory: ${used}/${total} MB\n`;
        }
        
        // Processes
        if (window.processScheduler) {
            const stats = window.processScheduler.getStatistics();
            output += `Processes: ${stats.processesCreated} created, ${stats.processesCompleted} completed\n`;
            output += `CPU Usage: ${stats.cpuUtilization.toFixed(1)}%\n`;
        }
        
        return output;
    }
    
    cmdHelp(args) {
        if (args.length > 0) {
            const command = this.commands.get(args[0]);
            if (command) {
                return `${args[0]} - ${command.description}\nUsage: ${command.usage}`;
            } else {
                return `Help: No manual entry for ${args[0]}`;
            }
        }
        
        let output = 'Available commands:\n';
        for (const [name, cmd] of this.commands) {
            output += `  ${name.padEnd(12)} - ${cmd.description}\n`;
        }
        output += '\nType "help [command]" for detailed usage information.';
        
        return output;
    }
    
    cmdClear(args) {
        const output = document.getElementById('terminal-output');
        if (output) {
            output.innerHTML = '';
        }
        return '';
    }
    
    cmdHistory(args) {
        if (this.history.length === 0) {
            return 'No commands in history';
        }
        
        let output = '';
        this.history.forEach((cmd, index) => {
            output += `${(index + 1).toString().padStart(4)}  ${cmd}\n`;
        });
        
        return output.trim();
    }
    
    cmdDate(args) {
        return new Date().toString();
    }
    
    cmdUptime(args) {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        
        let result = 'up ';
        if (days > 0) result += `${days} day${days > 1 ? 's' : ''}, `;
        if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''}, `;
        if (minutes > 0) result += `${minutes} minute${minutes > 1 ? 's' : ''}, `;
        result += `${seconds} second${seconds > 1 ? 's' : ''}`;
        
        return result;
    }
    
    cmdWhoami(args) {
        return this.userName;
    }
    
    cmdFortune(args) {
        const fortunes = [
            "The best way to predict the future is to create it.",
            "Code is like humor. When you have to explain it, it's bad.",
            "Programs must be written for people to read, and only incidentally for machines to execute.",
            "The most important property of a program is whether it accomplishes the intention of its user.",
            "Simplicity is the ultimate sophistication.",
            "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
            "First, solve the problem. Then, write the code.",
            "Experience is the name everyone gives to their mistakes.",
            "In order to understand recursion, one must first understand recursion.",
            "There are only two hard things in Computer Science: cache invalidation and naming things."
        ];
        
        return fortunes[Math.floor(Math.random() * fortunes.length)];
    }
}

// Initialize shell when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shell = new Shell();
});
