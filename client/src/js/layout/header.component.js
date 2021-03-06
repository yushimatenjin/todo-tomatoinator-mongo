class AppHeaderCtrl {
  constructor(AppConstants, AppHeader, Tasks, $state) {
    'ngInject';
    
    this._$state = $state;
    this._AppHeader = AppHeader;

    this.appName = AppConstants.appName;
  }
  
  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
  
  // workaround for Tasks ng-href not setting ui-sref-active when clicked
  tasksViewActive() {
    return this._$state.current.name === 'app.tasks.view';
  }
}

let AppHeader = {
  controller: AppHeaderCtrl,
  templateUrl: 'layout/header.html'
};

export default AppHeader;
