'use strict';

const services = require('./services');

module.exports = function RPC_ApprovalService(App) {

    var app = App({

        /*
         * Called when etcd configuration changes.
         *
         * args:
         *  name: name of the changed config.
         *  config: the config object
         */

        onConfigUpdate: () => app.restart(),

        /*
         * Called when the services is started
         *
         * args:
         *  bus: The seneca object.
         *  config: the service configuration defined in the yaml.
         */

        onStart: bootstrap,

        /*
         * Called when the services is restarted
         *
         * args:
         *  bus: The seneca object.
         *  config: the service configuration defined in the yaml.
         */

        onRestart: bootstrap,

        /*
         * Called when the services is Shutdown.
         * Note this does not close the process. That is up you.
         *
         * args:
         *  bus: The seneca object.
         *  config: the service configuration defined in the yaml.
         */

        onShutdown:() => process.exit(0)
    });

    // Start the service
    app.start();

    // ------------------------------------------------------------------------

    function bootstrap(bus, conf) {

        /*
         * Rpcfw documentation:
         * https://github.com/nsnsolutions/rpcfw/blob/master/README.md
         *
         * Seneca documentation:
         * http://senecajs.org/
         */

        // Install plugins here
        bus.use(services.HelloPlugin, conf);

        // Start Client - If you want to call other services.
        bus.rpcClient({ pin: "role:*" });

        // Start Server - If you want to expose services.
        bus.rpcServer({ pin: [
          "role:RPC-ApprovalService",
          "role:RPC-ApprovalService.Pub"
        ]});

        bus.ready(() => {
            if (App.isInDebugMode)
                console.log("Visit http://localhost:10101/act?role=hello.Pub&cmd=greet.v1");
        });
    }
}
