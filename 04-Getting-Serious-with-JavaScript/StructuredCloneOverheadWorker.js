var onmessage = function(e) {
    postMessage(e.data, e.data.buffer ? [e.data.buffer] : undefined);
};