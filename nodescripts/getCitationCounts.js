// Import dependencies
const fs = require('fs');
const rp = require('request-promise');
const cheerio = require('cheerio');

// Request HTML from 
const options = {
    uri: `https://scholar.google.co.uk/citations?user=wHpPF50AAAAJ&hl=en`,
    transform: body => cheerio.load(body)
};
rp(options)
  .then(($) => {
        // Get data
        htmlSource = $.html();

        // Create function to extract captured groups
        const extractCapturedGroups = (regex) => {
            let extractedGroups = [];
            let execResults = regex.exec(htmlSource);
            while (execResults != null){                // This also works:
                extractedGroups.push(execResults[1]);   // while (execResults = regex.exec(htmlSource)){
                execResults = regex.exec(htmlSource);   //    extractedGroups.push(execResults[1]); 
            }                                           // }
            return extractedGroups;
        }

        // Find all article citation
        citationCounts = extractCapturedGroups(/gsc_g_al">(\d*)/g);
        citations = extractCapturedGroups(/gsc_a_ac gs_ibl">(\d*)/g);
        articleNames = extractCapturedGroups(/"gsc_a_at">([\w\s:]*)/g);
        citationsAcrossYears = extractCapturedGroups(/"gsc_g_al">([\w\s:]*)/g);

        // Correct empty citations
        for (let i=0; i<citations.length; i++){
            if (!citations[i]) {
                citations[i] = `' '`
            }
        }

        // Save JS file
        var fileContent = 
            'var ticsCitations = ' + citations[0] + '; ' +
            'var firstFrontiersCitations = ' + citations[1] + '; ' +
            'var ejnCitations = ' + citations[2] + '; ' +
            'var jepgCitations = ' + citations[3] + ';' +
            'var secondFrontiersCitations = ' + citations[4] + '; ' + 
            'var citationsAcrossYears = [' + citationsAcrossYears + ']'
        ;
        var filepath = "citationCounts.js";
        fs.writeFile(filepath, fileContent, (err) => {
            if (err) throw err;

            console.log("The file was succesfully saved!");
        }); 
  })
  .catch((err) => {
    console.log(err);
  });
