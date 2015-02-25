# Included Benchmarks

[The draw benchmark](./draw-benchmark.html) demonstrates how different methods of drawing have different amounts of CPU overhead on WebGL.

[The interleaving benchmark](./interleaving-benchmark.html) demonstrates the cost of interleaving vertices at load time.

# Shader Precision

For an interactive demo on how lower-precision floating point numbers behave, see the [Mediump float calculator](http://oletus.github.io/float16-simulator.js/).

## How to Use Precision Emulation on Chrome

On Windows, run Chrome with the command line flags **--emulate-shader-precision --use-gl=desktop**. This will make ANGLE to insert precision emulation code to all shaders it compiles. The shaders will act as if they were running on mobile devices which include 16-bit float hardware, revealing incorrect usage of mediump and lowp floats.

On Linux/Mac, using simply **--emulate-shader-precision** is enough.

Note that the precision emulation has a very high performance cost.
