require('dotenv').config();
const express = require('express');
const mongoose = require("mongoose");
const http = require('http');
const socketIo = require('socket.io');
const userModel = require("./models/userModel");
const chatModel = require('./models/chatModel');

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatApplication', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.error("MongoDB connection error:", error);
});

// Initialize Socket.io
const io = socketIo(server, {
    pingInterval: 1000,
    pingTimeout: 1000
});

// Namespace for user communication
const userChannel = io.of("/user-namespace");

userChannel.on('connection', async (socket) => {
    console.log("A user connected");

    // Extract user ID from handshake auth
    const userId = socket.handshake.auth.token;

    try {
        // Update user status to online
        await userModel.findByIdAndUpdate(userId, { is_online: 1 });
        socket.broadcast.emit('getConnectedUser', { user_id: userId });

        // Handle user disconnection
        socket.on('disconnect', async () => {
            console.log('User disconnected');
            await userModel.findByIdAndUpdate(userId, { is_online: 0 });
            socket.broadcast.emit('getDisconnectedUser', { user_id: userId });
        });

        // Chat events
        socket.on('newChat', (data) => {
            socket.broadcast.emit('loadNewChat', data);
            console.log('chat recieved')
        });

        socket.on("existingChat", async (data) => {
            const chats = await chatModel.find({
                $or: [
                    { receiver_id: data.receiver_id, sender_id: data.sender_id },
                    { receiver_id: data.sender_id, sender_id: data.receiver_id }
                ]
            });
            socket.emit("allChats", chats);
        });

        // Handle delete chat
        socket.on('chatRemoved', (id) => {
            console.log("Chat removed...");
            socket.broadcast.emit('chatMessageDeleted', id);
            console.log("Chat removed");
        });

        // Handle update chat
        socket.on('chatUpdated', (data) => {
            console.log("Chat updated.....");
            socket.broadcast.emit('chatMessageUpdated', data);
            console.log("Chat updated");
        });
    } catch (error) {
        console.error("Socket connection error:", error);
    }
});

// Define Routes
app.use('/', require("./routes/userRoutes"));

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server connected successfully on port ${PORT}`);
});
