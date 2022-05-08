# JS_compressor

Two simple JS programs I made that use huffman trees to compress files / folders `pack.js` is the one to compress and `unpack.js` is to decompress, `tri.js` and `rad.js` are helper files that contain the tree generation code (`tri.js`) as well as a function to optimize the tree generation (`rad.js`).

## How to use

`node pack.js <FOLDER> <OUTPUT-FILE>` compresses the content of *FODLER* and writes it to *OUTPUT*.
`node unpack.js <COMPRESSED-FILE> <OUTPUT-FOLDER>` extracts the files compressed in *COMPRESSED-FILE* and sputs them in *OUPUT-FOLDER*
