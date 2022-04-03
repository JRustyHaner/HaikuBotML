import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.haikuParser.helpers({
    haikuMail: function(){
        emails = MailRecieved.find({project: "Haiku", processed:false}).fetch();
        return emails;
    },
    haikuList: function(){
        const t = Template.instance();
        haikus = t.currentHaikus.get();
        return haikus;
    },
    allHaikus: function(){
        haikus = Haikus.find().fetch();
        return haikus;
    },
    lsaData: function(){
        lsaData = HaikuLSAData.find({}).fetch()[0];
        console.log(lsaData);
        return lsaData.stats
    },
    generatedHaiku: function(){
        const t = Template.instance();
        generatedHaiku = t.generatedHaiku.get();
        return generatedHaiku;
    },
});
Template.haikuParser.events({
    'click #parse': function(event){
        event.preventDefault();
        parseHaiku();
    },
    'click #import-email': function(event){
        event.preventDefault();
        Meteor.call('updateHaikuMail');
        alert('Please refresh your page if processing returns undefined.');
    },
    'click #mark-email': function(event){
        id = event.target.getAttribute("data-id");
        Meteor.call('markEmail', id);
    },
    'click #process-email': function(event){
        id = event.target.getAttribute("data-id");
        options = {};
        if(document.getElementById('onlyNew').checked){
            options.onlyNew = true;
          }
        Meteor.call('processEmailAsHaiku',id,options)
        email = MailRecieved.findOne({_id: id});
        document.getElementById("inputText").value = email.textProcessed;
        parseHaiku();
    },
    'click #delete-new-haiku': function(event){
        id = event.target.getAttribute("data-id");
        const t = Template.instance();
        haikus = t.currentHaikus.get();
        haikus.splice(id,1);
        t.currentHaikus.set(haikus);
    },
    'click #accept-new-haiku': function(event){
        id = event.target.getAttribute("data-id");
        const t = Template.instance();
        haikus = t.currentHaikus.get();
        data = {
            haiku: haikus[id],
            approvedBy: Meteor.userId()
        }
        Meteor.call('addHaikuToDataset',data)
        haikus.splice(id,1);
        t.currentHaikus.set(haikus);
    },
    'click #delete-haiku': function(event){
        id = event.target.getAttribute("data-id");
        Meteor.call('deleteHaiku',id)
    },
    'click #regenerate-lsa': function(event){
        id = event.target.getAttribute("data-id");
        Meteor.call('regenerateHaikuLSA');
    },
    'click #generate-haiku-random-cooccurance': function (){
        const t = Template.instance();
        haikus = t.generatedHaiku.get();
        syllableCount = 0;
        haiku = "";
        uniqueWords = HaikuLSAData.find({}).fetch()[0].stats.uniqueWords;
        min = 0;
        max = uniqueWords.length;
        startIndex = Math.round(Math.random() * (max - min) + min);
        startWord = uniqueWords[startIndex].word;
        haiku = startWord; 
        console.log("START HAIKU:");
        console.log(haiku);
        syllableCount = uniqueWords[startIndex].syllables;
        lastIndex = startIndex;
        desiredLength = 5;
        nextWord = "";
        while(syllableCount <= desiredLength){
            wordChoices = []; i = -1;;
            for(i = 0;i < uniqueWords[lastIndex].adjacentWords.length; i++){
                console.log()
                if( uniqueWords[lastIndex].adjacentWords[i].syllables < desiredLength - syllableCount && uniqueWords[lastIndex].adjacentWords[i].position == "after"  && uniqueWords[lastIndex].adjacentWords[i].word != startWord){
                    wordChoices.push({
                        word: uniqueWords[lastIndex].adjacentWords[i].word,
                        syllables: uniqueWords[lastIndex].adjacentWords[i].syllables,
                    });
                }
            }
            min = 0;
            max = wordChoices.length;
            nextWordIndex = Math.round(Math.random() * (max - min) + min);
            if(typeof wordChoices[nextWordIndex] !== "undefined"){
                nextWord = wordChoices[nextWordIndex].word;
                haiku += " " + nextWord;
                console.log(haiku, syllableCount);
                syllableCount =  syllableCount + wordChoices[nextWordIndex].syllables;
            } else {
                for(j = 0; j < uniqueWords.length; j++){
                    if( uniqueWords[i].syllables <= desiredLength - syllableCount  && uniqueWords[i].word != nextWord){
                        wordChoices.push({
                            word: uniqueWords[i].word,
                            syllables: uniqueWords[i].syllables,
                        });
                    }
                }
                min = 0;
                max = wordChoices.length;
                nextWordIndex = Math.round(Math.random() * (max - min) + min);
                if(typeof wordChoices[nextWordIndex] !== "undefined"){
                    nextWord = wordChoices[nextWordIndex].word;
                    haiku += " " + nextWord;
                    console.log(haiku, syllableCount);
                    syllableCount = syllableCount + wordChoices[nextWordIndex].syllables;
                } else {
                    syllableCount = desiredLength + 1;
                }
                
            }
        }
        haiku = haiku + ";\n"
        desiredLength = 7;
        syllableCount = 0;
        while(syllableCount <= desiredLength){
            wordChoices = []; i = -1;;
            for(i = 0;i < uniqueWords[lastIndex].adjacentWords.length; i++){
                console.log()
                if( uniqueWords[lastIndex].adjacentWords[i].syllables < desiredLength - syllableCount && uniqueWords[lastIndex].adjacentWords[i].position == "after" && uniqueWords[lastIndex].adjacentWords[i].word != nextWord){
                    wordChoices.push({
                        word: uniqueWords[lastIndex].adjacentWords[i].word,
                        syllables: uniqueWords[lastIndex].adjacentWords[i].syllables,
                    });
                }
            }
            min = 0;
            max = wordChoices.length;
            nextWordIndex = Math.round(Math.random() * (max - min) + min);
            if(typeof wordChoices[nextWordIndex] !== "undefined"){
                nextWord = wordChoices[nextWordIndex].word;
                haiku += " " + nextWord;
                console.log(haiku, syllableCount);
                syllableCount =  syllableCount + wordChoices[nextWordIndex].syllables;
            } else {
                for(j = 0; j < uniqueWords.length; j++){
                    if( uniqueWords[i].syllables <= desiredLength - syllableCount  && uniqueWords[i].word != nextWord){
                        wordChoices.push({
                            word: uniqueWords[i].word,
                            syllables: uniqueWords[i].syllables,
                        });
                    }
                }
                min = 0;
                max = wordChoices.length;
                nextWordIndex = Math.round(Math.random() * (max - min) + min);
                if(typeof wordChoices[nextWordIndex] !== "undefined"){
                    nextWord = wordChoices[nextWordIndex].word;
                    haiku += " " + nextWord;
                    console.log(haiku, syllableCount);
                    syllableCount = syllableCount + wordChoices[nextWordIndex].syllables;
                } else {
                    syllableCount = desiredLength + 1;
                }
                
            }
        }
        haiku = haiku + ";\n"
        desiredLength = 5;
        syllableCount = 0;
        while(syllableCount <= desiredLength){
            wordChoices = []; i = -1;;
            for(i = 0;i < uniqueWords[lastIndex].adjacentWords.length; i++){
                console.log()
                if( uniqueWords[lastIndex].adjacentWords[i].syllables < desiredLength - syllableCount && uniqueWords[lastIndex].adjacentWords[i].position == "after" && uniqueWords[lastIndex].adjacentWords[i].word != nextWord){
                    wordChoices.push({
                        word: uniqueWords[lastIndex].adjacentWords[i].word,
                        syllables: uniqueWords[lastIndex].adjacentWords[i].syllables,
                    });
                }
            }
            min = 0;
            max = wordChoices.length;
            nextWordIndex = Math.round(Math.random() * (max - min) + min);
            if(typeof wordChoices[nextWordIndex] !== "undefined"){
                nextWord = wordChoices[nextWordIndex].word;
                haiku += " " + nextWord;
                console.log(haiku, syllableCount);
                syllableCount =  syllableCount + wordChoices[nextWordIndex].syllables;
            } else {
                for(j = 0; j < uniqueWords.length; j++){
                    if( uniqueWords[i].syllables <= desiredLength - syllableCount  && uniqueWords[i].word != nextWord){
                        wordChoices.push({
                            word: uniqueWords[i].word,
                            syllables: uniqueWords[i].syllables,
                        });
                    }
                }
                min = 0;
                max = wordChoices.length;
                nextWordIndex = Math.round(Math.random() * (max - min) + min);
                if(typeof wordChoices[nextWordIndex] !== "undefined"){
                    nextWord = wordChoices[nextWordIndex].word;
                    haiku += " " + nextWord;
                    console.log(haiku, syllableCount);
                    syllableCount = syllableCount + wordChoices[nextWordIndex].syllables;
                } else {
                    syllableCount = desiredLength + 1;
                }
                
            }
        }
        console.log(haiku);
        t.generatedHaiku.set(haiku);
    },
    'click #generate-haiku-random-cooccurance-markov': function (){
        const t = Template.instance();
        haikus = t.generatedHaiku.get();
        syllableCount = 0;
        haiku = "";
        uniqueWords = HaikuLSAData.find({}).fetch()[0].stats.uniqueWords;
        min = 0;
        max = uniqueWords.length;
        startIndex = Math.round(Math.random() * (max - min) + min);
        startWord = uniqueWords[startIndex].word;
        haiku = startWord; 
        console.log("START HAIKU:");
        console.log(haiku);
        syllableCount = uniqueWords[startIndex].syllables;
        lastIndex = startIndex;
        desiredLength = 5;
        nextWord = "";
        weightTotal = 0;
        while(syllableCount <= desiredLength){
            wordChoices = []; i = -1;;
            for(i = 0;i < uniqueWords[lastIndex].adjacentWords.length; i++){
                console.log()
                if( uniqueWords[lastIndex].adjacentWords[i].syllables < desiredLength - syllableCount && uniqueWords[lastIndex].adjacentWords[i].position == "after"  && uniqueWords[lastIndex].adjacentWords[i].word != startWord){
                    for(k = 0; k < uniqueWords[lastIndex].adjacentWords[i].count; k++){
                        wordChoices.push({
                            word: uniqueWords[lastIndex].adjacentWords[i].word,
                            syllables: uniqueWords[lastIndex].adjacentWords[i].syllables,
                            weight: uniqueWords[lastIndex].adjacentWords[i].count,
                        });
                    }
                }
            }
            min = 0;
            max = wordChoices.length;
            nextWordIndex = Math.round(Math.random() * (max - min) + min);
            if(typeof wordChoices[nextWordIndex] !== "undefined"){
                nextWord = wordChoices[nextWordIndex].word;
                haiku += " " + nextWord;
                console.log(haiku, syllableCount);
                syllableCount =  syllableCount + wordChoices[nextWordIndex].syllables;
            } else {
                for(j = 0; j < uniqueWords.length; j++){
                    if( uniqueWords[i].syllables <= desiredLength - syllableCount  && uniqueWords[i].word != nextWord){
                        wordChoices.push({
                            word: uniqueWords[i].word,
                            syllables: uniqueWords[i].syllables,
                        });
                    }
                }
                min = 0;
                max = wordChoices.length;
                nextWordIndex = Math.round(Math.random() * (max - min) + min);
                if(typeof wordChoices[nextWordIndex] !== "undefined"){
                    nextWord = wordChoices[nextWordIndex].word;
                    haiku += " " + nextWord;
                    console.log(haiku, syllableCount);
                    syllableCount = syllableCount + wordChoices[nextWordIndex].syllables;
                } else {
                    syllableCount = desiredLength + 1;
                }
                
            }
        }
        haiku = haiku + ";\n"
        desiredLength = 7;
        syllableCount = 0;
        while(syllableCount <= desiredLength){
            wordChoices = []; i = -1;;
            for(i = 0;i < uniqueWords[lastIndex].adjacentWords.length; i++){
                console.log()
                if( uniqueWords[lastIndex].adjacentWords[i].syllables < desiredLength - syllableCount && uniqueWords[lastIndex].adjacentWords[i].position == "after" && uniqueWords[lastIndex].adjacentWords[i].word != nextWord){
                    wordChoices.push({
                        word: uniqueWords[lastIndex].adjacentWords[i].word,
                        syllables: uniqueWords[lastIndex].adjacentWords[i].syllables,
                    });
                }
            }
            min = 0;
            max = wordChoices.length;
            nextWordIndex = Math.round(Math.random() * (max - min) + min);
            if(typeof wordChoices[nextWordIndex] !== "undefined"){
                nextWord = wordChoices[nextWordIndex].word;
                haiku += " " + nextWord;
                console.log(haiku, syllableCount);
                syllableCount =  syllableCount + wordChoices[nextWordIndex].syllables;
            } else {
                for(j = 0; j < uniqueWords.length; j++){
                    if( uniqueWords[i].syllables <= desiredLength - syllableCount  && uniqueWords[i].word != nextWord){
                        wordChoices.push({
                            word: uniqueWords[i].word,
                            syllables: uniqueWords[i].syllables,
                        });
                    }
                }
                min = 0;
                max = wordChoices.length;
                nextWordIndex = Math.round(Math.random() * (max - min) + min);
                if(typeof wordChoices[nextWordIndex] !== "undefined"){
                    nextWord = wordChoices[nextWordIndex].word;
                    haiku += " " + nextWord;
                    console.log(haiku, syllableCount);
                    syllableCount = syllableCount + wordChoices[nextWordIndex].syllables;
                } else {
                    syllableCount = desiredLength + 1;
                }
                
            }
        }
        haiku = haiku + ";\n"
        desiredLength = 5;
        syllableCount = 0;
        while(syllableCount <= desiredLength){
            wordChoices = []; i = -1;;
            for(i = 0;i < uniqueWords[lastIndex].adjacentWords.length; i++){
                console.log()
                if( uniqueWords[lastIndex].adjacentWords[i].syllables < desiredLength - syllableCount && uniqueWords[lastIndex].adjacentWords[i].position == "after" && uniqueWords[lastIndex].adjacentWords[i].word != nextWord){
                    wordChoices.push({
                        word: uniqueWords[lastIndex].adjacentWords[i].word,
                        syllables: uniqueWords[lastIndex].adjacentWords[i].syllables,
                    });
                }
            }
            min = 0;
            max = wordChoices.length;
            nextWordIndex = Math.round(Math.random() * (max - min) + min);
            if(typeof wordChoices[nextWordIndex] !== "undefined"){
                nextWord = wordChoices[nextWordIndex].word;
                haiku += " " + nextWord;
                console.log(haiku, syllableCount);
                syllableCount =  syllableCount + wordChoices[nextWordIndex].syllables;
            } else {
                for(j = 0; j < uniqueWords.length; j++){
                    if( uniqueWords[i].syllables <= desiredLength - syllableCount  && uniqueWords[i].word != nextWord){
                        wordChoices.push({
                            word: uniqueWords[i].word,
                            syllables: uniqueWords[i].syllables,
                        });
                    }
                }
                min = 0;
                max = wordChoices.length;
                nextWordIndex = Math.round(Math.random() * (max - min) + min);
                if(typeof wordChoices[nextWordIndex] !== "undefined"){
                    nextWord = wordChoices[nextWordIndex].word;
                    haiku += " " + nextWord;
                    console.log(haiku, syllableCount);
                    syllableCount = syllableCount + wordChoices[nextWordIndex].syllables;
                } else {
                    syllableCount = desiredLength + 1;
                }
                
            }
        }
        console.log(haiku);
        t.generatedHaiku.set(haiku);
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
    const t = Template.instance();
    currentHaikus = t.currentHaikus.get();
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
                currentHaikus.push(title + linesParsed[i].wordsParsed.join(" ") + "\n" + linesParsed[i+1].wordsParsed.join(" ")  +   "\n" +linesParsed[i+2].wordsParsed.join(" "));
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
                    currentHaikus.push(title + linesParsed[i].wordsParsed.join(" ") + "\n" + linesParsed[i+1].wordsParsed.join(" ")  +   "\n" +linesParsed[i+2].wordsParsed.join(" "));
                } else {
                    console.log ("Haiku Not Detected");
                    pattern = linesParsed[i].syllableCount + " "  + linesParsed[i+1].syllableCount  + " "  +  linesParsed[i+2].syllableCount;
                    notHaikus.push(linesParsed[i].wordsParsed.join(" ") + " " + linesParsed[i].syllableCount + "\n" + linesParsed[i+1].wordsParsed.join(" ") + " " + linesParsed[i+1].syllableCount + "\n" +linesParsed[i+2].wordsParsed.join(" ") + " " + linesParsed[i+2].syllableCount + "\n" +  "== Rejected due to syllable pattern: " +  pattern + " ==\n\n");
                }
            }
        }
    }
    t.currentHaikus.set(currentHaikus);
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
Template.haikuParser.onCreated(function() {
    this.currentHaikus = new ReactiveVar([]);
    this.generatedHaiku = new ReactiveVar([]);
})