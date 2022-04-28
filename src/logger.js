const flags = {
	logging: 1,
}

function vlog(level, message) {
	if (flags.logging >= level)
		console.log(message);
}

module.exports = { vlog, flags };