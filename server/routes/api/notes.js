var router = require('express').Router();
var passport = require('passport');
var mongoose = require('mongoose');
var async = require('async')

var User = mongoose.model('User');
var Task = mongoose.model('Task');
var Note = mongoose.model('Note');
var Step = mongoose.model('Step');
var Project = mongoose.model('Project');
var auth = require('../auth');

/* GET note list */
router.get('/', auth.required, function (req, res, next) {
    var query = {};
    var limit = 20;
    var offset = 0;

    if (typeof req.query.isComplete !== 'undefined') {
        query.isComplete = req.query.isComplete === 'true' ? true : false;
    }

    if (typeof req.query.tag !== 'undefined') {
        query.tagList = { "$in": [req.query.tag] };
    }

    if (typeof req.query.title !== 'undefined') {
        query.title = req.query.title;
    }

    if (typeof req.query.id !== 'undefined') {
        query._id = req.query.id;
    }

    if (typeof req.query.taskID !== 'undefined') {
        query.task = req.query.taskID;
    }

    if (typeof req.query.order !== 'undefined') {
        query.order = req.query.order;
    }

    // TODO: could find Note's corresponding Task and check its user against sent token,
    // TODO(con't): BUT, unnecessary since we already have a unique task ID?
    Note.find(query).sort({ order: 'asc' }).populate('steps').exec().then(function (notes) {     
        return res.json({
            notes: notes.map(function (note) {
                return note.toJSON();
            }),
        });
    }).catch(next);
});

/* POST create note on task */
router.post('/', auth.required, function (req, res, next) {
    console.log('note:');
    console.log(req.body.note);
    User.findById(req.body.task.user.id).then(function (user) {
        // if (!user) { return res.sendStatus(401); } // Note: user was NOT authenticated in articles.js POST create comment on article, this was there instead (??)
        if (req.body.task.user.id.toString() === req.payload.id.toString()) {
            Task.findById(req.body.task.id).then(function (task) {
                var note = new Note(req.body.note);
                note.task = req.body.task.id;
                // TODO/QUESTION: Set Note's user?        

                return note.save().then(function (note) {
                    task.notes.push(note);

                    return task.save().then(function () {
                        return res.json({ note: note.toJSON() })
                    });
                });
            });

        }
    }).catch(next);
});

/* INTERCEPT and prepopulate note data from id */
router.param('noteId', function (req, res, next, id) {
    Note.findById(id)
        // .populate('user')
        .populate('task')
        .populate('user')
        .then(function (note) {
            if (!note) { return res.sendStatus(404); }
            req.note = note;
            return next();
        }).catch(next);
});
/* DELETE destroy note on task */
router.delete('/:noteId', auth.required, function (req, res, next) {
    User.findById(req.note.task.user).then(function (user) {
        if (!user) { return res.sendStatus(401); } // Note: user was NOT authenticated in articles.js POST create comment on article, this was there instead (??)
        if (user._id.toString() === req.payload.id.toString()) {
            // If note is a checklist, delete associated steps
            return Promise.all([
                req.note.isChecklist ? Step.find({"note": req.note._id}).remove() : null
            ]).then(function () {
                // must explicitly remove reference to note in Task model
                //     NOTE: one of the pitfalls of a NoSQL database
                Task.findById(req.note.task._id).then(function (task) {
                    task.notes.remove(req.note._id)
                    task.save()
                        .then(Note.find({ _id: req.note._id }).remove().exec())
                        .then(function () {
                            res.sendStatus(204);
                        });
                })
            })            
        } else {
            res.sendStatus(403);
        }
    });
});

/* PUT update task note */
router.put('/', auth.required, function (req, res, next) {
    // TODO: populate some task data (taskID) in notes instead of just ID ?
    Task.findById(req.body.note.task).then(function (task) {
        User.findById(task.user).then(function (user) {
            if (!user) { return res.sendStatus(401); } // Note: user was NOT authenticated in articles.js POST create comment on article, this was there instead (??)
            if (user._id.toString() === req.payload.id.toString()) {
                Note.findById(req.body.note.id).then(function (targetNote) {
                    if (typeof req.body.note.title !== 'undefined') {
                        targetNote.title = req.body.note.title;
                    }
                    
                    if (typeof req.body.note.isComplete !== 'undefined') {
                        targetNote.isComplete = req.body.note.isComplete;
                    }

                    if (typeof req.body.note.order !== 'undefined') {
                        targetNote.order = req.body.note.order;
                    }

                    targetNote.save().then(function (note) {
                        // res.json({isComplete: note.isComplete})
                        return res.json(note.toJSON());
                    })
                })
            } else {
                res.sendStatus(403);
            }
        });
    })
})

/* PUT increment order of all task notes on task note drop event */
router.put('/incrementorder', auth.required, function (req, res, next) {
    let startOrder = req.body.startOrder;
    Note.findById(req.body.tgtNote.id).populate('task').exec().then(function (targetNote) {
        User.findById(targetNote.task.user).then(function (user) {
            if (user.id.toString() === req.payload.id.toString()) {
                // Increment note order where order is >= startOrder and note id not equal to the updated note id
                Note.update({ 'order': { $gte: startOrder }, task: targetNote.task._id, _id: { $ne: req.body.tgtNote.id } },
                    { $inc: { 'order': 1 } }, { multi: true })
                    .then(function () {
                        return res.sendStatus(204);
                    })
            }
        });
    })
});

/* PUT update all checklist-steps attached to passed task-checklist ID based on checklistIsComplete parameter */
router.put('/updatecheckliststeps', auth.required, function (req, res, next) {
    Step.update({"note": req.body.taskChecklistID}, {"stepComplete": req.body.checklistIsComplete}, {multi: true}).then(function () {
        return res.sendStatus(204)
    }).catch(next);
})

module.exports = router;
