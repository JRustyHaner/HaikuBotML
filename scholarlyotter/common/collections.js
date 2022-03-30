import { Mongo } from 'meteor/mongo';

//Define Collections
Invites = new Mongo.Collection('invites');
MailRecieved = new Mongo.Collection('emails');
Haikus = new Mongo.Collection('haikus');