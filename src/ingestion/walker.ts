import { AUDIO_EXTENSIONS } from "./constants";

export async function* walkDirectory(
  root: FileSystemDirectoryHandle,
): AsyncGenerator<[FileSystemFileHandle, string]> {
  const stack: [FileSystemDirectoryHandle, string][] = [[root, ""]];

  while (stack.length > 0) {
    const [directory, prefix] = stack.pop()!;

    for await (const [name, entry] of directory.entries()) {
      const path = prefix ? `${prefix}/${name}` : name;

      if (entry.kind === "directory") {
        stack.push([entry as FileSystemDirectoryHandle, path]);
        continue;
      }

      const dotIndex = name.lastIndexOf(".");
      const extension = dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";

      if (AUDIO_EXTENSIONS.has(extension)) {
        yield [entry as FileSystemFileHandle, path];
      }
    }
  }
}
