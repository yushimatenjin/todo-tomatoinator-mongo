var mongoose = require('mongoose');
var User = mongoose.model('User');
// var uniqueValidator = require('mongoose-unique-validator');

var TaskSchema = new mongoose.Schema({
    title: String,
    order: {type: Number, default: 0},
    priority: {type: Number, default: 0},
    timesPaused: {type: Number, default: 0},
    isActive: {type: Boolean, default: false},
    isComplete: {type: Boolean, default: false},
    wasSuccessful: {type: Boolean, default: false},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: '59fb0738174258442bbd4645'}, // TODO: set by title of 'miscellaneous'
    // project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
    notes: [ {type: mongoose.Schema.Types.ObjectId, ref: 'Note'} ],
    tagList: [ {type: String} ],
    showNotes: {type: Boolean, default: false},
    dueDateTime: { type: Date, default: null },
    dueDateTimeNotified: { type: Boolean, default: false },
    reminderDateTime: { type: Date, default: null},
    reminderDateTimeNotified: { type: Boolean, default: false }
}, {timestamps: true}); // adds createdAt and updatedAt fields

TaskSchema.methods.toJSONFor = function(user) {        
    return {
        id: this.id,
        title: this.title,
        order: this.order,
        priority: this.priority,
        timesPaused: this.timesPaused,
        isActive: this.isActive,
        isComplete: this.isComplete,
        wasSuccessful: this.wasSuccessful,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tagList: this.tagList,
        showNotes: this.showNotes,
        user: this.user.toProfileJSONFor(user), 
        // project: this.project.toJSONFor(user),
        project: this.project.toJSON(),
        notes: this.notes,
        dueDateTime: this.dueDateTime,
        dueDateTimeNotified: this.dueDateNotified,
        reminderDateTime: this.reminderDate,
        reminderDateTimeNotified: this.reminderDateNotified
    };
};

// QUESTION: just return task notification objects with toJSONFor(), so they can be updated as a whole?
//           **ACTUALLY, since we don't look at undefined fields in update route, could just send what we want to update
TaskSchema.methods.toDueDateTimeNotification = function() {
    return {
        id: this.id,
        title: this.title,
        targetDateTime: this.dueDateTime,
        notified: this.dueDateTimeNotified,
        user: this.user
        // dueDateTime: this.dueDateTime,
        // dueDateTimeNotified: this.dueDateTimeNotified
    }
}

TaskSchema.methods.toReminderDateTimeNotification = function() {
    return {
        id: this.id,
        title: this.title,
        targetDateTime: this.reminderDateTime,
        notified: this.reminderDateTimeNotified,
        user: this.user
        // reminderDateTime: this.reminderDateTime,
        // reminderDateTimeNotified: this.reminderDateTimeNotified
    }
}

mongoose.model('Task', TaskSchema);
