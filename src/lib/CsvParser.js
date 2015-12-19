'use strict';

function stateParser(line) {
    let len = line.length,
        valueIndex = 0,
        state = 0, // 0 - initila, 1 = start ", 2 = after ", 3 - plain text without quotes
        res = [];

    let startIndex = 1,
        endIndex = 0;

    for(let i = 0; i < len; ++i) {
        let c = line[i];
        if(c == '"') {
            if(state != 1) {
                startIndex = i + 1;
                state = 1;
            } else {
                endIndex = i - 1;
                state = 2;
            }

        } else if(c == ',') {
            if(state == 1) continue;
            else if(state == 3) endIndex = i - 1;

            if(startIndex >= endIndex + 1) {
                res.push(null);
            } else {
                let term = line.substr(startIndex, endIndex - startIndex + 1);
                res.push(term);
            }

            state = 0;
            endIndex = i;
            startIndex = i + 1;

        } else {
            if(state == 1) continue;
            else if(state == 0) {
                startIndex = i;
                state = 3;
            }
        }

        if(i == len - 1){
            if(state == 1) throw "error format";
            else if(state == 2) --len;
            else if(state == 0) {
                res.push(null);
                continue;
            }
            let term = line.substr(startIndex, len - startIndex);
            res.push(term);
        }
    }

    return res;
}

function Parser() { }
Parser.prototype.toArray = stateParser;
Parser.prototype.parse = function(cvsLine) {
    var arr = this.toArray(cvsLine);
    return arr;
}

exports.get = function(type){
    if(type == 'state')
        return Parser;

    // TODO: regex parser
    //return { parse: regexParser };
};
