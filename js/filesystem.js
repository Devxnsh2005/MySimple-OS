// File System implementation for SimpleOS

class FileSystemNode {
    constructor(name, type = 'file', content = '') {
        this.name = name;
        this.type = type; // 'file' or 'directory'
        this.content = content;
        this.children = type === 'directory' ? new Map() : null;
        this.parent = null;
        this.created = new Date();
        this.modified = new Date();
        this.size = type === 'file' ? content.length : 0;
        this.permissions = '755'; // Unix-style permissions
    }
    
    addChild(node) {
        if (this.type !== 'directory') {
            throw new Error('Cannot add child to non-directory');
        }
        node.parent = this;
        this.children.set(node.name, node);
        this.modified = new Date();
    }
    
    removeChild(name) {
        if (this.type !== 'directory') {
            throw new Error('Cannot remove child from non-directory');
        }
        const removed = this.children.delete(name);
        if (removed) {
            this.modified = new Date();
        }
        return removed;
    }
    
    getChild(name) {
        if (this.type !== 'directory') return null;
        return this.children.get(name) || null;
    }
    
    getPath() {
        if (!this.parent) return '/';
        const parentPath = this.parent.getPath();
        return parentPath === '/' ? `/${this.name}` : `${parentPath}/${this.name}`;
    }
    
    updateContent(content) {
        if (this.type !== 'file') {
            throw new Error('Cannot update content of non-file');
        }
        this.content = content;
        this.size = content.length;
        this.modified = new Date();
    }
}

class FileSystem {
    constructor() {
        this.root = new FileSystemNode('', 'directory');
        this.currentDirectory = this.root;
        this.initializeDefaultStructure();
        this.setupEventListeners();
        this.updateUI();
        
        OSLogger.log('File system initialized', 'success');
    }
    
    initializeDefaultStructure() {
        // Create basic Unix-like directory structure
        const directories = [
            'bin', 'etc', 'home', 'usr', 'var', 'tmp', 'dev'
        ];
        
        directories.forEach(dirName => {
            const dir = new FileSystemNode(dirName, 'directory');
            this.root.addChild(dir);
        });
        
        // Create some default files
        const binDir = this.root.getChild('bin');
        if (binDir) {
            const commands = ['ls', 'cat', 'mkdir', 'rm', 'cd', 'pwd', 'help'];
            commands.forEach(cmd => {
                const file = new FileSystemNode(cmd, 'file', `#!/bin/sh\n# ${cmd} command`);
                binDir.addChild(file);
            });
        }
        
        const etcDir = this.root.getChild('etc');
        if (etcDir) {
            const configFile = new FileSystemNode('config.conf', 'file', 
                'system_name=SimpleOS\nversion=1.0\ndebug=false');
            etcDir.addChild(configFile);
            
            const passwdFile = new FileSystemNode('passwd', 'file',
                'root:x:0:0:root:/root:/bin/sh\nuser:x:1000:1000:user:/home/user:/bin/sh');
            etcDir.addChild(passwdFile);
        }
        
        const homeDir = this.root.getChild('home');
        if (homeDir) {
            const userDir = new FileSystemNode('user', 'directory');
            homeDir.addChild(userDir);
            
            const welcomeFile = new FileSystemNode('welcome.txt', 'file',
                'Welcome to SimpleOS!\n\nThis is a simple educational operating system simulator.\nFeel free to explore the file system.');
            userDir.addChild(welcomeFile);
        }
    }
    
    createFile(name, content = '') {
        if (this.currentDirectory.getChild(name)) {
            OSLogger.log(`File creation failed: ${name} already exists`, 'error');
            return false;
        }
        
        const file = new FileSystemNode(name, 'file', content);
        this.currentDirectory.addChild(file);
        
        OSLogger.log(`File created: ${file.getPath()}`, 'success');
        this.updateUI();
        OSEventBus.emit('fileCreated', { path: file.getPath(), size: file.size });
        
        return true;
    }
    
    createDirectory(name) {
        if (this.currentDirectory.getChild(name)) {
            OSLogger.log(`Directory creation failed: ${name} already exists`, 'error');
            return false;
        }
        
        const dir = new FileSystemNode(name, 'directory');
        this.currentDirectory.addChild(dir);
        
        OSLogger.log(`Directory created: ${dir.getPath()}`, 'success');
        this.updateUI();
        OSEventBus.emit('directoryCreated', { path: dir.getPath() });
        
        return true;
    }
    
    deleteItem(name) {
        const item = this.currentDirectory.getChild(name);
        if (!item) {
            OSLogger.log(`Deletion failed: ${name} not found`, 'error');
            return false;
        }
        
        if (item.type === 'directory' && item.children.size > 0) {
            OSLogger.log(`Deletion failed: Directory ${name} is not empty`, 'error');
            return false;
        }
        
        this.currentDirectory.removeChild(name);
        OSLogger.log(`Deleted: ${item.getPath()}`, 'info');
        this.updateUI();
        OSEventBus.emit('itemDeleted', { path: item.getPath(), type: item.type });
        
        return true;
    }
    
    changeDirectory(path) {
        let targetDir = this.currentDirectory;
        
        if (path === '/') {
            targetDir = this.root;
        } else if (path === '..') {
            targetDir = this.currentDirectory.parent || this.currentDirectory;
        } else if (path === '.') {
            // Stay in current directory
            return true;
        } else {
            // Navigate to named directory
            const child = this.currentDirectory.getChild(path);
            if (!child) {
                OSLogger.log(`Directory not found: ${path}`, 'error');
                return false;
            }
            if (child.type !== 'directory') {
                OSLogger.log(`Not a directory: ${path}`, 'error');
                return false;
            }
            targetDir = child;
        }
        
        this.currentDirectory = targetDir;
        OSLogger.log(`Changed directory to: ${this.getCurrentPath()}`, 'info');
        this.updateUI();
        OSEventBus.emit('directoryChanged', { path: this.getCurrentPath() });
        
        return true;
    }
    
    readFile(name) {
        const file = this.currentDirectory.getChild(name);
        if (!file) {
            OSLogger.log(`File not found: ${name}`, 'error');
            return null;
        }
        if (file.type !== 'file') {
            OSLogger.log(`Not a file: ${name}`, 'error');
            return null;
        }
        
        return file.content;
    }
    
    writeFile(name, content) {
        const file = this.currentDirectory.getChild(name);
        if (!file) {
            return this.createFile(name, content);
        }
        if (file.type !== 'file') {
            OSLogger.log(`Cannot write to directory: ${name}`, 'error');
            return false;
        }
        
        file.updateContent(content);
        OSLogger.log(`File updated: ${file.getPath()}`, 'info');
        this.updateUI();
        OSEventBus.emit('fileUpdated', { path: file.getPath(), size: file.size });
        
        return true;
    }
    
    listDirectory(showHidden = false) {
        const items = [];
        
        if (this.currentDirectory.children) {
            for (const [name, node] of this.currentDirectory.children) {
                if (!showHidden && name.startsWith('.')) continue;
                
                items.push({
                    name: name,
                    type: node.type,
                    size: node.size,
                    modified: node.modified,
                    permissions: node.permissions,
                    path: node.getPath()
                });
            }
        }
        
        return items.sort((a, b) => {
            // Directories first, then files
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }
    
    getCurrentPath() {
        return this.currentDirectory.getPath();
    }
    
    findFiles(pattern, recursive = false) {
        const results = [];
        this._findFilesRecursive(this.currentDirectory, pattern, results, recursive);
        return results;
    }
    
    _findFilesRecursive(dir, pattern, results, recursive) {
        if (!dir.children) return;
        
        for (const [name, node] of dir.children) {
            if (name.includes(pattern)) {
                results.push({
                    name: name,
                    type: node.type,
                    path: node.getPath(),
                    size: node.size
                });
            }
            
            if (recursive && node.type === 'directory') {
                this._findFilesRecursive(node, pattern, results, recursive);
            }
        }
    }
    
    getDirectoryTree() {
        return this._buildTreeStructure(this.root, 0);
    }
    
    _buildTreeStructure(node, depth) {
        const tree = [];
        
        if (node.children) {
            for (const [name, child] of node.children) {
                tree.push({
                    name: name,
                    type: child.type,
                    depth: depth,
                    path: child.getPath(),
                    children: child.type === 'directory' ? this._buildTreeStructure(child, depth + 1) : null
                });
            }
        }
        
        return tree.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }
    
    setupEventListeners() {
        document.getElementById('create-file-btn')?.addEventListener('click', () => {
            const name = prompt('Enter file name:');
            if (name && name.trim()) {
                this.createFile(name.trim());
            }
        });
        
        document.getElementById('create-dir-btn')?.addEventListener('click', () => {
            const name = prompt('Enter directory name:');
            if (name && name.trim()) {
                this.createDirectory(name.trim());
            }
        });
        
        document.getElementById('delete-item-btn')?.addEventListener('click', () => {
            const name = prompt('Enter name of item to delete:');
            if (name && name.trim()) {
                this.deleteItem(name.trim());
            }
        });
    }
    
    updateUI() {
        this.updateCurrentPath();
        this.updateDirectoryTree();
        this.updateFileList();
    }
    
    updateCurrentPath() {
        const pathElement = document.getElementById('current-path');
        if (pathElement) {
            pathElement.textContent = this.getCurrentPath();
        }
    }
    
    updateDirectoryTree() {
        const treeElement = document.getElementById('directory-tree');
        if (!treeElement) return;
        
        treeElement.innerHTML = '';
        const tree = this.getDirectoryTree();
        this._renderTreeNodes(treeElement, tree);
    }
    
    _renderTreeNodes(container, nodes) {
        nodes.forEach(node => {
            const nodeElement = document.createElement('div');
            nodeElement.className = `tree-item ${node.type}`;
            
            const indent = '  '.repeat(node.depth);
            const icon = node.type === 'directory' ? '📁' : '📄';
            
            nodeElement.innerHTML = `
                <span class="indent">${indent}</span>
                <span class="icon">${icon}</span>
                <span class="name">${node.name}</span>
            `;
            
            if (node.type === 'directory') {
                nodeElement.addEventListener('click', () => {
                    this.navigateToPath(node.path);
                });
            }
            
            container.appendChild(nodeElement);
            
            if (node.children && node.children.length > 0) {
                this._renderTreeNodes(container, node.children);
            }
        });
    }
    
    updateFileList() {
        const listElement = document.getElementById('file-list');
        if (!listElement) return;
        
        listElement.innerHTML = '';
        const items = this.listDirectory();
        
        // Add parent directory entry if not at root
        if (this.currentDirectory !== this.root) {
            const parentItem = document.createElement('div');
            parentItem.className = 'file-item directory';
            parentItem.innerHTML = '📁 ..';
            parentItem.addEventListener('click', () => {
                this.changeDirectory('..');
            });
            listElement.appendChild(parentItem);
        }
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = `file-item ${item.type}`;
            
            const icon = item.type === 'directory' ? '📁' : '📄';
            const size = item.type === 'file' ? ` (${item.size} bytes)` : '';
            
            itemElement.innerHTML = `${icon} ${item.name}${size}`;
            
            itemElement.addEventListener('click', () => {
                if (item.type === 'directory') {
                    this.changeDirectory(item.name);
                } else {
                    // Show file content in a simple modal or alert
                    const content = this.readFile(item.name);
                    alert(`File: ${item.name}\n\n${content}`);
                }
            });
            
            listElement.appendChild(itemElement);
        });
        
        if (items.length === 0) {
            listElement.innerHTML = '<div class="file-item empty">Directory is empty</div>';
        }
    }
    
    navigateToPath(path) {
        // Simple path navigation - for demo purposes
        const parts = path.split('/').filter(p => p);
        this.currentDirectory = this.root;
        
        for (const part of parts) {
            const child = this.currentDirectory.getChild(part);
            if (child && child.type === 'directory') {
                this.currentDirectory = child;
            } else {
                break;
            }
        }
        
        this.updateUI();
    }
    
    // Export filesystem state (for persistence simulation)
    exportState() {
        return this._serializeNode(this.root);
    }
    
    _serializeNode(node) {
        const serialized = {
            name: node.name,
            type: node.type,
            content: node.content,
            created: node.created,
            modified: node.modified,
            permissions: node.permissions
        };
        
        if (node.type === 'directory' && node.children) {
            serialized.children = {};
            for (const [name, child] of node.children) {
                serialized.children[name] = this._serializeNode(child);
            }
        }
        
        return serialized;
    }
}

// Initialize file system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileSystem = new FileSystem();
});
