
import { io } from "socket.io-client";

// ✅ set these
const BASE_URL = "http://127.0.0.1:8000";
const ACCESS_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTk0OGYwYzJiMWJlNDA1NmNjN2UyYmYiLCJlbWFpbCI6InRlc3QxMjNAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3QxMjMiLCJpYXQiOjE3NzE5OTkxODIsImV4cCI6MTc3MjA4NTU4Mn0.Egq0Up0UnLUgl53hLsIRU0r4XlMnT74cYJc9Nfs_3xI";

// ✅ set your 3 conversation IDs here
const CONVERSATIONS = [
    { label: "workspace", id: "6999dd6eaba6b8e1185761e0" },
    { label: "project", id: "6999ad0efc469e24a427d798" },
    { label: "task", id: "699ea929d7fa8125d51a6001" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const socket = io(BASE_URL, {
    transports: ["websocket"], // force ws (clean testing)
    auth: { token: ACCESS_TOKEN },
});

socket.on("connect", async () => {
    console.log("✅ Connected:", socket.id);

    for (const c of CONVERSATIONS) {
        console.log(`\n➡️ Joining ${c.label}:`, c.id);

        socket.emit("join_conversation", { conversationId: c.id });

        // wait a bit so server joins room before sending
        await sleep(300);

        const msg = `Hello from test (${c.label}) at ${new Date().toISOString()}`;
        console.log(`➡️ Sending to ${c.label}:`, msg);

        socket.emit("send_message", { conversationId: c.id, text: msg });

        await sleep(300);
    }

    console.log("\n✅ Done. Disconnecting...");
    socket.disconnect();
});

socket.on("joined_conversation", (data) => {
    console.log("✅ Joined:", data);
});

socket.on("message_created", (msg) => {
    console.log("✅ Message received:", {
        conversation: msg.conversation,
        text: msg.text,
        sender: msg.sender?.username,
    });
});

socket.on("error_event", (err) => {
    console.log("❌ error_event:", err);
});

socket.on("connect_error", (err) => {
    console.log("❌ connect_error:", err.message);
});