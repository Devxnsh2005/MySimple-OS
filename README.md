# SimpleOS — Educational Operating System Simulator

SimpleOS is an interactive browser-based operating system simulator built using **HTML, CSS, and JavaScript**.

It demonstrates core operating-system concepts through a visual desktop interface, including process scheduling, memory allocation, file-system operations, a shell terminal, and a simulated boot sequence.

## Features

- Animated bootloader with boot logs and progress status
- Interactive desktop-style interface
- Draggable, minimizable, maximizable, and closable windows
- Built-in shell terminal with Linux-like commands
- Virtual file-system simulation
- Memory allocation and deallocation visualization
- Memory fragmentation calculation
- Garbage collection / memory compaction simulation
- Process creation and termination
- CPU ready queue and current-process visualization
- Scheduling algorithms:
  - Round Robin
  - First Come First Serve (FCFS)
  - Shortest Job First (SJF)
- Live taskbar showing memory usage, processes, and time

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Font Awesome icons

## Project Structure

```text
MySimpleOS-main/
│
├── index.html              # Main user interface
├── styles.css              # Styling for desktop, windows, terminal, etc.
├── generated-icon.png      # Project icon
│
└── js/
    ├── bootloader.js       # Simulated operating-system boot sequence
    ├── filesystem.js       # Virtual file-system logic
    ├── main.js             # Main OS interface and window management
    ├── memory.js           # Memory allocation and garbage collection logic
    ├── scheduler.js        # Process and CPU scheduling logic
    ├── shell.js            # Terminal commands and shell behavior
    └── utils.js            # Shared utilities, logger, and event system
