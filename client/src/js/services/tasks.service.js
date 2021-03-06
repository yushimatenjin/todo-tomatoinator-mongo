export default class Tasks {
    constructor(AppConstants, PomTimer, $http, $q) {
    'ngInject';

    this._AppConstants = AppConstants;
    this._PomTimer = PomTimer;
    this._$http = $http;

    this.currentlySetFilters = {}; // TODO: hook this into local session storage
  }

  save(task) {
    let request = {
      url: `${this._AppConstants.api}/tasks`,
      method: 'POST',
      data: { task: task }
    };

    return this._$http(request).then((res) => res.data.task);
  }

  // TODO: merge query and queryAndSet methods and allow caller to pass callback? 
  query(queryConfig = {}) {
    // Create the $http object for this request
    let request = {
      url: `${this._AppConstants.api}/tasks`,
      method: 'GET',
      params: queryConfig.filters ? queryConfig.filters : null
    };

    return this._$http(request).then((res) => { return res.data; });
  }

  queryAndSet(stateParams = {}) {
    var queryConfig = {};
    // queryConfig.filters = angular.equals(stateParams, {}) ? this.currentlySetFilters : this.getMergedFilters(stateParams);
    queryConfig.filters = this.getMergedFilters(stateParams); // dont need empty stateParams check since default param values used

    // Create the $http object for this request
    let request = {
      url: `${this._AppConstants.api}/tasks`,
      method: 'GET',
      params: queryConfig.filters ? queryConfig.filters : null
    };
    return this._$http(request).then((res) => { return this.handleQueryResponse(res.data) });
  }

  handleQueryResponse(tasksInfo) {
    this.setRefreshedTasksInfo(tasksInfo);
    return tasksInfo; // TODO: return object containing {activeTask, tasks, taskCount, etc.. for tasks-display.controller.js and elsewhere}
  }

  refreshTasks() {
    this.queryAndSet().then(
      (tasksInfo) => tasksInfo,
      (err) => console.log(err)
    );
  }
  setRefreshedTasksInfo(tasksInfo) { // Note: this functionality couldn't be implemented in refreshTasks() success method ('this' was inaccessible)         
    this.tasksInfo = tasksInfo;
    // if (!this.activeTask) { this.activeTask = tasksInfo.activeTask; } // QUESTION: only set activeTask if it hasn't been set prior?
    this.activeTask = tasksInfo.activeTask;
    this.tasks = this.getInactiveTasks(tasksInfo.tasks);
    // TODO: use angular.copy(this.getInactiveTasks(tasksInfo.tasks), this.tasks), then potentially move from MVVM => MVC in view
    this.taskCount = tasksInfo.tasksCount;
    this.lowestOrderNumber = tasksInfo.lowestOrderNumber;
    this.highestOrderNumber = tasksInfo.highestOrderNumber;
  }

  getActiveTask(tasks) {
    return tasks.find((task) => { return task.isActive; }); // TODO: .find() not viable in IE -> but shouldn't babel convert ES6 to vanilla JS?
  }

  getInactiveTasks(tasks) {
    return tasks.filter((task) => { if (!task.isActive) { return task; } });
  }

  toggleTaskActive(task) {
    if (this.activeTask && !task.isActive) { // Not currently active task
      
      // TODO/QUESTION: do we need to keep below four lines, OR revert back?
      let priorActiveTask = this.activeTask;
      priorActiveTask.isActive = false;
      
      task.isActive = true;
      this.activeTask = task;

      // this.activeTask.isActive = false;
      // TODO: use $q promise here to call both services asynchronously
      this.update(priorActiveTask).then(
        (success) => {
          task.isActive = true;
          this.update(task).then(
            (success) => {
              // TODO: handle setting of new activeTask and relegating previously activeTask to inactive list in FRONTEND w/o refreshTasks service calls
              // console.log(this.tasks.indexOf(task));
              // var tgtActiveTaskIdx = this.tasks.indexOf(task);
              // this.activeTask = this.tasks.splice(tgtActiveTaskIdx, 1); // Remove task from inactive list and set to activeTask
               
              // clear activeTask binding so that newly set activeTask in setRefreshedTasksInfo() is re-instantiated, and consequently doesn't have lingering   
              //  bindings from old task. without clearing reference, task completed items panels would linger from previously set activeTask, potentially bc the new activeTask 
              //  (and child components) weren't being re-instantiated
              // this.activeTask = undefined; 
              this.refreshTasks();
            },
            (failure) => { 
              console.log('toggleTaskActive() failed');
              this.refreshTasks(); // call refresh to clear activeTask since service call failed, TODO: need error notification
            }
          )
        },
        (failure) => { 
          console.log('toggleTaskActive() failed');
          this.refreshTasks(); // call refresh to clear activeTask since service call failed, TODO: need error notification
        }
      )
    } else if (!this.activeTask) { // No currently active task
      task.isActive = true;            

      this.activeTask = task; // set activeTask to passed task
      // remove task if it hasn't been removed via ui-sortable (hitting play/pause button on task)
      var tgtActiveTaskIdx = this.tasks.indexOf(task);
      if (tgtActiveTaskIdx > -1) { 
        this.tasks.splice(tgtActiveTaskIdx, 1)[0];
      }  

      this.update(task).then(
        (success) => {
          // this.activeTask = task; // set activeTask to passed task
          // // remove task if it hasn't been removed via ui-sortable (hitting play/pause button on task)
          // var tgtActiveTaskIdx = this.tasks.indexOf(task);
          // if (tgtActiveTaskIdx > -1) { 
          //   this.tasks.splice(tgtActiveTaskIdx, 1)[0];
          // }   
        },
        (failure) => { 
          console.log('toggleTaskActive() failed');
          this.refreshTasks(); // call refresh to clear activeTask since service call failed, TODO: need error notification
        }
      )
    } else if (task.isActive) { // Currently active task        
      task.isActive = false;
      this.update(task).then(
        (success) => this.refreshTasks(), // TODO: place note based off of whether it is completed
        (failure) => console.log('toggleTaskActive() failed')
      )
    }
  }

  setTaskInactive(task) { // this can only be called in tasks route to clear active task, otherwise tasks will not be updated properly with freshly deactivated task
    task.isActive = false;
    this.update(task).then(
      (success) => { return this.setTaskInactiveSuccessHandler() }, // TODO: place note based off of whether it is completed
      (failure) => console.log('setTaskInactive() failed')
    )
  }

  setTaskInactiveSuccessHandler() {
    this.activeTask = undefined;
    return true;
  }


  getMergedFilters(stateParams = {}) {    
    this.setStatusFilterFromString(stateParams.status);        
    this.setProjectFilterFromString(stateParams.project);
    return this.currentlySetFilters;
  }

  setStatusFilterFromString(targetStatus) {
    // if (targetStatus === undefined) { return; } // TODO: this could probably be deleted since default params are used in ui-router

    this.setStatus = targetStatus || 'all'; // setStatus field for dynamically setting Tasks href in header.html

    switch (targetStatus) {
      case 'all':
        delete this.currentlySetFilters.isComplete;
        break;
      case 'in-progress':
        this.currentlySetFilters.isComplete = false;
        break;
      case 'completed':
        this.currentlySetFilters.isComplete = true;
        break;
      case 'team':
        // TODO: not sure what we're doing here yet!
        break;
    }
  }

  setProjectFilterFromString(targetProject) {
    if (targetProject === undefined) { return; } // TODO: this could probably be deleted since default params are used in ui-router

    if (targetProject === 'all') delete this.currentlySetFilters.project;
    else this.currentlySetFilters.project = targetProject;
  }

  delete(task) {
    let request = {
      // TODO: just send task id in url path (?)
      url: `${this._AppConstants.api}/tasks/${task.id}`,
      method: 'DELETE'
    }
    return this._$http(request).then((res) => res.data);
  }

  update(task) {
    let request = {
      url: `${this._AppConstants.api}/tasks/update`,
      method: 'PUT',
      data: { task: task } // => becomes req.body.task in tasks.js route
    }
    return this._$http(request).then((res) => res.data.task);    
  }

  // updateAndSet(task) for when user is updating task data on backend (ex: task notification), but not on the frontend (ex: task corresponding to task notification)
  updateAndSet(task) {
    return this.update(task).then(
      (updatedTask) => this.setUpdatedTask(updatedTask),
      (err) => console.log(err)
    )
  }
  setUpdatedTask(updatedTask) {    
    if (updatedTask.isActive) {
      this.activeTask = updatedTask;
    } else {
      let updatedTaskId = updatedTask.id;      
      let staleTaskIdx = this.tasks.findIndex( (task) => { return task.id === updatedTaskId })
      // Only return if updatedTask is in current task list (i.e. currently set project)
      if (staleTaskIdx !== -1) { this.tasks.splice(staleTaskIdx, 1, updatedTask); }
    }
    return updatedTask;
  }

  // ** DEPRECATED **
  clearUnmatchedActiveTask(stateParamsProjTitle) {  
    // No activeTask set until resolve bindings in task route succeed first time. OK since we initally route to /tasks/all/all
    if (!this.activeTaskProjectTitle() || stateParamsProjTitle == 'all' || stateParamsProjTitle === this.activeTaskProjectTitle()) {
      return true;
    } else {
      this._PomTimer.resetTimer();
      return this.setTaskInactive(this.activeTask);
    }
  }

  activeTaskProjectTitle() {
    return this.activeTask ? this.activeTask.project.title : undefined;
  }

  updateTasksOrderOnDrop(startIdx, stopIdx) {
    if (startIdx === stopIdx) { return; }
    let tgtTask = this.tasks[stopIdx];
    let initialTgtTaskOrder = tgtTask.order;

    // if set to first task in list, ex: 4 -> 1, set to lowest order of currently displayed tasks and increment order of other tasks
    if (stopIdx === 0) {
      let lowestDisplayedTaskOrder = Math.min.apply(Math, this.tasks.map((t) => { return t.order }));
      tgtTask.order = lowestDisplayedTaskOrder;
      this.update(tgtTask).then(
        (success) => this.incrementOrderOfNonTgtTasks(tgtTask, lowestDisplayedTaskOrder),
        (err) => console.log(err)
      )
    // else set to prior task's order +1
    } else {
      let priorTaskOrderPlusOne = this.tasks[stopIdx - 1].order + 1;
      let query = { filters: { order: priorTaskOrderPlusOne } };
      this.query(query).then((res) => {
        let tgtOrderExists = res.tasks.length === 1;
        // if order of task prior +1 exists
        if (tgtOrderExists) {
          // add 1 to each object after (excluding newly updated task)
          tgtTask.order = priorTaskOrderPlusOne;
          this.update(tgtTask).then(
            (success) => this.incrementOrderOfNonTgtTasks(tgtTask, priorTaskOrderPlusOne),
            (err) => console.log(err)
          )
          // else order of task prior +1 does not exist - update task order
        } else {
          tgtTask.order = priorTaskOrderPlusOne;
          this.update(tgtTask);
        };
      });
    }
  }

  incrementOrderOfNonTgtTasks(tgtTask, startOrder) {
    let request = {
      url: `${this._AppConstants.api}/tasks/incrementorder`,
      method: 'PUT',
      data: { tgtTask: tgtTask, startOrder: startOrder }
    }
    return this._$http(request).then((res) => { return this.refreshTasks() });
  }  
}