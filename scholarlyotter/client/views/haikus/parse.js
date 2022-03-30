import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';


Template.haikuParser.events({
    'click #parse': function(event){
        event.preventDefault();
        parseHaiku();
    },
    'click #parse-email': function(event){
        event.preventDefault();
        Meteor.call('updateHaikuMail');
    }
})

function parseHaiku(){
    input = document.getElementById("inputText").value;
    output = haikuCheck(input);
    document.getElementById("outputText").value = output.haikus.join();
    document.getElementById("closeText").value = output.closePoems.join();
    document.getElementById("rejectedText").value = output.notHaikus.join();
}
function haikuCheck(input){
    console.log("input", input);
    lines = input.split(/\r\n|\r|\n/);
    linesParsed = [];
    haikus = [];
    closePoems = [];
    notHaikus = [];
    for(i = 0;  i < lines.length; i++){
        //Remove all blank lines
        if(lines[i].trim() == "/n" || lines[i] == "" || lines[i].indexOf("<") > -1){
            lines.splice(i,1);
        }
    }
    console.log("cleaned input", lines);
    for(i = 0;  i < lines.length; i++){
        words = lines[i].split(" ");
        lineData = {};
        lineData.wordsParsed = [];
        lineData.syllableCount = 0;
        for(j = 0; j < words.length; j++) {
            syllables = undefined;
            syllablesCount = 0;
            wordInit = words[j];
            syllables = getSylls(wordInit);
            if(syllables){
                lineData.wordsParsed.push(wordInit);
                lineData.syllableCount += syllables.length;
            }
        }
        linesParsed.push(lineData);
    }

    //Check for Errors
    for(i = 0; i < lines.length; i++){
        if(linesParsed[i].syllableCount == 6 || linesParsed[i].syllableCount == 4){
            words = lines[i].split(" ");
            for(j = 0;  j < words.length; j++){
                wordInit = words[j];
                syllables = getSylls(wordInit);
                if(wordInit.slice(-1) == "s"){
                    linesParsed[i].syllableCount -= 1;
                }
                if(wordInit.includes("-")){
                    linesParsed[i].syllableCount += 1;
                }
            }
        }
    }

    //Check for Haikus
    for(i = 0; i < linesParsed.length; i++){
        if(i < linesParsed.length - 2){
            if(linesParsed[i].syllableCount == 5 && linesParsed[i+1].syllableCount == 7 && linesParsed[i+2].syllableCount == 5){
                console.log("Haiku Detected. Added To Haiku List")
                title = "";
                if(i > 0){
                    if(linesParsed[i - 1].syllableCount > 0 && linesParsed[i - 1].wordsParsed.join(" ").indexOf(":") > -1 && linesParsed[i - 1].wordsParsed.join(" ").indexOf(">") === -1){
                        title = linesParsed[i-1].wordsParsed.join(" ") + "\n";
                    }
                }   
                haikus.push(title + linesParsed[i].wordsParsed.join(" ") + "\n" + linesParsed[i+1].wordsParsed.join(" ")  +   "\n" +linesParsed[i+2].wordsParsed.join(" ") +  "\n\n");
            }
            else {
                console.log(linesParsed[i]);
                console.log("Logic",Math.abs(linesParsed[i].syllableCount - 5), Math.abs(linesParsed[i+1].syllableCount - 7), Math.abs(linesParsed[i+2].syllableCount - 5));
                if(
                    Math.abs(linesParsed[i].syllableCount - 5) < 3 && Math.abs(linesParsed[i+1].syllableCount - 7) < 3 && Math.abs(linesParsed[i+2].syllableCount - 5) < 3
                ){
                    title = "";
                    if(i > 0){
                        if(linesParsed[i - 1].syllableCount > 0 && linesParsed[i - 1].wordsParsed.join(" ").indexOf(":") > -1 && linesParsed[i - 1].wordsParsed.join(" ").indexOf(">") === -1){
                            title = linesParsed[i-1].wordsParsed.join(" ") + "\n";
                        }
                    }   
                    console.log ("Close Poem Detected")
                    pattern = linesParsed[i].syllableCount + " "  + linesParsed[i+1].syllableCount  + " "  +  linesParsed[i+2].syllableCount;
                    closePoems.push(title + linesParsed[i].wordsParsed.join(" ") + "\n" + linesParsed[i+1].wordsParsed.join(" ")  +   "\n" +linesParsed[i+2].wordsParsed.join(" ") +  "\n\n");
                } else {
                    console.log ("Haiku Not Detected");
                    pattern = linesParsed[i].syllableCount + " "  + linesParsed[i+1].syllableCount  + " "  +  linesParsed[i+2].syllableCount;
                    notHaikus.push(linesParsed[i].wordsParsed.join(" ") + " " + linesParsed[i].syllableCount + "\n" + linesParsed[i+1].wordsParsed.join(" ") + " " + linesParsed[i+1].syllableCount + "\n" +linesParsed[i+2].wordsParsed.join(" ") + " " + linesParsed[i+2].syllableCount + "\n" +  "== Rejected due to syllable pattern: " +  pattern + " ==\n\n");
                }
            }
        }
    }
    console.log(haikus);
    return {haikus, closePoems, notHaikus};
}

function getSylls(wordInit){
    const syllableRegex = /[aeiouy]{1,2}/g;
    word = wordInit.replace("'","").toLowerCase();
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');  
    syllables = word.match(syllableRegex);
    return syllables;
}