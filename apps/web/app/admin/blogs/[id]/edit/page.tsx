import { BlogForm } from "../../blog-form";

export default function EditBlogPage({ params }: { params: { id: string } }) {
  return <BlogForm blogId={params.id} />;
}
