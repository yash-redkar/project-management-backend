import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import http from "http";

const { default: app } = await import("./app.js");
const { default: connectDB } = await import("./db/db_connection.js");
const { initSocket } = await import("./socket/index.js");

const PORT = process.env.PORT || 3000;

connectDB()
    .then(() => {
        const server = http.createServer(app);

        const io = initSocket(server);
        app.set("io", io);

        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error", err);
        process.exit(1);
    });
