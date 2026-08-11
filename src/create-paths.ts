/** Join a vault parent path with a child name, handling the vault root. */
export function joinVaultPath(parentPath: string, childName: string): string {
	if (!parentPath || parentPath === "/") {
		return childName;
	}
	return `${parentPath}/${childName}`;
}

/**
 * Pick the next free path under `parentPath` for `baseName`, optionally with an
 * extension (notes). When taken, appends " 1", " 2", … like Obsidian's Untitled.
 */
export function nextAvailablePath(
	exists: (path: string) => boolean,
	parentPath: string,
	baseName: string,
	extension?: string
): string {
	const toPath = (name: string): string => {
		const leaf = extension ? `${name}.${extension}` : name;
		return joinVaultPath(parentPath, leaf);
	};

	let candidate = toPath(baseName);
	if (!exists(candidate)) return candidate;

	let index = 1;
	while (exists(toPath(`${baseName} ${index}`))) {
		index += 1;
	}
	return toPath(`${baseName} ${index}`);
}
