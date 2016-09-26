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
        let data = response.json();

        // Get configuration urls
        let routesUrl = '/config/net/routes.json';
        let themeUrl = '/config/themes/' + (data.theme.name || 'material') + '.json';

        // Execute the ajax requests
        let routes = http(routesUrl);
        let theme = http(themeUrl);

        // Once all the configurations are loaded...
        Http.when(routes, theme).done(items => {
            // Initialize the configs
            Routes['init'](items[0].content);
            Themes['init'](items[1].content);

            // Run extra stuff
            Routes.loadRoute();
        });
    }

}

new Min().init();