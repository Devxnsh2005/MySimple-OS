# SimpleOS — Educational Operating System Simulator

SimpleOS is an interactive browser-based operating system simulator built using **HTML, CSS, and JavaScript**.

It demonstrates core operating-system concepts through a visual desktop interface, including process scheduling, memory allocation, file-system operations, a shell terminal, and a simulated boot sequence.

## Live Demo

🚀 **Try SimpleOS here:** [MySimpleOS Live](https://my-simple-os-devansh25.vercel.app)

---

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

---

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Font Awesome Icons

---

## Project Structure

```text
MySimpleOS-main/
│
├── index.html              # Main user interface
├── styles.css              # Styling for desktop, windows, terminal, etc.
├── generated-icon.png      # Project icon
├── README.md               # Project documentation
│
└── js/
    ├── bootloader.js       # Simulated operating-system boot sequence
    ├── filesystem.js       # Virtual file-system logic
    ├── main.js             # Main OS interface and window management
    ├── memory.js           # Memory allocation and garbage collection logic
    ├── scheduler.js        # Process and CPU scheduling logic
    ├── shell.js            # Terminal commands and shell behavior
    └── utils.js            # Shared utilities, logger, and event system
```


## Future Improvements

- Add Priority Scheduling
- Add persistent storage using Local Storage
- Add a dark/light theme toggle
- Add process-priority editing
- Add waiting-time and turnaround-time statistics
- Add deadlock simulation
- Add paging and virtual-memory simulation
- Improve terminal command support
- Add custom file and folder creation dialogs

---

## Author

**Devansh Gupta**  
