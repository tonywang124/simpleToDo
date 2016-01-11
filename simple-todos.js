Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
  Template.body.helpers({
    tasks: function() {
      return Tasks.find({}, {sort: {createdAt: -1}});
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
      Tasks.insert({
        text: text,
        createdAt: new Date()
      });
      // Clear form
      event.target.text.value = '';
    }
  });

  Template.task.events({
    "click .toggle-checked": function () {
      // Flip the checked property
      Tasks.update(this._id, {
        $set: {checked: ! this.checked}
      });
    },
    "click .delete": function() {
      Tasks.remove(this._id);
    }
  });
}
