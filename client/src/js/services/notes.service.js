export default class Notes {
  constructor(AppConstants, $http) {
    'ngInject';

    this._AppConstants = AppConstants;
    this._$http = $http;

  }

  add(task, note) {
    let request = {
      url: `${this._AppConstants.api}/notes`,
      method: 'POST',
      data: { task: task, note: note }
    };
    return this._$http(request).then((res) => res.data.note);
  }    

  delete(noteID) {
    let request = {
      url: `${this._AppConstants.api}/notes/${noteID}`,
      method: 'DELETE'
    };  
    return this._$http(request).then((res) => res.data);
  }

  query(queryConfig = {}) {
    let request = {
      url: `${this._AppConstants.api}/notes`,
      method: 'GET',
      params: queryConfig.filters ? queryConfig.filters : null
    }
    return this._$http(request).then((res) => res.data );
  }

  update(note) {
    let request = { 
      url: `${this._AppConstants.api}/notes`,
      method: 'PUT',
      data: { note: note }
    };
    return this._$http(request).then((res) => res.data.isComplete);
  }
}
