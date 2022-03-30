import { Meteor } from 'meteor/meteor';
/* routes.js - the routing logic we use for the application.

If you need to create a new route, note that you should specify a name and an
action (at a minimum). This is good practice, but it also works around a bug
in Chrome with certain versions of Iron Router (they routing engine we use).

*/



//Set Default Template
Router.configure({
  layoutTemplate: 'DefaultLayout'
});

//Set Up Default Router Actions
const defaultBehaviorRoutes = [
  'code'
];

//Set Up Logged In Restricted Routes 
const restrictedRoutes = [
  'haikuParser',
  'projects'
]

//Set Up Admin Restricted Routes 
const restrictedAdminRoutes = [
  'inviteCodes',
]

const getDefaultRouteAction = function(routeName) {
  return function() {
    this.render(routeName);
  };
};

// set up all routes with default behavior
for (const route of defaultBehaviorRoutes) {
  Router.route('/' + route, {
    name: 'client.' + route,
    action: getDefaultRouteAction(route),
  });
}

// set up all routes with restricted to login behavior
for (const route of restrictedRoutes) {
  Router.route('/' + route, function() {
    if(Meteor.userId()){
      this.render(route);
      }else{
        this.render('home', {
          data: {
            message: "That area is not accessible to users who haven't logged in. Please sign in.",
            alert: "danger"
          }
        });
      }
    });
  }

// set up all routes with restricted to login behavior
for (const route of restrictedAdminRoutes) {
  Router.route('/' + route, function() {
    if((Roles.userIsInRole(Meteor.user(), 'admin'))){
      Roles
      this.render(route);
      }else{
        this.render('profile', {
          data: {
            message: "That area is not accessible to users who are not Admins.",
            alert: "danger"
          }
        });
      }
    });
  }  

// setup home route
Router.route('/', function () {
  this.render('home');
});

//setup logout
Router.route('/logout', function(){
  Meteor.logout();
  this.render('home');
})

// route organizational invites
Router.route('/signup/:_id', function(){
  // add the subscription handle to our waitlist
  if(Meteor.user()){
    Router.go('/');
  }
  id = this.params._id;
  Meteor.call('callInvite',id,(err, res) => {
    if(res){
      this.render('signup')
    } else {
      this.render('home', {
        data: {
          message: "That code cannot be found.",
          alert: "danger"
        }
      });
    }
  });
});