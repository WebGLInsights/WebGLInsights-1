# Included Benchmarks

[The draw benchmark](./draw-benchmark.html) demonstrates how different methods of drawing have different amounts of CPU overhead on WebGL.

[The interleaving benchmark](./interleaving-benchmark.html) demonstrates the cost of interleaving vertices at load time.

# Shader Precision

For an interactive demo on how lower-precision floating point numbers behave, see the [Mediump float calculator](http://oletus.github.io/float16-simulator.js/).

## How to Use Precision Emulation on Chrome

Run Chrome with the command line flag **--emulate-shader-precision**. This will make ANGLE to insert precision emulation code to all shaders it compiles. The shaders will act as if they were running on a device which includes 16-bit float hardware, revealing incorrect usage of mediump and lowp floats.

Precision emulation is supported on all OpenGL based platforms (mostly Linux and Mac), and also on DirectX 11 -capable Windows PCs starting from Chrome version 54 (available in the Canary channel starting June 15th 2016).

Note that the precision emulation has a very high performance cost.
