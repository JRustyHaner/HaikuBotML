Template.inviteCodes.helpers({
    'invites' : function() {
        invites = Invites.find().fetch();
        console.log(invites);
        if(invites.length > 0){
            return invites
        } else {
            return false;
        }
    },
})

Template.inviteCodes.events({
    'click #create-invite': function(event) {
        Meteor.call('createInvite')
    },
    'click #delete-invite': function(event) {
        Meteor.call('deleteInvite', event.target.getAttribute("data-id"));
    },
    
})

