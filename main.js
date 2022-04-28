const readline = require('readline');

const { vlog, flags } = require("./src/logger.js");
const { parseArgs } = require("./src/cli.js");
const { convertDirectory } = require("./src/filesystem.js");


function main() {
	let exportPath;

	//Must happen immediately
	if (process.argv.includes(`-vvv`))
		flags.logging = 4;

	exportPath = parseArgs(process.argv);

	if (!exportPath) {
		vlog(4, `Path not detected in arguments - asking user for path`);
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question(`Notion Export Path:\n`, (path) => {
			rl.close();
			vlog(4, `Input: \`${path}\``);
			exportPath = path.trim();
			startConversion(exportPath);
		});
	}
	else {
		startConversion(exportPath);
	}
}

main();