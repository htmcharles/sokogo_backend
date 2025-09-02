const express = require("express")
const app = express()
require("dotenv").config()
const { connection } = require("./config/db")

// Performance optimizations for React frontend
// const compression = require('compression')
// const helmet = require('helmet')

const { userRouter } = require("./routes/userRoutes")
const { itemRouter } = require("./routes/itemRoutes")
// const { sellerRouter } = require("./routes/sellerRoutes")
const cors = require("cors")

// Performance middleware for React frontend optimization
// app.use(compression()) // Compress responses for faster loading
// app.use(helmet({
//     crossOriginEmbedderPolicy: false, // Allow React dev server
//     contentSecurityPolicy: false // Disable for development
// }))

// Request parsing with optimized limits
app.use(express.json({
    limit: '10mb',
    type: ['application/json', 'text/plain'] // Optimize JSON parsing
}))
app.use(express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000 // Prevent parameter pollution
}))

// Enhanced CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        // Allow localhost on any port and common development URLs
        const allowedOrigins = [
            /^http:\/\/localhost:\d+$/,
            /^http:\/\/127\.0\.0\.1:\d+$/,
            /^https:\/\/localhost:\d+$/,
            /^https:\/\/127\.0\.0\.1:\d+$/,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://localhost:3000",
            "https://127.0.0.1:3000"
        ];

        const isAllowed = allowedOrigins.some(pattern => {
            if (typeof pattern === 'string') {
                return pattern === origin;
            }
            return pattern.test(origin);
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Allow all origins for development
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "userid",
        "user-id",
        "x-seller-id",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204
}))

// Handle preflight requests explicitly
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, userid, user-id, x-seller-id, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
})

app.get("/", (req, res) => {
    res.send("WELCOME TO SOKOGO CLASSIFIEDS BACKEND API")
})

// User authentication routes
app.use("/api/auth", userRouter)

// Item/classifieds routes (includes cars and products)
app.use("/api/items", itemRouter)

// Seller-specific routes (removed)
// app.use("/api/sellers", sellerRouter)

// Enhanced port configuration with automatic fallback
const { exec } = require('child_process');
const net = require('net');

const DEFAULT_PORT = process.env.PORT || process.env.port || 8000;

// Function to check if a port is available
const isPortAvailable = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.listen(port, () => {
            server.once('close', () => {
                resolve(true);
            });
            server.close();
        });

        server.on('error', () => {
            resolve(false);
        });
    });
};

// Function to find next available port
const findAvailablePort = async (startPort) => {
    for (let port = startPort; port <= startPort + 10; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    return null;
};

// Function to kill process on specific port
const killPortProcess = (port) => {
    return new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(false);
                return;
            }

            const lines = stdout.trim().split('\n');
            const pids = new Set();

            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0' && !isNaN(pid)) {
                    pids.add(pid);
                }
            });

            if (pids.size === 0) {
                resolve(false);
                return;
            }

            console.log(`🔄 Killing ${pids.size} process(es) on port ${port}...`);

            let killed = 0;
            pids.forEach(pid => {
                exec(`taskkill /PID ${pid} /F`, (killError) => {
                    killed++;
                    if (!killError) {
                        console.log(`✅ Killed process PID ${pid}`);
                    }
                    if (killed === pids.size) {
                        setTimeout(() => resolve(true), 1000);
                    }
                });
            });
        });
    });
};

// Smart server startup function
const startServer = async () => {
    let PORT = DEFAULT_PORT;

    console.log(`🚀 Starting SOKOGO Backend Server...`);
    console.log(`🔍 Checking port ${PORT}...`);

    // Check if default port is available
    const isDefaultPortAvailable = await isPortAvailable(PORT);

    if (!isDefaultPortAvailable) {
        console.log(`⚠️  Port ${PORT} is in use. Attempting to free it...`);

        const killed = await killPortProcess(PORT);

        if (killed) {
            console.log(`✅ Port ${PORT} freed successfully`);
        } else {
            console.log(`❌ Could not free port ${PORT}. Finding alternative...`);
            const alternativePort = await findAvailablePort(PORT + 1);

            if (alternativePort) {
                PORT = alternativePort;
                console.log(`✅ Using alternative port ${PORT}`);
            } else {
                console.error(`❌ No available ports found between ${PORT} and ${PORT + 10}`);
                process.exit(1);
            }
        }
    }

    // Start the server
    const server = app.listen(PORT, async () => {
        try {
            await connection;
            console.log("✅ Connected to MongoDB")
        } catch (error) {
            console.error("❌ MongoDB connection failed:", error)
            console.log("⚠️  Server running without database connection")
        }
        console.log(`🎉 SOKOGO Backend Server is running on port ${PORT}`)
        console.log(`🌐 API available at: http://localhost:${PORT}`)
        console.log(`📋 API Documentation: http://localhost:${PORT}/api`)
    });

    // Enhanced error handling
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is still in use after cleanup!`);
            console.log(`💡 Manual fix required:`);
            console.log(`   netstat -ano | findstr :${PORT}`);
            console.log(`   taskkill /F /PID <process_id>`);
            process.exit(1);
        } else {
            console.error('❌ Server error:', err);
            process.exit(1);
        }
    });

    return server;
};

// Start the server with smart port management
startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
