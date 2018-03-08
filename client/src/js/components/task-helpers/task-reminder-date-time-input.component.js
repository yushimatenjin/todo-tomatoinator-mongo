class TaskReminderDateTimeInputCtrl {
    constructor($scope, Tasks) {
        'ngInject';

        this._$scope = $scope;
        this._Tasks = Tasks;

        this.reminderIntervalOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        this.reminderPeriodOptions = ['hour', 'day', 'week', 'month'];        
    }
    
    removeTaskDate() {
        this.task.reminderDateTime = null;      
        if (this.editmode) {
            this._Tasks.update(this.task).then(
                (updatedTask) => {return updatedTask},
                (err) => console.log(err)
            )
        }  
    }

    handleReminderIntervalChange() {
        let intervalNumber = this.task.reminderIntervalNumber;
        let intervalPeriod = this.task.reminderIntervalPeriod;

        if (intervalNumber && intervalPeriod) {
            this.task.reminderDateTime = moment().add(intervalNumber, intervalPeriod).toISOString();
        }
    }    
}

let TaskReminderDateTimeInput =  {
    bindings: {
        displayingreminderdatetimeinput: '=',
        task: '=',
    },
    controller: TaskReminderDateTimeInputCtrl,
    templateUrl: 'components/task-helpers/task-reminder-date-time-input.html'
};

export default TaskReminderDateTimeInput;
