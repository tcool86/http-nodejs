require('dotenv').config();

const accountSid = process.env.TWIL_ACCOUNT_SID;
const authToken = process.env.TWIL_AUTH_TOKEN;
const twilPhone = process.env.TWIL_PHONE;
const myPhone = process.env.MY_PHONE;
const client = require('twilio')(accountSid, authToken);

const sendMessage = (body) => {
	client.messages
		.create({ body: body, from: twilPhone, to: myPhone })
		.then((message) => console.log(message.sid));
};

module.exports = sendMessage;
