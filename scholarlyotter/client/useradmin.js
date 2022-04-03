import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.useradmin.helpers({
    'users': () => Meteor.users.find({}, { sort: {lastname: 1, firstname: 1, _id: 1}}).fetch()
});
Template.useradmin.events({
    'click #promote-user': function(event){
        id = event.target.getAttribute("data-id");
        Meteor.call('promoteUser', id);
    },
    'click #demote-user': function(event){
        id = event.target.getAttribute("data-id");
        Meteor.call('demoteUser', id);
    },
    'click #delete-user': function(event){
        id = event.target.getAttribute("data-id");
        Meteor.call('deleteUser', id);
    },
});

Template.useradmin.onCreated(function() {
    Meteor.subscribe('users');
})


