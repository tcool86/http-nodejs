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

const allowlist = [
	'http://www.timcool.me',
	'https://www.timcool.me',
	// 'http://127.0.0.1:3000',
];
const corsOptionsDelegate = (req, callback) => {
	const originName = req.header('Origin');
	let useOrigin = allowlist.indexOf(originName) !== -1;
	let name = '';
	if (useOrigin) {
		name = originName;
	}
	callback(null, {
		origin: name,
		credentials: true,
	});
};
app.use(cors(corsOptionsDelegate));

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

app.get('/', (req, res) => {
	res.send(`tcool is online 🛰`);
});

app.get('/session', (req, res) => {
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
	const { name, subject, message, email } = req.body;
	if (!name || !subject || !message || !email) {
		const error = `missing body details\n - from name: ${name}\n - email: ${email}\n - subject: ${subject}\n - message: ${message}\n`;
		res.status(401).json({ error: error });
		res.end();
		return;
	}
	const smsBody = `\n🤖 incoming message:\n${name} at ${email}\nsubject: ${subject}\n\n${message}`;
	sendMessage(smsBody);
	res.json({ message: `sent` });
});

app.listen(8000);
