export function Comment({ text }) {
  return <div className="c" dangerouslySetInnerHTML={{ __html: text }} />;
}
