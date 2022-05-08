const chunks = (arr,size)=>arr.reduce( (p,c)=>(p[p.length-1].length==size)?p.concat([[c]]):(p[p.length-1].push(c),p),[[]] );

// let letters = [];
// let freq = [];
// let s = 'Bonjour mon cher ami, comment vas-tu, j\'espère bien';
// for (let ss of s) {
//     if (!letters.includes(ss)) letters.push(ss);
// }
// for (let l of s) {
//     freq[letters.indexOf(l)] ??=0;
//     freq[letters.indexOf(l)] += 1;
// }
// //console.log(freq,letters)
// //console.log(require('./rad')(letters,freq));
// letters = require('./rad')(letters,freq);
// let len = 2;

function generateTree(things) {
    while (things.length != 2) {
        things[0] = [things[0],things[1]];
        if (!things[0].some(v=>v==things[things.length-1]||v==things[things.length-2]))
            things[things.length-1] = [things[things.length-1],things[things.length-2]];
        things = [things[0]].concat(things.slice(2,things.length-2)).concat([things[things.length-1]]);
    }
    return things;
}

function getAddr(things) {
    function ga(things,p=[]) {
        return (typeof things == 'string')?[things,p]:[ga(things[0],p.concat(0)),ga(things[1],p.concat(1))].flat();
    }
    let g = ga(things);
    let o = {};
    while (g.length) {
        o[g[0]] = g[1].join('');
        g = g.slice(2);
    }
    return o;
}

function encode(string,tree) {
    let addr = getAddr(tree);
    let s = '';
    for (let c of string) {
        s += addr[c];
    }
    return s;
}

function decode(string,tree,maxLength=-1) {
    let s = '';
    let node = tree;
    for (p of string) {
        node = node[p];
        if (typeof node == 'string') {
            s += node;
            node = tree;
            maxLength--;
            if (maxLength==0) break;
        }
    }
    return s;
}

function binaryEncode(string,tree) {
    let encoded = encode(string,tree);
    //console.log(chunks(Array.from(encoded),8).map(c=>c.join('')).map((c,i,a)=>i==a.length-1?c.padEnd(8,'0'):c));
    return String.fromCodePoint(...chunks(Array.from(encoded),8).map(c=>c.join('')).map((c,i,a)=>i==a.length-1?c.padEnd(8,'0'):c).map(c=>(c[0]<<7)+(c[1]<<6)+(c[2]<<5)+(c[3]<<4)+(c[4]<<3)+(c[5]<<2)+(c[6]<<1)+(c[7]<<0)));
}

function binaryDecode(binaryEncoded,length,tree) {
    let bytes = Array.from(binaryEncoded).map(b=>b.codePointAt(0)).map(b=>(b&128)+(b&64)+(b&32)+(b&16)+(b&8)+(b&4)+(b&2)+(b&1)).map(b=>b.toString(2).padStart(8,'0')).join('');
    return decode(bytes,tree,length);
}

// let t = generateTree(letters);
// let e = binaryEncode('bjr',t);
// console.log(e);
// console.log(binaryDecode(e,3,t));

// console.log(getAddr(t));

module.exports = {/*decode,binaryDecode,encode,binaryEncode*/decode:binaryDecode,encode:binaryEncode,tree:generateTree,getAddr};