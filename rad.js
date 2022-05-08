function radialSort(things) {
    //console.log(things);
    let sorted = [];

    sorted.push(Math.max(...things));
    things = things.filter((t,i)=>i!=things.indexOf(Math.max(...things)));

    while (things.length) {
        let ll = sorted.slice(0,sorted.indexOf(Math.max(...sorted))).length;
        let rl = sorted.slice(sorted.indexOf(Math.max(...sorted))+1).length;

        if (ll < rl) {
            sorted = [Math.max(...things)].concat(sorted);
        } else {
            sorted = sorted.concat(Math.max(...things));
        }

        things = things.filter((t,i)=>i!=things.indexOf(Math.max(...things)));
    }

    return sorted;
}

function radialSortChars(chars,freq) {
    let c = {};
    for (let i in chars) {
        c[chars[i]] = freq[i];
    }
    //console.log(c);
    let sf = radialSort(freq); // [ 1, 3, 5, 4, 2 ]
    //console.log(sf);
    let s = []; // ['a','c','e','d','b']
    for (let f of sf) {
        let cci = Object.values(c).indexOf(f);
        let cc = Object.keys(c)[cci];
        s.push(cc);
        delete c[cc];
    }
    return s.reverse();
}

// let freq = [ 1,  2,  3,  4,  5 ];
// let c =    ['a','b','c','d','e'];
// console.log(radialSortChars(c,freq));

module.exports = radialSortChars;