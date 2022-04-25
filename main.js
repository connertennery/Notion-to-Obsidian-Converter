const fs = require('fs');
const readline = require('readline-promise');
const npath = require('path');

let exportPath;

const flags = {
	logging: 1,
}

const argHelp = [
	{
		arg: `-v`, //logging 2
		help: `Enables basic logging. Logs major operations and the current directory the converter is working in.`
	},
	{
		arg: `-vv`, //logging 3
		help: `Enables verbose logging. Logs most operations, the current directory the converter is working in, as well as every file the converter processes. Note: This can reduce performance!`
	},
	{
		arg: `-vvv`, //logging 4
		help: `Enables complete verbose logging. Logs every operation, the current directory the converter is working in, as well as every file the converter processes. Note: This can reduce performance!`
	},
	{
		arg: `-q, --quiet`,
		help: `Disables all logging.`
	},
	{
		arg: `--help, -h, -?`,
		help: `Prints this message!`
	},
]

function printHelp() {
	vlog(4, `Printing help message`);
	console.log(
		`Notion-to-Obisidian-Converter
by Conner, the contributors, and the community
repo: https://github.com/connertennery/Notion-to-Obsidian-Converter
`);

	console.warn(`WARNINGS:`);
	console.warn(`\t• Please make a backup of your export and read the warnings in the README so your data isn't mangled!`);
	console.warn(`\t• Notion pages that contain parentheses or dashes in the title will have them removed by Notion while exporting your data so the file will be created without them, even though the link itself will still retain them.`);
	console.warn(`\t• This is not made to be robust. Don't run it twice on the same export or it's likely to fail and truncate paths unnecessarily.`);

	console.log(`\nUsage:
	node main.js [args] [path_to_export]
	node main.js /my/notion/export
	node main.js -v my_export`);

	console.log(`\nArgs:`);
	argHelp.map(arg => console.log(`\t${arg.arg}\n\t\t${arg.help}`));
}


function parseArgs(args) {
	vlog(3, `Parsing arguments: ${args}`);
	const unknownArgs = [];
	args.slice(2).forEach(arg => {
		switch (arg) {
			case `-v`:
				vlog(4, `Setting logging to 2`);
				flags.logging = 2;
				break;
			case `-vv`:
				vlog(4, `Setting logging to 3`);
				flags.logging = 3;
				break;
			case `-vvv`:
				vlog(4, `Setting logging to 4`);
				flags.logging = 4;
				break;
			case `--quiet`:
			case `-q`:
				vlog(4, `Setting logging to 0`);
				flags.logging = 0;
				break;
			case `--help`:
			case `-h`:
			case `-?`:
				printHelp();
				break;
			default:
				vlog(4, `Adding to unknownArgs: ${arg}`);
				unknownArgs.push(arg);
		}
	});

	if (unknownArgs.length) {
		vlog(4, `Checking unknown args`);
		unknownArgs.forEach(arg => {
			vlog(4, `Checking if ${arg} exists`);
			const exists = fs.existsSync(arg);
			if (exists) {
				vlog(4, `Checking if ${arg} is a directory`);
				const isDir = fs.lstatSync(arg).isDirectory();
				if (isDir) {
					if (exportPath === undefined) {
						vlog(4, `Setting exportPath to: ${arg}`);
						exportPath = arg;
					}
					else if (exportPath !== undefined) {
						console.warn(`Provided multiple paths - right now the converter can only operate on one directory and its subdirectories`);
						process.exit(1);
					}
				}
				else {
					console.warn(`Path goes to a file, or something else weird`);
					process.exit(1);
				}
			}
			else {
				console.warn(`Unknown arg: ${arg}\n\tIf this is supposed to be the target directory, the converter is unable to find it. Please make sure it's typed in correctly and try again`);
				process.exit(1);
			}
		});
	}
}


async function main() {
	//Must happen immediately
	if (process.argv.includes(`-vvv`))
		flags.logging = 4;

	parseArgs(process.argv);

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

const truncateFileName = (name) => {
	vlog(4, `Truncating file name: ${name}`);
	let bn = npath.basename(name);
	bn = bn.lastIndexOf(' ') > 0 ? bn.substring(0, bn.lastIndexOf(' ')) : bn;
	return npath.resolve(
		npath.format({
			dir: npath.dirname(name),
			base: bn + npath.extname(name),
		})
	);
};

const truncateDirName = (name) => {
	vlog(4, `Truncating directory name: ${name}`);
	let bn = npath.basename(name);
	bn = bn.lastIndexOf(' ') > 0 ? bn.substring(0, bn.lastIndexOf(' ')) : bn;
	return npath.resolve(
		npath.format({
			dir: npath.dirname(name),
			base: bn,
		})
	);
};

const ObsidianIllegalNameRegex = /[\*\"\/\\\<\>\:\|\?]/g;
const URLRegex = /(:\/\/)|(w{3})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
const correctMarkdownLinks = (content) => {
	//* [Link Text](Link Directory + uuid/And Page Name + uuid) => [[LinkText]]

	vlog(4, `Finding Markdown links with ~regex~`);
	const linkFullMatches = content.match(/(\[(.*?)\])(\((.*?)\))/gi);
	const linkTextMatches = content.match(/(\[(.*?)\])(\()/gi);
	const linkFloaterMatches = content.match(/([\S]*\.md(\))?)/gi);
	const linkNotionMatches = content.match(/([\S]*notion.so(\S*))/g);
	if (!linkFullMatches && !linkFloaterMatches && !linkNotionMatches)
		return { content: content, links: 0 };

	let totalLinks = 0;

	let out = content;
	if (linkFullMatches) {
		totalLinks += linkFullMatches.length;
		for (let i = 0; i < linkFullMatches.length; i++) {
			if (URLRegex.test(linkFullMatches[i])) {
				continue;
			}
			let linkText = linkTextMatches[i].substring(
				1,
				linkTextMatches[i].length - 2
			);
			vlog(4, `Fixing Markdown link: ${linkText}`);
			if (linkText.includes('.png')) {
				linkText = convertPNGPath(linkText);
			} else {
				linkText = linkText.replace(ObsidianIllegalNameRegex, ' ');
			}
			out = out.replace(linkFullMatches[i], `[[${linkText}]]`);
		}
	}

	//! Convert free-floating relativePaths and Notion.so links
	if (linkFloaterMatches) {
		totalLinks += linkFullMatches
			? linkFloaterMatches.length - linkFullMatches.length
			: linkFloaterMatches.length;
		vlog(4, `Converting relative paths`);
		out = out.replace(/([\S]*\.md(\))?)/gi, convertRelativePath);
	}

	if (linkNotionMatches) {
		vlog(4, `Converting Notion.so links`);
		out = out.replace(/([\S]*notion.so(\S*))/g, convertNotionLinks);
		totalLinks += linkNotionMatches.length;
	}

	return {
		content: out,
		links: totalLinks,
	};
};

const convertPNGPath = (path) => {
	vlog(4, `Converting PNG path: ${path}`);
	let imageTitle = path
		.substring(path.lastIndexOf('/') + 1)
		.split('%20')
		.join(' ');
	path = convertRelativePath(path.substring(0, path.lastIndexOf('/')));
	path = path.substring(2, path.length - 2);

	return `${path}/${imageTitle}`;
};

const convertNotionLinks = (match, p1, p2, p3) => {
	vlog(4, `Converting Notion.so link: ${match}`);
	return `[[${match
		.substring(match.lastIndexOf('/') + 1)
		.split('-')
		.slice(0, -1)
		.join(' ')}]]`;
};

const convertRelativePath = (path) => {
	vlog(4, `Converting relative path: ${path}`);
	return `[[${path.split('/').pop().split('%20').slice(0, -1).join(' ')}]]`;
};

const correctCSVLinks = (content) => {
	//* ../Relative%20Path/To/File%20Name.md => [[File Name]]
	let lines = content.split('\n');
	let links = 0;
	for (let x = 0; x < lines.length; x++) {
		let line = lines[x];
		cells = line.split(',');

		for (let y = 0; y < cells.length; y++) {
			let cell = cells[y];
			if (cell.includes('.md')) {
				vlog(4, `Converting CSV link: ${cell}`);
				cells[y] = convertRelativePath(cell);
				links++;
			}
		}
		lines[x] = cells.join(',');
	}
	return { content: lines.join('\n'), links: links };
};

const convertCSVToMarkdown = (content) => {
	vlog(4, `Converting CSV to Markdown`);
	const csvCommaReplace = (match, p1, p2, p3, offset, string) => {
		return `${p1}|${p3}`;
	};

	let fix = content
		.replace(/(\S)(\,)((\S)|(\n)|($))/g, csvCommaReplace)
		.split('\n')
		.map((l) => "|" + l.trim() + "|");
	const headersplit = '|' + '---|'.repeat(
		fix[0].split('').filter((char) => char === '|').length - 1
	);
	fix.splice(1, 0, headersplit);
	return fix.join('\n');
};

const convertDirectory = function (path) {
	const start = Date.now();

	vlog(2, `Converting directory: ${path}`);

	let directories = [];
	let files = [];
	let markdownLinks = 0;
	let csvLinks = 0;
	let totalElapsedTime = 0;

	vlog(4, `Reading directory: ${path}`);
	let currentDirectory = fs.readdirSync(path, { withFileTypes: true });

	vlog(4, `Organizing directory contents`);
	for (let i = 0; i < currentDirectory.length; i++) {
		let currentPath = npath.format({
			dir: path,
			base: currentDirectory[i].name,
		});
		if (currentDirectory[i].isDirectory()) directories.push(currentPath);
		if (currentDirectory[i].isFile()) files.push(currentPath);
	}

	for (let i = 0; i < files.length; i++) {
		let file = files[i];
		vlog(3, `Converting file: ${file}`);
		if (!file.includes('.png')) {
			let trunc = truncateFileName(file);
			vlog(3, `Renaming file ${file} -> ${trunc}`);
			fs.renameSync(file, trunc);
			file = trunc;
			files[i] = trunc;
		}

		//Fix Markdown Links
		if (npath.extname(file) === '.md') {
			vlog(3, `Fixing Markdown links`);
			const correctedFileContents = correctMarkdownLinks(
				fs.readFileSync(file, 'utf8')
			);
			if (correctedFileContents.links)
				markdownLinks += correctedFileContents.links;
			vlog(4, `Writing corrected Markdown links to disk`);
			fs.writeFileSync(file, correctedFileContents.content, 'utf8');
		} else if (npath.extname(file) === '.csv') {
			vlog(3, `Fixing CSV links`);
			const correctedFileContents = correctCSVLinks(
				fs.readFileSync(file, 'utf8')
			);
			vlog(3, `Converting CSV to Markdown`);
			const csvConverted = convertCSVToMarkdown(
				correctedFileContents.content
			);
			if (correctedFileContents.links)
				csvLinks += correctedFileContents.links;
			vlog(4, `Writing corrected CSV links to disk`);
			fs.writeFileSync(file, correctedFileContents.content, 'utf8');
			vlog(4, `Writing converted CSV -> Markdown file to disk`);
			fs.writeFileSync(
				npath.resolve(
					npath.format({
						dir: npath.dirname(file),
						base: npath.basename(file, `.csv`) + '.md',
					})
				),
				csvConverted,
				'utf8'
			);
		}

		vlog(3, `Finished converting file: ${file}`);
	}

	vlog(3, `Renaming child directories`);
	for (let i = 0; i < directories.length; i++) {
		let dir = directories[i];
		vlog(4, `Truncating directory name: ${dir}`);
		let dest = truncateDirName(dir);
		while (fs.existsSync(dest)) {
			vlog(4, `Truncated directory name already exists" ${dest}`);
			dest = `${dest} - ${Math.random().toString(36).slice(2)}`;
		}
		vlog(3, `Renaming directory ${dir} -> ${dest}`);
		fs.renameSync(dir, dest);
		directories[i] = dest;
	}

	vlog(3, `Recursively converting children directory`);
	directories.forEach((dir) => {
		vlog(4, `Recursively converting child directory: ${dir}`);
		const stats = convertDirectory(dir);
		directories = directories.concat(stats.directories);
		files = files.concat(stats.files);
		markdownLinks += stats.markdownLinks;
		csvLinks += stats.csvLinks;
		totalElapsedTime += stats.elapsed
	});

	const elapsed = Date.now() - start;
	vlog(3, `Converted directory ${path} in: ${elapsed}ms`);
	return {
		directories,
		files,
		markdownLinks,
		csvLinks,
		elapsed,
		totalElapsedTime
	};
};

function startConversion(path) {
	vlog(1, `Beginning Conversion`);
}

function vlog(level, message) {
	if (flags.logging >= level)
		console.log(message);
}

main();
