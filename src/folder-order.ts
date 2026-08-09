const PATH_SEPARATOR = "/";

export function mergeFolderOrder(
	storedOrder: readonly string[] | undefined,
	currentPaths: readonly string[]
): string[] {
	const current = new Set(currentPaths);
	const ordered = (storedOrder ?? []).filter((path) => current.delete(path));
	const unplaced = Array.from(current).sort((left, right) =>
		left.localeCompare(right, undefined, { sensitivity: "base" })
	);

	return [...ordered, ...unplaced];
}

export function moveFolderRelative(
	order: readonly string[],
	folderPath: string,
	targetPath: string,
	position: "after" | "before"
): string[] {
	if (folderPath === targetPath || !order.includes(folderPath) || !order.includes(targetPath)) {
		return [...order];
	}

	const nextOrder = order.filter((path) => path !== folderPath);
	const targetIndex = nextOrder.indexOf(targetPath);
	nextOrder.splice(position === "before" ? targetIndex : targetIndex + 1, 0, folderPath);
	return nextOrder;
}

export function replacePathPrefix(path: string, oldPath: string, newPath: string): string {
	if (path === oldPath) {
		return newPath;
	}

	const oldPrefix = oldPath.endsWith(PATH_SEPARATOR)
		? oldPath
		: `${oldPath}${PATH_SEPARATOR}`;
	if (!path.startsWith(oldPrefix)) {
		return path;
	}

	const newPrefix = newPath.endsWith(PATH_SEPARATOR)
		? newPath
		: `${newPath}${PATH_SEPARATOR}`;
	return `${newPrefix}${path.slice(oldPrefix.length)}`;
}
