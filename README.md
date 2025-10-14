# Chat Service Backend

## Description

This backend provides the API and real-time functionality for a chat application. It's built using Node.js, Express, MySQL, and Socket.IO. It handles user authentication, chat management, message handling, and file uploads.

## Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure the environment:**

    *   Create a `.env` file in the root directory.
    *   Populate the `.env` file with the following values, adjusting them as necessary for your local environment:

        ```
        PORT=5000
        JWT_SECRET=f2f7f0b1a4c9e8d0e0f9b8c6d2f3a7b1a8d6f0e9c1d5b7f3e6a2c8f4b9d7a1e2
        MYSQL_HOST=localhost
        MYSQL_USER=root
        MYSQL_PASSWORD=123456
        MYSQL_DATABASE=chat_service
        MYSQL_PORT=3306
        ```

    **Important:**

    *   `PORT`: The port on which the server will listen.  Defaults to 5000.
    *   `JWT_SECRET`:  This is a secret key used for signing JSON Web Tokens (JWTs).  **In a production environment, use a strong, randomly generated secret.**  A strong secret should be a long, random string.
    *   `MYSQL_HOST`: The hostname or IP address of your MySQL server.  Defaults to `localhost`.
    *   `MYSQL_USER`: The username for connecting to the MySQL database.  Defaults to `root`.
    *   `MYSQL_PASSWORD`: The password for the MySQL user.  Defaults to `123456`.  **Change this to a secure password in a production environment.**
    *   `MYSQL_DATABASE`: The name of the MySQL database to use.  Defaults to `chat_service`.
    *   `MYSQL_PORT`: The port on which the MySQL server is listening. Defaults to `3306`.

4.  **Database Setup:**

    *   Make sure you have MySQL installed and running.
    *   Create a database named `chat_service` (or the name specified in your `.env` file).
    *   The database schema is not provided in this `README`. You'll need to either create the tables manually or use an ORM (like Sequelize or TypeORM) with the provided models to automatically generate the schema.  The models are located in the `models/` directory.

5.  **Run the application:**

    ```bash
    npm run dev  # For development (using nodemon)
    npm start      # For production
    ```

    The `npm run dev` command typically uses `nodemon` to automatically restart the server when changes are made to the code.  The `npm start` command typically starts the server in a production environment.  Check the `scripts` section in `package.json` for the exact commands.

## Functionality

The backend provides the following functionalities:

*   **User Authentication:**  Handles user registration, login, and authentication using JWTs.  Users can register with a username, email, and password.  Upon successful login, a JWT is issued, which must be included in the `Authorization` header of subsequent requests.
*   **Chat Management:**  Allows users to create, join, and manage chat rooms.  Chat rooms can be public or private.  Only members of a private chat room can view its messages.
*   **Message Handling:**  Enables users to send and receive messages in real-time using Socket.IO.  Messages are stored in the database.
*   **File Uploads:** Supports file uploads to chat rooms.  Uploaded files are stored on the server (or a cloud storage service) and a link to the file is sent as a message in the chat room.

## Key Components

*   `app.ts`:  Main application entry point, responsible for setting up middleware, routes, and error handling.
*   `server.ts`:  Configures the server, integrates Socket.IO for real-time communication, and starts the server listening on the specified port.
*   `routes/`: Contains the API routes for users, chats, and uploads.  Each route file defines the endpoints for a specific resource.
*   `controllers/`:  Handles the business logic for each route.  Controllers interact with the models to perform database operations and return responses to the client.
*   `models/`: Defines the data models for users, chats, and messages using Mongoose.  These models define the structure of the data stored in the database.
*   `middleware/`: Includes authentication middleware (`authMiddleware.ts`) to protect routes that require authentication, and upload handling middleware (`upload.ts`) for handling file uploads.
*   `socket/index.ts`:  Configures Socket.IO for real-time communication.  Handles events such as connecting, disconnecting, sending messages, and joining/leaving chat rooms.
*   `utils/generateToken.ts`: Utility function for generating JWTs.  This function is used to create JWTs when a user successfully logs in.
*   `config/db.ts`: Database connection configuration.  This file establishes the connection to the MySQL database using the credentials specified in the `.env` file.

## API Endpoints

*   **User Authentication:**
    *   `POST /api/users/register`:  Registers a new user.
        *   Request body: `{ username, email, password }`
        *   Response: `{ message: "User registered successfully" }`
    *   `POST /api/users/login`: Logs in an existing user.
        *   Request body: `{ email, password }`
        *   Response: `{ token: "JWT token" }`
    *   `GET /api/users/profile`: Retrieves the user's profile. Requires authentication (JWT in the `Authorization` header).
        *   Response: `{ id, username, email }`

*   **Chat Management:**
    *   `GET /api/chats`: Retrieves a list of chats for the logged-in user. Requires authentication.
        *   Response: `[ { id, name, isGroupChat, users: [ ... ], latestMessage: { ... } }, ... ]`
    *   `POST /api/chats`: Creates a new chat. Requires authentication.
        *   Request body: `{ userId }` (for a one-on-one chat) or `{ chatName, users: [ ... ] }` (for a group chat)
        *   Response: `{ id, name, isGroupChat, users: [ ... ], latestMessage: { ... } }`
    *   `PUT /api/chats/rename`: Renames a group chat. Requires authentication.
        *   Request body: `{ chatId, chatName }`
        *   Response: `{ id, name, isGroupChat, users: [ ... ], latestMessage: { ... } }`
    *   `PUT /api/chats/groupadd`: Adds a user to a group chat. Requires authentication.
        *   Request body: `{ chatId, userId }`
        *   Response: `{ id, name, isGroupChat, users: [ ... ], latestMessage: { ... } }`
    *   `PUT /api/chats/groupremove`: Removes a user from a group chat. Requires authentication.
        *   Request body: `{ chatId, userId }`
        *   Response: `{ id, name, isGroupChat, users: [ ... ], latestMessage: { ... } }`

*   **Message Handling:**
    *   `GET /api/messages/:chatId`: Retrieves all messages for a specific chat. Requires authentication.
        *   Response: `[ { id, sender: { ... }, content, chat: { ... }, createdAt, updatedAt }, ... ]`
    *   `POST /api/messages`: Sends a new message to a chat. Requires authentication.
        *   Request body: `{ content, chatId }`
        *   Response: `{ id, sender: { ... }, content, chat: { ... }, createdAt, updatedAt }`

*   **Uploads:**
    *   `POST /api/upload`: Uploads a file. Requires authentication.
        *   Request body: `multipart/form-data` with a file named `file`.
        *   Response: `{ url: "URL of the uploaded file" }`

## Real-time Events (Socket.IO)

*   `connection`:  Emitted when a new client connects to the Socket.IO server.
*   `disconnect`: Emitted when a client disconnects from the Socket.IO server.
*   `join chat`: Emitted when a user joins a chat room.  The server listens for this event and adds the user to the specified chat room.
*   `new message`: Emitted when a new message is sent.  The server listens for this event, saves the message to the database, and emits the `message received` event to all clients in the chat room.
*   `typing`: Emitted when a user starts typing a message.  The server listens for this event and emits the `typing` event to all other clients in the chat room.
*   `stop typing`: Emitted when a user stops typing a message.  The server listens for this event and emits the `stop typing` event to all other clients in the chat room.
*   `message received`: Emitted by the server when a new message is received.  All clients in the chat room listen for this event and display the new message.

## Contributing

We welcome contributions to this project!  To contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, concise commit messages.
4.  Test your changes thoroughly.
5.  Submit a pull request.

Please ensure that your code adheres to the project's coding standards and that you include appropriate unit tests.

## License

MIT License

Copyright (c) \[year] \[your name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.