const express = require('express');
const winston = require('winston');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const port = 8080;

const cal_app = express();

// MongoDB Connection
const mongoUri = 'mongodb://admin1:test123@34.71.76.131:27017/calculatorApp';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('connection error:', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

const User = mongoose.model('user', userSchema);

// Middleware
cal_app.use(bodyParser.json());
cal_app.use(bodyParser.urlencoded({ extended: true }));
cal_app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoUri })
}));

// Logging configuration for Winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'calculator-service' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

cal_app.use(express.json());

// Hash password middleware
const hashPassword = async (req, res, next) => {
    if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    next();
};

// Registration Endpoint
cal_app.post('/register', hashPassword, async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login Endpoint
cal_app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            req.session.userId = user._id;
            logger.info(`login successful: ${user}`);
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        logger.info(`login req: ${req}`);
        logger.info(`login error: ${error}`);
        res.status(500).json({ message: error.message });
    }
});

// Logout Endpoint
cal_app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).sendFile(path.join(__dirname, 'login.html')); // Redirect to login page if not logged in
    }
    next();
};

// Serve login page as default
cal_app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve calculator page only if logged in
cal_app.get('/calculator.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'calculator.html'));
});

// Serve static files
cal_app.use(express.static('.'));

// Calculator functions and endpoints
const add = (num1, num2) => {
    return num1 + num2;
};

const subtract = (num1, num2) => {
    return num1 - num2;
};

const multiply = (num1, num2) => {
    return num1 * num2;
};

const divide = (num1, num2) => {
    if (num2 === 0) {
        throw new Error("Division by zero error");
    }
    return num1 / num2;
};

const expon = (num1, num2) => {
    return Math.pow(num1, num2);
};

const sqrRoot = (num1) => {
    if (num1 < 0) {
        throw new Error("Square root cannot compute for a negative number");
    }
    return Math.sqrt(num1);
};

const mod = (num1, num2) => {
    if (num2 === 0) {
        throw new Error("Cannot modulo by zero");
    }
    return num1 % num2;
};

// Endpoints for calculator functions
cal_app.get('/add', requireLogin, (req, res) => {
    try {
        const num1 = parseFloat(req.query.num1);
        const num2 = parseFloat(req.query.num2);
        const result = add(num1, num2);
        logger.info(`Add operation successful: ${num1} + ${num2} = ${result}`);
        res.status(200).json({ statuscode: 200, data: `${num1} + ${num2} = ${result}` });
    } catch (error) {
        logger.error(`Add operation error: ${error}`);
        res.status(500).json({ statuscode: 500, message: error.toString() });
    }
});

cal_app.get('/subtract', requireLogin, (req, res) => {
    try {
        const num1 = parseFloat(req.query.num1);
        const num2 = parseFloat(req.query.num2);
        const result = subtract(num1, num2);
        logger.info(`Subtract operation successful: ${num1} - ${num2} = ${result}`);
        res.status(200).json({ statuscode: 200, data: `${num1} - ${num2} = ${result}` });
    } catch (error) {
        logger.error(`Subtract operation error: ${error}`);
        res.status(500).json({ statuscode: 500, message: error.toString() });
    }
});

cal_app.get('/multiply', requireLogin, (req, res) => {
    try {
        const num1 = parseFloat(req.query.num1);
        const num2 = parseFloat(req.query.num2);
        const result = multiply(num1, num2);
        logger.info(`Multiply operation successful: ${num1} * ${num2} = ${result}`);
        res.status(200).json({ statuscode: 200, data: `${num1} * ${num2} = ${result}` });
    } catch (error) {
        logger.error(`Multiply operation error: ${error}`);
        res.status(500).json({ statuscode: 500, message: error.toString() });
    }
});

cal_app.get('/divide', requireLogin, (req, res) => {
    try {
        const num1 = parseFloat(req.query.num1);
        const num2 = parseFloat(req.query.num2);
        const result = divide(num1, num2);
        logger.info(`Divide operation successful: ${num1} / ${num2} = ${result}`);
        res.status(200).json({ statuscode: 200, data: `${num1} / ${num2} = ${result}` });
    } catch (error) {
        logger.error(`Divide operation error: ${error}`);
        res.status(500).json({ statuscode: 500, message: error.toString() });
    }
});

cal_app.get('/expo', requireLogin, (req, res) => {
    try {
        const num1 = parseFloat(req.query.num1);
        const num2 = parseFloat(req.query.num2);
        const result = expon(num1, num2);
        logger.info(`Power operation successful: ${num1}^${num2} = ${result}`);
        res.status(200).json({ statuscode: 200, data: `${num1}^${num2} = ${result}` });
    } catch (error) {
        logger.error(`Power operation error: ${error}`);
        res.status(500).json({ statuscode: 500, message: error.toString() });
    }
});

cal_app.get('/sqrt', requireLogin, (req, res) => {
    try {
        const num1 = parseFloat(req.query.num1);
        const result = sqrRoot(num1);
        logger.info(`Square root operation successful: sqrt(${num1}) = ${result}`);
        res.status(200).json({ statuscode: 200, data: `sqrt(${num1}) = ${result}` });
    } catch (error) {
        logger.error(`Square root operation error: ${error}`);
        res.status(500).json({ statuscode: 500, message: error.toString() });
    }
});

cal_app.get('/mod', requireLogin, (req, res) => {
    try {
        const num1 = parseFloat(req.query.num1);
        const num2 = parseFloat(req.query.num2);
        const result = mod(num1, num2);
        logger.info(`Modulo operation successful: ${num1} % ${num2} = ${result}`);
        res.status(200).json({ statuscode: 200, data: `${num1} % ${num2} = ${result}` });
    } catch (error) {
        logger.error(`Modulo operation error: ${error}`);
        res.status(500).json({ statuscode: 500, message: error.toString() });
    }
});

cal_app.listen(port, () => {
    logger.info(`Calculator service running at http://localhost:${port}`);
});

cal_app.use(express.static('.'));
