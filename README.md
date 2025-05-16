# Node.js TypeScript Assessment API
A simple RESTful API built with **Node.js**, **TypeScript**, and **MongoDB**, without any external frameworks like Express. This project loads sample data from JSONPlaceholder and provides CRUD operations for users, their posts, and comments.

# Features
- Load mock data (users, posts, comments) from JSONPlaceholder API
- View user details with their posts and associated comments
- Create a new user
- Delete a user and all their related data
- Delete all users and related data
- No external web frameworks (e.g., Express)
- MongoDB for data storage
- TypeScript for static typing

## 📁 Project Structure

backend/
├── src/
│ ├── server.ts   # Main server logic using native HTTP
│ ├── db.ts       # MongoDB connection and database access
│ ├── loadData.ts # Loads users, posts, and comments from JSONPlaceholder
│ └── models/     # TypeScript interfaces (optional)
│ ├── User.ts
│ └── Post.ts
├── package.json
├── tsconfig.json
└── README.md

## ⚙️ Prerequisites
- Node.js >= 16
- MongoDB running locally at `mongodb://localhost:27017`

## 🛠️ Setup & Run

# Install dependencies
npm install

# Start the server
npm start
Once running, the server is accessible at:http://localhost:3000

# API Endpoints
# GET /load Loads mock data from JSONPlaceholder into MongoDB.
GET http://localhost:3000/load

# GET /users/:id Returns user details with posts and their comments.
GET http://localhost:3000/users/1

# POST /users Creates a new user. POST http://localhost:3000/users
Content-Type: application/json
{
  "id": 11,
  "name": "Jane Doe"
}

# DELETE /users Deletes all users, posts, and comments.
DELETE http://localhost:3000/users

# DELETE /users/:id Deletes a specific user and their related posts/comments.
DELETE http://localhost:3000/users/1

# Notes
This project uses the native http module instead of Express for educational purposes.
TypeScript is used for better code safety and development experience.
MongoDB stores all API data in a local node_assignment database.

