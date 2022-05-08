const fs = require('fs');
const tree = require('./tri');

process.argv = process.argv.slice(2);

let data = fs.readFileSync(process.argv[0],{'encoding':'binary'});

/*
TSSSSD...
    Type: 1 byte
    Size: 4 bytes
    Data: [Size] bytes
*/

function parseThing(data,typesHandlers) {
    //let ms = Math.max(...types.concat('<unknown>').map(e=>e.length));
    let dtypes = {
        '00': function string(dat,size){
            return dat;
        },
        '01': function ubyte(dat,size){
            return dat.charCodeAt(0);
        },
        '02': function byte(dat,size){
            return dat.charCodeAt(0)>127?-dat.charCodeAt(0):dat.charCodeAt(0);
        },
        '03': function uint(dat,size){
            return ((dat.charCodeAt(0) << 8*0) + (dat.charCodeAt(1) << 8*1) +(dat.charCodeAt(2) << 8*2) + (dat.charCodeAt(3) << 8*3))>>>0;
        },
        '04': function int(dat,size){
            return (dat.charCodeAt(0) << 8*0) + (dat.charCodeAt(1) << 8*1) +(dat.charCodeAt(2) << 8*2) + (dat.charCodeAt(3) << 8*3);
        },
    }
    typesHandlers = {...typesHandlers,
        ...dtypes,
        
    }
    let ret = [];
    while (data.length) {

        let rtype = data.charCodeAt(0).toString(16).padStart(2,"0").toUpperCase();
        //let type = Object.keys(typesHandlers).filter((k)=>k!='<unknown>')[rtype]??'<unknown>';
        let size = ((data.charCodeAt(1) << 8*0) + (data.charCodeAt(2) << 8*1) +(data.charCodeAt(3) << 8*2) + (data.charCodeAt(4) << 8*3))>>>0;
        let rdata = data.slice(5,5+size);

        //console.log(`\ntype: ${rtype.toString(16).padStart(2,'0').toUpperCase()} ${type.padEnd(ms,' ')} length: ${size}`);

        // let rv = (typesHandlers[type]??(()=>{}))(rdata,size);
        // if (rv) {
        //     ret.push(rv);
        // }

        let tPattern = RegExp('^('+rtype+')(#\\w+)?$');
        let rtKey_ = Object.keys(typesHandlers).find(
            k => k.match( tPattern ) != null
        );
        if (rtKey_) {
            let [rtKey,type,transform] = rtKey_.match(tPattern);
            let rv;
            if (transform) {
                rv = typesHandlers[rtKey](
                    Object.values(typesHandlers).find(h=>"#"+h.name==transform)(rdata,size),
                    size
                );
            } else {
                rv = typesHandlers[rtKey](rdata,size);
            }
            if (rv) ret.push(rv);
        } else {
            Object.values(typesHandlers).find(h=>h.name=='<unknown>')??(()=>{})(rdata,size);
        }

        data = data.slice(5+size);
    }
    return ret;
}

if (data.length) {
    let files = parseThing(data,{
        '<unknown>': function(dat,size) {
            console.log(`> ${Array.from(dat).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ').toUpperCase()}`)
        },
        // '0A': function Folder(dat,size) {
        //     /*
        //     FS:
        //         [ FN,FP ],
        //         ...
        //     FS: FolderStructure
        //     FN: FolderName
        //     FP: FolderPath
        //     */
        //     let [fn,fp] = parseThing(dat);
        //     console.log(`Got a folder: ${fp}${fn}`);
        // },
        '0B': function FileData(dat,size) {
            //console.log('FD');
            //console.log(Array.from(dat).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ').toUpperCase());
            /*
            FD:
                [ FN,FP,FC ],
                ...
            FS: FileData
            FN: FileName
            FP: FilePath
            FC: FileContent
            */
            return {type:'fd', value: parseThing(dat,{
                '00#string': function FileName(fnDat,fnSize) {
                    //console.log(`fn: ${fnDat}`);
                    return fnDat;
                },
                '01#string': function FilePath(fpDat,fpSize) {
                    //console.log(`fp: ${fpDat}`);
                    return fpDat;
                },
                '02#uint': function ContentLength(clDat,fcSize) {
                    //console.log(`cl: ${clDat}`);
                    return clDat;
                },
                '03#string': function FileContent(fcDat,fcSize) {
                    //console.log(`fc: ${fcDat}`);
                    return fcDat;
                }
            })};
        },
        '0C': function compressionInfo(dat,size) {
            return {type: 'ci', value: parseThing(dat,{
                '00#string': function CompressionTree(ctDat,ctSize) {
                    return ctDat;
                },
                '0D': function FileInfo(fiDat,fiSize) {
                    let [fn,cs,rs] = parseThing(fiDat,{
                        '01#string': function FileName(fnDat,fnSize) {
                            return fnDat;
                        },
                        '02#uint': function CompressedSize(csDat,csSize) {
                            return csDat;
                        },
                        '03#uint': function UncompressedSize(usDat,usSize) {
                            return usDat;
                        }
                    });
                    return {
                        name: fn,
                        compressed: cs,
                        uncompressed: rs
                    };
                }
            })};
        }
    });

    if (fs.existsSync(process.argv[1])) fs.rmSync(process.argv[1],{force:true,recursive:true});
    let t;
    for (let file of files) {
        //console.log(file);
        if (file.type == 'fd') {
            file = file.value;
            let [fn,fp,cl,fc] = file;
            fs.mkdirSync((process.argv[1]+fp).replace(/\/\//g,'/'),{'recursive':true});
            fs.writeFileSync((process.argv[1]+fp+'/'+fn).replace(/\/\//g,'/'),tree.decode(fc,cl,t),{'encoding':'binary'});
        } else if (file.type == 'ci') {

            let ct = file.value[0];
            let files = file.value.slice(1);
            t = tree.tree(Array.from(ct));

            const longest = (arr)=>arr.reduce( (a,b)=>a.length>b.length?a:b );
            let ln = longest(files.map(f=>f.name));

            for (let f of files) {
                console.log(`${f.name}\t${f.uncompressed}\t${f.compressed}\t${Math.round((f.compressed/f.uncompressed)*100*10)/10}%`);
            }
            //console.log(tree.getAddr(t));
        }
    }

    // parseThing(data,{
    //     '0A#string': function(dat,size) {
    //         console.log(dat);
    //     }
    // })

    // let types = [
    //     'FolderStructure',
    //     'FileData'
    // ];  
    // let ms = Math.max(...types.concat('<unknown>').map(e=>e.length));
    // while (data.length) {

    //     let rtype = data.charCodeAt(0);
    //     let type = types[rtype]??'<unknown>';
    //     let size = ((data.charCodeAt(1) << 8*0) + (data.charCodeAt(2) << 8*1) +(data.charCodeAt(3) << 8*2) + (data.charCodeAt(4) << 8*3))>>>0;
    //     let rdata = data.slice(5,5+size);

    //     console.log(`\ntype: ${rtype.toString(16).padStart(2,'0').toUpperCase()} ${type.padEnd(ms,' ')} length: ${size}`);

    //     if (type == 'FolderStructure') {

    //     }
    //     if (type == 'FileData') {

    //     }
    //     if (type == '<unknown>') {
    //         console.log(`> ${Array.from(rdata).map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ').toUpperCase()}`)
    //     }

    //     data = data.slice(5+size);
    // }

    // console.log();
} else {

    console.log('<no data>');

}