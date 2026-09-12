import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/blog_/$slug")({
  loader: ({ params }) => {
    throw redirect({ to: "/blogs/$slug", params: { slug: params.slug }, statusCode: 301 });
  },
});
