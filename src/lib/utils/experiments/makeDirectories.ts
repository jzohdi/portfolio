// take each path:
// split into prefxies (conways-gpu-2d) => conways, gpu, 2d
// for each prefix, combine with any similar prefixes.
// if a folder only has one file in it, the folder becomes a file

import type { Experiment } from '$lib/types/experiments';

//
export type File = {
	name: string;
	type: 'file';
};
export type Directory = {
	name: string;
	type: 'dir';
	subs: Path[];
};
export type Path = Directory | File;

export function makeDirectories(experiments: Experiment[]) {
	const allPaths = experiments.map((e) => e.path);
	const root: Directory = { name: '', type: 'dir', subs: [] };
	for (const path of allPaths) {
		const newFile = breakUpPath(path);
		const parentForFile = addDirsToRoot(root, newFile.dirs);
		parentForFile.subs.push(newFile.file);
	}
	// sortSubs(root);
	// console.log(root);
	return root;
}

// function sortSubs(dir: Directory) {
// 	if (dir.subs.length === 0) {
// 		return;
// 	}
// 	const file = dir.subs.find((ele) => ele.type === 'file');
// 	const sortedDirs: Directory[] = [];
// 	for (const sub of dir.subs) {
// 		if (sub.type === 'dir') {
// 			sortedDirs.push(sub);
// 		}
// 	}
// 	sortedDirs.sort((a, b) => a.name.localeCompare(b.name));
// 	for (const dir of sortedDirs) {
// 		sortSubs(dir);
// 	}
// 	if (!file) {
// 		dir.subs = sortedDirs;
// 		return;
// 	}
// 	dir.subs = [file, ...sortedDirs];
// }

function breakUpPath(path: string): { dirs: Directory[]; file: File } {
	const paths = path.split('-');
	const file: File = {
		type: 'file',
		name: paths.slice(paths.length - 1)[0]
	};

	if (paths.length === 1) {
		return {
			dirs: [],
			file
		};
	}
	const prefixes = paths.slice(0, paths.length - 1);
	const dirs: Directory[] = [];
	for (const prefix of prefixes) {
		dirs.push({ type: 'dir', name: prefix, subs: [] });
	}
	return { dirs, file };
}

function addDirsToRoot(root: Directory, newDirs: Directory[]) {
	let parentForFile = root;
	for (const newDir of newDirs) {
		const findSub = returnDirFrom(parentForFile, newDir.name);
		if (findSub === null) {
			parentForFile.subs.push(newDir);
			parentForFile = newDir;
		} else {
			parentForFile = findSub;
		}
	}
	return parentForFile;
}

// function addFileTo(dest: Directory, file: File) {
// 	for (const sub of dest.subs) {
// 		if (sub.type === 'file') {
// 			return new Error('bad path');
// 		}
// 	}
// 	dest.subs.push(file);
// }

function returnDirFrom(src: Directory, targetName: string) {
	for (const sub of src.subs) {
		if (sub.name === targetName && sub.type === 'dir') {
			return sub;
		}
	}
	return null;
}
