class Config {
}
Config.main = {};
function http(url) {
    return Http.request(url);
}
class Http {
    static request(url) {
        let response = new HttpResponse;
        new Http().httpRequest(url, response).then(function (response) {
            if (typeof response['successFunc'] == 'function' && response.code == 200) {
                response['successFunc'](response);
            }
            else if (typeof response['errorFunc'] == 'function' && response.code != 200) {
                response['errorFunc'](response);
            }
            if (typeof response['completeFunc'] == 'function') {
                response['completeFunc'](response);
            }
        });
        return response;
    }
    static when(args) {
        let watch = new HttpWatch;
        watch.items = args;
        Http.watchers.push(watch);
        return watch;
    }
    updateWatchers() {
        for (var i = Http.watchers.length - 1; i >= 0; i--) {
            let watcher = Http.watchers[i];
            let isDone = watcher['test']();
            if (isDone) {
                let idx = Http.watchers.indexOf(watcher);
                if (idx > -1) {
                    Http.watchers.splice(idx, 1);
                }
            }
        }
    }
    httpRequest(url, response) {
        let $this = this;
        return new Promise(resolve => {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (xhttp.readyState == 4) {
                    response['set'](xhttp);
                    $this.updateWatchers();
                    resolve(response);
                }
            };
            xhttp.open('get', url);
            xhttp.send();
        });
    }
}
Http.watchers = [];
class HttpWatch {
    constructor() {
        this.items = [];
    }
    test() {
        let isAllDone = true;
        this.items.forEach(item => {
            if (item instanceof HttpResponse && !item.isDone) {
                isAllDone = false;
            }
        });
        if (isAllDone && typeof this.doneFunc == 'function') {
            this.doneFunc(this.items);
        }
        return isAllDone;
    }
    done(callback) {
        this.doneFunc = callback;
        return this;
    }
    code(code, callback) {
        return this;
    }
}
class HttpResponse {
    constructor() {
        this.contentType = "";
        this.code = 0;
        this.isDone = false;
        this.isJson = false;
        this._name = '';
    }
    get name() {
        return this._name;
    }
    setName(name) {
        if (name.length > 0) {
            this._name = name;
        }
        return this;
    }
    success(callback) {
        this.successFunc = callback;
        return this;
    }
    complete(callback) {
        this.completeFunc = callback;
        return this;
    }
    error(callback) {
        this.errorFunc = callback;
        return this;
    }
    json() {
        try {
            if (typeof this.content == 'string') {
                return JSON.parse(this.content);
            }
        }
        catch (e) { }
        return this.content;
    }
    set(xhttp) {
        this.contentType = xhttp.getResponseHeader('Content-Type');
        this.code = xhttp.status;
        this.isDone = true;
        if (this.contentType.indexOf('json') > -1) {
            this.isJson = true;
            this.content = JSON.parse(xhttp.responseText);
        }
        else {
            this.content = xhttp.responseText;
        }
    }
}
class Routes {
    static get all() {
        return this._configRoutes.routes;
    }
    static get rootTarget() {
        return this._rootTarget;
    }
    static target(obj) {
        return obj || Routes.rootTarget;
    }
    static loadRoute() {
        let current = this._currentPath;
        let found = false;
        Routes.all.forEach(route => {
            if (found) {
                return;
            }
            let configPath = RoutePath.parse(route.path);
            if (current.path.length == configPath.length) {
                for (let i = 0; i < configPath.length; i++) {
                    let configItem = configPath[i];
                    let pathItem = current.path[i];
                    if (configItem != pathItem) {
                        return;
                    }
                }
                found = true;
                let targetStr = Routes.target(route.target);
                let target = document.querySelector(targetStr);
                let bind, view, viewString = '';
                if (route.redirect) {
                    Routes.goto(route.redirect);
                    return;
                }
                if (route.call) {
                    Routes.call(route.call);
                    return;
                }
                if (route.bind) {
                    bind = http(route.bind);
                }
                if (route.view) {
                    view = http(route.view);
                }
                else if (route.template) {
                    viewString = route.template;
                }
                let obj = {};
                if (target) {
                    obj.target = target;
                }
                if (bind || view) {
                    Http.when([bind, view]).done(responses => {
                        let bindResp = responses[0];
                        let viewResp = responses[1];
                        if (bindResp) {
                            obj.bindings = bindResp.content;
                        }
                        if (viewResp) {
                            obj.view = viewResp.content;
                        }
                        else if (viewString.length > 0) {
                            obj.view = viewString;
                        }
                        this.exec(route.ctrl, obj);
                    });
                }
                else {
                    if (viewString.length > 0) {
                        obj.view = viewString;
                    }
                    this.exec(route.ctrl, obj);
                }
            }
        });
    }
    static exec(ctrl, obj) {
        if (ctrl) {
            let calls = ctrl.split('.');
            if (calls.length == 2) {
                let ctrl = new window[calls[0]];
                ctrl[calls[1]]();
            }
            else if (calls.length == 1) {
                window[calls[0]]();
            }
        }
        if (obj.view && obj.target) {
            obj.target.innerHTML = obj.view;
        }
    }
    static call(name) {
        for (let i = 0; i < Routes.all.length; i++) {
            let route = Routes.all[i];
            if (route.name == name) {
                Routes.goto(route.path);
                return;
            }
        }
    }
    static goto(url) {
        history.pushState({}, null, url);
        Routes.setCurrentRoute();
        Routes.loadRoute();
    }
    static get currentRoute() {
        return Routes._currentPath;
    }
    static setCurrentRoute() {
        Routes._currentPath = new RoutePath();
    }
    static setConfigRoutes(routes) {
        Routes._configRoutes = routes;
        Routes._rootTarget = routes.target ? routes.target : '';
    }
    static init(content) {
        this.setConfigRoutes(content);
        this.setCurrentRoute();
    }
}
Routes._rootTarget = "";
class RoutePath {
    constructor(path = "") {
        this._path = [];
        if (path.length > 0) {
            this._path = RoutePath.parse(path);
        }
        else {
            this._path = RoutePath.parse(window.location.pathname);
        }
    }
    get path() {
        return this._path;
    }
    static parse(path) {
        let pathArr = [];
        if (path) {
            pathArr = path.split('/').filter(Boolean);
        }
        if (pathArr.length == 0) {
            pathArr = ['/'];
        }
        return pathArr;
    }
}
class Themes {
    static init(theme) {
    }
}
class Min {
    init() {
        let main = http('/config/minjs.json').error(response => {
            console.error('Minjs config file was not found at: "/config/minjs.json"');
        }).success(response => {
            Config.main = response.content;
            this.loadConfigs(response);
        });
    }
    loadConfigs(response) {
        let configs = [];
        let data = response.json();
        if (data.routes) {
            configs.push(http('/config/' + data.routes).setName('routes'));
        }
        if (data.theme) {
            configs.push(http('/config/themes/' + (data.theme.name || 'material') + '.json').setName('theme'));
        }
        Http.when(configs).done(items => {
            items.forEach(item => {
                let name = item.name;
                if (name == 'routes') {
                    Routes['init'](item.content);
                }
                else if (name == 'theme') {
                    Themes['init'](item.content);
                }
            });
            Routes.loadRoute();
        });
    }
}
new Min().init();
