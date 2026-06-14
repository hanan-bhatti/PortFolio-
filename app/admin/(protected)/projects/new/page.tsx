/**
 * @file app/admin/(protected)/projects/new/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - NewProjectPage (default): Main React component or function
 */

import PageHeader from "@/components/admin/PageHeader";
import ProjectForm from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div>
      <PageHeader
        title="New Project"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Projects", href: "/admin/projects" },
          { label: "New" },
        ]}
      />
      <ProjectForm project={null} />
    </div>
  );
}
