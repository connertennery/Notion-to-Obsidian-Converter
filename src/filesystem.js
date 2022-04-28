const fs = require('fs');
const npath = require('path');

const { vlog, _l } = require("./logger.js");
const { correctMarkdownLinks, _p } = require('./pages.js')

const truncateFileName = (name) => {
	vlog(4, `Truncating file name: ${name}`);
	let bn = npath.basename(name);
	let extname = "";
	if (bn.lastIndexOf(' ') > 0) {
		bn = bn.substring(0, bn.lastIndexOf(' '))
		extname = npath.extname(name)
	}
	return npath.resolve(
		npath.format({
			dir: npath.dirname(name),
			base: bn + extname,
		})
	)
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

module.exports = { convertDirectory, truncateFileName }