import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

  Template.DefaultLayout.events({
    'click #logoutButton': function(event) {
      event.preventDefault();
      Router.go("/logout");
    },
  
    'click #navbar-brand': function(event){
      event.preventDefault();
      Router.go("/");
    }
  });