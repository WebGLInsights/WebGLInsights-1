"use strict";

var benchUtil = (function() {

/**
 * Log a string message on the page and to the console.
 */
var log = function(message) {
    console.log(message);
    var p = document.createElement('p');
    p.textContent = message;
    var logElement = document.getElementById('log');
    if (!logElement)
        logElement = document.body;
    logElement.appendChild(p);
};

var now = (function() {
 
// Returns the number of milliseconds elapsed since either the browser navigationStart event or
// the UNIX epoch, depending on availability.
// Where the browser supports 'performance' we use that as it is more accurate (microseconds
// will be returned in the fractional part) and more reliable as it does not rely on the system time.
// Where 'performance' is not available, we will fall back to Date().getTime().
 
var performance = window.performance || {};
 
performance.now = (function() {
return performance.now    ||
performance.webkitNow     ||
performance.msNow         ||
performance.oNow          ||
performance.mozNow        ||
function() { return new Date().getTime(); };
})();
 
return performance.now();
 
});  

var dummyValue;

/**
 * Simulate CPU load from application logic.
 */
var cpuWork = function(multiplier) {
    if (multiplier === undefined) {
        multiplier = 1;
    }
    for (var j = 0; j < multiplier; ++j) {
        for (var i = 0; i < 10000; ++i) {
            // the function has side effects in order to prevent dead code elimination
            dummyValue += Math.sin(i * 0.01);
        }
    }
};


/**
 * Simulate CPU load from application logic for at least the given
 * number of milliseconds.
 */
var cpuWorkMillis = function(minMilliseconds) {
    var start = now();
    var end = start;
    while (end - start < minMilliseconds) {
        cpuWork();
        end = now();
    }
};

return {
    cpuWork: cpuWork,
    cpuWorkMillis: cpuWorkMillis,
    log: log,
    now: now
};

})();


var glUtil = (function() {

var gl = null;
var vaoExt = null;

var init = function(aGl) {
    if (aGl !== undefined) {
        gl = aGl;
    } else {
        var canvas = document.createElement('canvas');
        gl = canvas.getContext('webgl');
    }

    gl.enableVertexAttribArray(0);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    vaoExt = gl.getExtension('OES_vertex_array_object');
};

/**
 * @constructor
 * @param {number} numComponents Number of float32 components per element.
 * @param {Float32Array|Array.<number>} array Raw array data.
 */
var VertexArray = function(numComponents, array) {
    this.numComponents = numComponents;
    this.array = array;
};

/**
 * @param {Array.<VertexArray>} arrays Vertex arrays that need to be interleaved.
 * @param {number} vertexCount Number of vertices.
 * @return 
 */
var interleaveArrays = function(arrays, vertexCount) {
    var interleaved = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, interleaved);
    var size = 0;
    for (var j = 0; j < arrays.length; ++j) {
        size += arrays[j].numComponents;
    }
    size *= vertexCount;
    var data = new Float32Array(size);
    var ind = 0;
    for (var i = 0; i < vertexCount; ++i) {
        for (var j = 0; j < arrays.length; ++j) {
            for (var k = 0; k < arrays[j].numComponents; ++k) {
                data[ind] = arrays[j].array[i * arrays[j].numComponents + k];
                ind++;
            }
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return interleaved;
};

var createGridShader = function(numAttrs, numLightUniforms) {
    var numColorAttrs = numAttrs - 1;

    var prog = gl.createProgram();
    var vert = gl.createShader(gl.VERTEX_SHADER);
    var frag = gl.createShader(gl.FRAGMENT_SHADER);

    var vertSrc = [];
    vertSrc.push('uniform mat4 u_mat;');
    vertSrc.push('attribute vec3 a_pos;');
    for (var i = 0; i < numColorAttrs; ++i) {
        vertSrc.push('attribute vec3 a_attr' + i + ';');
    }
    vertSrc.push('varying vec3 v_color;');
    vertSrc.push('void main() {');
    vertSrc.push('    gl_Position = u_mat * vec4(a_pos, 1.0);');
    vertSrc.push('    vec3 colorSum = vec3(0.0, 0.0, 0.0);');
    for (var i = 0; i < numColorAttrs; ++i) {
        vertSrc.push('    colorSum += a_attr' + i + ';');
    }
    if (numColorAttrs > 0) {
        vertSrc.push('    v_color = 0.5 + colorSum * 0.8 / ' + numColorAttrs + '.0;');
    }
    vertSrc.push('}');

    var fragSrc = [];
    fragSrc.push('precision mediump float;');
    for (var i = 0; i < numLightUniforms; ++i) {
        fragSrc.push('uniform vec3 u_light' + i + ';');
    }
    fragSrc.push('varying vec3 v_color;');
    fragSrc.push('void main() {');
    fragSrc.push('    vec3 light = vec3(1.0);');
    for (var i = 0; i < numLightUniforms; ++i) {
        fragSrc.push('    light *= u_light' + i + ';');
    }
    fragSrc.push('    gl_FragColor = vec4(v_color * light, 1.0);');
    fragSrc.push('}');

    gl.shaderSource(vert, vertSrc.join('\n'));
    gl.shaderSource(frag, fragSrc.join('\n'));
    gl.compileShader(vert);
    gl.compileShader(frag);
    //benchUtil.log(gl.getShaderInfoLog(vert) + '\n' + vertSrc.join('\n'));
    //benchUtil.log(gl.getShaderInfoLog(frag) + '\n' + fragSrc.join('\n'));
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.bindAttribLocation(prog, 0, 'a_pos');
    for (var i = 0; i < numColorAttrs; ++i) {
        gl.bindAttribLocation(prog, i + 1, 'a_attr' + i);
    }
    gl.linkProgram(prog);

    return prog;
};

/**
 * Create a warped grid of vertices for testing drawing.
 * @param {WebGLRenderingContext} gl
 * @param {number} width Width in grid cells.
 * @param {number} height Height in grid cells.
 * @param {number} numAttrs Number of vertex attributes. Must be at least 1 (position).
 * @param {bool} useDrawElements True to use drawElements instead of drawArrays.
 * @param {GLenum} mode gl.TRIANGLES or gl.TRIANGLE_STRIP
 * @param {bool} interleaved True to interleave vertex attributes.
 * @param {bool} useVAO True to use VAO. Will use a fallback if VAO extension not supported.
 * @param {number} seed Seed to make the object look unique.
 * @return {function} function that draws the warped grid.
 */
var createWarpedGrid = function(width, height, numAttrs, useDrawElements, mode, interleaved, useVAO, seed) {
    var numColorAttrs = numAttrs - 1;

    var getVertPosition = function(xInd, yInd) {
        var x = ((xInd / width) - 0.5) * 1.8;
        var y = ((yInd / height) - 0.5) * 1.8;
        return [x, y];
    };

    var getWarpedVertPosition = function(xInd, yInd) {
        var pos = getVertPosition(xInd, yInd);
        var x = pos[0];
        var y = pos[1];
        var z = Math.sin((x + y + seed) * 10.0) * 0.04;
        x += Math.sin((x + y + seed) * 12.0 + 2.0) * 0.03;
        y += z;
        return [x, y, z];
    };

    var getVertColorAttribute = function(xInd, yInd, attributeIndex, numComponents) {
        var pos = getVertPosition(xInd, yInd);
        var x = pos[0];
        var y = pos[1];
        var arr = [];
        for (var i = 0; i < numComponents; ++i) {
            if (i == attributeIndex % numComponents) {
                if (0 == attributeIndex % 2) {
                    arr.push(Math.sin((x + 1 + seed) * (attributeIndex + 1)));
                } else {
                    arr.push(Math.sin((y + 1 + seed) * (attributeIndex + 1)));
                }
            } else {
                arr.push(0.5);
            }
        }
        return arr;
    };

    var positions = [];
    var attrs = [];
    for (var i = 0; i < numColorAttrs; ++i) {
        attrs.push(new VertexArray(3, []));
    }

    var addPosToData = function(xInd, yInd) {
        positions.push.apply(positions, getWarpedVertPosition(xInd, yInd));
        for (var i = 0; i < numColorAttrs; ++i) {
            attrs[i].array.push.apply(attrs[i].array, getVertColorAttribute(xInd, yInd, i, 3));
        }
    }

    var addPos;

    if (useDrawElements) {
        var indices = [];
        for (var yInd = 0; yInd <= width; ++yInd) {
            for (var xInd = 0; xInd <= width; ++xInd) {
                addPosToData(xInd, yInd);
            }
        }
        var getElementIndex = function(xInd, yInd) {
            return yInd * (width + 1) + xInd;
        };
        addPos = function(xInd, yInd) {
            indices.push(getElementIndex(xInd, yInd));
        }
    } else {
        addPos = addPosToData;
    }

    for (var yInd = 0; yInd < width; ++yInd) {
        for (var xInd = 0; xInd < width; ++xInd) {
            if (mode === gl.TRIANGLES) {
                addPos(xInd, yInd);
                addPos(xInd, yInd + 1);
                addPos(xInd + 1, yInd);

                addPos(xInd + 1, yInd + 1);
                addPos(xInd + 1, yInd);
                addPos(xInd, yInd + 1);
            } else {
                // mode === gl.TRIANGLE_STRIP
                if (xInd == 0) {
                    if (yInd > 0) {
                        // Add a degenerate triangle
                        addPos(xInd, yInd);
                    }
                    addPos(xInd, yInd);
                    addPos(xInd, yInd + 1);
                }
                addPos(xInd + 1, yInd);
                addPos(xInd + 1, yInd + 1);
                if (xInd == width - 1) {
                    // Add a degenerate triangle
                    addPos(xInd + 1, yInd + 1);
                }
            }
        }
    }

    var numVerts;
    var indexBuf;
    if (useDrawElements) {
        numVerts = indices.length;
        indexBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    } else {
        numVerts = positions.length / 3;
    }

    var bind;
    var draw;

    if (!interleaved) {
        var positionsBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        var attrBufs = [positionsBuf];
        for (var i = 0; i < numColorAttrs; ++i) {
            var attrBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, attrBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attrs[i].array), gl.STATIC_DRAW);
            attrBufs.push(attrBuf);
        }

        if (useDrawElements) {
            bind = function() {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
                for (var i = 0; i < numAttrs; ++i) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, attrBufs[i]);
                    if (i > 0) {
                        gl.enableVertexAttribArray(i);
                    }
                    gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 4 * 3, 0);
                }
            };
        } else {
            bind = function() {
                for (var i = 0; i < numAttrs; ++i) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, attrBufs[i]);
                    if (i > 0) {
                        gl.enableVertexAttribArray(i);
                    }
                    gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 4 * 3, 0);
                }
            };
        }
    } else {
        var posArray = new VertexArray(3, positions);
        attrs.splice(0, 0, posArray);
        var interleavedBuf = interleaveArrays(attrs, numVerts);

        if (useDrawElements) {
            bind = function() {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
                gl.bindBuffer(gl.ARRAY_BUFFER, interleavedBuf);
                for (var i = 0; i < numAttrs; ++i) {
                    if (i > 0) {
                        gl.enableVertexAttribArray(i);
                    }
                    gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 4 * 3 * numAttrs, 4 * 3 * i);
                }
            };
        } else {
            bind = function() {
                gl.bindBuffer(gl.ARRAY_BUFFER, interleavedBuf);
                for (var i = 0; i < numAttrs; ++i) {
                    if (i > 0) {
                        gl.enableVertexAttribArray(i);
                    }
                    gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 4 * 3 * numAttrs, 4 * 3 * i);
                }
            };
        }
    }

    if (useVAO) {
        if (vaoExt) {
            var vao = vaoExt.createVertexArrayOES();
            vaoExt.bindVertexArrayOES(vao);
            gl.enableVertexAttribArray(0);
            bind();
        }
        // Note that creating new function instances for every mesh like this is not optimal, but
        // in this case where there's only two unique objects and we don't mind a bit of constant
        // CPU overhead it's acceptable.
        if (useDrawElements) {
            draw = function() {
                if (vaoExt)
                    vaoExt.bindVertexArrayOES(vao);
                else
                    bind();
                gl.drawElements(mode, numVerts, gl.UNSIGNED_SHORT, 0);
            };
        } else {
            draw = function() {
                if (vaoExt)
                    vaoExt.bindVertexArrayOES(vao);
                else
                    bind();
                gl.drawArrays(mode, 0, numVerts);
            };
        }
    } else {
        if (useDrawElements) {
            draw = function() {
                bind();
                gl.drawElements(mode, numVerts, gl.UNSIGNED_SHORT, 0);
            };
        } else {
            draw = function() {
                bind();
                gl.drawArrays(mode, 0, numVerts);
            };
        }
    }

    return draw;
};

return {
    init: init,

    createGridShader: createGridShader,
    createWarpedGrid: createWarpedGrid
};

})();
