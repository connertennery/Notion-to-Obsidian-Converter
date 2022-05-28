const flags = {
	logging: 1,
}

function vlog(level, message) {
	if (flags.logging >= level)
		console.log(message);
}

function verror(level, message) {
	if (flags.logging >= level)
		console.error(message);
}

module.exports = { vlog, verror, flags };