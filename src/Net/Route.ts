class Routes {

    private static _currentPath: RoutePath;
    private static _configRoutes: any;
    private static _rootTarget: string = "";

    public static get all(): [{ call: string, ctrl: string, bind: string, path: string, name: string, target: string, view: string, template: string, redirect: string }] {
        return this._configRoutes.routes;
    }

    public static get rootTarget(): string {
        return this._rootTarget;
    }

    public static target(obj: any) {
        return obj || Routes.rootTarget;
    }

    public static loadRoute() {
        let current: RoutePath = this._currentPath;
        let found = false;
        Routes.all.forEach(route => {
            if (found) { return; }
            let configPath = RoutePath.parse(route.path);
            if (current.path.length == configPath.length) {
                for (let i = 0; i < configPath.length; i++){
                    let configItem = configPath[i];
                    let pathItem = current.path[i];
                    if (configItem != pathItem) {
                        return;
                    }
                }
                found = true;
                let targetStr: string = Routes.target(route.target);
                let target: HTMLElement = document.querySelector(targetStr) as HTMLElement;

                let bind, view, viewString: string = '';

                // If a redirect item is found redirect the client
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
                // Load the view from a url
                if (route.view) {
                    view = http(route.view);
                }
                // Load the view from a string
                else if (route.template) {
                    viewString = route.template;
                }
                let obj: { bindings?: any, view?: string, target?: HTMLElement } = {};
                if (target) {
                    obj.target = target;
                }
                if (bind || view) {
                    Http.when([bind, view]).done(responses => {
                        let bindResp: HttpResponse = responses[0];
                        let viewResp: HttpResponse = responses[1];
                        if (bindResp) {
                            obj.bindings = bindResp.content;
                        }
                        if (viewResp) {
                            obj.view = viewResp.content;
                        } else if (viewString.length > 0) {
                            obj.view = viewString;
                        }
                        this.exec(route.ctrl, obj);
                    });
                } else {
                    if (viewString.length > 0) {
                        obj.view = viewString;
                    }
                    this.exec(route.ctrl, obj);
                }
            }
        });
    }

    public static exec(ctrl: string, obj: { view?: string, bindings?: any, target?: HTMLElement }) {
        if (ctrl) {
            let calls = ctrl.split('.');
            if (calls.length == 2) {
                let ctrl = new window[calls[0]];
                ctrl[calls[1]]();
            } else if (calls.length == 1) {
                window[calls[0]]();
            }
        }
        if (obj.view && obj.target) {
            obj.target.innerHTML = obj.view;
        }
    }

    public static call(name: string) {
        for (let i = 0; i < Routes.all.length; i++){
            let route = Routes.all[i];
            if (route.name == name) {
                Routes.goto(route.path);
                return;
            }
        }
    }

    public static goto(url: string) {
        history.pushState({}, null, url);
        Routes.setCurrentRoute();
        Routes.loadRoute();
    }

    public static get currentRoute(): RoutePath {
        return Routes._currentPath;
    }

    private static setCurrentRoute(): void {
        Routes._currentPath = new RoutePath();
    }

    private static setConfigRoutes(routes: any): void {
        Routes._configRoutes = routes;
        Routes._rootTarget = routes.target ? routes.target : '';
    }

    private static init(content: any) {
        this.setConfigRoutes(content);
        this.setCurrentRoute();
    }

}

class RoutePath {

    private _path: string[] = [];

    public get path(): string[] {
        return this._path;
    }

    public constructor(path: string = "") {
        if (path.length > 0) {
            this._path = RoutePath.parse(path);
        } else {
            this._path = RoutePath.parse(window.location.pathname);
        }
    }

    public static parse(path: string): string[] {
        let pathArr: string[] = [];
        if (path) {
            pathArr = path.split('/').filter(Boolean);
        }
        // If the path is empty fill it with the root
        if (pathArr.length == 0) {
            pathArr = ['/'];
        }
        return pathArr;
    }

}