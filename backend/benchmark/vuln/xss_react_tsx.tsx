type Props = { body: string };
export function Post({ body }: Props) {
  return <article dangerouslySetInnerHTML={{ __html: body }} />;
}
