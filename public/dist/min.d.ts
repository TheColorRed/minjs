declare class Config {
    static main: {};
}
declare function http(url: string): HttpResponse;
declare class Http {
    private static watchers;
    static request(url: string): HttpResponse;
    static when(args: HttpResponse[]): HttpWatch;
    private updateWatchers();
    private httpRequest(url, response);
}
declare class HttpWatch {
    items: HttpResponse[];
    private doneFunc;
    private test();
    done(callback: (items: HttpResponse[]) => void): HttpWatch;
    code(code: number, callback: () => void): HttpWatch;
}
declare class HttpResponse {
    contentType: string;
    code: number;
    isDone: boolean;
    isJson: boolean;
    content: any;
    private successFunc;
    private completeFunc;
    private errorFunc;
    private _name;
    readonly name: string;
    setName(name: string): HttpResponse;
    success(callback: (response: HttpResponse) => void): HttpResponse;
    complete(callback: (response: HttpResponse) => void): HttpResponse;
    error(callback: (response: HttpResponse) => void): HttpResponse;
    json(): any;
    private set(xhttp);
}
declare class Routes {
    private static _currentPath;
    private static _configRoutes;
    private static _rootTarget;
    static readonly all: [{
        call: string;
        ctrl: string;
        bind: string;
        path: string;
        name: string;
        target: string;
        view: string;
        template: string;
        redirect: string;
    }];
    static readonly rootTarget: string;
    static target(obj: any): any;
    static loadRoute(): void;
    static exec(ctrl: string, obj: {
        view?: string;
        bindings?: any;
        target?: HTMLElement;
    }): void;
    static call(name: string): void;
    static goto(url: string): void;
    static readonly currentRoute: RoutePath;
    private static setCurrentRoute();
    private static setConfigRoutes(routes);
    private static init(content);
}
declare class RoutePath {
    private _path;
    readonly path: string[];
    constructor(path?: string);
    static parse(path: string): string[];
}
declare class Themes {
    static init(theme: any): void;
}
declare class Min {
    init(): void;
    private loadConfigs(response);
}
