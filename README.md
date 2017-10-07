# Breakpoints
A simple extension for controlling gdb breakpoints.

### How to use it
Pressing `F9` will toggle breakpoints on the current line. These breakpoints will be saved in `projectDir/.breakpoints` by default in a format that gdb can use with the command line argument `-x .breakpoints`. Be sure to compile all files with the `-g` option or this will not work.
