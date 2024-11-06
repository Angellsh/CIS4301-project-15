
#Stock Insights

##Table of Contents

-[Frontend Setup](#project-setup)
-[Backend Setup](#project-setup)
-[Running the Project](#running-the-project)
-[Dependencies](#dependencies)

## Frontend Setup
```bash
cd client
npm install 

```
In the 'server' directory, create a `.env` file to store your Oracle database configuration.
```plaintext
USER=your_database_username
PASSWORD=your_database_password
CONNECT_STRING=your_database_connect_string
```

# Backend Setup
```bash
cd ../client 
npm install
```

# Running the Project

To run the client server from the root directory

```bash
cd client
npm run dev
```

To run the backend server from the root directory open another terminal
```bash
cd server
npm run dev
```
Access the application
Frontend: http://localhost:5173

Backend: http://localhost:3000

## Dependencies
Frontend (client/package.json)
Vite - for fast frontend development
React - for building UI components
Bootstrap  - for styling

Backend (server/package.json)
Express - for creating the API
Nodemon - for fast backend development
CORS - for handling cross-origin requests
dotenv - for environment variable management
oracledb - for connecting to the Oracle database