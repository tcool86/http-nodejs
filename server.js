const express = require('express');
const app = express();

const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const md5 = require('md5');
const sendMessage = require('./message.js');

const jsonParser = bodyParser.json();
const urlEncodedParser = bodyParser.urlencoded({ extended: false });

app.use(jsonParser);
app.use(cookieParser());
app.use(cors());

const allowlist = ['http://www.timcool.me', 'https://www.timcool.me'];
const corsOptionsDelegate = (req, callback) => {
	let corsOptions;
	if (allowlist.indexOf(req.header('Origin')) !== -1) {
		corsOptions = { origin: true };
	} else {
		corsOptions = { origin: false };
	}
	callback(null, corsOptions);
};

app.get('/', (req, res) => {
	res.send('hello world');
});

const getHash = (info) => {
	const content = `${info}-${process.env.SECRET_HASH}`;
	return md5(content);
};

const checkHash = (hash, target) => {
	const hashedTarget = getHash(target);
	return hash === hashedTarget;
};

app.get('/session', cors(corsOptionsDelegate), (req, res) => {
	const sessionId = getHash(req.ip);
	res.cookie('sessionId', sessionId);
	res.send(sessionId);
});

app.post('/contact', urlEncodedParser, (req, res) => {
	const { sessionId } = req.cookies;
	if (!checkHash(sessionId, req.ip)) {
		const error = `bad session`;
		res.status(500).json({ error: error });
		res.end();
		return;
	}
	const { from, subject, message } = req.body;
	if (!from || !subject || !message) {
		const error = `missing body details\n - from: ${from}\n - subject: ${subject}\n - message: ${message}\n`;
		res.status(401).json({ error: error });
		res.end();
		return;
	}
	const smsBody = `🤖: ${from}\n${subject}\n${message}`;
	sendMessage(smsBody);
	res.json({ message: `sent` });
});

app.listen(8000);
