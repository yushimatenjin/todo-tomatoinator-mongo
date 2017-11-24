export default class Tasks {
  constructor(AppConstants, $http) {
    'ngInject';

    this._AppConstants = AppConstants;
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

  query(stateParams={}) {
    var testParams = {};

    var queryConfig = {};
    // NOTE: before queryConfig.filters was set to {} if stateParams === {}, but this resulted in all tasks being displayed when query called with no params, changed to this.currentlySetFilters
    queryConfig.filters = angular.equals(stateParams, {}) ? this.currentlySetFilters : this.getMergedFilters(stateParams);

    // Create the $http object for this request
    let request = {
      url: `${this._AppConstants.api}/tasks`,
      method: 'GET',
      params: queryConfig.filters ? queryConfig.filters : null // TODO uncomment this for other concrete tasks routes (EX: InProgress/Completed/etc..)
    };
    // console.log(this._$http(request).then((res) => console.log(`service: ${res.data.highestOrderNumber}`)));
    // return this._$http(request).then((res) => res.data);
    return this._$http(request).then((res) => { return this.handleQueryResponse(res.data) });
  }

  handleQueryResponse(tasksInfo) {
    // TODO - set tasks here, including active/inactive - MOVE ALL METHODS FROM tasks-display.controller to tasks.service
    // this.tasks = tasksInfo.tasks;
    return tasksInfo; // TODO: return object containing {activeTask, tasks, taskCount, etc.. for tasks-display.controller.js and elsewhere}
  }

  getMergedFilters(stateParams = {}) {
    this.setStatusFilterFromString(stateParams.status);
    this.setProjectFilterFromString(stateParams.project);
    return this.currentlySetFilters;
  }

  setStatusFilterFromString(targetStatus) {
    if (targetStatus === undefined) { return; } // TODO: this could probably be deleted since default params are used in ui-router

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
    return this._$http(request).then((res) => res.data);
  }
}