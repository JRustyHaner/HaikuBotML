import { Meteor } from "meteor/meteor";
import { Accounts } from 'meteor/accounts-base';
import { onPageLoad } from "meteor/server-render";
import { Roles } from 'meteor/alanning:roles'; // https://github.com/Meteor-Community-Packages/meteor-roles


Meteor.startup(() => {
  // Code to run on server startup.
  console.log(`Greetings from ${module.id}!`);
      //create seed roles
      SEED_ROLES = ['admin','user'];
      for(let role of SEED_ROLES){
        if(!Meteor.roles.findOne({ '_id' : role })){
            Roles.createRole(role);
        }
    }
  if(Meteor.users.find({}).fetch().length == 0){
    //Create first invite
    data = {
      code: "00000",
      createdBy: "default",
      active: true,
      role: "admin"
    }
    Invites.insert(data);
  }
});

Meteor.methods({
  createNewUser: function(user, pass, emailAddr, firstName, lastName, code, role="user"){
    if (!Accounts.findUserByUsername(user)) {
        if (!Accounts.findUserByEmail(emailAddr)){
            const uid = Accounts.createUser({
                username: user,
                password: pass,
                email: emailAddr
            });
            Meteor.users.update({ _id: uid }, 
                {   $set: 
                    {
                        firstname: firstName,
                        lastname: lastName,
                    }
                });
                addUserToRoles(uid, role);
                Invites.remove({code: code});
        }
        else{
            throw new Meteor.Error ('user-already-exists', `Email ${emailAddr} already in use`);
        }
    }
    else{
        throw new Meteor.Error ('user-already-exists', `User ${user} already exists`);
    }
  },
  createInvite: function(){
    var code = '';
    var length = 5;
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    var unique = false;
    while(unique == false){;
        for ( var i = 0; i < length; i++ ) {
            code += characters.charAt(Math.floor(Math.random() * charactersLength));
        }  
        linkFound = Invites.find({code: code}).fetch().length; 
        if(linkFound == 0){
            unique = true;
        } else {
            link = "";
        }
    }
    data = {
      code: code,
      role: "user",
      createdBy: this.userId,
      active: true
    }
    Invites.insert(data);
  },
  deleteInvite: function(id){
    Invites.remove({_id: id});
  },
  callInvite: function(invite){
    console.log('getInvite', invite);
    invite = Invites.findOne({code: invite, active: true});
    if(invite){
      Invites.remove({code: invite});
      data = {
        role: invite.role
      }
      return data;
    } else {
      return false;
    }
  },
  updateHaikuMail: function(){
    const Imap = require('imap'), inspect = require('util').inspect;
    const Fiber = require('fibers')
    let getEmailFromInbox = (mailServer) => {

      mailServer.openBox('INBOX', false, function (err, box) {
    
        if (err) throw err;
    
        let f = mailServer.seq.fetch('1:*', {
          bodies: ['HEADER','']
        });
    
        f.on('message', function (msg, seqno) {
          let prefix = '(#' + seqno + ') ';
    
          msg.on('body', function (stream, info) {
            let buffer = '';
    
            stream.on('data', function (chunk) {
              buffer += chunk.toString('utf8');
            });
            data = '';
            stream.once('end', function () {
              const simpleParser = require('mailparser').simpleParser;
              const options = {};
              simpleParser(buffer, options, (err, parsed) => {
                Fiber(function() {
                  let project =  "Unknown";
                  if(parsed.subject.indexOf("Haiku") > 0 && parsed.textAsHtml){
                    project = "Haiku";
                  }
                  id = MailRecieved.insert({
                      data: parsed,
                      project: project,
                      processed: false
                  });
              }).run();
              });
            });
          });
          mailServer.seq.setFlags(seqno,"\\Deleted", function(res, err){
            if(err){
              console.log(err);
             }
           });
        });
    
        f.once('error', function (err) {
          console.log('Fetch error: ' + err);
        });    
      });
    
    }
    
    let mailServer1 = new Imap({
      user: "scholarlyotter@gmail.com",
      password: "Kittelendamwagon1~",
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      },
      authTimeout: 3000
    }).once('error', function (err) {
      console.log('Source Server Error:- ', err);
    });
    mailServer1.once('ready', function () {
      mailServer1.openBox('INBOX', true, function (err, box) {
        if (err) throw err;
      });
    
      getEmailFromInbox(mailServer1)
    })
    
    mailServer1.connect();
    
  },
  processEmailAsHaiku: function(id, options){
    email = MailRecieved.findOne({_id: id});
    textProcessed = email.data.textAsHtml;
    if(options.onlyNew){
      textSplit = textProcessed.split('<p>---------- Forwarded message ---------');
      textProcessed = textSplit[0];
      console.log(textProcessed, textSplit[0]);
    }
    blankChars = ['<p>'];
    newLineChars = ['</p>','<br/>'];
    var regexReplace = /<br\s*[\/]?>/gi;
    for(i=0;i < blankChars.length; i++){
      textProcessed = textProcessed.replace(blankChars[i],'');
    }
    for(i=0;i < newLineChars.length; i++){
      textProcessed = textProcessed.replace(newLineChars[i],'\n');
    }
    textProcessed = textProcessed.replace(regexReplace, '\n');
    MailRecieved.update({_id: id}, {
      $set:{
        textProcessed: textProcessed,
      }
    });
  },
  markEmail: function(id){
    MailRecieved.update({
      _id: id
    },{$set: {
      processed: true
    }
    });
  },
  addHaikuToDataset: function(data){
    Haikus.insert({data});
  },
  deleteHaiku: function(id){
    Haikus.remove({_id: id});
  },
  promoteUser: function(id){
    removeUserFromRoles(id, 'user');
    addUserToRoles(id, 'admin');
  },
  demoteUser: function(id){
    removeUserFromRoles(id, 'admin');
    addUserToRoles(id, 'user');
  },
  deleteUser: function(id){
    Meteor.users.remove(id);  
  },
  regenerateHaikuLSA: function(){
    haikus = Haikus.find().fetch();
    haikuData = []
    for(i=0; i < haikus.length; i++){
      haikuData.push(haikus[i].data.haiku)
    };
    haikusJoined = haikuData.join(' ').replace(/[.,\/#!$%?\^&\*;:{}=\-_`~()]/g,"").replace(/(\r\n|\n|\r)/gm, " ").replace(/((['&])(?!\]))/g,"").replace(/aposs/g,'').toLowerCase().split(" ");
    uniqueWordObjs = [];
    for(i=0; i < haikus.length; i++){
      haikuData.push(haikus[i].data.haiku)
    };
    for(j=0; j < haikusJoined.length; j++){
      wordBefore = haikusJoined[j - 1];
      wordAfter = haikusJoined[j + 1];
      currentWord = haikusJoined[j];
      const syllableRegex = /[aeiouy]{1,2}/g;
      word = currentWord.replace("'","").toLowerCase();
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');  
      if(word.match(syllableRegex) != null){
        syllables = word.match(syllableRegex).length
      } else {
        syllables = 0;
      } 
      if(j > 0){
      word = wordBefore.replace("'","").toLowerCase();
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');  
      if(word.match(syllableRegex) != null){
        syllablesWordBefore = word.match(syllableRegex).length
      } else {
        syllablesWordBefore = 0;
      } 
      } else {
        syllablesWordBefore = 0;
      }
      if(j < haikusJoined.length - 1){
        word = wordAfter.replace("'","").toLowerCase();
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');  
        if(word.match(syllableRegex) != null){
          syllablesWordAfter = word.match(syllableRegex).length
        } else {
          syllablesWordAfter = 0;
        } 
        } else {
          syllablesWordAfter = 0;
        }
      isWordBefore = (element) => element.word == wordBefore;
      isWordAfter = (element) => element.word == wordAfter;
      isCurrentWord = (element) => element.word == currentWord;     
      if(uniqueWordObjs.findIndex(isCurrentWord) == -1){
        uniqueWordObjs.push({
          word: currentWord,
          syllables:syllables
        })
        uniqueWordObjs[uniqueWordObjs.length -1].adjacentWords = [{word: wordBefore, count: 1, syllables: syllablesWordBefore, position: 'before'},{word: wordAfter, count:1, syllables: syllablesWordAfter, position:'after'}];
      } else {
        index = uniqueWordObjs.findIndex(isCurrentWord);
        if(uniqueWordObjs[index].adjacentWords.findIndex(isWordBefore) == -1) {
          uniqueWordObjs[index].adjacentWords.push({
            word: wordBefore,
            syllables: syllablesWordBefore,
            position: 'before',
            count: 1
          })
        } else {
          wordIndex = uniqueWordObjs[index].adjacentWords.findIndex(isWordBefore);
          uniqueWordObjs[index].adjacentWords[wordIndex].count++;
        }
        if(uniqueWordObjs[index].adjacentWords.findIndex(isWordAfter) == -1) {
          uniqueWordObjs[index].adjacentWords.push({
            word: wordAfter,
            syllables: syllablesWordAfter,
            position: 'after',
            count: 1
          })
        } else {
          wordIndex = uniqueWordObjs[index].adjacentWords.findIndex(isWordAfter);
          uniqueWordObjs[index].adjacentWords[wordIndex].count++;
        }
      }
    }
    uniqueWordCount = uniqueWordObjs.count;
    totalWords = haikusJoined.count;
    stats = {
      uniqueWords: uniqueWordObjs,
    }
    HaikuLSAData.remove({});
    HaikuLSAData.upsert({}, {stats});
  }
});


onPageLoad(sink => {
  // Code to run on every request.
  sink.renderIntoElementById(
    "server-render-target",
    `Server time: ${new Date}`
  );
});

// User Roles
function addUserToRoles(uid, roles){
  Roles.addUsersToRoles(uid, roles);
  Meteor.users.update({ _id: uid }, { $set: { role: roles}});
}

function removeUserFromRoles(uid, roles){
  Roles.removeUsersFromRoles(uid, roles);
  Meteor.users.update({ _id: uid }, { $set: { role: roles}});
}


//allow the use of Roles.userIsInRole() accorss client
Meteor.publish(null, function () {
  if (this.userId) {
      return Meteor.roleAssignment.find({ 'user._id': this.userId });
  } 
  else {
      this.ready()
  }
});

//Publish codes
//get my events
Meteor.publish(null, function() {
  return Invites.find({createdBy: this.userId});
});
//get my events
Meteor.publish('users', function() {
  if(Roles.userIsInRole(this.userId, 'admin' )){ 
      return Meteor.users.find({});
  }
});
  
//get emails
Meteor.publish(null, function() {
  return MailRecieved.find({});
});
//get my events
Meteor.publish(null, function() {
  return Haikus.find({});
});
Meteor.publish(null, function() {
  return HaikuLSAData.find({});
});


//Helper Functions
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}