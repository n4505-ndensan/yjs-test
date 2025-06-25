console.log("howdy!")

import { Server } from "@hocuspocus/server";
import { SQLite } from "@hocuspocus/extension-sqlite";

// Configure the server …
const server = new Server({
    port: 1234,

    async onConnect() {
        console.log('🔮')
    },

    async onChange(data) {
        console.log("eesh")
    },

    extensions: [
        new SQLite({
            database: 'data/db.sqlite',
        }),
    ],
});

// … and run it!
server.listen();