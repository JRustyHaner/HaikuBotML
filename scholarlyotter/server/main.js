import { Meteor } from "meteor/meteor";
import { Accounts } from 'meteor/accounts-base';
import { onPageLoad } from "meteor/server-render";
import { Roles } from 'meteor/alanning:roles'; // https://github.com/Meteor-Community-Packages/meteor-roles

const SEED_ADMIN = {
  username: 'testAdmin',
  password: 'password',
  email: 'testAdmin@memphis.edu',
  firstName: 'Johnny',
  lastName: 'Test',
  role: 'admin'
};
const SEED_USER = {
  username: 'testUser',
  password: 'password',
  email: 'testUser@memphis.edu',
  firstName: 'User',
  lastName: 'Test',
  role: 'user'
};

const SEED_USERS = [SEED_ADMIN, SEED_USER];
const SEED_ROLES = ['user','admin']

Meteor.startup(() => {
  // Code to run on server startup.
  console.log(`Greetings from ${module.id}!`);

    //create seed roles
    for(let role of SEED_ROLES){
      if(!Meteor.roles.findOne({ '_id' : role })){
          Roles.createRole(role);
      }
  }
  let newOrgId;
  //create seed user
  for(let user of SEED_USERS){
      if (!Accounts.findUserByUsername(user.username)) {
          const uid = Accounts.createUser({
              username: user.username,
              password: user.password,
              email: user.email,
          });
          addUserToRoles(uid, user.role);
          Meteor.users.update({ _id: uid }, 
              {   $set:
                  {
                      firstname: user.firstName,
                      lastname: user.lastName,
      
                  }
              }
          );
        }
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
    invites = Invites.find({code: invite}).fetch().length;
    if(invites > 0){
      return true;
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
          bodies: 'TEXT'
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
              text = inspect(buffer);
              Fiber(function() {
                id = MailRecieved.insert({
                    data: text, 
                });
            }).run();
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
      user: "scholarlyotter@.com",
      password: "~",
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
  Meteor.users.update({ _id: uid }, { $set: { role: Roles.getRolesForUser(uid)[0] }});
}

function removeUserFromRoles(uid, roles){
  Roles.removeUsersFromRoles(uid, roles);
  Meteor.users.update({ _id: uid }, { $set: { role: Roles.getRolesForUser(uid)[0] }});
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