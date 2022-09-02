const express = require('express');
const app = express();

const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

const md5 = require('md5');
const sendMessage = require('./message.js');

const jsonParser = bodyParser.json();
const urlEncodedParser = bodyParser.urlencoded({ extended: false });

app.use(jsonParser);
app.use(cors());

const getHash = (info) => {
	const content = `${info}-${process.env.SECRET_HASH}`;
	return md5(content);
};

const sesh = {
	genid: function (req) {
		return getHash(req.ip);
	},
	secret: getHash('key'),
	cookie: {},
};

if (app.get('env') === 'production') {
	app.set('trust proxy', 1);
	sesh.cookie.secure = true;
}

app.use(session(sesh));

const allowlist = ['http://www.timcool.me', 'https://www.timcool.me'];
const corsOptionsDelegate = (req, callback) => {
	const originName = req.header('Origin');
	let useOrigin = allowlist.indexOf(originName) !== -1;
	callback(null, {
		origin: useOrigin,
	});
};

app.get('/', (req, res) => {
	res.send(`tcool is online 🛰`);
});

app.get('/session', cors(corsOptionsDelegate), (req, res) => {
	const sessionId = getHash(req.ip);
	res.cookie('sessionId', sessionId);
	res.send(sessionId);
});

app.post('/contact', urlEncodedParser, (req, res) => {
	const sessionId = req.sessionID;
	if (!req.session || !sessionId) {
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
