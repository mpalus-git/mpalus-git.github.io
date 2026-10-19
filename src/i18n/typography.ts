const singleLetterWord = /(?<=^|[\s(„"])([aiouwz])[ \t\r\n]+(?=\S)/giu;

type TextNode = {
  type: "text";
  value: string;
};

export function bindSingleLetterWords(text: string): string {
  return text.replace(singleLetterWord, "$1 ");
}

export const bindSingleLetterWordsPlugin = {
  name: "bind-single-letter-words",
  text: (node: Readonly<TextNode>): TextNode | undefined => {
    const value = bindSingleLetterWords(node.value);
    return value === node.value ? undefined : { type: "text", value };
  },
};
