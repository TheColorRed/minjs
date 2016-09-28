class Min {

    /**
     * Loads the master config
     *
     *
     * @memberOf Min
     */
    public init() {
        let main = http('/config/minjs.json').error(response => {
            console.error('Minjs config file was not found at: "/config/minjs.json"');
        }).success(response => {
            Config.main = response.content;
            this.loadConfigs(response);
        });
    }

    /**
     * Loads the helper configs
     *
     * @private
     * @param {HttpResponse} response
     *
     * @memberOf Min
     */
    private loadConfigs(response: HttpResponse) {
        let configs: HttpResponse[] = [];
        let data: {
            routes?: string,
            animations?: string,
            theme?: { name: string }
        } = response.json();

        // Execute the ajax requests
        if (data.routes) {
            configs.push(http('/config/' + data.routes).setName('routes'));
        }
        if (data.theme) {
            configs.push(http('/config/themes/' + (data.theme.name || 'material') + '.json').setName('theme'));
        }
        if (data.animations) {
            configs.push(http('/config/' + data.animations).setName('animation'));
        }

        // Once all the configurations are loaded...
        Http.when(configs).done(items => {
            // Initialize the configs
            items.forEach(item => {
                let name = item.name;
                if (name == 'routes') {
                    Routes['init'](item.content);
                } else if (name == 'theme') {
                    Themes['init'](item.content);
                } else if (name == 'animation') {
                    Animation['init'](item.content);
                }
            });

            // Run extra stuff
            Routes.loadRoute();
        });
    }

}

let observer = new MutationObserver(function (mutations, observer) {
    window.dispatchEvent(new CustomEvent('onDomChange', { detail: mutations }));
    // console.log(mutations)
});

observer.observe(document, {
    subtree: true,
    attributes: false,
    characterData: false,
    childList: true
});

new Min().init();