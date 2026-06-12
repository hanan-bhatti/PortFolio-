import PageHeader from "@/components/admin/PageHeader";
import PostEditor from "@/components/admin/PostEditor";

export default function NewPostPage() {
  return (
    <div>
      <PageHeader
        title="New Post"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Posts", href: "/admin/posts" },
          { label: "New" },
        ]}
      />
      <PostEditor post={null} />
    </div>
  );
}
