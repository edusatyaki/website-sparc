/* eslint-env node */

/*
 * Dummy mailer.  Originally this codebase used @sendgrid/mail; for the
 * minimally-functional debug build we replace the network call with a local
 * no-op that simply logs the would-be email to the console (and optionally
 * appends it to ./logs/mail.log).  The interface mimics the small subset of
 * sgMail we used (sgMail.send(message) -> Promise).
 */

const fs = require('fs')
const path = require('path')

const LOG_DIR = path.join(__dirname, '..', 'logs')
const LOG_FILE = path.join(LOG_DIR, 'mail.log')

function ensureLogDir() {
	try {
		fs.mkdirSync(LOG_DIR, { recursive: true })
	} catch (e) {
		// best-effort only
	}
}

function send(email) {
	const stamp = new Date().toISOString()
	const line =
		`\n=== DUMMY MAIL @ ${stamp} ===\n` +
		`To:      ${email && email.to}\n` +
		`From:    ${email && email.from}\n` +
		`Subject: ${email && email.subject}\n` +
		`Body:    ${(email && (email.html || email.text)) || ''}\n` +
		`============================\n`

	console.log(line)
	ensureLogDir()
	try {
		fs.appendFileSync(LOG_FILE, line)
	} catch (e) {
		// non-fatal: writing the log is a courtesy only
	}

	// Mimic the sgMail Promise API so callers using .catch keep working.
	return Promise.resolve({ statusCode: 202, dummy: true })
}

// The legacy code calls sgMail.setApiKey(...).  Expose a no-op so we don't
// crash if the call is left in place anywhere.
function setApiKey(/* key */) {
	// no-op
}

module.exports = {
	send: send,
	setApiKey: setApiKey
}
