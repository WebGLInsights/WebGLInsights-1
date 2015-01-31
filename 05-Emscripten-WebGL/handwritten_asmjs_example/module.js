// In this example we pass in a copy of a reference to the global window
// object, an object which has some non-asm JS we'd like our asm.js compiled
// module to call into, and our heap. We then copy the reference to our passed
// in functions that we planned on using, creating an invariant. If those
// functions are later modified outside of the asm.js module, the asm.js module
// maintains a reference to the original function object. We then create and
// export three functions that we use to fill our heap with dummy values then
// normalize and print a set of four single precision floating point numbers.

function Module (stdlib, foreign, buffer) {
  "use asm";

  var sqrt = stdlib.Math.sqrt;
  var values = new stdlib.Float32Array(buffer);
  var _log = foreign.log;

  function init (size) {
    size = size | 0;
    var p = 0;
    var i = 0.0;
    for (; (p | 0) < (size | 0); p = (p + 4) | 0, i = i + 1.0) {
      values[p >> 2] = +i;
    }
  };

  function normalize (start) {
    start = start | 0;

    var x = 0.0;
    var y = 0.0;
    var z = 0.0;
    var w = 0.0;
    var len = 0.0;

    x = +values[start >> 2];
    y = +values[start + 4 >> 2];
    z = +values[start + 8 >> 2];
    w = +values[start + 12 >> 2];
    len = x * x + y * y + z * z + w * w;

    if (len > 0.0) {
      len = 1.0 / sqrt(len);
      values[start >> 2] = x * len; // storing a double in a float?
      values[start + 4 >> 2] = y * len;
      values[start + 8 >> 2] = z * len;
      values[start + 12 >> 2] = w * len;
    }
  };

  function log (start) {
    start = start | 0;
    _log(+values[start >> 2],
         +values[start + 4 >> 2],
         +values[start + 8 >> 2],
         +values[start + 12 >> 2]
    );
  };

  return {
    init: init,
    normalize: normalize,
    log: log,
  };
};

const HEAP_SIZE = 0x10000; // 64 KB (minimum)
var heap = new ArrayBuffer(HEAP_SIZE);
var module = Module(window, { log: console.log.bind(console) }, heap);

module.init(HEAP_SIZE);
module.log(0);
module.normalize(0);
module.log(0);

