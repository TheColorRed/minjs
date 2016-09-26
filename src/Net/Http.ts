/**
 * Short hand for creating an http request.
 *
 * @param {string} url
 * @returns {HttpResponse}
 */
function http(url: string): HttpResponse {
    return Http.request(url);
}

class Http {

    private static watchers: HttpWatch[] = [];

    public static request(url: string): HttpResponse {
        let response = new HttpResponse;

        new Http().httpRequest(url, response).then(function (response) {
            if (typeof response['successFunc'] == 'function' && response.code == 200) {
                response['successFunc'](response);
            }else if (typeof response['errorFunc'] == 'function' && response.code != 200) {
                response['errorFunc'](response);
            }
            if (typeof response['completeFunc'] == 'function') {
                response['completeFunc'](response);
            }
        });
        return response;
    }

    public static when(...args: HttpResponse[]): HttpWatch {
        let watch = new HttpWatch;
        watch.items = args;
        Http.watchers.push(watch);
        return watch;
    }

    private updateWatchers() {
        for(var i = Http.watchers.length -1; i >= 0 ; i--){
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

    private httpRequest(url: string, response: HttpResponse): Promise<HttpResponse> {
        let $this = this;
        return new Promise(resolve => {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (xhttp.readyState == 4) {
                    response['set'](xhttp);
                    $this.updateWatchers();
                    resolve(response);
                }
            }
            xhttp.open('get', url);
            xhttp.send();
        });
    }

}

class HttpWatch {
    public items: HttpResponse[] = [];

    private doneFunc: Function;

    private test(): boolean {
        let isAllDone: boolean = true;
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

    public done(callback: (items: HttpResponse[]) => void): HttpWatch {
        this.doneFunc = callback;
        return this;
    }

    public code(code: number, callback: () => void): HttpWatch {
        return this;
    }

}

class HttpResponse {

    public contentType: string = "";
    public code: number = 0;
    public isDone: boolean = false;
    public isJson: boolean = false;

    public content: any;

    private successFunc: Function;
    private completeFunc: Function;
    private errorFunc: Function;

    public success(callback: (response: HttpResponse) => void): HttpResponse {
        this.successFunc = callback;
        return this;
    }

    public complete(callback: (response: HttpResponse) => void): HttpResponse {
        this.completeFunc = callback;
        return this;
    }

    public error(callback: (response: HttpResponse) => void): HttpResponse {
        this.errorFunc = callback;
        return this;
    }

    public json(): any {
        try {
            if (typeof this.content == 'string') {
                return JSON.parse(this.content);
            }
        } catch (e) {}
        return this.content;
    }

    private set(xhttp: XMLHttpRequest) {
        this.contentType = xhttp.getResponseHeader('Content-Type');
        this.code = xhttp.status;
        this.isDone = true;
        if (this.contentType.indexOf('json') > -1) {
            this.isJson = true;
            this.content = JSON.parse(xhttp.responseText);
        } else {
            this.content = xhttp.responseText;
        }
    }
}