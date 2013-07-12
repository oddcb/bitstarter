#!/usr/bin/env node
/*
 Automatically grade files for the presence of specified HTML tags/attributes.
 Uses commander.js and cheerio. Teaches command line application development
 and basic DOM parsing.

 References:

 + cheerio
 - https://github.com/MatthewMueller/cheerio
 - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
 - http://maxogden.com/scraping-with-node.html

 + commander.js
 - https://github.com/visionmedia/commander.js
 - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
 - http://en.wikipedia.org/wiki/JSON
 - https://developer.mozilla.org/en-US/docs/JSON
 - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 */

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function (infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

function readFile(htmlfile) {
    return fs.readFileSync(htmlfile);
}
var cheerioHtml = function (html) {
    return cheerio.load(html);
};

var loadChecks = function (checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function (html, checks) {
    $ = cheerioHtml(html);
    var sortedChecks = checks.sort();
    var out = {};
    for (var ii in sortedChecks) {
        var present = $(sortedChecks[ii]).length > 0;
        out[sortedChecks[ii]] = present;
    }
    return out;
};

var clone = function (fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var checkHtmlFromUrl = function (url, checksFile) {
    rest.get(url)
        .on('success', function (data, response) {
            var checkJson = checkHtml(data, loadChecks(checksFile));
            outputJson(checkJson);
        })
        .on('error', function(){
            console.log("failed on url: %s", url);
            process.exit(1);
        });
};

var checkHtmlFromFile = function (file, checksFile) {
    var checkJson = checkHtml(readFile(program.file), loadChecks(program.checks));
    outputJson(checkJson)
};

var outputJson = function (checkJson) {
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

if (require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to html file', null, null)
        .parse(process.argv);

    if (program.url) {
        checkHtmlFromUrl(program.url, program.checks)
    } else {
        checkHtmlFromFile(program.file, program.checks)
    }


} else {
    exports.checkHtmlFile = checkHtmlFile;
}
