const readline = require('readline/promises');

const { vlog, flags } = require("./src/logger.js");
const { parseArgs } = require("./src/cli.js");
const { convertDirectory } = require("./src/filesystem.js");


async function main() {
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

		const path = await rl.question(`Notion Export Path:\n`);
		rl.close();
		vlog(4, `Input: \`${path}\``);
		exportPath = path.trim();
	}

	vlog(1, `Starting conversion`);
	const output = convertDirectory(exportPath);

	console.log(
		`Fixed in ${output.elapsed}ms
${'-'.repeat(8)}
Directories: ${output.directories.length}
Files: ${output.files.length}
Markdown Links: ${output.markdownLinks}
CSV Links: ${output.csvLinks}`
	);
}

main();