# Breakpoints
A simple extension for managing breakpoints in gdb.

### How do you use it?

Pressing `F9` will toggle a breakpoint on the current line. The breakpoints will be saved in `(Project root)/.breakpoints` by default in a format that gdb can use with the command line argument `-x .breakpoints`. Be sure to compile all files with the `-g` option or this may not work.

### On the to-do list:

- update when manually changing breakpoint file
- customizable format for use in other debuggers
- other customizations
