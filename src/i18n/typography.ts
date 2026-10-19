const singleLetterWord = /(?<=^|[\s(„"])([aiouwz])[ \t\r\n]+(?=\S)/giu;

type HastNode = {
  type: string;
  value?: string;
  children?: HastNode[];
};

export function bindSingleLetterWords(text: string): string {
  return text.replace(singleLetterWord, "$1 ");
}

export function rehypeBindSingleLetterWords() {
  return (tree: HastNode): void => {
    bindTextNodes(tree);
  };
}

function bindTextNodes(node: HastNode): void {
  if (node.type === "text" && node.value !== undefined) {
    node.value = bindSingleLetterWords(node.value);
  }
  node.children?.forEach(bindTextNodes);
}
