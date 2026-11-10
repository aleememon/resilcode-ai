export function A({ html, text }) {
  return (
    <div>
      <p>{text}</p>
      <div dangerouslySetInnerHTML={{ __html: "<b>static</b>" }} />
      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
    </div>
  );
}
