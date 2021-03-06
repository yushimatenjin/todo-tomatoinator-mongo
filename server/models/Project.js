var mongoose = require('mongoose');

var ProjectSchema = new mongoose.Schema({
    title: {type: String, required: [true, "can't be blank"]}, // NOTE: removed unique: true & index: true
    order: { type: Number, default: 0 },
    tasks: [ {type: mongoose.Schema.Types.ObjectId, ref: 'Task'} ], // TODO: unsure if needed
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    notes: [ {type: mongoose.Schema.Types.ObjectId, ref: 'Note'} ],
    // dueDate: ?, /* TODO: allow user to set due date for project, potentially w/reminders */
    // users: ? /* TODO: allow the tracking of all users on an individual project */
}, {timestamps: true}); // adds createdAt and updatedAt fields

ProjectSchema.pre('save', function(next) {    
    let userId = this.user._id;
    let tgtProjTitle = this.title;
    let tgtProjId = this._id;
    
    const Project = this.constructor;
    Project.find({user: userId, title: tgtProjTitle, _id: { $ne: tgtProjId }}).then(function (projects) {
        if (!projects.length) {
            next();
        } else {
            var err = new Error('Project creation failed');
            err.name = 'ValidationError';
            err.errors = { title: new Error('already exists!') };
            next(err); // NOTE: calling next() with an argument assumes the error is passed as argument
        }
    });
});

ProjectSchema.methods.toJSON = function() {   
    return {
        id: this.id,
        order: this.order,
        title: this.title,
        // tasks: this.tasks, // TODO: unsure if needed
        user: this.user,
        // user: this.user.toProfileJSONFor(user), // NOTE/TODO: hangs - unsure if even necessary!!
        notes: this.notes
    };
};

mongoose.model('Project', ProjectSchema);