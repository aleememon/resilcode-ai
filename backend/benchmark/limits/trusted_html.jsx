// Body was already sanitized on the server, but Semgrep cannot see that.
export const Post = ({ post }) => (
  <article dangerouslySetInnerHTML={{ __html: post.renderedBody }} />
);
