export const noComments = {
  meta: {
    type: "problem",
    messages: {
      comment: "Comments are not allowed.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          context.report({ loc: comment.loc, messageId: "comment" });
        }
      },
    };
  },
};
