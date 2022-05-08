const fs = require('fs');
const tree = require('./tri');
const rad = require('./rad');

process.argv = process.argv.slice(2);

function getChilds(folder) {
    return fs.readdirSync(folder).map(f=>(fs.statSync((folder+'/'+f).replace(/\/\//g,'/')).isDirectory())?getChilds((folder+'/'+f).replace(/\/\//g,'/')).flat():[(folder+'/'+f).replace(/\/\//g,'/')]).flat();
}

function toInt(num) {
    return String.fromCodePoint(num & 0x000000ff,(num & 0x0000ff00)>>0o10>>>0,(num & 0x00ff0000)>>0o20>>>0,(num & 0xff000000)>>0o30>>>0);
}

let basePath = process.argv[0];
let files = getChilds(basePath);

let letters = [];
let freq = [];
for (let file of files) {
    let con = fs.readFileSync(file,{'encoding':'binary'});
    for (let c of con) {
        if (!letters.includes(c)) letters.push(c);
    }
    for (let c of con) {
        freq[letters.indexOf(c)] ??=0;
        freq[letters.indexOf(c)] += 1;
    }
}
letters = rad(letters,freq);

let t = tree.tree([...letters]);
console.log(tree.getAddr(t));

let ci = `\x00${toInt(letters.join('').length)}${letters.join('')}`;
let fi = ``;
let header = ``;
let data = ``;

for (let file of files) {
    let con = fs.readFileSync(file,{'encoding':'binary'});
    file = ('/'+file.slice(basePath.length)).replace(/\/\//g,'/');
    let d = 
        `\x00${toInt(file.match(/([^\/]+)$/g)[0].length)}${file.match(/([^\/]+)$/g)[0]}`+
        `\x01${toInt((file.match(/^(.+)(?:\/)/g)??'/')[0].length)}${(file.match(/^(.+)(?:\/)/g)??'/')[0]}`+
        `\x02\x04\x00\x00\x00${toInt(con.length)}`+
        `\x03${toInt(tree.encode(con,t).length)}${tree.encode(con,t)}`;
    data += `\x0B${toInt(d.length)}${d}`;

    //console.log(tree.decode(tree.encode(con,t),con.length,t));

    let fn =  `\x01${toInt(file.length)}${file}`;
    let cs =  `\x02${toInt(4)}${toInt(tree.encode(con,t).length)}`;
    let rs =  `\x03${toInt(4)}${toInt(con.length)}`;
    let cfi = `\x0D${toInt((fn+cs+rs).length)}${fn+cs+rs}`;
    fi += cfi;
}

//fi = `\x0D${toInt(fi.length)}${fi}`;
header = `\x0C${toInt(ci.length+fi.length)}${ci}${fi}`
data = header+data;

console.log(Array.from(data).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ').toUpperCase());
fs.writeFileSync(process.argv[1],data,{'encoding':'binary'});