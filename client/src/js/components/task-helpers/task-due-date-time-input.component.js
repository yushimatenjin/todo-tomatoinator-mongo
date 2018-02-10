class TaskDueDateTimeInputCtrl {
    constructor($scope, Tasks) {
        'ngInject';

        this._$scope = $scope;
        this._Tasks = Tasks;

        // TODO: better to pass this in to task-due-date-time-input-component, but this doesn't seem too bad for now
        this.editingDueDateTime = $scope.$parent.$ctrl.editingDueDateTime;
    }
    
    removeTaskDate() {
        this.task.dueDateTime = null;      
        if (this.editmode) {
            this._Tasks.update(this.task).then(
                (updatedTask) => {return updatedTask},
                (err) => console.log(err)
            )
        }  
    }

    handleDateTimeInputBlur() {
        if (!this.editmode) { return; }
        this._$scope.$emit('updateTaskOnCalendarBlur');
    }
}

let TaskDueDateTimeInput =  {
    bindings: {
        // editingduedatetime: '=',
        task: '=',
        editmode: '=?' // question mark makes this parameter optional, 'submitonblur' used in task component to submit updated time when date-time-picker loses focus
    },
    controller: TaskDueDateTimeInputCtrl,
    templateUrl: 'components/task-helpers/task-due-date-time-input.html'
};

export default TaskDueDateTimeInput;