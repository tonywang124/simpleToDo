Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {
  //This is strictly server-side code.

  Meteor.publish("tasks", function () {
    return Tasks.find({
      $or: [
      { private: {$ne: true} },
      { owner: this.userId}]
    })
  });
}

if (Meteor.isClient) {
// This is where the client-side code lives.
  Meteor.subscribe('tasks');

  Template.body.helpers({
    tasks: function() {
      if (Session.get("hideCompleted")) {
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        return Tasks.find({}, {sort: {createdAt: -1}})
      }
    },
    hideCompleted: function() {
      return Session.get("hideCompleted");
    },
    incompleteCount: function() {
      return Tasks.find({checked: {$ne: true}}).count(); 
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // This prevents default browser form submission.
      event.preventDefault();
      console.log(event)

      //Fetches value from form element
      var text = event.target.text.value;

      //Inserts the task into the collection
      Meteor.call("addTask", text);
      // Clear form
      event.target.text.value = '';
    },
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.task.helpers({
    isOwner: function() {
      return this.owner === Meteor.userId();
    }
  });

  Template.task.events({
    "click .toggle-checked": function () {
      // Flip the checked property
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function() {
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function() {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}
Meteor.methods({
  addTask: function (text) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== meteor.userId()) {
      throw new Meteor.Error("Cannot check off other user's task.")
    }
    Tasks.update(taskId, { $set: { checked: setChecked}});
  },
  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);

    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("Cannot delete other user's task.");
    }

    Tasks.update(taskId, {$set: { private: setToPrivate}});
  },
  deleteTask: function(taskId) {
      var task = Tasks.findOne(taskId);
      // If task is private, only the user can delete it.
      if (task.private && task.owner !== meteor.userId()) {
        throw new Meteor.Error("Cannot delete other user's task.")
      }
      Tasks.remove(taskId);
  }
});
