import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.login.events({
    'click #login-submit': function(event) {
        event.preventDefault();
        Meteor.loginWithPassword($('#usernameLogin').val(), $('#passwordLogin').val());
        //clears the Login boxes on submit
        $('#usernameLogin').val('');
        $('#passwordLogin').val('');
        //goes to profile
        Router.go('/projects');
    },
    'click #code-submit': function(event) {
        event.preventDefault();
        Router.go('/code')
    }
})